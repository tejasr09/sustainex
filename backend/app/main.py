from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .data_store import store
from .schemas import (
    LifecycleEvent,
    LifecycleEventType,
    MaterialComponent,
    MaterialInsight,
    ProductPassport,
    RoutingDecision,
    RoutingRequest,
)
from .services.materials_intel import analyze_materials
from .services.routing_engine import decide
from .services.sustainability import build_dashboard

app = FastAPI(
    title="Sustainex Circular Intelligence API",
    description="Digital Product Passport, routing engine, materials intelligence, and sustainability analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
USERS: dict[str, dict[str, str]] = {}
SESSIONS: dict[str, str] = {}


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


DEFAULT_PARTS_BY_CATEGORY: dict[str, list[str]] = {
    "Mobile": ["Display", "Battery", "Motherboard", "Camera module", "Aluminum frame"],
    "Electronics": ["PCB assembly", "Battery", "Casing", "Connectors"],
    "Laptop": ["Display panel", "Battery pack", "PCB assembly", "SSD", "Aluminum chassis"],
}




@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sustainex-api"}


@app.get("/products", response_model=list[ProductPassport])
def list_products() -> list[ProductPassport]:
    return store.list_products()


@app.get("/products/{product_id}", response_model=ProductPassport)
def get_product(product_id: str) -> ProductPassport:
    p = store.get_product(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@app.post("/products", response_model=ProductPassport)
def create_product(passport: ProductPassport) -> ProductPassport:
    return store.upsert_product(passport)


@app.post("/products/upload", response_model=ProductPassport)
async def create_product_with_photo(
    product_id: str = Form(...),
    sku: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    origin_country: str = Form(...),
    manufacturer: str = Form(...),
    condition: str = Form(...),
    base_value_inr: float = Form(0),
    parts_json: str | None = Form(None),
    current_location_lat: float | None = Form(None),
    current_location_lon: float | None = Form(None),
    photo: UploadFile | None = File(None),
) -> ProductPassport:
    saved_name: str | None = None
    if photo and photo.filename:
        safe_ext = Path(photo.filename).suffix or ".jpg"
        saved_name = f"{uuid4().hex}{safe_ext}"
        destination = UPLOAD_DIR / saved_name
        payload = await photo.read()
        destination.write_bytes(payload)

    event = LifecycleEvent(
        event_type=LifecycleEventType.MANUFACTURED,
        timestamp=datetime.now(timezone.utc),
        actor="user",
        note="Created from product upload form",
        metadata={"photo_filename": saved_name} if saved_name else {},
    )
    parsed_parts: list[str] = []
    if parts_json:
        try:
            raw_parts = json.loads(parts_json)
            if isinstance(raw_parts, list):
                parsed_parts = [str(p).strip() for p in raw_parts if str(p).strip()]
        except Exception:
            parsed_parts = []

    source_parts = parsed_parts or DEFAULT_PARTS_BY_CATEGORY.get(category, DEFAULT_PARTS_BY_CATEGORY["Electronics"])
    each_mass = max(0.08, round(max(0.6, base_value_inr / 45000) / max(len(source_parts), 1), 3))
    commodity = min(0.95, max(0.25, 0.35 + base_value_inr / 250000))
    embodied = round(max(2.5, base_value_inr / 9000), 3)

    passport = ProductPassport(
        product_id=product_id,
        sku=sku,
        name=name,
        category=category,
        origin_country=origin_country,
        manufacturer=manufacturer,
        condition=condition,
        materials=[
            MaterialComponent(
                name=part,
                category="E-waste",
                mass_kg=each_mass,
                recyclable=True,
                reusable=True,
                commodity_index=commodity,
                embodied_carbon_kg_co2e=round(embodied / max(len(source_parts), 1), 3),
            )
            for part in source_parts
        ],
        lifecycle_events=[event],
        current_location_lat=current_location_lat,
        current_location_lon=current_location_lon,
    )
    return store.upsert_product(passport)


@app.post("/products/{product_id}/events", response_model=ProductPassport)
def add_event(product_id: str, event: LifecycleEvent) -> ProductPassport:
    p = store.append_event(product_id, event)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@app.post("/routing/decide", response_model=RoutingDecision)
def routing_decide(req: RoutingRequest) -> RoutingDecision:
    p = store.get_product(req.product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return decide(p, store.facilities, override_condition=req.override_condition)


@app.get("/materials/insights/{product_id}", response_model=MaterialInsight)
def materials_insights(product_id: str) -> MaterialInsight:
    p = store.get_product(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return analyze_materials(p)


@app.get("/analytics/dashboard")
def analytics_dashboard() -> dict:
    return build_dashboard().model_dump()


@app.get("/facilities")
def list_facilities() -> list[dict]:
    return [f.model_dump() for f in store.facilities]


@app.post("/demo/return/{product_id}", response_model=dict)
def simulate_return(product_id: str) -> dict:
    """End-to-end demo: mark returned + run routing + return insights."""
    p = store.get_product(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    event = LifecycleEvent(
        event_type=LifecycleEventType.RETURNED,
        timestamp=datetime.now(timezone.utc),
        actor="demo_user",
        note="Simulated return / EoL intake",
    )
    store.append_event(product_id, event)
    updated = store.get_product(product_id)
    assert updated is not None
    decision = decide(updated, store.facilities)
    insight = analyze_materials(updated)
    return {
        "passport": updated.model_dump(mode="json"),
        "routing": decision.model_dump(mode="json"),
        "materials": insight.model_dump(mode="json"),
    }


@app.post("/auth/signup")
def auth_signup(payload: SignupRequest) -> dict[str, str]:
    email = payload.email.strip().lower()
    if not email or not payload.password.strip() or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name, email, and password are required")
    if email in USERS:
        raise HTTPException(status_code=409, detail="Account already exists")
    USERS[email] = {"name": payload.name.strip(), "password": payload.password}
    return {"message": "Account created", "email": email}


@app.post("/auth/login")
def auth_login(payload: LoginRequest) -> dict[str, str]:
    email = payload.email.strip().lower()
    account = USERS.get(email)
    if not account or account["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session_id = uuid4().hex
    SESSIONS[session_id] = email
    return {"message": "Login successful", "email": email, "name": account["name"], "session_id": session_id}


@app.get("/auth/me")
def auth_me(session_id: str) -> dict[str, str]:
    email = SESSIONS.get(session_id)
    if not email:
        raise HTTPException(status_code=401, detail="Session expired")
    account = USERS.get(email)
    if not account:
        raise HTTPException(status_code=401, detail="Account missing")
    return {"email": email, "name": account["name"]}


@app.post("/auth/logout")
def auth_logout(session_id: str) -> dict[str, str]:
    SESSIONS.pop(session_id, None)
    return {"message": "Logged out"}


@app.get("/uploads/{filename}")
def get_uploaded_file(filename: str) -> FileResponse:
    safe_name = Path(filename).name
    file_path = UPLOAD_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
