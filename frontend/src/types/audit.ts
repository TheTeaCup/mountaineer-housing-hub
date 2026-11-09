export interface SetupAudit {
  issue_count: number;
  property_count: number;
  agency_count: number;
  items: {
    id: number;
    name: string;
    kind: "property" | "agency";
    status?: string;
    href: string;
    issues: { label: string; href: string }[];
  }[];
}
