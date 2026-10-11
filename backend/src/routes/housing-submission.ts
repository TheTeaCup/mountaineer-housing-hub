export const propertyTypes = [
  "apartment_complex",
  "townhome",
  "house",
  "duplex",
  "condo",
  "other",
] as const;

function text(value: unknown, max: number, required = false): string | null {
  if (value === undefined || value === null) value = "";
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error("Check the required fields and text lengths.");
  return value.trim() || null;
}
function website(value: unknown): string | null {
  const result = text(value, 2048);
  if (result) {
    try {
      if (!["http:", "https:"].includes(new URL(result).protocol))
        throw new Error();
    } catch {
      throw new Error("Websites must use an http or https URL.");
    }
  }
  return result;
}

export function validateHousingSubmission(input: Record<string, unknown>) {
  const kind = input.submission_kind ?? "property";
  if (kind !== "property" && kind !== "agency")
    throw new Error("Choose a property or rental agency.");
  const name = text(input.name, 255, true);
  const site = website(input.website);
  const information = text(input.information, 10000);
  const type =
    kind === "property" ? (input.property_type ?? "apartment_complex") : null;
  if (
    kind === "property" &&
    !propertyTypes.includes(type as (typeof propertyTypes)[number])
  )
    throw new Error("Choose a valid property type.");
  const address = text(input.address, 255, kind === "property");
  const agencyId = input.agency_id ?? null;
  if (
    agencyId !== null &&
    (!Number.isSafeInteger(agencyId) || (agencyId as number) < 1)
  )
    throw new Error("Choose a valid rental agency.");
  const proposedName = text(input.proposed_agency_name, 255);
  const proposedWebsite = website(input.proposed_agency_website);
  if (agencyId && proposedName)
    throw new Error(
      "Choose an existing agency or suggest a new one, not both.",
    );
  if (proposedWebsite && !proposedName)
    throw new Error("Enter the name of the suggested rental agency.");
  if (kind === "agency" && (agencyId || proposedName || proposedWebsite))
    throw new Error(
      "A rental agency submission cannot have a managing agency.",
    );
  return {
    submission_kind: kind,
    name,
    address: kind === "property" ? address : null,
    website: site,
    information,
    property_type: type,
    agency_id: agencyId,
    proposed_agency_name: proposedName,
    proposed_agency_website: proposedWebsite,
  };
}
