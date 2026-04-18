from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class LifecycleEventType(str, Enum):
    MANUFACTURED = "manufactured"
    SHIPPED = "shipped"
    IN_USE = "in_use"
    REPAIR = "repair"
    REUSE = "reuse"
    RETURNED = "returned"
    RECYCLE = "recycle"
    DISPOSED = "disposed"


class ProductCondition(str, Enum):
    NEW = "new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    END_OF_LIFE = "end_of_life"


class RoutingAction(str, Enum):
    REUSE = "reuse"
    REFURBISH = "refurbish"
    RECYCLE = "recycle"


class MaterialComponent(BaseModel):
    name: str
    category: str
    mass_kg: float = Field(ge=0)
    recyclable: bool = True
    reusable: bool = True
    commodity_index: float = Field(
        default=0.5,
        ge=0,
        le=1,
        description="Normalized market value proxy 0–1",
    )
    embodied_carbon_kg_co2e: float = Field(
        default=0,
        ge=0,
        description="Embodied carbon for this component (kg CO2e)",
    )


class LifecycleEvent(BaseModel):
    event_type: LifecycleEventType
    timestamp: datetime
    actor: str = "system"
    note: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class Facility(BaseModel):
    id: str
    name: str
    city: str
    country: str
    lat: float
    lon: float
    capabilities: list[RoutingAction]


class ProductPassport(BaseModel):
    product_id: str
    sku: str
    name: str
    category: str
    origin_country: str
    manufacturer: str
    condition: ProductCondition
    materials: list[MaterialComponent]
    lifecycle_events: list[LifecycleEvent]
    current_location_lat: float | None = None
    current_location_lon: float | None = None


class RoutingRequest(BaseModel):
    product_id: str
    override_condition: ProductCondition | None = None


class ActionScore(BaseModel):
    action: RoutingAction
    score: float
    rationale: list[str]


class RoutingDecision(BaseModel):
    product_id: str
    recommended: RoutingAction
    confidence: float
    action_scores: list[ActionScore]
    estimated_value_retained_usd: float
    estimated_carbon_saved_kg_co2e: float
    matched_facility: Facility | None = None
    model_version: str = "rules-v1"


class MaterialInsight(BaseModel):
    product_id: str
    components: list[MaterialComponent]
    recyclable_mass_kg: float
    reusable_mass_kg: float
    estimated_recoverable_value_usd: float
    estimated_embodied_carbon_kg_co2e: float
    circularity_contribution: float = Field(ge=0, le=1)


class DashboardMetrics(BaseModel):
    reuse_rate_pct: float
    recycling_efficiency_pct: float
    carbon_savings_tons_co2e: float
    value_retained_million_usd: float
    circularity_score: float = Field(ge=0, le=100)
    products_tracked: int
    returns_routed_30d: int
    top_actions: dict[str, float]
    trend_labels: list[str]
    trend_circularity: list[float]
    trend_carbon_tons: list[float]
