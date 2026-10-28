import SEO from "@/components/seo";
import FloorPlanManager from "@/components/staff/floor-plan-manager";
import PropertyPhotoManager, {
  type StaffPropertyPhoto,
} from "@/components/staff/property-photo-manager";
import { useAccount } from "@/components/ui/account-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import type { FloorPlan } from "@/types/properties";
import { accountRequest } from "@/utils/api/account";
import { propertyTypeLabel } from "@/utils/api/properties";
import { formatPhoneNumber } from "@/utils/format-phone";
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface PropertyForm {
  submission_kind?: "property" | "agency";
  proposed_agency_name?: string | null;
  proposed_agency_website?: string | null;
  id: number;
  name: string;
  slug: string;
  address: string;
  property_type: string;
  website: string | null;
  information: string | null;
  agency_id: number | null;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  phone: string | null;
  photos: StaffPropertyPhoto[];
  floor_plans: FloorPlan[];
}
const fields = [
  ["name", "Property / community name", 255],
  ["address", "Street address", 255],
  ["address_line2", "Address line 2", 255],
  ["city", "City", 100],
  ["state", "State code", 2],
  ["postal_code", "Postal code", 10],
  ["website", "Website", 2048],
  ["phone", "Phone", 32],
  ["latitude", "Latitude", 20],
  ["longitude", "Longitude", 20],
] as const;
export default function EditProperty({
  suggestion = false,
}: {
  suggestion?: boolean;
}) {
  const router = useRouter();
  const { profile, error: accessError } = useAccount();
  const [property, setProperty] = useState<PropertyForm | null>(null);
  const [agencies, setAgencies] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const id = router.query.id;
  useEffect(() => {
    if (profile?.role !== "staff" || typeof id !== "string") return;
    let active = true;
    Promise.all([
      accountRequest<PropertyForm>(
        `/staff/${suggestion ? "apartments" : "properties"}/${id}`,
      ),
      accountRequest<{ id: number; name: string }[]>("/account/agencies"),
    ])
      .then(([property, agencies]) => {
        if (active) {
          setProperty({
            ...property,
            slug:
              property.slug ??
              (property.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .slice(0, 140)
                .replace(/^-|-$/g, "") ||
                "listing"),
            city: property.city ?? "Boone",
            state: property.state ?? "NC",
            photos: property.photos ?? [],
            floor_plans: property.floor_plans ?? [],
          });
          setAgencies(agencies);
        }
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [id, profile?.role, suggestion]);
  async function rejectSuggestion() {
    if (!suggestion || !property) return;
    setPending(true);
    setError("");
    try {
      await accountRequest(`/staff/apartments/${property.id}`, "PATCH", {
        status: "rejected",
      });
      notifySuccess("Suggestion rejected");
      await router.push("/staff/apartments");
    } catch (error) {
      notifyError("Could not reject suggestion", error);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <SEO title={suggestion ? "Review suggestion" : "Edit property"} noIndex />
      <Container maxW="800px" py={10}>
        <NextLink href="/staff/apartments">
          ← Property submissions and listings
        </NextLink>
        <Heading as="h1" my={5}>
          {suggestion ? "Review and edit suggestion" : "Edit property"}
        </Heading>
        {accessError || error ? (
          <Text role="alert">{accessError || error}</Text>
        ) : null}
        {profile?.role !== "staff" ? (
          <Text>Staff access is required.</Text>
        ) : !property || String(property.id) !== id ? (
          <Text>Loading property…</Text>
        ) : (
          <>
            <Box
              key={property.id}
              as="form"
              onSubmit={async (event) => {
                event.preventDefault();
                setPending(true);
                setError("");
                const data = Object.fromEntries(
                  new FormData(
                    event.currentTarget as unknown as HTMLFormElement,
                  ),
                );
                try {
                  const edits = {
                    ...data,
                    submission_kind: property.submission_kind ?? "property",
                    agency_id: data.agency_id ? Number(data.agency_id) : null,
                  };
                  const result = await accountRequest<{ propertyId?: number }>(
                    `/staff/${suggestion ? "apartments" : "properties"}/${property.id}`,
                    "PATCH",
                    suggestion ? { status: "approved", edits } : edits,
                  );
                  if (suggestion) {
                    notifySuccess(
                      "Suggestion published",
                      "Approved and published with your edits.",
                    );
                    await router.push(
                      result.propertyId
                        ? `/staff/properties/${result.propertyId}?published=1`
                        : "/staff/apartments",
                    );
                    return;
                  }
                  notifySuccess(
                    "Property saved",
                    "The public listing and map use these details.",
                  );
                  setProperty((current) =>
                    current ? { ...current, slug: String(data.slug) } : current,
                  );
                } catch (error) {
                  notifyError("Could not save property", error);
                } finally {
                  setPending(false);
                }
              }}
            >
              <Stack gap={4}>
                {suggestion && (
                  <Text>
                    Review and correct the submitted information. Publishing
                    will use the values in this form.
                  </Text>
                )}
                {property.submission_kind !== "agency" && (
                  <Text fontSize="sm" color="var(--site-muted)">
                    Keep buildings in the same apartment community under one
                    listing, such as University Highlands. Separate properties
                    across town get individual listings linked to their managing
                    agency. Use the main address and map location of the
                    community.
                  </Text>
                )}
                {property.submission_kind !== "agency" && (
                  <Field.Root required>
                    <Field.Label>
                      Property URL slug <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      name="slug"
                      defaultValue={property.slug}
                      required
                      maxLength={140}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    />
                    <Field.HelperText>
                      /properties/{property.slug}. Use lowercase letters,
                      numbers, and hyphens. Changing this slug changes the
                      public URL.
                    </Field.HelperText>
                  </Field.Root>
                )}
                {!suggestion && (
                  <NextLink href={`/properties/${property.slug}`}>
                    View public property page →
                  </NextLink>
                )}
                {property.submission_kind !== "agency" && (
                  <Text>
                    Add both coordinates to show this property on the map. Leave
                    both blank if the location has not been verified.
                  </Text>
                )}
                {fields
                  .filter(
                    ([name]) =>
                      property.submission_kind !== "agency" ||
                      ["name", "website", "phone"].includes(name),
                  )
                  .map(([name, label, max]) => (
                    <Field.Root
                      key={name}
                      required={["name", "address", "city", "state"].includes(
                        name,
                      )}
                    >
                      <Field.Label>
                        {name === "name" &&
                        property.submission_kind === "agency"
                          ? "Agency name"
                          : label}
                      </Field.Label>
                      <Input
                        name={name}
                        defaultValue={
                          name === "phone"
                            ? formatPhoneNumber(property.phone)
                            : (property[name] ?? "")
                        }
                        maxLength={max}
                        required={["name", "address", "city", "state"].includes(
                          name,
                        )}
                        type={
                          name === "website"
                            ? "url"
                            : name === "phone"
                              ? "tel"
                              : ["latitude", "longitude"].includes(name)
                                ? "number"
                                : "text"
                        }
                        step={
                          ["latitude", "longitude"].includes(name)
                            ? "any"
                            : undefined
                        }
                        inputMode={name === "phone" ? "tel" : undefined}
                        onBlur={
                          name === "phone"
                            ? (event) => {
                                event.currentTarget.value = formatPhoneNumber(
                                  event.currentTarget.value,
                                );
                              }
                            : undefined
                        }
                        min={
                          name === "latitude"
                            ? -90
                            : name === "longitude"
                              ? -180
                              : undefined
                        }
                        max={
                          name === "latitude"
                            ? 90
                            : name === "longitude"
                              ? 180
                              : undefined
                        }
                      />
                    </Field.Root>
                  ))}
                {property.submission_kind !== "agency" && (
                  <>
                    <Field.Root>
                      <Field.Label>Property type</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          name="property_type"
                          defaultValue={property.property_type}
                        >
                          {[
                            "apartment_complex",
                            "townhome",
                            "house",
                            "duplex",
                            "condo",
                            "other",
                          ].map((type) => (
                            <option key={type} value={type}>
                              {propertyTypeLabel(type)}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Managing agency</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          name="agency_id"
                          defaultValue={property.agency_id ?? ""}
                        >
                          <option value="">No separate agency known</option>
                          {agencies.map((agency) => (
                            <option key={agency.id} value={agency.id}>
                              {agency.name}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.HelperText>
                        Link a separate management company if known. Multiple
                        buildings do not make a community a rental agency.
                      </Field.HelperText>
                    </Field.Root>
                    {suggestion && (
                      <>
                        <Text>
                          To create a new managing agency, leave the existing
                          agency selection as No separate agency known and enter
                          its details below. Clear these fields to keep the
                          manager unknown or select an existing agency.
                        </Text>
                        <Field.Root>
                          <Field.Label>
                            Suggested managing agency name
                          </Field.Label>
                          <Input
                            name="proposed_agency_name"
                            defaultValue={property.proposed_agency_name ?? ""}
                            maxLength={255}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>
                            Suggested managing agency website
                          </Field.Label>
                          <Input
                            name="proposed_agency_website"
                            type="url"
                            defaultValue={
                              property.proposed_agency_website ?? ""
                            }
                            maxLength={2048}
                          />
                        </Field.Root>
                      </>
                    )}
                  </>
                )}
                <Field.Root>
                  <Field.Label>Description</Field.Label>
                  <Textarea
                    name="information"
                    defaultValue={property.information ?? ""}
                    rows={6}
                    maxLength={10000}
                  />
                </Field.Root>
                <Button type="submit" loading={pending}>
                  {suggestion
                    ? "Approve and publish edited suggestion"
                    : "Save property"}
                </Button>
                {suggestion &&
                  (confirmReject ? (
                    <Box
                      borderWidth="1px"
                      borderColor="border.error"
                      borderRadius="md"
                      p={4}
                    >
                      <Text mb={3}>
                        Reject this suggestion without adding it to the catalog?
                      </Text>
                      <Stack direction="row" gap={3}>
                        <Button
                          type="button"
                          colorPalette="red"
                          loading={pending}
                          onClick={rejectSuggestion}
                        >
                          Confirm rejection
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={pending}
                          onClick={() => setConfirmReject(false)}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      colorPalette="red"
                      disabled={pending}
                      onClick={() => setConfirmReject(true)}
                    >
                      Reject suggestion
                    </Button>
                  ))}
              </Stack>
            </Box>
            {!suggestion && (
              <Stack gap={4} mt={4}>
                <FloorPlanManager
                  propertyId={property.id}
                  floorPlans={property.floor_plans}
                  onChange={(floorPlans) =>
                    setProperty((current) =>
                      current
                        ? { ...current, floor_plans: floorPlans }
                        : current,
                    )
                  }
                />
                <PropertyPhotoManager
                  propertyId={property.id}
                  photos={property.photos}
                  onChange={(photos) =>
                    setProperty((current) =>
                      current ? { ...current, photos } : current,
                    )
                  }
                />
              </Stack>
            )}
          </>
        )}
      </Container>
    </>
  );
}
