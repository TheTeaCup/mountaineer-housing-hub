import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useAccount } from "./account-provider";
import { useAuth } from "./auth-provider";
import UserAvatar from "./user-avatar";

export default function WelcomeGuide({ replay = false }: { replay?: boolean }) {
  const { session } = useAuth();
  const { profile, refresh } = useAccount();
  const router = useRouter();
  const [showReplay, setShowReplay] = useState(false);
  const [completedFor, setCompletedFor] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);
  if (!session || !profile) return null;
  const userId = String(session.user.id);
  const open = replay
    ? showReplay
    : profile.onboarding_completed_at === null &&
      completedFor !== userId &&
      !router.pathname.startsWith("/auth/");

  async function finish(href?: string) {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      if (!replay) {
        await accountRequest("/account/onboarding/complete", "POST", {});
        setCompletedFor(userId);
        // The completion is already saved even if a profile refresh fails.
        void refresh().catch(() => {});
      }
      setShowReplay(false);
      if (href) void router.push(href);
    } catch {
      setError("We couldn't save your welcome preference. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const nextSteps =
    profile.role === "property_manager"
      ? [
          {
            label: "Manage your listings",
            href: "/account",
            description: "Find properties staff have assigned to you.",
          },
          {
            label: "Suggest a missing property",
            href: "/submit/apartment",
            description: "Send a listing to staff for verification.",
          },
        ]
      : profile.role === "staff"
        ? [
            {
              label: "Open Staff Dashboard",
              href: "/staff",
              description: "Review submissions and manage the housing catalog.",
            },
            {
              label: "Browse apartments",
              href: "/properties",
              description: "Explore the public housing directory.",
            },
          ]
        : [
            {
              label: "Find your next place",
              href: "/properties",
              description: "Browse apartments and save your favorites.",
            },
            {
              label: "Share your experience",
              href: "/submit",
              description:
                "Write a review. Staff check submissions before publication.",
            },
          ];

  return (
    <>
      {replay && (
        <Button
          variant="outline"
          alignSelf="start"
          onClick={() => setShowReplay(true)}
        >
          About your public profile and privacy
        </Button>
      )}
      <Dialog.Root
        open={open}
        onOpenChange={({ open: nextOpen }) => {
          if (!nextOpen) void finish();
        }}
        placement="center"
        size="lg"
        scrollBehavior="inside"
        initialFocusEl={() => closeButton.current}
        closeOnInteractOutside={false}
        closeOnEscape={!pending}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.700" />
          <Dialog.Positioner p={{ base: 3, md: 6 }}>
            <Dialog.Content
              bg="var(--site-surface)"
              color="var(--site-fg)"
              borderWidth="1px"
              borderColor="var(--site-border)"
              borderRadius="2xl"
              maxH="90dvh"
            >
              <Dialog.Header pb={3}>
                <Stack gap={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color="var(--site-accent-fg)"
                  >
                    Make yourself at home
                  </Text>
                  <Dialog.Title fontSize="2xl" color="var(--site-heading)">
                    Welcome to Mountaineer Housing Hub
                  </Dialog.Title>
                  <Dialog.Description color="var(--site-muted)">
                    A quick guide to your public profile, privacy, and what to
                    do next.
                  </Dialog.Description>
                </Stack>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={5}>
                  <Flex
                    gap={4}
                    align="center"
                    p={4}
                    bg="var(--site-control)"
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                  >
                    <Box flexShrink={0} aria-hidden="true">
                      <UserAvatar
                        size={56}
                        seed={profile.avatar_seed || `mountaineer-${userId}`}
                        variant={profile.avatar_variant}
                        palette={profile.avatar_palette}
                      />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="xs" color="var(--site-muted)">
                        Your public profile
                      </Text>
                      <Text fontWeight="bold" overflowWrap="anywhere">
                        {profile.username}
                      </Text>
                    </Box>
                  </Flex>
                  <Box>
                    <Heading as="h2" size="md" mb={2}>
                      A generated identity for your reviews
                    </Heading>
                    <Text fontSize="sm" lineHeight="tall">
                      Published reviews use your generated username and avatar
                      instead of your account name or email. You can generate a
                      new username and customize your avatar in My Account. Your
                      current choices also appear on your published reviews.
                    </Text>
                  </Box>
                  <Box p={4} bg="var(--site-accent-soft)" borderRadius="xl">
                    <Heading as="h2" size="md" mb={2}>
                      Your email is still connected to your account
                    </Heading>
                    <Text fontSize="sm" lineHeight="tall">
                      We store your sign-in email and account records.
                      Authorized staff can view your email to administer the
                      service, and your submissions remain linked to your
                      account. A generated public profile does not make your
                      activity anonymous to the site.
                    </Text>
                    <Text mt={2} fontSize="sm" lineHeight="tall">
                      Avoid including your name, contact details, faces, or
                      other identifying information in review text and photos.
                    </Text>
                  </Box>
                  <Box>
                    <Heading as="h2" size="md" mb={3}>
                      Where would you like to start?
                    </Heading>
                    <Stack gap={2}>
                      {[
                        {
                          label: "Personalize your profile",
                          href: "/account#profile",
                          description:
                            "Choose an avatar and generate a new username.",
                        },
                        ...nextSteps,
                      ].map((step) => (
                        <Button
                          key={step.href}
                          variant="outline"
                          h="auto"
                          py={3}
                          px={4}
                          justifyContent="start"
                          whiteSpace="normal"
                          textAlign="start"
                          disabled={pending}
                          onClick={() => void finish(step.href)}
                        >
                          <Stack gap={1}>
                            <Text>{step.label} &rarr;</Text>
                            <Text
                              fontWeight="normal"
                              fontSize="xs"
                              color="var(--site-muted)"
                            >
                              {step.description}
                            </Text>
                          </Stack>
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                  <Text fontSize="xs" color="var(--site-muted)">
                    You can reopen this guide in My Account. Read the{" "}
                    <NextLink
                      href="/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      Privacy Policy (opens in a new tab)
                    </NextLink>{" "}
                    for more detail.
                  </Text>
                  {error && (
                    <Text role="alert" color="fg.error" fontSize="sm">
                      {error}
                    </Text>
                  )}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  ref={closeButton}
                  loading={pending}
                  onClick={() => void finish()}
                >
                  Got it, let's explore
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
