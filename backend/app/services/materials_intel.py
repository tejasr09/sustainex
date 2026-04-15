from __future__ import annotations

from ..schemas import MaterialComponent, MaterialInsight, ProductPassport

VALUE_USD_PER_KG_INDEX = 120.0
CARBON_AVOIDANCE_FACTOR = 0.35


def analyze_materials(product: ProductPassport) -> MaterialInsight:
    total_mass = sum(m.mass_kg for m in product.materials) or 1e-6
    rec_mass = sum(m.mass_kg for m in product.materials if m.recyclable)
    reuse_mass = sum(m.mass_kg for m in product.materials if m.reusable)

    commodity = sum(m.mass_kg * m.commodity_index for m in product.materials)
    embodied = sum(m.embodied_carbon_kg_co2e for m in product.materials)

    est_value = commodity * VALUE_USD_PER_KG_INDEX
    circularity = min(
        1.0,
        0.45 * (reuse_mass / total_mass)
        + 0.35 * (rec_mass / total_mass)
        + 0.2 * (commodity / total_mass),
    )

    return MaterialInsight(
        product_id=product.product_id,
        components=list(product.materials),
        recyclable_mass_kg=round(rec_mass, 3),
        reusable_mass_kg=round(reuse_mass, 3),
        estimated_recoverable_value_usd=round(est_value, 2),
        estimated_embodied_carbon_kg_co2e=round(embodied, 2),
        circularity_contribution=round(circularity, 3),
    )


def environmental_savings_if_diverted(product: ProductPassport, action_factor: float) -> float:
    """kg CO2e potentially avoided vs linear disposal (simplified)."""
    insight = analyze_materials(product)
    base = insight.estimated_embodied_carbon_kg_co2e * CARBON_AVOIDANCE_FACTOR
    return round(base * action_factor, 2)
