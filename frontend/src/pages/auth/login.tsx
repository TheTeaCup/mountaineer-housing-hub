import SEO from "@/components/seo";
import { useAuth } from "@/components/ui/auth-provider";
import { signInWithEmail, signInWithGoogle } from "@/utils/api/auth";
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";

export default function AuthLogin() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [external, setExternal] = useState(false);
  useEffect(() => {
    if (router.query.mode === "agency") setExternal(true);
  }, [router.query.mode]);
  const handleGoogleLogin = async () => {
    setError("");
    setPending(true);
    try {
      window.location.assign(signInWithGoogle());
    } catch {
      setError(
        "Could not start Google sign-in. Please try again or check that the API is running.",
      );
      setPending(false);
    }
  };

  return (
    <>
      <SEO title="Login" />

      <Box
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container maxW="500px" py={{ base: 12, md: 20 }}>
          <Box
            bg="var(--site-surface)"
            borderWidth="1px"
            borderColor="var(--site-border)"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
            boxShadow="sm"
          >
            <VStack gap={6} align="stretch">
              <Box textAlign="center">
                <Heading as="h1" size="xl" color="var(--site-heading)" mb={3}>
                  Welcome
                </Heading>

                <Text color="var(--site-muted)" fontSize="md">
                  Sign in to continue to Mountaineer Housing Hub.
                </Text>
              </Box>

              {session ? (
                <Text role="status">Signed in as {session.user.email}.</Text>
              ) : external ? (
                <Stack gap={4}>
                  <Heading as="h2" size="md">
                    Agency or external login
                  </Heading>
                  <Text fontSize="sm">
                    Use the account created for you by staff. If you need access
                    or a password reset, contact the site staff for a setup
                    link.
                  </Text>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      setPending(true);
                      setError("");
                      try {
                        await signInWithEmail(
                          String(data.get("email")).trim(),
                          String(data.get("password")),
                        );
                        window.location.assign("/account");
                      } catch {
                        setError(
                          "Could not sign in. Check your email and password, or ask staff to confirm your account is active.",
                        );
                        setPending(false);
                      }
                    }}
                  >
                    <Stack gap={4}>
                      <Field.Root required>
                        <Field.Label>Email address</Field.Label>
                        <Input
                          name="email"
                          type="email"
                          required
                          autoComplete="username"
                        />
                      </Field.Root>
                      <Field.Root required>
                        <Field.Label>Password</Field.Label>
                        <Input
                          name="password"
                          type="password"
                          required
                          maxLength={128}
                          autoComplete="current-password"
                        />
                      </Field.Root>
                      <Button
                        type="submit"
                        loading={pending}
                        disabled={loading || pending}
                      >
                        Sign in
                      </Button>
                    </Stack>
                  </form>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      setExternal(false);
                      setError("");
                    }}
                  >
                    Use App State Google login
                  </Button>
                </Stack>
              ) : (
                <Stack gap={3}>
                  <Button
                    size="lg"
                    width="100%"
                    bg="var(--site-surface)"
                    color="var(--site-fg)"
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    _hover={{
                      bg: "var(--site-muted-surface)",
                      borderColor: "#c6c6c6",
                    }}
                    onClick={handleGoogleLogin}
                    loading={pending}
                    loadingText="Connecting to Google"
                    disabled={loading || pending}
                  >
                    <FaGoogle />
                    Sign in with your App State Email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || pending}
                    onClick={() => {
                      setExternal(true);
                      setError("");
                    }}
                  >
                    Agency or external login
                  </Button>
                </Stack>
              )}

              {(error || router.query.error) && (
                <Text role="alert" color="fg.error">
                  {error ||
                    "Google sign-in was unsuccessful. Please try again with your App State email."}
                </Text>
              )}

              <Text
                textAlign="center"
                fontSize="sm"
                color="var(--site-muted)"
                lineHeight="1.6"
              >
                Students sign in with App State Google accounts. Agency and
                external accounts are created by staff. By signing in, you agree
                to our{" "}
                <NextLink
                  href="/legal/terms"
                  style={{ textDecoration: "underline" }}
                >
                  Terms of Use
                </NextLink>{" "}
                and acknowledge our{" "}
                <NextLink
                  href="/legal/privacy"
                  style={{ textDecoration: "underline" }}
                >
                  Privacy Policy
                </NextLink>
                .
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
