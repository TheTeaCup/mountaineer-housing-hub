import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import { ColorModeButton } from "@/components/ui/color-mode";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import UserAvatar from "@/components/ui/user-avatar";
import { Box, Button, Flex, Menu, Portal, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiChevronDown, FiLogOut, FiShield, FiUser } from "react-icons/fi";

export default function NavBar() {
  const pathname = usePathname();
  const { session, loading, logout } = useAuth();
  const { profile } = useAccount();
  const [signingOut, setSigningOut] = useState(false);
  const navItems = [
    { label: "Properties", href: "/properties" },
    { label: "Map", href: "/map" },
    { label: "Submit", href: "/submit" },
  ];
  return (
    <Box
      as="header"
      flexShrink={0}
      bg="#111111"
      color="white"
      px={{ base: 4, md: 8 }}
      py={4}
      borderBottom="4px solid"
      borderColor="#ffc72c"
    >
      <Flex
        maxW="1200px"
        mx="auto"
        align="center"
        justify="space-between"
        gap={{ base: 4, md: 6 }}
        flexWrap="wrap"
      >
        <NextLink href="/" style={{ textDecoration: "none" }}>
          <Text
            fontSize={{ base: "1.15rem", md: "1.4rem" }}
            fontWeight="bold"
            whiteSpace="nowrap"
          >
            Mountaineer{" "}
            <Text as="span" color="#ffc72c">
              Housing Hub
            </Text>
          </Text>
        </NextLink>
        <Flex
          as="nav"
          aria-label="Main navigation"
          gap={{ base: 4, md: 6 }}
          align="center"
          justify="space-between"
          w={{ base: "100%", md: "auto" }}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <NextLink
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                style={{ textDecoration: "none" }}
              >
                <Text
                  fontWeight="500"
                  fontSize={{ base: "sm", md: "md" }}
                  color={isActive ? "#ffc72c" : "white"}
                  borderBottom="2px solid"
                  borderColor={isActive ? "#ffc72c" : "transparent"}
                  pb="2px"
                  _hover={{ color: "#ffc72c", borderColor: "#ffc72c" }}
                >
                  {item.label}
                </Text>
              </NextLink>
            );
          })}
          <ColorModeButton
            color="white"
            size="md"
            _hover={{ bg: "whiteAlpha.200" }}
          />
          <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Menu.Trigger asChild>
              <Button
                aria-label={session ? "Open account menu" : "Open site menu"}
                variant="ghost"
                p={0}
                w="44px"
                h="44px"
                minW="44px"
                borderRadius="full"
                borderWidth="0"
                bg="transparent"
                color="white"
                disabled={loading || signingOut}
                _hover={{ bg: "transparent", opacity: 0.85 }}
              >
                <Box
                  position="relative"
                  w="40px"
                  h="40px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  css={{
                    "& > svg": {
                      width: session ? "36px" : "32px",
                      height: session ? "36px" : "32px",
                      flexShrink: 0,
                    },
                  }}
                >
                  {session ? (
                    <UserAvatar
                      size={36}
                      seed={
                        profile?.avatar_seed || `mountaineer-${session.user.id}`
                      }
                      variant={profile?.avatar_variant}
                      palette={profile?.avatar_palette}
                    />
                  ) : (
                    <FiUser size={32} />
                  )}
                  <Box
                    position="absolute"
                    right="0"
                    bottom="0"
                    bg="#111111"
                    color="#ffc72c"
                    p="2px"
                    borderRadius="sm"
                    css={{ "& > svg": { width: "12px", height: "12px" } }}
                    aria-hidden="true"
                  >
                    <FiChevronDown />
                  </Box>
                </Box>
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  minW="270px"
                  maxW="calc(100vw - 32px)"
                  p={2}
                  borderRadius="2xl"
                  borderWidth="1px"
                  boxShadow="0 12px 40px rgba(0, 0, 0, 0.22)"
                  css={{
                    "& [role=menuitem]": {
                      padding: "12px 14px",
                      borderRadius: "10px",
                      gap: "12px",
                      fontWeight: 500,
                    },
                    "& [role=menuitem][data-highlighted]": {
                      background: "var(--site-muted-surface)",
                      color: "var(--site-heading)",
                    },
                  }}
                  bg="var(--site-surface)"
                  color="var(--site-fg)"
                  borderColor="var(--site-border)"
                >
                  <Box
                    px={3}
                    py={4}
                    mb={1}
                    borderBottomWidth="1px"
                    borderColor="var(--site-border)"
                  >
                    <Text fontWeight="bold">
                      {session ? profile?.username || "My Account" : "Welcome"}
                    </Text>
                    <Text fontSize="xs" color="var(--site-muted)">
                      {session
                        ? "Your saved places and reviews"
                        : "Sign in to save your favorite apartments"}
                    </Text>
                  </Box>
                  {session ? (
                    <Menu.Item value="account" asChild>
                      <NextLink href="/account">
                        <FiUser />
                        My Account
                      </NextLink>
                    </Menu.Item>
                  ) : (
                    <Menu.Item value="login" asChild>
                      <NextLink href="/auth/login">
                        <FiUser />
                        Sign in with Google
                      </NextLink>
                    </Menu.Item>
                  )}
                  {profile?.role === "staff" && (
                    <Menu.Item value="staff" asChild>
                      <NextLink href="/staff">
                        <FiShield />
                        Staff dashboard
                      </NextLink>
                    </Menu.Item>
                  )}
                  {session && (
                    <>
                      <Menu.Separator />
                      <Menu.Item
                        value="logout"
                        onSelect={async () => {
                          setSigningOut(true);
                          try {
                            await logout();
                            notifySuccess("Signed out");
                          } catch (err) {
                            notifyError("Could not sign out", err);
                          } finally {
                            setSigningOut(false);
                          }
                        }}
                      >
                        <FiLogOut />
                        Sign out
                      </Menu.Item>
                    </>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>
      </Flex>
    </Box>
  );
}
