import { useAuth } from "@/components/ui/auth-provider";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";

const propertyTypes = [
  ["apartment_complex", "Apartment complex / community"],
  ["townhome", "Townhome"],
  ["house", "House"],
  ["duplex", "Duplex"],
  ["condo", "Condominium"],
  ["other", "Other"],
];

export default function ApartmentForm() {
  const { session, loading } = useAuth();
  const [kind, setKind] = useState("property");
  const [manager, setManager] = useState("unknown");
  const [agencies, setAgencies] = useState<{ id: number; name: string }[]>([]);
  const [agencyError, setAgencyError] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (notice) {
      confirmation.current?.focus();
      confirmation.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [notice]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    accountRequest<{ id: number; name: string }[]>("/account/agencies")
      .then((data) => {
        if (active) setAgencies(data);
      })
      .catch(() => {
        if (active)
          setAgencyError(
            "The agency list is unavailable. You can leave the manager unknown or suggest a new agency.",
          );
      });
    return () => {
      active = false;
    };
  }, [session]);
  if (loading) return <Text>Loading…</Text>;
  if (!session)
    return (
      <Text>
        <NextLink href="/auth/login">Sign in</NextLink> to suggest a property or
        rental agency.
      </Text>
    );
  return (
    <>
      <NextLink href="/submit">← Back to apartment reviews</NextLink>
      <Heading as="h1" mt={4} mb={3}>
        Suggest a Property or Rental Agency
      </Heading>
      <Text mb={6}>
        A property is a building, community, or home where people live. A rental
        agency is the company that manages properties. One agency can manage
        several different properties. Staff will verify your suggestion before
        it is added.
      </Text>
      {error && (
        <Text role="alert" color="fg.error" mb={3}>
          {error}
        </Text>
      )}
      {notice && (
        <Box
          ref={confirmation}
          tabIndex={-1}
          role="status"
          borderWidth="2px"
          borderColor="var(--site-accent-fg)"
          borderRadius="lg"
          p={6}
          mb={5}
        >
          <Heading as="h2" size="lg" mb={3}>
            Suggestion received
          </Heading>
          <Text mb={4}>{notice} Staff will verify it before publication.</Text>
          <Button onClick={() => setNotice("")}>
            Submit another suggestion
          </Button>
          <Box mt={4}>
            <NextLink href="/submit">Back to apartment reviews</NextLink>
          </Box>
        </Box>
      )}
      <Box
        display={notice ? "none" : undefined}
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as unknown as HTMLFormElement;
          const data = new FormData(form);
          setPending(true);
          setError("");
          setNotice("");
          try {
            await accountRequest("/account/apartments", "POST", {
              submission_kind: kind,
              name: data.get("name"),
              address: kind === "property" ? data.get("address") : null,
              property_type:
                kind === "property" ? data.get("property_type") : null,
              website: data.get("website"),
              information: data.get("information"),
              agency_id:
                kind === "property" && !["unknown", "new"].includes(manager)
                  ? Number(manager)
                  : null,
              proposed_agency_name:
                kind === "property" && manager === "new"
                  ? data.get("proposed_agency_name")
                  : null,
              proposed_agency_website:
                kind === "property" && manager === "new"
                  ? data.get("proposed_agency_website")
                  : null,
            });
            setNotice(
              `Your suggestion for ${String(data.get("name"))} was submitted for staff review.`,
            );
            form.reset();
            setManager("unknown");
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        <Stack gap={5}>
          <Field.Root>
            <Field.Label>What is missing from the site?</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                aria-label="Suggestion type"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setManager("unknown");
                  setError("");
                  setNotice("");
                }}
              >
                <option value="property">
                  A property / apartment community
                </option>
                <option value="agency">
                  A rental agency / management company
                </option>
              </NativeSelect.Field>
              <NativeSelect.Indicator color="var(--site-muted)" />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              {kind === "property"
                ? "Property / building name"
                : "Rental agency name"}{" "}
              <Field.RequiredIndicator />
            </Field.Label>
            <Input name="name" required maxLength={255} />
          </Field.Root>
          {kind === "property" && (
            <>
              <Field.Root>
                <Field.Label>Property type</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    name="property_type"
                    defaultValue="apartment_complex"
                  >
                    {propertyTypes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator color="var(--site-muted)" />
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>
                  Property address <Field.RequiredIndicator />
                </Field.Label>
                <Input name="address" required maxLength={255} />
                <Field.HelperText>
                  Use the property address, not the rental agency office
                  address.
                </Field.HelperText>
              </Field.Root>
              <Field.Root>
                <Field.Label>Operated / managed by</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    aria-label="Managing rental agency"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                  >
                    <option value="unknown">
                      I do not know the managing agency
                    </option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                    <option value="new">
                      The agency is not listed — suggest a new one
                    </option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator color="var(--site-muted)" />
                </NativeSelect.Root>
                <Field.HelperText>
                  Choose the company that currently manages this property, if
                  known.
                </Field.HelperText>
                {agencyError && (
                  <Text fontSize="sm" role="status">
                    {agencyError}
                  </Text>
                )}
              </Field.Root>
              {manager === "new" && (
                <Box
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  p={5}
                  borderRadius="lg"
                >
                  <Stack gap={4}>
                    <Text fontWeight="bold">Missing rental agency</Text>
                    <Field.Root required>
                      <Field.Label>
                        Agency name <Field.RequiredIndicator />
                      </Field.Label>
                      <Input
                        name="proposed_agency_name"
                        required
                        maxLength={255}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Agency website</Field.Label>
                      <Input
                        name="proposed_agency_website"
                        type="url"
                        maxLength={2048}
                        placeholder="https://example.com"
                      />
                    </Field.Root>
                    <Text fontSize="sm">
                      Staff will check the agency and its relationship to this
                      property.
                    </Text>
                  </Stack>
                </Box>
              )}
            </>
          )}
          <Field.Root>
            <Field.Label>
              {kind === "property" ? "Property website" : "Agency website"}
            </Field.Label>
            <Input
              name="website"
              type="url"
              maxLength={2048}
              placeholder="https://example.com"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Additional information</Field.Label>
            <Textarea
              name="information"
              maxLength={10000}
              rows={5}
              placeholder="Share anything that could help staff verify the suggestion."
            />
          </Field.Root>
          <Button
            type="submit"
            loading={pending}
            bg="#ffc72c"
            color="#111111"
            alignSelf="flex-start"
          >
            Submit {kind === "property" ? "property" : "agency"} suggestion
          </Button>
        </Stack>
      </Box>
    </>
  );
}
