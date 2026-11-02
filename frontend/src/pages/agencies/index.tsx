import SEO from "@/components/seo";
import { AgencyGridSkeleton } from "@/components/ui/page-skeletons";
import PaginationControls from "@/components/ui/pagination-controls";
import {
  agencyRatingSummary,
  fetchAgencies,
  type AgencySummary,
} from "@/utils/api/agencies";
import { Box, Container, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    fetchAgencies(controller.signal)
      .then(setAgencies)
      .catch((requestError: Error) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const paginatedAgencies = agencies.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <>
      <SEO title="Rental Agencies" />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <Heading as="h1" mb={3}>
            Rental agencies
          </Heading>
          <Text color="var(--site-muted)" mb={7} maxW="720px">
            Compare management companies by their local properties and the
            experiences students have shared across those listings.
          </Text>
          {loading ? (
            <AgencyGridSkeleton />
          ) : error ? (
            <Text role="alert" color="fg.error">
              {error}
            </Text>
          ) : !agencies.length ? (
            <Text>No rental agencies have been added yet.</Text>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                {paginatedAgencies.map((agency) => (
                  <NextLink
                    key={agency.id}
                    href={`/agencies/${agency.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Box
                      h="100%"
                      bg="var(--site-surface)"
                      borderWidth="1px"
                      borderColor="var(--site-border)"
                      borderRadius="xl"
                      p={6}
                      _hover={{ borderColor: "var(--site-accent-fg)" }}
                    >
                      <Heading as="h2" size="lg" mb={3}>
                        {agency.name}
                      </Heading>
                      <Text fontWeight="medium">
                        {agency.property_count}{" "}
                        {agency.property_count === 1
                          ? "property"
                          : "properties"}
                      </Text>
                      <Text color="var(--site-muted)" mt={1}>
                        {agencyRatingSummary(agency)}
                      </Text>
                      {agency.description && (
                        <Text mt={4} lineClamp={3}>
                          {agency.description}
                        </Text>
                      )}
                    </Box>
                  </NextLink>
                ))}
              </SimpleGrid>
              <PaginationControls
                page={page}
                total={agencies.length}
                pageSize={PAGE_SIZE}
                label="Rental agencies"
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
