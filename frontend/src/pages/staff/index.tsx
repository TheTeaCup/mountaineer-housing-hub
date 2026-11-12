import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBarChart2,
  FiBriefcase,
  FiClipboard,
  FiHome,
  FiUsers,
} from "react-icons/fi";

interface DashboardCounts {
  audit: { issue_count: number; property_count: number; agency_count: number };
  pending_submissions: number;
  pending_reviews: number;
  agencies: number;
  users: number;
}
export default function StaffHome() {
  const { session, loading } = useAuth();
  const { profile, error } = useAccount();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [countError, setCountError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (profile?.role !== "staff") return;
    let active = true;
    function refresh() {
      accountRequest<DashboardCounts>("/staff/dashboard")
        .then((data) => {
          if (active) {
            setCounts(data);
            setCountError(false);
          }
        })
        .catch(() => {
          if (active) setCountError(true);
        });
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [profile?.role, revision]);
  const cards = [
    {
      href: "/account/analytics",
      title: "Listing analytics",
      icon: FiBarChart2,
      description: "See listing views across the housing catalog.",
      count: undefined,
      label: "",
      pending: false,
      detail: "",
    },
    {
      href: "/staff/audit",
      title: "Setup audit",
      icon: FiAlertCircle,
      description:
        "Find missing details, photos, floor plans, and pricing across apartments and rental agencies.",
      count: counts?.audit.issue_count,
      label: "setup fixes",
      pending: true,
      detail: counts
        ? `${counts.audit.property_count} properties and ${counts.audit.agency_count} agencies need attention.`
        : "",
    },
    {
      href: "/staff/apartments",
      title: "Apartments",
      icon: FiHome,
      description:
        "Review suggested properties and rental agencies, and manage existing property listings.",
      count: counts?.pending_submissions,
      label: "pending suggestions",
      pending: true,
      detail: "Property and agency suggestions awaiting staff review.",
    },
    {
      href: "/staff/agencies",
      title: "Agencies",
      icon: FiBriefcase,
      description:
        "Update agency names, websites, phone numbers, email addresses, and descriptions.",
      count: counts?.agencies,
      label: "rental agencies",
      pending: false,
      detail: "Rental agencies in the housing catalog.",
    },
    {
      href: "/staff/reviews",
      title: "Reviews",
      icon: FiClipboard,
      description:
        "Read submitted apartment reviews. Approve reviews for publication or reject them.",
      count: counts?.pending_reviews,
      label: "pending reviews",
      pending: true,
      detail: "Reviews awaiting staff approval.",
    },
    {
      href: "/staff/users",
      title: "Users",
      icon: FiUsers,
      description:
        "Edit user accounts and manage agency and individual property access.",
      count: counts?.users,
      label: "registered accounts",
      pending: false,
      detail: "Student, staff, and external accounts.",
    },
  ];
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
              {countError && (
                <Flex align="center" gap={3} mb={5}>
                  <Text role="alert">Dashboard counts are unavailable.</Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRevision((value) => value + 1)}
                  >
                    Retry counts
                  </Button>
                </Flex>
              )}
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={5} autoRows="1fr">
                {cards.map((card) => (
                  <NextLink
                    key={card.href}
                    href={card.href}
                    style={{ textDecoration: "none", display: "flex" }}
                  >
                    <Box
                      w="100%"
                      h="100%"
                      bg="var(--site-surface)"
                      p={7}
                      borderWidth="1px"
                      borderColor="var(--site-border)"
                      borderRadius="xl"
                      display="flex"
                      flexDirection="column"
                      _hover={{ borderColor: "var(--site-accent-fg)" }}
                    >
                      <Flex
                        align="center"
                        justify="space-between"
                        minH="32px"
                        gap={3}
                      >
                        <card.icon size={28} />
                        {card.count !== undefined && !countError && (
                          <Box
                            bg={
                              card.pending && card.count > 0
                                ? "red.600"
                                : "var(--site-muted-surface)"
                            }
                            color={
                              card.pending && card.count > 0
                                ? "white"
                                : "var(--site-fg)"
                            }
                            borderRadius="full"
                            minW="32px"
                            h="32px"
                            px={2}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="sm"
                            fontWeight="bold"
                            aria-label={`${card.count} ${card.label}`}
                          >
                            {card.count}
                          </Box>
                        )}
                      </Flex>
                      <Heading as="h2" size="lg" mt={4} mb={2}>
                        {card.title} →
                      </Heading>
                      <Text mb={4}>{card.description}</Text>
                      <Text
                        mt="auto"
                        fontSize="sm"
                        color="var(--site-muted)"
                        role="status"
                      >
                        {card.href === "/account/analytics"
                          ? "7, 30, or 90 day reports"
                          : countError
                            ? "Count unavailable"
                            : card.count === undefined
                              ? "Checking counts…"
                              : `${card.count} ${card.label}. ${card.detail}`}
                      </Text>
                    </Box>
                  </NextLink>
                ))}
              </SimpleGrid>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
