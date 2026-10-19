import SEO from "@/components/seo";
import {
  agencyRatingSummary,
  fetchAgencies,
  type AgencySummary,
} from "@/utils/api/agencies";
import { Box, Container, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            <Text role="status">Loading rental agencies…</Text>
          ) : error ? (
            <Text role="alert" color="fg.error">
              {error}
            </Text>
          ) : !agencies.length ? (
            <Text>No rental agencies have been added yet.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
              {agencies.map((agency) => (
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
                      {agency.property_count === 1 ? "property" : "properties"}
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
          )}
        </Container>
      </Box>
    </>
  );
}
