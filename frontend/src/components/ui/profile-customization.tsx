import { accountRequest, type AccountProfile } from "@/utils/api/account";
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAccount } from "./account-provider";
import { useAuth } from "./auth-provider";
import { notifyError, notifySuccess } from "./toaster";
import UserAvatar, { avatarPalettes } from "./user-avatar";

export default function ProfileCustomization() {
  const { session } = useAuth();
  const { profile, refresh } = useAccount();
  const [variant, setVariant] = useState<
    AccountProfile["avatar_variant"] | null
  >(null);
  const [palette, setPalette] = useState<
    AccountProfile["avatar_palette"] | null
  >(null);
  const [pending, setPending] = useState(false);
  if (!profile || !session) return <Text>Loading profile customization…</Text>;
  const selectedVariant = variant || profile.avatar_variant;
  const selectedPalette = palette || profile.avatar_palette;
  const seed = profile.avatar_seed || `mountaineer-${session.user.id}`;
  async function save(
    path: string,
    method: string,
    message: string,
    body?: unknown,
  ) {
    setPending(true);
    try {
      await accountRequest(path, method, body);
      await refresh();
      notifySuccess(message);
    } catch (err) {
      notifyError("Could not update profile", err);
    } finally {
      setPending(false);
    }
  }
  return (
    <Stack gap={5}>
      <Box>
        <Text mb={3}>
          Public username:{" "}
          <Text as="span" fontWeight="bold">
            {profile.username}
          </Text>
        </Text>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            save(
              "/account/username/regenerate",
              "POST",
              "Your new username is ready.",
              {},
            )
          }
        >
          Generate new username
        </Button>
        <Text fontSize="sm" color="var(--site-muted)" mt={2}>
          Usernames are randomly generated. You can generate a new one once per
          minute; your published reviews will display the new name.
        </Text>
      </Box>
      <Box>
        <Heading as="h3" size="md" mb={4}>
          Customize your avatar
        </Heading>
        <Flex gap={5} align="center" mb={5}>
          <Box aria-hidden="true">
            <UserAvatar
              size={96}
              seed={seed}
              variant={selectedVariant}
              palette={selectedPalette}
            />
          </Box>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              save("/account/avatar/regenerate", "POST", "Avatar shuffled.", {})
            }
          >
            Shuffle avatar
          </Button>
        </Flex>
        <Text fontWeight="bold" mb={3}>
          Style
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3} mb={5}>
          {(["beam", "marble", "bauhaus", "ring"] as const).map((value) => (
            <Button
              key={value}
              variant="outline"
              h="auto"
              py={3}
              aria-pressed={selectedVariant === value}
              borderColor={
                selectedVariant === value
                  ? "var(--site-accent-fg)"
                  : "var(--site-border)"
              }
              borderWidth={selectedVariant === value ? "2px" : "1px"}
              disabled={pending}
              onClick={() => setVariant(value)}
            >
              <Stack align="center" gap={2}>
                <Box
                  aria-hidden="true"
                  css={{ "& > svg": { width: "40px", height: "40px" } }}
                >
                  <UserAvatar
                    size={40}
                    seed={seed}
                    variant={value}
                    palette={selectedPalette}
                  />
                </Box>
                <Text textTransform="capitalize">{value}</Text>
              </Stack>
            </Button>
          ))}
        </SimpleGrid>
        <Text fontWeight="bold" mb={3}>
          Colors
        </Text>
        <Flex gap={3} flexWrap="wrap" mb={5}>
          {(["gold", "forest", "ocean"] as const).map((value) => (
            <Button
              key={value}
              variant="outline"
              aria-pressed={selectedPalette === value}
              borderColor={
                selectedPalette === value
                  ? "var(--site-accent-fg)"
                  : "var(--site-border)"
              }
              borderWidth={selectedPalette === value ? "2px" : "1px"}
              disabled={pending}
              onClick={() => setPalette(value)}
            >
              <Flex gap={1} aria-hidden="true">
                {avatarPalettes[value].slice(0, 3).map((color) => (
                  <Box
                    key={color}
                    bg={color}
                    boxSize="12px"
                    borderRadius="full"
                  />
                ))}
              </Flex>
              <Text textTransform="capitalize">{value}</Text>
            </Button>
          ))}
        </Flex>
        <Button
          loading={pending}
          onClick={() =>
            save("/account", "PATCH", "Avatar style saved.", {
              avatar_variant: selectedVariant,
              avatar_palette: selectedPalette,
            })
          }
        >
          Save avatar style
        </Button>
      </Box>
    </Stack>
  );
}
