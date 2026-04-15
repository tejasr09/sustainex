export type ProductCondition =
  | "new"
  | "good"
  | "fair"
  | "poor"
  | "end_of_life";

export type RoutingAction = "reuse" | "refurbish" | "remanufacture" | "recycle";

export interface MaterialComponent {
  name: string;
  category: string;
  mass_kg: number;
  recyclable: boolean;
  reusable: boolean;
  commodity_index: number;
  embodied_carbon_kg_co2e: number;
}

export interface LifecycleEvent {
  event_type: string;
  timestamp: string;
  actor: string;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProductPassport {
  product_id: string;
  sku: string;
  name: string;
  category: string;
  origin_country: string;
  manufacturer: string;
  condition: ProductCondition;
  materials: MaterialComponent[];
  lifecycle_events: LifecycleEvent[];
  current_location_lat?: number | null;
  current_location_lon?: number | null;
}

export interface ActionScore {
  action: RoutingAction;
  score: number;
  rationale: string[];
}

export interface Facility {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  capabilities: RoutingAction[];
}

export interface RoutingDecision {
  product_id: string;
  recommended: RoutingAction;
  confidence: number;
  action_scores: ActionScore[];
  estimated_value_retained_usd: number;
  estimated_carbon_saved_kg_co2e: number;
  matched_facility: Facility | null;
  model_version: string;
}

export interface MaterialInsight {
  product_id: string;
  components: MaterialComponent[];
  recyclable_mass_kg: number;
  reusable_mass_kg: number;
  estimated_recoverable_value_usd: number;
  estimated_embodied_carbon_kg_co2e: number;
  circularity_contribution: number;
}

export interface DashboardMetrics {
  reuse_rate_pct: number;
  recycling_efficiency_pct: number;
  carbon_savings_tons_co2e: number;
  value_retained_million_usd: number;
  circularity_score: number;
  products_tracked: number;
  returns_routed_30d: number;
  top_actions: Record<string, number>;
  trend_labels: string[];
  trend_circularity: number[];
  trend_carbon_tons: number[];
}
