import SEO from "@/components/seo";
import { useAuth } from "@/components/ui/auth-provider";
import { signInWithEmail, signInWithGoogle } from "@/utils/api/auth";
import {
  Box,
  Button,
  Container,
  Field,
  Flex,
  Grid,
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
import { LuHeart, LuMapPin, LuMessageSquare } from "react-icons/lu";

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
      setError("Could not start Google sign-in. Please try again in a moment.");
      setPending(false);
    }
  };

  return (
    <>
      <SEO title="Login" />

      <Box
        flex="1"
        minH={{ base: "auto", md: "calc(100svh - 84px)" }}
        display="flex"
        alignItems="center"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container maxW="1000px" py={{ base: 8, md: 14 }}>
          <Grid
            templateColumns={{ base: "1fr", md: "0.9fr 1.1fr" }}
            bg="var(--site-surface)"
            borderWidth="1px"
            borderColor="var(--site-border)"
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="0 12px 40px rgb(0 0 0 / 12%)"
          >
            <Flex
              as="aside"
              display={{ base: "none", md: "flex" }}
              direction="column"
              justify="space-between"
              p={9}
              color="white"
              bgImage="linear-gradient(180deg, rgba(17,17,17,0.5), rgba(17,17,17,0.92)), url('/assets/background.jpeg')"
              bgSize="cover"
              backgroundPosition="center"
            >
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="0.14em"
                  color="#ffc72c"
                  mb={5}
                >
                  AT HOME IN BOONE
                </Text>
                <Heading as="h2" fontSize="2.25rem" lineHeight="1.15" mb={4}>
                  Find a place.
                  <br />
                  Make it home.
                </Heading>
                <Text color="whiteAlpha.900" lineHeight="1.7">
                  A little local knowledge goes a long way. Find your next home
                  with real student experiences.
                </Text>
              </Box>
              <Stack gap={5} mt={12} fontSize="sm">
                <Flex gap={3} align="center">
                  <LuMapPin color="#ffc72c" size={20} />
                  Explore housing around Boone
                </Flex>
                <Flex gap={3} align="center">
                  <LuHeart color="#ffc72c" size={20} />
                  Keep your favorite places together
                </Flex>
                <Flex gap={3} align="center">
                  <LuMessageSquare color="#ffc72c" size={20} />
                  Share your experience with students
                </Flex>
              </Stack>
            </Flex>
            <VStack
              gap={6}
              align="stretch"
              p={{ base: 6, md: 9 }}
              minW={0}
              css={{
                "& input": {
                  background: "var(--site-control)",
                  borderColor: "var(--site-border)",
                  borderRadius: "10px",
                  minHeight: "48px",
                },
                "& input:focus-visible": {
                  outline: "2px solid var(--site-accent-fg)",
                  outlineOffset: "2px",
                },
              }}
            >
              <Box>
                <Text
                  color="var(--site-accent-fg)"
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  mb={2}
                >
                  MOUNTAINEER HOUSING HUB
                </Text>
                <Heading as="h1" size="2xl" color="var(--site-heading)" mb={3}>
                  Welcome to the Hub
                </Heading>

                <Text color="var(--site-muted)" fontSize="md">
                  {external
                    ? "Sign in to manage your properties and account."
                    : "Your Boone housing search starts here."}
                </Text>
              </Box>

              {session ? (
                <Stack gap={4}>
                  <Text role="status">Signed in as {session.user.email}.</Text>
                  <Button asChild>
                    <NextLink href="/account">Go to your account</NextLink>
                  </Button>
                </Stack>
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
                    variant="outline"
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
                    bg="#ffc72c"
                    color="#111111"
                    borderWidth="1px"
                    borderColor="#ffc72c"
                    whiteSpace="normal"
                    height="auto"
                    minH="52px"
                    py={3}
                    _hover={{
                      bg: "#e5b324",
                      borderColor: "#e5b324",
                    }}
                    onClick={handleGoogleLogin}
                    loading={pending}
                    loadingText="Connecting to Google"
                    disabled={loading || pending}
                  >
                    <FaGoogle />
                    Continue with App State Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    minH="48px"
                    disabled={loading || pending}
                    onClick={() => {
                      setExternal(true);
                      setError("");
                    }}
                  >
                    Agency &amp; external sign in
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
                borderTopWidth="1px"
                borderColor="var(--site-border)"
                pt={5}
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
          </Grid>
        </Container>
      </Box>
    </>
  );
}
