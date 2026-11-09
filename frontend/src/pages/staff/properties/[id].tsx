import SEO from "@/components/seo";
import PropertyEditorNav from "@/components/staff/property-editor-nav";
import type { StaffPropertyPhoto } from "@/components/staff/property-photo-manager";
import { useAccount } from "@/components/ui/account-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import type { FloorPlan } from "@/types/properties";
import { accountRequest } from "@/utils/api/account";
import { propertyTypeLabel } from "@/utils/api/properties";
import { formatPhoneNumber } from "@/utils/format-phone";
import { parseSubmittedAddress } from "@/utils/parse-address";
import {
  Box,
  Button,
  Container,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

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
interface AgencyOption {
  id: number;
  name: string;
  website: string | null;
  phone: string | null;
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
  assigned = false,
}: {
  suggestion?: boolean;
  assigned?: boolean;
}) {
  const router = useRouter();
  const { profile, error: accessError } = useAccount();
  const role = profile?.role;
  const formRef = useRef<HTMLFormElement | null>(null);
  const [property, setProperty] = useState<PropertyForm | null>(null);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [creatingAgency, setCreatingAgency] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const id = router.query.id;
  useEffect(() => {
    if (!role || (role !== "staff" && !assigned) || typeof id !== "string")
      return;
    let active = true;
    Promise.all([
      accountRequest<PropertyForm>(
        `/staff/${suggestion ? "apartments" : "properties"}/${id}`,
      ),
      accountRequest<AgencyOption[]>("/account/agencies"),
    ])
      .then(([property, agencies]) => {
        if (active) {
          const parsedAddress =
            suggestion && property.submission_kind !== "agency"
              ? parseSubmittedAddress(property.address)
              : null;
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
            address: parsedAddress?.address ?? property.address,
            address_line2:
              property.address_line2 ?? parsedAddress?.addressLine2 ?? null,
            city: property.city ?? parsedAddress?.city ?? "Boone",
            state: property.state ?? parsedAddress?.state ?? "NC",
            postal_code:
              property.postal_code ?? parsedAddress?.postalCode ?? null,
            photos: property.photos ?? [],
            floor_plans: property.floor_plans ?? [],
          });
          setAgencies(agencies);
          setSelectedAgencyId(
            property.agency_id === null ? "" : String(property.agency_id),
          );
          setCreatingAgency(
            property.agency_id === null &&
              Boolean(
                property.proposed_agency_name ||
                property.proposed_agency_website,
              ),
          );
        }
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [assigned, id, role, suggestion]);
  const selectedAgency = agencies.find(
    (agency) => String(agency.id) === selectedAgencyId,
  );
  function applyAgencyContact(field: "website" | "phone") {
    const value = selectedAgency?.[field];
    const input = formRef.current?.elements.namedItem(field);
    if (!value || !(input instanceof HTMLInputElement)) return;
    input.value = field === "phone" ? formatPhoneNumber(value) : value;
    input.focus();
    notifySuccess(
      `Agency ${field} copied`,
      `The ${field} from ${selectedAgency.name} is now in the property form.`,
    );
  }
  const readinessWarnings = property
    ? [
        property.latitude === null ||
        property.latitude === "" ||
        property.longitude === null ||
        property.longitude === ""
          ? "Map coordinates are missing, so this property will not appear on the map."
          : null,
        !property.photos.length
          ? "No property photos have been added. Add at least one image for the listing cover."
          : null,
        !property.floor_plans.length
          ? "No floor plans or pricing have been added."
          : null,
        !property.information?.trim()
          ? "The property description is missing."
          : null,
        !property.website?.trim() && !property.phone?.trim()
          ? "No property website or phone number has been provided."
          : null,
      ].filter((warning): warning is string => warning !== null)
    : [];
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
        <NextLink href={assigned ? "/account" : "/staff/apartments"}>
          ← {assigned ? "My account" : "Property submissions and listings"}
        </NextLink>
        <Heading as="h1" my={5}>
          {suggestion ? "Review and edit suggestion" : "Edit property"}
        </Heading>
        {!suggestion && typeof id === "string" && (
          <PropertyEditorNav
            propertyId={id}
            assigned={assigned}
            active="details"
          />
        )}
        {accessError || error ? (
          <Text role="alert">{accessError || error}</Text>
        ) : !profile ? (
          <Text>Checking property access…</Text>
        ) : profile.role !== "staff" && !assigned ? (
          <Text>Staff access is required.</Text>
        ) : !property || String(property.id) !== id ? (
          <Text>Loading property…</Text>
        ) : (
          <>
            <Box
              key={property.id}
              as="form"
              ref={formRef}
              bg="var(--site-surface)"
              borderWidth="1px"
              borderColor="var(--site-border)"
              borderRadius="xl"
              boxShadow="sm"
              p={{ base: 4, md: 6 }}
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
                    agency_id:
                      assigned && role !== "staff"
                        ? property.agency_id
                        : data.agency_id
                          ? Number(data.agency_id)
                          : null,
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
                    current
                      ? {
                          ...current,
                          slug: String(data.slug),
                          information: String(data.information || "") || null,
                          website: String(data.website || "") || null,
                          phone: String(data.phone || "") || null,
                          latitude: String(data.latitude || "") || null,
                          longitude: String(data.longitude || "") || null,
                        }
                      : current,
                  );
                } catch (error) {
                  notifyError("Could not save property", error);
                } finally {
                  setPending(false);
                }
              }}
            >
              <Stack gap={6}>
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
                  <Box
                    borderWidth="1px"
                    borderColor={
                      readinessWarnings.length
                        ? "border.warning"
                        : "border.success"
                    }
                    borderRadius="lg"
                    p={4}
                  >
                    <Heading as="h2" size="md" mb={2}>
                      Listing readiness
                    </Heading>
                    {readinessWarnings.length ? (
                      <Box as="ul" pl={5}>
                        {readinessWarnings.map((warning) => (
                          <li key={warning}>
                            <Text>{warning}</Text>
                          </li>
                        ))}
                      </Box>
                    ) : (
                      <Text>
                        This listing has its core map, photo, floor-plan,
                        description, and contact information.
                      </Text>
                    )}
                  </Box>
                )}
                {property.submission_kind !== "agency" && (
                  <Box>
                    <Heading as="h2" size="md">
                      Listing details
                    </Heading>
                    <Text mt={1} fontSize="sm" color="var(--site-muted)">
                      Add the public-facing address, contact information, and
                      map location.
                    </Text>
                  </Box>
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
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {fields
                    .filter(
                      ([name]) =>
                        property.submission_kind !== "agency" ||
                        ["name", "website", "phone"].includes(name),
                    )
                    .map(([name, label, max]) => (
                      <Field.Root
                        key={name}
                        gridColumn={
                          ["name", "address"].includes(name)
                            ? { md: "span 2" }
                            : undefined
                        }
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
                        <Flex
                          gap={2}
                          align={
                            name === "website" || name === "phone"
                              ? "flex-start"
                              : "center"
                          }
                          direction={
                            name === "website" || name === "phone"
                              ? "column"
                              : "row"
                          }
                        >
                          <Input
                            w="100%"
                            name={name}
                            defaultValue={
                              name === "phone"
                                ? formatPhoneNumber(property.phone)
                                : (property[name] ?? "")
                            }
                            maxLength={max}
                            required={[
                              "name",
                              "address",
                              "city",
                              "state",
                            ].includes(name)}
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
                                    event.currentTarget.value =
                                      formatPhoneNumber(
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
                          {(name === "website" || name === "phone") &&
                            selectedAgency?.[name] && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyAgencyContact(name)}
                              >
                                Use agency {name}
                              </Button>
                            )}
                        </Flex>
                        {name === "longitude" && (
                          <Field.HelperText>
                            Add both coordinates to display this property on the
                            map, or leave both blank if unverified.
                          </Field.HelperText>
                        )}
                      </Field.Root>
                    ))}
                </SimpleGrid>
                {property.submission_kind !== "agency" && (
                  <Box
                    bg="var(--site-muted-surface)"
                    borderRadius="lg"
                    p={{ base: 4, md: 5 }}
                  >
                    <Heading as="h2" size="md" mb={4}>
                      Type and management
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
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
                        <NativeSelect.Root
                          disabled={assigned && role !== "staff"}
                        >
                          <NativeSelect.Field
                            name="agency_id"
                            value={selectedAgencyId}
                            onChange={(event) => {
                              setSelectedAgencyId(event.currentTarget.value);
                              setCreatingAgency(false);
                            }}
                          >
                            <option value="">No agency selected</option>
                            {agencies.map((agency) => (
                              <option key={agency.id} value={agency.id}>
                                {agency.name}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <Field.HelperText>
                          {assigned && role !== "staff"
                            ? "Contact staff to change the managing agency. "
                            : ""}
                          {selectedAgency
                            ? `Using ${selectedAgency.name} as the managing company.`
                            : "Link a separate management company when one is known."}
                        </Field.HelperText>
                      </Field.Root>
                    </SimpleGrid>
                    {suggestion && selectedAgency && (
                      <Box mt={4}>
                        <Text fontSize="sm" color="var(--site-muted)">
                          Need to create a different managing company? Click the
                          button below to clear this selection and add one.
                        </Text>
                        <Button
                          type="button"
                          mt={2}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAgencyId("");
                            setCreatingAgency(true);
                          }}
                        >
                          Add a new agency instead
                        </Button>
                      </Box>
                    )}
                    {suggestion && !selectedAgency && !creatingAgency && (
                      <Box mt={4}>
                        <Text fontSize="sm" color="var(--site-muted)">
                          Can’t find the managing company in the list? Click the
                          button below to add it.
                        </Text>
                        <Button
                          type="button"
                          mt={2}
                          size="sm"
                          variant="outline"
                          onClick={() => setCreatingAgency(true)}
                        >
                          Add a new agency
                        </Button>
                      </Box>
                    )}
                    {suggestion && !selectedAgency && creatingAgency && (
                      <Box
                        mt={4}
                        bg="var(--site-surface)"
                        borderWidth="1px"
                        borderColor="var(--site-border)"
                        borderRadius="md"
                        p={4}
                      >
                        <Flex justify="space-between" align="center" gap={3}>
                          <Heading as="h3" size="sm">
                            New managing agency
                          </Heading>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => setCreatingAgency(false)}
                          >
                            Cancel
                          </Button>
                        </Flex>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                          <Field.Root>
                            <Field.Label>Agency name</Field.Label>
                            <Input
                              name="proposed_agency_name"
                              defaultValue={property.proposed_agency_name ?? ""}
                              maxLength={255}
                            />
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Agency website</Field.Label>
                            <Input
                              name="proposed_agency_website"
                              type="url"
                              defaultValue={
                                property.proposed_agency_website ?? ""
                              }
                              maxLength={2048}
                            />
                          </Field.Root>
                        </SimpleGrid>
                      </Box>
                    )}
                  </Box>
                )}
                <Box>
                  <Heading as="h2" size="md" mb={1}>
                    Description
                  </Heading>
                  <Text mb={3} fontSize="sm" color="var(--site-muted)">
                    Summarize the property, location, and notable amenities.
                  </Text>
                  <Textarea
                    name="information"
                    aria-label="Description"
                    defaultValue={property.information ?? ""}
                    rows={7}
                    maxLength={10000}
                  />
                </Box>
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
          </>
        )}
      </Container>
    </>
  );
}
