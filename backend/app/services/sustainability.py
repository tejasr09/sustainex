from __future__ import annotations

from datetime import datetime, timedelta, timezone

from ..data_store import store
from ..schemas import DashboardMetrics, ProductCondition, RoutingAction
from .routing_engine import decide

UTC = timezone.utc


def _simulate_historical_actions() -> list[RoutingAction]:
    """Derive demo distribution from routing engine on seed products."""
    actions: list[RoutingAction] = []
    for p in store.list_products():
        d = decide(p, store.facilities)
        actions.append(d.recommended)
    return actions


def build_dashboard() -> DashboardMetrics:
    products = store.list_products()
    n = len(products)

    routed = _simulate_historical_actions()
    reuse_n = sum(1 for a in routed if a == RoutingAction.REUSE)
    refurb_n = sum(1 for a in routed if a == RoutingAction.REFURBISH)
    reman_n = sum(1 for a in routed if a == RoutingAction.REMANUFACTURE)
    recycle_n = sum(1 for a in routed if a == RoutingAction.RECYCLE)

    reuse_rate = (reuse_n + refurb_n * 0.6) / max(n, 1) * 100
    recycle_eff = (recycle_n + reman_n * 0.35) / max(n, 1) * 100

    # Circular economy score: weighted blend
    good_share = sum(1 for p in products if p.condition in (ProductCondition.NEW, ProductCondition.GOOD)) / max(n, 1)
    circularity = min(
        100.0,
        38
        + good_share * 22
        + reuse_rate * 0.15
        + recycle_eff * 0.12
        + min(n * 3, 15),
    )

    carbon_tons = round(120 + n * 18 + reuse_n * 12 + recycle_n * 8, 1)
    value_m = round(2.1 + n * 0.35 + good_share * 1.2, 2)

    now = datetime.now(UTC)
    labels = [(now - timedelta(days=30 - i * 5)).strftime("%b %d") for i in range(6)]
    base_c = circularity - 8
    trend_c = [round(min(100, base_c + i * 1.6 + (i % 2)), 1) for i in range(6)]
    base_t = carbon_tons * 0.82
    trend_t = [round(base_t + i * 6 + (i % 3) * 2, 1) for i in range(6)]

    top_actions = {
        "reuse": reuse_n,
        "refurbish": refurb_n,
        "remanufacture": reman_n,
        "recycle": recycle_n,
    }

    return DashboardMetrics(
        reuse_rate_pct=round(reuse_rate, 1),
        recycling_efficiency_pct=round(recycle_eff, 1),
        carbon_savings_tons_co2e=carbon_tons,
        value_retained_million_usd=value_m,
        circularity_score=round(circularity, 1),
        products_tracked=n,
        returns_routed_30d=42 + n * 7,
        top_actions={k: float(v) for k, v in top_actions.items()},
        trend_labels=labels,
        trend_circularity=trend_c,
        trend_carbon_tons=trend_t,
    )
