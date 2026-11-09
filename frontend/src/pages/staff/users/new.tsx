import SEO from "@/components/seo";
import { SetupLink } from "@/components/staff/user-editor";
import { useAccount } from "@/components/ui/account-provider";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useState } from "react";

export default function NewExternalUser() {
  const { profile, error: accessError } = useAccount();
  const [created, setCreated] = useState<{
    id: number;
    setup_url: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <SEO title="Create external account · Staff" noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="700px" py={10}>
          <NextLink href="/staff/users">← Registered users</NextLink>
          <Heading as="h1" mt={4} mb={4}>
            Create agency or external account
          </Heading>
          {accessError ? (
            <Text role="alert">{accessError}</Text>
          ) : !profile ? (
            <Text>Checking staff access…</Text>
          ) : profile.role !== "staff" ? (
            <Text role="alert">Staff access is required.</Text>
          ) : created ? (
            <Stack gap={4}>
              <Text role="status">
                Account created. Share the setup link with the owner, then
                assign the agencies or properties they may edit.
              </Text>
              <SetupLink url={created.setup_url} />
              <NextLink href={`/staff/users/${created.id}`}>
                <Button>Manage this user’s access →</Button>
              </NextLink>
            </Stack>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setPending(true);
                setError("");
                try {
                  setCreated(
                    await accountRequest("/staff/users/external", "POST", {
                      name: form.get("name"),
                      email: form.get("email"),
                    }),
                  );
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setPending(false);
                }
              }}
            >
              <Stack gap={5}>
                <Text>
                  External accounts can sign in with any non-App State email
                  address and a password they choose. They receive access only
                  to agencies or individual properties assigned by staff.
                </Text>
                <Field.Root required>
                  <Field.Label>Account name</Field.Label>
                  <Input
                    name="name"
                    required
                    maxLength={255}
                    autoComplete="off"
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Email address</Field.Label>
                  <Input
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    autoComplete="off"
                  />
                </Field.Root>
                {error && (
                  <Text role="alert" color="fg.error">
                    {error}
                  </Text>
                )}
                <Button type="submit" loading={pending} alignSelf="flex-start">
                  Create account and setup link
                </Button>
              </Stack>
            </form>
          )}
        </Container>
      </Box>
    </>
  );
}
