import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import PaginationControls from "@/components/ui/pagination-controls";
import type { SetupAudit } from "@/types/audit";
import { accountRequest } from "@/utils/api/account";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;
export default function StaffAuditPage() {
  const { session, loading } = useAuth();
  const { profile, error: accessError } = useAccount();
  const [audit, setAudit] = useState<SetupAudit | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (profile?.role !== "staff") return;
    let active = true;
    setBusy(true);
    setError("");
    accountRequest<SetupAudit>("/staff/audit")
      .then((data) => {
        if (active) setAudit(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [profile?.role, revision]);
  const filtered = (audit?.items ?? []).filter(
    (item) =>
      (kind === "all" || item.kind === kind) &&
      item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );
  return (
    <>
      <SEO title="Setup audit · Staff" noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1000px" py={10}>
          <NextLink href="/staff">← Staff dashboard</NextLink>
          <Heading as="h1" mt={5} mb={3}>
            Setup audit
          </Heading>
          {loading ? (
            <Text>Checking access…</Text>
          ) : !session ? (
            <Text>
              <NextLink href="/auth/login">Sign in</NextLink> with a staff
              account.
            </Text>
          ) : accessError ? (
            <Text role="alert">{accessError}</Text>
          ) : !profile ? (
            <Text>Checking staff access…</Text>
          ) : profile.role !== "staff" ? (
            <Text role="alert">Staff access is required.</Text>
          ) : (
            <Stack gap={5}>
              <Text color="var(--site-muted)">
                Review missing setup details for published and draft properties
                and rental agencies. Archived properties are excluded. The badge
                counts individual fixes; listings with the most issues appear
                first.
              </Text>
              <Flex
                justify="space-between"
                align="center"
                gap={3}
                flexWrap="wrap"
              >
                <Text fontWeight="semibold" role="status">
                  {busy
                    ? "Checking setup…"
                    : error
                      ? "Audit unavailable"
                      : audit
                        ? `${audit.issue_count} fixes across ${audit.property_count} properties and ${audit.agency_count} agencies`
                        : ""}
                </Text>
                <Button
                  variant="outline"
                  loading={busy}
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Refresh audit
                </Button>
              </Flex>
              {error ? (
                <Text role="alert" color="fg.error">
                  {error} Use Refresh audit to try again.
                </Text>
              ) : (
                audit && (
                  <>
                    <Flex
                      gap={2}
                      flexWrap="wrap"
                      role="group"
                      aria-label="Listing type"
                    >
                      {[
                        ["all", "All"],
                        ["property", "Apartments / properties"],
                        ["agency", "Agencies"],
                      ].map(([value, label]) => (
                        <Button
                          key={value}
                          variant={kind === value ? "solid" : "outline"}
                          aria-pressed={kind === value}
                          onClick={() => {
                            setKind(value);
                            setPage(1);
                          }}
                        >
                          {label}
                        </Button>
                      ))}
                    </Flex>
                    <Input
                      aria-label="Search listings in the audit"
                      placeholder="Search by property or agency name"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                    {audit.items.length === 0 ? (
                      <Box
                        p={6}
                        borderWidth="1px"
                        borderColor="var(--site-border)"
                        borderRadius="xl"
                      >
                        <Heading as="h2" size="md" mb={2}>
                          All caught up
                        </Heading>
                        <Text>No missing setup details were found.</Text>
                      </Box>
                    ) : filtered.length === 0 ? (
                      <Text>No listings match your filters.</Text>
                    ) : (
                      filtered
                        .slice(
                          (currentPage - 1) * PAGE_SIZE,
                          currentPage * PAGE_SIZE,
                        )
                        .map((item) => (
                          <Box
                            key={`${item.kind}-${item.id}`}
                            p={5}
                            borderWidth="1px"
                            borderColor="var(--site-border)"
                            borderRadius="xl"
                            bg="var(--site-surface)"
                          >
                            <Flex
                              justify="space-between"
                              gap={3}
                              align="start"
                              flexWrap="wrap"
                            >
                              <Box>
                                <Heading as="h2" size="lg">
                                  <NextLink href={item.href}>
                                    {item.name} →
                                  </NextLink>
                                </Heading>
                                <Flex gap={2} mt={2}>
                                  <Badge>
                                    {item.kind === "property"
                                      ? "Property"
                                      : "Agency"}
                                  </Badge>
                                  {item.status && <Badge>{item.status}</Badge>}
                                </Flex>
                              </Box>
                              <Badge colorPalette="red">
                                {item.issues.length}{" "}
                                {item.issues.length === 1 ? "fix" : "fixes"}
                              </Badge>
                            </Flex>
                            <Box as="ul" mt={4} pl={5}>
                              {item.issues.map((issue) => (
                                <Box as="li" key={issue.label} mb={2}>
                                  <NextLink
                                    href={issue.href}
                                    style={{
                                      textDecoration: "underline",
                                      textUnderlineOffset: "3px",
                                    }}
                                  >
                                    {issue.label}
                                  </NextLink>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ))
                    )}
                    <PaginationControls
                      page={currentPage}
                      total={filtered.length}
                      pageSize={PAGE_SIZE}
                      label="Audit results"
                      onPageChange={setPage}
                    />
                  </>
                )
              )}
            </Stack>
          )}
        </Container>
      </Box>
    </>
  );
}
