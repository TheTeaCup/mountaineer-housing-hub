import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
import { formatPhoneNumber } from "@/utils/format-phone";
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface AgencyForm {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  information: string | null;
}

export default function EditAgency() {
  const router = useRouter();
  const { profile, error: accessError } = useAccount();
  const id = router.query.id;
  const [agency, setAgency] = useState<AgencyForm | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (profile?.role !== "staff" || typeof id !== "string") return;
    let active = true;
    accountRequest<AgencyForm>(`/staff/agencies/${id}`)
      .then((result) => {
        if (active) setAgency(result);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [id, profile?.role]);

  return (
    <>
      <SEO title="Edit rental agency" noIndex />
      <Container maxW="800px" py={10}>
        <NextLink href="/staff/agencies">← Rental agencies</NextLink>
        <Heading as="h1" my={5}>
          Edit rental agency
        </Heading>
        {accessError || error ? (
          <Text role="alert" color="fg.error">
            {accessError || error}
          </Text>
        ) : null}
        {profile?.role !== "staff" ? (
          <Text>Staff access is required.</Text>
        ) : !agency || String(agency.id) !== id ? (
          <Text>Loading rental agency…</Text>
        ) : (
          <Box
            as="form"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError("");
              const data = Object.fromEntries(
                new FormData(event.currentTarget as HTMLFormElement),
              );
              try {
                await accountRequest(
                  `/staff/agencies/${agency.id}`,
                  "PATCH",
                  data,
                );
                setAgency((current) =>
                  current
                    ? {
                        ...current,
                        name: String(data.name),
                        slug: String(data.slug),
                        website: String(data.website || "") || null,
                        phone: String(data.phone || "") || null,
                        email: String(data.email || "") || null,
                        information: String(data.information || "") || null,
                      }
                    : current,
                );
                notifySuccess("Rental agency saved");
              } catch (requestError) {
                notifyError("Could not save rental agency", requestError);
              } finally {
                setPending(false);
              }
            }}
          >
            <Stack gap={5}>
              <Field.Root required>
                <Field.Label>
                  Agency name <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  name="name"
                  defaultValue={agency.name}
                  required
                  maxLength={255}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>
                  Agency URL slug <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  name="slug"
                  defaultValue={agency.slug}
                  required
                  maxLength={140}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                />
                <Field.HelperText>
                  /agencies/{agency.slug}. Use lowercase letters, numbers, and
                  hyphens. Changing this slug changes the public URL.
                </Field.HelperText>
              </Field.Root>
              <NextLink href={`/agencies/${agency.slug}`}>
                View public agency page →
              </NextLink>
              <Field.Root>
                <Field.Label>Website</Field.Label>
                <Input
                  name="website"
                  type="url"
                  defaultValue={agency.website ?? ""}
                  maxLength={2048}
                  placeholder="https://example.com"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Phone</Field.Label>
                <Input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={formatPhoneNumber(agency.phone)}
                  maxLength={32}
                  placeholder="(828) 555-0123"
                  onBlur={(event) => {
                    event.currentTarget.value = formatPhoneNumber(
                      event.currentTarget.value,
                    );
                  }}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={agency.email ?? ""}
                  maxLength={255}
                  placeholder="leasing@example.com"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                  name="information"
                  defaultValue={agency.information ?? ""}
                  rows={6}
                  maxLength={10000}
                />
              </Field.Root>
              <Button type="submit" loading={pending}>
                Save rental agency
              </Button>
            </Stack>
          </Box>
        )}
      </Container>
    </>
  );
}
