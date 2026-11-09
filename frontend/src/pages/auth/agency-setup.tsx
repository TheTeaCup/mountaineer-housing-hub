import SEO from "@/components/seo";
import { API_URL } from "@/utils/api/auth";
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
import { useEffect, useState } from "react";

export default function AgencySetup() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setToken(window.location.hash.slice(1));
    setReady(true);
  }, []);
  return (
    <>
      <SEO title="Set agency account password" noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="550px" py={12}>
          <Heading as="h1" mb={5}>
            Set your account password
          </Heading>
          {done ? (
            <Stack gap={4}>
              <Text role="status">
                Your password is saved. You can now sign in with the email
                address staff used to create your account.
              </Text>
              <NextLink href="/auth/login?mode=agency">
                <Button>Agency or external login →</Button>
              </NextLink>
            </Stack>
          ) : !ready ? (
            <Text>Loading setup link…</Text>
          ) : !/^[a-f0-9]{64}$/.test(token) ? (
            <Text role="alert">
              This setup link is incomplete. Ask staff for a new password setup
              link.
            </Text>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const password = String(data.get("password"));
                if (password !== data.get("confirm")) {
                  setError("The passwords do not match.");
                  return;
                }
                setPending(true);
                setError("");
                try {
                  const response = await fetch(
                    `${API_URL}/external-account/activate`,
                    {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token, password }),
                    },
                  );
                  const result = await response.json();
                  if (!response.ok)
                    throw new Error(
                      result.message || "Could not set your password.",
                    );
                  window.history.replaceState(
                    null,
                    "",
                    window.location.pathname,
                  );
                  setToken("");
                  setDone(true);
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setPending(false);
                }
              }}
            >
              <Stack gap={4}>
                <Text>
                  Choose a password between 12 and 128 characters. This link
                  works once and expires 24 hours after staff create it. Setting
                  a password ends any existing sessions for this account.
                </Text>
                <Field.Root required>
                  <Field.Label>New password</Field.Label>
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    disabled={pending}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Confirm password</Field.Label>
                  <Input
                    name="confirm"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    disabled={pending}
                  />
                </Field.Root>
                {error && (
                  <Text role="alert" color="fg.error">
                    {error}
                  </Text>
                )}
                <Button type="submit" loading={pending}>
                  Save password
                </Button>
              </Stack>
            </form>
          )}
        </Container>
      </Box>
    </>
  );
}
