import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import type { SetupAudit } from "@/types/audit";
import { accountRequest } from "@/utils/api/account";
import { Box, Container, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiClipboard,
  FiHome,
  FiUsers,
} from "react-icons/fi";

export default function StaffHome() {
  const { session, loading } = useAuth();
  const { profile, error } = useAccount();
  const [audit, setAudit] = useState<SetupAudit | null>(null);
  const [auditError, setAuditError] = useState(false);
  useEffect(() => {
    if (profile?.role !== "staff") return;
    let active = true;
    function refresh() {
      accountRequest<SetupAudit>("/staff/audit")
        .then((data) => {
          if (active) {
            setAudit(data);
            setAuditError(false);
          }
        })
        .catch(() => {
          if (active) setAuditError(true);
        });
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [profile?.role]);
  return (
    <>
      <SEO title="Staff Dashboard" noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1000px" py={10}>
          <Heading as="h1" mb={3}>
            Staff dashboard
          </Heading>
          {loading ? (
            <Text>Checking access…</Text>
          ) : !session ? (
            <Text>
              <NextLink href="/auth/login">Sign in</NextLink> with a staff
              account.
            </Text>
          ) : error ? (
            <Text role="alert">{error}</Text>
          ) : !profile ? (
            <Text>Checking staff access…</Text>
          ) : profile.role !== "staff" ? (
            <Text role="alert">Staff access is required.</Text>
          ) : (
            <>
              <Text color="var(--site-muted)" mb={7}>
                Choose a section to manage the housing hub.
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                <NextLink
                  href="/staff/audit"
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    position="relative"
                    bg="var(--site-surface)"
                    p={7}
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    _hover={{ borderColor: "var(--site-accent-fg)" }}
                  >
                    {audit && !auditError && (
                      <Box
                        position="absolute"
                        top={4}
                        right={4}
                        bg={audit.issue_count ? "red.600" : "green.700"}
                        color="white"
                        borderRadius="full"
                        minW="28px"
                        px={2}
                        py={1}
                        textAlign="center"
                        fontSize="sm"
                        fontWeight="bold"
                        aria-label={`${audit.issue_count} setup issues`}
                      >
                        {audit.issue_count}
                      </Box>
                    )}
                    <FiAlertCircle size={28} />
                    <Heading as="h2" size="lg" mt={4} mb={2}>
                      Setup audit →
                    </Heading>
                    <Text>
                      Find missing details, photos, floor plans, and pricing
                      across apartments and rental agencies.
                    </Text>
                    <Text
                      mt={3}
                      fontSize="sm"
                      color="var(--site-muted)"
                      role="status"
                    >
                      {auditError
                        ? "Issue count unavailable. Open the audit to retry."
                        : audit
                          ? `${audit.property_count} properties and ${audit.agency_count} agencies need attention.`
                          : "Checking setup…"}
                    </Text>
                  </Box>
                </NextLink>
                <NextLink
                  href="/staff/apartments"
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    bg="var(--site-surface)"
                    p={7}
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    _hover={{ borderColor: "var(--site-accent-fg)" }}
                  >
                    <FiHome size={28} />
                    <Heading as="h2" size="lg" mt={4} mb={2}>
                      Apartments →
                    </Heading>
                    <Text>
                      Review suggested properties and rental agencies, including
                      which company manages each property.
                    </Text>
                  </Box>
                </NextLink>
                <NextLink
                  href="/staff/agencies"
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    bg="var(--site-surface)"
                    p={7}
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    _hover={{ borderColor: "var(--site-accent-fg)" }}
                  >
                    <FiBriefcase size={28} />
                    <Heading as="h2" size="lg" mt={4} mb={2}>
                      Agencies →
                    </Heading>
                    <Text>
                      Update rental agency names, websites, phone numbers, email
                      addresses, and descriptions.
                    </Text>
                  </Box>
                </NextLink>
                <NextLink
                  href="/staff/reviews"
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    bg="var(--site-surface)"
                    p={7}
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    _hover={{ borderColor: "var(--site-accent-fg)" }}
                  >
                    <FiClipboard size={28} />
                    <Heading as="h2" size="lg" mt={4} mb={2}>
                      Reviews →
                    </Heading>
                    <Text>
                      Read submitted apartment reviews. Approve reviews for
                      publication or reject them.
                    </Text>
                  </Box>
                </NextLink>
                <NextLink
                  href="/staff/users"
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    bg="var(--site-surface)"
                    p={7}
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    _hover={{ borderColor: "var(--site-accent-fg)" }}
                  >
                    <FiUsers size={28} />
                    <Heading as="h2" size="lg" mt={4} mb={2}>
                      Users →
                    </Heading>
                    <Text>
                      View registered accounts, signup dates, roles, and account
                      status.
                    </Text>
                  </Box>
                </NextLink>
              </SimpleGrid>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
