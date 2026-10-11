import SEO from "@/components/seo";
import { useAuth } from "@/components/ui/auth-provider";
import { signInWithGoogle } from "@/utils/api/auth";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";

export default function AuthLogin() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
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
              ) : (
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
                Mountaineer Housing Hub uses Google for authentication. Please
                use your App State email account to continue. By signing in, you
                agree to our{" "}
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
