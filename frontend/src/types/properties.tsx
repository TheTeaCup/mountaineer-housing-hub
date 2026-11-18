export interface FloorPlan {
  id: number;
  name: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  rent_min: number | null;
  rent_max: number | null;
  rent_basis: "per_unit" | "per_bedroom";
  description: string | null;
}
export interface Property {
  id: number;
  name: string;
  slug: string;
  property_type: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  bus_route_ids?: string[];
  parking_type?: "free" | "monthly" | "one_time" | null;
  website_url: string | null;
  phone: string | null;
  agency: {
    id: number;
    name: string;
    slug: string;
    website_url: string | null;
    phone: string | null;
  } | null;
  review_count: number;
  average_rating: number | null;
  latest_review?: { date: string; excerpt: string };
  floor_plans: FloorPlan[];
  photos: { image_url: string; alt_text: string | null }[];
}
