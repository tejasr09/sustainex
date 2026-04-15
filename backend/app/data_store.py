from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .schemas import (
    Facility,
    LifecycleEvent,
    LifecycleEventType,
    MaterialComponent,
    ProductCondition,
    ProductPassport,
    RoutingAction,
)

UTC = timezone.utc


def _dt(days_ago: float = 0) -> datetime:
    return datetime.now(UTC) - timedelta(days=days_ago)


def seed_facilities() -> list[Facility]:
    return [
        Facility(
            id="fac-bengaluru",
            name="Sustainex Bengaluru Recovery Hub",
            city="Bengaluru",
            country="IN",
            lat=12.9716,
            lon=77.5946,
            capabilities=[RoutingAction.REFURBISH, RoutingAction.REMANUFACTURE, RoutingAction.RECYCLE],
        ),
        Facility(
            id="fac-mumbai",
            name="Sustainex Mumbai Circular Port",
            city="Mumbai",
            country="IN",
            lat=19.0760,
            lon=72.8777,
            capabilities=[RoutingAction.RECYCLE, RoutingAction.REMANUFACTURE],
        ),
        Facility(
            id="fac-delhi",
            name="Sustainex Delhi Reuse Collective",
            city="Delhi",
            country="IN",
            lat=28.6139,
            lon=77.2090,
            capabilities=[RoutingAction.REUSE, RoutingAction.REFURBISH],
        ),
        Facility(
            id="fac-hyderabad",
            name="Sustainex Hyderabad Electronics Recovery",
            city="Hyderabad",
            country="IN",
            lat=17.3850,
            lon=78.4867,
            capabilities=[RoutingAction.RECYCLE, RoutingAction.REFURBISH, RoutingAction.REUSE],
        ),
    ]


def seed_products() -> dict[str, ProductPassport]:
    p1 = ProductPassport(
        product_id="DPP-7F2A-001",
        sku="LC-NB-PRO-14",
        name="Sustainex ProBook 14",
        category="Electronics — Laptop",
        origin_country="TW",
        manufacturer="Sustainex OEM Partners",
        condition=ProductCondition.GOOD,
        materials=[
            MaterialComponent(
                name="Aluminum chassis",
                category="Metal",
                mass_kg=0.45,
                recyclable=True,
                reusable=True,
                commodity_index=0.72,
                embodied_carbon_kg_co2e=6.2,
            ),
            MaterialComponent(
                name="Lithium battery pack",
                category="Battery",
                mass_kg=0.38,
                recyclable=True,
                reusable=False,
                commodity_index=0.88,
                embodied_carbon_kg_co2e=12.4,
            ),
            MaterialComponent(
                name="PCB assembly",
                category="E-waste",
                mass_kg=0.22,
                recyclable=True,
                reusable=True,
                commodity_index=0.55,
                embodied_carbon_kg_co2e=9.1,
            ),
            MaterialComponent(
                name="ABS keycaps / bezels",
                category="Polymer",
                mass_kg=0.12,
                recyclable=True,
                reusable=True,
                commodity_index=0.28,
                embodied_carbon_kg_co2e=1.8,
            ),
        ],
        lifecycle_events=[
            LifecycleEvent(
                event_type=LifecycleEventType.MANUFACTURED,
                timestamp=_dt(420),
                actor="manufacturer",
                note="Initial assembly — verified DPP minted",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.SHIPPED,
                timestamp=_dt(400),
                actor="3PL",
                note="EU distribution center inbound",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.IN_USE,
                timestamp=_dt(380),
                actor="owner",
                note="Registered to enterprise fleet",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.REPAIR,
                timestamp=_dt(120),
                actor="authorized_service",
                note="SSD replaced under warranty",
            ),
        ],
        current_location_lat=12.9716,
        current_location_lon=77.5946,
    )

    p2 = ProductPassport(
        product_id="DPP-9C11-204",
        sku="LC-PHONE-X5",
        name="Sustainex Phone X5",
        category="Electronics — Mobile",
        origin_country="VN",
        manufacturer="Sustainex Mobile Works",
        condition=ProductCondition.FAIR,
        materials=[
            MaterialComponent(
                name="Glass front",
                category="Glass",
                mass_kg=0.04,
                recyclable=True,
                reusable=False,
                commodity_index=0.15,
                embodied_carbon_kg_co2e=0.9,
            ),
            MaterialComponent(
                name="Stainless frame",
                category="Metal",
                mass_kg=0.08,
                recyclable=True,
                reusable=True,
                commodity_index=0.5,
                embodied_carbon_kg_co2e=1.4,
            ),
            MaterialComponent(
                name="Mixed rare earth magnets",
                category="Critical raw material",
                mass_kg=0.02,
                recyclable=True,
                reusable=False,
                commodity_index=0.95,
                embodied_carbon_kg_co2e=3.2,
            ),
        ],
        lifecycle_events=[
            LifecycleEvent(
                event_type=LifecycleEventType.MANUFACTURED,
                timestamp=_dt(300),
                actor="manufacturer",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.IN_USE,
                timestamp=_dt(280),
                actor="consumer",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.RETURNED,
                timestamp=_dt(5),
                actor="retailer",
                note="Trade-in at partner store",
            ),
        ],
        current_location_lat=19.0760,
        current_location_lon=72.8777,
    )

    p3 = ProductPassport(
        product_id="DPP-3B88-771",
        sku="LC-CHAIR-ERG",
        name="Sustainex Ergo Chair",
        category="Furniture",
        origin_country="SE",
        manufacturer="Sustainex Furnish",
        condition=ProductCondition.POOR,
        materials=[
            MaterialComponent(
                name="Recycled steel frame",
                category="Metal",
                mass_kg=8.5,
                recyclable=True,
                reusable=True,
                commodity_index=0.48,
                embodied_carbon_kg_co2e=18.0,
            ),
            MaterialComponent(
                name="PET textile mesh",
                category="Textile",
                mass_kg=1.2,
                recyclable=True,
                reusable=True,
                commodity_index=0.22,
                embodied_carbon_kg_co2e=4.5,
            ),
            MaterialComponent(
                name="PU foam cushion",
                category="Foam",
                mass_kg=2.1,
                recyclable=False,
                reusable=False,
                commodity_index=0.1,
                embodied_carbon_kg_co2e=6.8,
            ),
        ],
        lifecycle_events=[
            LifecycleEvent(
                event_type=LifecycleEventType.MANUFACTURED,
                timestamp=_dt(900),
                actor="manufacturer",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.IN_USE,
                timestamp=_dt(880),
                actor="office",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.RETURNED,
                timestamp=_dt(2),
                actor="facility",
                note="End-of-lease bulk return",
            ),
        ],
        current_location_lat=28.6139,
        current_location_lon=77.2090,
    )

    p4 = ProductPassport(
        product_id="DPP-1A00-992",
        sku="LC-DRONE-SVY",
        name="Sustainex Survey Drone",
        category="Electronics — UAV",
        origin_country="CN",
        manufacturer="Sustainex Aero",
        condition=ProductCondition.END_OF_LIFE,
        materials=[
            MaterialComponent(
                name="Carbon fiber shell",
                category="Composite",
                mass_kg=0.35,
                recyclable=False,
                reusable=False,
                commodity_index=0.6,
                embodied_carbon_kg_co2e=7.5,
            ),
            MaterialComponent(
                name="Copper windings / motors",
                category="Metal",
                mass_kg=0.18,
                recyclable=True,
                reusable=True,
                commodity_index=0.82,
                embodied_carbon_kg_co2e=2.1,
            ),
            MaterialComponent(
                name="LiPo cells",
                category="Battery",
                mass_kg=0.25,
                recyclable=True,
                reusable=False,
                commodity_index=0.78,
                embodied_carbon_kg_co2e=5.4,
            ),
        ],
        lifecycle_events=[
            LifecycleEvent(
                event_type=LifecycleEventType.MANUFACTURED,
                timestamp=_dt(200),
                actor="manufacturer",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.IN_USE,
                timestamp=_dt(180),
                actor="agri_coop",
            ),
            LifecycleEvent(
                event_type=LifecycleEventType.RETURNED,
                timestamp=_dt(1),
                actor="operator",
                note="Crash damage — structural compromise",
            ),
        ],
        current_location_lat=17.3850,
        current_location_lon=78.4867,
    )

    return {p.product_id: p for p in (p1, p2, p3, p4)}


class InMemoryStore:
    def __init__(self) -> None:
        self.facilities = seed_facilities()
        self.products = seed_products()

    def get_product(self, product_id: str) -> ProductPassport | None:
        return self.products.get(product_id)

    def list_products(self) -> list[ProductPassport]:
        return list(self.products.values())

    def upsert_product(self, passport: ProductPassport) -> ProductPassport:
        self.products[passport.product_id] = passport
        return passport

    def append_event(self, product_id: str, event: LifecycleEvent) -> ProductPassport | None:
        p = self.products.get(product_id)
        if not p:
            return None
        p.lifecycle_events.append(event)
        self.products[product_id] = p
        return p


store = InMemoryStore()
