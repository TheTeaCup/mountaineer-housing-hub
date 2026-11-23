import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { AgencyDetailSkeleton } from "@/components/ui/page-skeletons";
import PaginationControls from "@/components/ui/pagination-controls";
import { accountRequest } from "@/utils/api/account";
import {
  agencyRatingSummary,
  fetchAgency,
  type AgencyDetail,
} from "@/utils/api/agencies";
import { propertyTypeLabel, safeUrl } from "@/utils/api/properties";
import { formatPhoneNumber, phoneHref } from "@/utils/format-phone";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiMapPin } from "react-icons/fi";

const PAGE_SIZE = 10;

export default function AgencyPage() {
  const router = useRouter();
  const { profile } = useAccount();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [result, setResult] = useState<{
    slug: string;
    agency: AgencyDetail | null;
    error: string;
  }>({ slug: "", agency: null, error: "" });
  const [page, setPage] = useState(1);
  const [editableAgencyId, setEditableAgencyId] = useState<number | null>(null);

  const agency = result.slug === slug ? result.agency : null;
  const error = result.slug === slug ? result.error : "";

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetchAgency(slug, controller.signal)
      .then((agency) => {
        if (!controller.signal.aborted) {
          setResult({ slug, agency, error: "" });
          setPage(1);
        }
      })
      .catch((requestError: Error) => {
        if (!controller.signal.aborted)
          setResult({ slug, agency: null, error: requestError.message });
      });
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (profile?.role !== "property_manager" || !agency?.id) return;
    let active = true;
    accountRequest<{ id: number }[]>("/account/managed-agencies")
      .then((managedAgencies) => {
        if (active) {
          setEditableAgencyId(
            managedAgencies.some((managed) => managed.id === agency.id)
              ? agency.id
              : null,
          );
        }
      })
      .catch(() => {
        if (active) setEditableAgencyId(null);
      });
    return () => {
      active = false;
    };
  }, [agency?.id, profile?.role]);

  const website = safeUrl(agency?.website_url);
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil((agency?.properties.length ?? 0) / PAGE_SIZE)),
  );
  const paginatedProperties =
    agency?.properties.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    ) ?? [];

  return (
    <>
      <SEO title={agency?.name || "Rental Agency"} />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <Button
            asChild
            variant="outline"
            size="sm"
            borderRadius="full"
            px={4}
            borderColor="var(--site-border)"
            color="var(--site-fg)"
            _hover={{
              bg: "var(--site-muted-surface)",
              borderColor: "var(--site-muted)",
            }}
          >
            <NextLink href="/agencies">
              <FiArrowLeft aria-hidden="true" /> All rental agencies
            </NextLink>
          </Button>
          {error ? (
            <Heading as="h1" size="lg" mt={6}>
              {error}
            </Heading>
          ) : !agency ? (
            <AgencyDetailSkeleton />
          ) : (
            <>
              <Flex
                mt={6}
                mb={8}
                gap={6}
                justify="space-between"
                align={{ base: "stretch", md: "start" }}
                direction={{ base: "column", md: "row" }}
              >
                <Box maxW="720px">
                  <Heading as="h1" mb={3}>
                    {agency.name}
                  </Heading>
                  {profile?.role === "staff" && (
                    <NextLink href={`/staff/agencies/${agency.id}`}>
                      <Button variant="outline" mb={4}>
                        Edit agency profile
                      </Button>
                    </NextLink>
                  )}
                  {profile?.role === "property_manager" &&
                    editableAgencyId === agency.id && (
                      <NextLink href={`/account/agencies/${agency.id}`}>
                        <Button variant="outline" mb={4}>
                          Edit agency profile
                        </Button>
                      </NextLink>
                    )}
                  <Text fontSize="lg" fontWeight="medium">
                    {agency.property_count}{" "}
                    {agency.property_count === 1 ? "property" : "properties"}
                    {" · "}
                    {agencyRatingSummary(agency)}
                  </Text>
                  {agency.description && (
                    <Box
                      mt={5}
                      p={{ base: 4, md: 5 }}
                      bg="var(--site-muted-surface)"
                      borderWidth="1px"
                      borderColor="var(--site-border)"
                      borderLeftWidth="4px"
                      borderLeftColor="#ffc72c"
                      borderRadius="xl"
                      boxShadow="0 8px 24px rgb(0 0 0 / 10%)"
                    >
                      <Text
                        mb={2}
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        letterSpacing="0.1em"
                        color="var(--site-heading)"
                      >
                        About this agency
                      </Text>
                      <Text
                        whiteSpace="pre-wrap"
                        maxW="68ch"
                        lineHeight="1.8"
                        color="var(--site-muted)"
                      >
                        {agency.description}
                      </Text>
                    </Box>
                  )}
                </Box>
                <Stack
                  minW={{ md: "280px" }}
                  bg="var(--site-surface)"
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="xl"
                  p={5}
                  gap={3}
                >
                  <Heading as="h2" size="md">
                    Contact
                  </Heading>
                  {agency.address && (
                    <Text
                      display="flex"
                      alignItems="start"
                      gap={2}
                      fontSize="sm"
                      lineHeight="tall"
                    >
                      <FiMapPin aria-hidden="true" style={{ marginTop: 4 }} />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agency.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {agency.address}
                      </a>
                    </Text>
                  )}
                  {agency.phone && (
                    <a href={phoneHref(agency.phone)}>
                      {formatPhoneNumber(agency.phone)}
                    </a>
                  )}
                  {agency.email && (
                    <a href={`mailto:${agency.email}`}>{agency.email}</a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer">
                      <Button w="100%">Visit agency website</Button>
                    </a>
                  )}
                  {!agency.address &&
                    !agency.phone &&
                    !agency.email &&
                    !website && (
                    <Text color="var(--site-muted)">
                      Contact information has not been provided.
                    </Text>
                  )}
                </Stack>
              </Flex>

              <Heading as="h2" size="lg" mb={4}>
                Managed properties
              </Heading>
              {!agency.properties.length ? (
                <Text>No published properties are linked to this agency.</Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                  {paginatedProperties.map((property) => (
                    <NextLink
                      key={property.slug}
                      href={`/properties/${property.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Box
                        h="100%"
                        bg="var(--site-surface)"
                        borderWidth="1px"
                        borderColor="var(--site-border)"
                        borderRadius="xl"
                        p={5}
                        _hover={{ borderColor: "var(--site-accent-fg)" }}
                      >
                        <Heading as="h3" size="md">
                          {property.name}
                        </Heading>
                        <Text textTransform="capitalize" mt={2}>
                          {propertyTypeLabel(property.property_type)}
                        </Text>
                        <Text color="var(--site-muted)" mt={1}>
                          {property.address}
                        </Text>
                        <Text mt={3}>{agencyRatingSummary(property)}</Text>
                      </Box>
                    </NextLink>
                  ))}
                </SimpleGrid>
              )}
              {agency.properties.length > 0 && (
                <PaginationControls
                  page={currentPage}
                  total={agency.properties.length}
                  pageSize={PAGE_SIZE}
                  label={`${agency.name} properties`}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
