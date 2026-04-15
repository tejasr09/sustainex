from __future__ import annotations

from ..schemas import (
    ActionScore,
    Facility,
    ProductCondition,
    ProductPassport,
    RoutingAction,
    RoutingDecision,
)
from .geospatial import haversine_km
from .materials_intel import analyze_materials, environmental_savings_if_diverted

CONDITION_SCORES: dict[ProductCondition, dict[RoutingAction, float]] = {
    ProductCondition.NEW: {
        RoutingAction.REUSE: 1.0,
        RoutingAction.REFURBISH: 0.55,
        RoutingAction.REMANUFACTURE: 0.35,
        RoutingAction.RECYCLE: 0.2,
    },
    ProductCondition.GOOD: {
        RoutingAction.REUSE: 0.95,
        RoutingAction.REFURBISH: 0.85,
        RoutingAction.REMANUFACTURE: 0.5,
        RoutingAction.RECYCLE: 0.25,
    },
    ProductCondition.FAIR: {
        RoutingAction.REUSE: 0.45,
        RoutingAction.REFURBISH: 0.9,
        RoutingAction.REMANUFACTURE: 0.75,
        RoutingAction.RECYCLE: 0.5,
    },
    ProductCondition.POOR: {
        RoutingAction.REUSE: 0.15,
        RoutingAction.REFURBISH: 0.55,
        RoutingAction.REMANUFACTURE: 0.85,
        RoutingAction.RECYCLE: 0.7,
    },
    ProductCondition.END_OF_LIFE: {
        RoutingAction.REUSE: 0.05,
        RoutingAction.REFURBISH: 0.25,
        RoutingAction.REMANUFACTURE: 0.45,
        RoutingAction.RECYCLE: 0.95,
    },
}

ACTION_VALUE_FACTOR: dict[RoutingAction, float] = {
    RoutingAction.REUSE: 0.95,
    RoutingAction.REFURBISH: 0.75,
    RoutingAction.REMANUFACTURE: 0.55,
    RoutingAction.RECYCLE: 0.35,
}

ACTION_CARBON_FACTOR: dict[RoutingAction, float] = {
    RoutingAction.REUSE: 1.0,
    RoutingAction.REFURBISH: 0.82,
    RoutingAction.REMANUFACTURE: 0.68,
    RoutingAction.RECYCLE: 0.45,
}

# Higher = cheaper to process for hackathon demo
BASE_RECOVERY_COST: dict[RoutingAction, float] = {
    RoutingAction.REUSE: 12,
    RoutingAction.REFURBISH: 28,
    RoutingAction.REMANUFACTURE: 45,
    RoutingAction.RECYCLE: 18,
}

WEIGHTS = {
    "condition": 0.28,
    "material": 0.22,
    "cost": 0.18,
    "carbon": 0.17,
    "facility": 0.15,
}


def _nearest_capable_facility(
    product: ProductPassport,
    action: RoutingAction,
    facilities: list[Facility],
) -> tuple[Facility | None, float]:
    if product.current_location_lat is None or product.current_location_lon is None:
        return None, 0.5

    best: Facility | None = None
    best_d = float("inf")
    for f in facilities:
        if action not in f.capabilities:
            continue
        d = haversine_km(
            product.current_location_lat,
            product.current_location_lon,
            f.lat,
            f.lon,
        )
        if d < best_d:
            best_d = d
            best = f

    if best is None:
        return None, 0.2

    proximity_score = max(0.0, 1.0 - min(best_d, 2000) / 2000)
    return best, proximity_score


def score_actions(
    product: ProductPassport,
    condition: ProductCondition,
    facilities: list[Facility],
) -> tuple[list[ActionScore], Facility | None, RoutingAction]:
    mat = analyze_materials(product)
    material_signal = min(1.0, mat.circularity_contribution + mat.estimated_recoverable_value_usd / 5000)

    scores: list[ActionScore] = []
    best_action = RoutingAction.RECYCLE
    best_total = -1.0
    best_facility: Facility | None = None

    for action in RoutingAction:
        cond = CONDITION_SCORES[condition][action]
        fac, fac_score = _nearest_capable_facility(product, action, facilities)
        cost_penalty = BASE_RECOVERY_COST[action] / max(mat.estimated_recoverable_value_usd, 50)
        cost_signal = max(0.05, 1.0 - min(cost_penalty, 1.0))
        carbon_signal = ACTION_CARBON_FACTOR[action]

        total = (
            WEIGHTS["condition"] * cond
            + WEIGHTS["material"] * material_signal
            + WEIGHTS["cost"] * cost_signal
            + WEIGHTS["carbon"] * carbon_signal
            + WEIGHTS["facility"] * fac_score
        )

        rationale = [
            f"Condition fit ({condition.value}) → {action.value}: {cond:.2f}",
            f"Material & value signal: {material_signal:.2f} (recoverable ~${mat.estimated_recoverable_value_usd:.0f})",
            f"Recovery cost fit: {cost_signal:.2f}",
            f"Carbon pathway factor: {carbon_signal:.2f}",
            f"Facility proximity score: {fac_score:.2f}",
        ]

        scores.append(ActionScore(action=action, score=round(total, 4), rationale=rationale))

        if total > best_total:
            best_total = total
            best_action = action
            best_facility = fac

    scores.sort(key=lambda s: s.score, reverse=True)
    return scores, best_facility, best_action


def decide(
    product: ProductPassport,
    facilities: list[Facility],
    override_condition: ProductCondition | None = None,
) -> RoutingDecision:
    condition = override_condition or product.condition
    action_scores, facility, recommended = score_actions(product, condition, facilities)
    top = action_scores[0].score
    second = action_scores[1].score if len(action_scores) > 1 else 0.0
    confidence = max(0.35, min(0.99, 0.5 + (top - second)))

    mat = analyze_materials(product)
    value_retained = mat.estimated_recoverable_value_usd * ACTION_VALUE_FACTOR[recommended]
    carbon_saved = environmental_savings_if_diverted(product, ACTION_CARBON_FACTOR[recommended])

    return RoutingDecision(
        product_id=product.product_id,
        recommended=recommended,
        confidence=round(confidence, 3),
        action_scores=action_scores,
        estimated_value_retained_usd=round(value_retained, 2),
        estimated_carbon_saved_kg_co2e=carbon_saved,
        matched_facility=facility,
        model_version="rules-v1",
    )
