import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { accountRequest } from "@/utils/api/account";
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
}
const fields = [
  ["name", "Property name", 255],
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
export default function EditProperty() {
  const router = useRouter();
  const { profile, error: accessError } = useAccount();
  const [property, setProperty] = useState<PropertyForm | null>(null);
  const [agencies, setAgencies] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const id = router.query.id;
  useEffect(() => {
    if (profile?.role !== "staff" || typeof id !== "string") return;
    let active = true;
    Promise.all([
      accountRequest<PropertyForm>(`/staff/properties/${id}`),
      accountRequest<{ id: number; name: string }[]>("/account/agencies"),
    ])
      .then(([property, agencies]) => {
        if (active) {
          setProperty(property);
          setAgencies(agencies);
        }
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [id, profile?.role]);
  return (
    <>
      <SEO title="Edit property" noIndex />
      <Container maxW="800px" py={10}>
        <NextLink href="/staff/apartments">
          ← Property submissions and listings
        </NextLink>
        <Heading as="h1" my={5}>
          Edit property
        </Heading>
        {accessError || error ? (
          <Text role="alert">{accessError || error}</Text>
        ) : null}
        {profile?.role !== "staff" ? (
          <Text>Staff access is required.</Text>
        ) : !property || String(property.id) !== id ? (
          <Text>Loading property…</Text>
        ) : (
          <Box
            key={property.id}
            as="form"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError("");
              setNotice("");
              const data = Object.fromEntries(
                new FormData(event.currentTarget as unknown as HTMLFormElement),
              );
              try {
                await accountRequest(
                  `/staff/properties/${property.id}`,
                  "PATCH",
                  {
                    ...data,
                    agency_id: data.agency_id ? Number(data.agency_id) : null,
                  },
                );
                setNotice(
                  "Property saved. The public listing and map use these details.",
                );
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setPending(false);
              }
            }}
          >
            <Stack gap={4}>
              <Text>
                Add both coordinates to show this property on the map. Leave
                both blank if the location has not been verified.
              </Text>
              {fields.map(([name, label, max]) => (
                <Field.Root
                  key={name}
                  required={["name", "address", "city", "state"].includes(name)}
                >
                  <Field.Label>{label}</Field.Label>
                  <Input
                    name={name}
                    defaultValue={property[name] ?? ""}
                    maxLength={max}
                    required={["name", "address", "city", "state"].includes(
                      name,
                    )}
                    type={
                      name === "website"
                        ? "url"
                        : ["latitude", "longitude"].includes(name)
                          ? "number"
                          : "text"
                    }
                    step={
                      ["latitude", "longitude"].includes(name)
                        ? "any"
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
                        {type.replace(/_/g, " ")}
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
                    <option value="">Unknown</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                  name="information"
                  defaultValue={property.information ?? ""}
                  rows={6}
                  maxLength={10000}
                />
              </Field.Root>
              {notice && <Text role="status">{notice}</Text>}
              <Button type="submit" loading={pending}>
                Save property
              </Button>
            </Stack>
          </Box>
        )}
      </Container>
    </>
  );
}
