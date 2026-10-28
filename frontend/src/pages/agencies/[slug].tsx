import SEO from "@/components/seo";
import { AgencyDetailSkeleton } from "@/components/ui/page-skeletons";
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

export default function AgencyPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [result, setResult] = useState<{
    slug: string;
    agency: AgencyDetail | null;
    error: string;
  }>({ slug: "", agency: null, error: "" });

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetchAgency(slug, controller.signal)
      .then((agency) => {
        if (!controller.signal.aborted) setResult({ slug, agency, error: "" });
      })
      .catch((requestError: Error) => {
        if (!controller.signal.aborted)
          setResult({ slug, agency: null, error: requestError.message });
      });
    return () => controller.abort();
  }, [slug]);

  const agency = result.slug === slug ? result.agency : null;
  const error = result.slug === slug ? result.error : "";
  const website = safeUrl(agency?.website_url);

  return (
    <>
      <SEO title={agency?.name || "Rental Agency"} />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <NextLink href="/agencies">← All rental agencies</NextLink>
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
                  <Text fontSize="lg" fontWeight="medium">
                    {agency.property_count}{" "}
                    {agency.property_count === 1 ? "property" : "properties"}
                    {" · "}
                    {agencyRatingSummary(agency)}
                  </Text>
                  {agency.description && (
                    <Text mt={5} whiteSpace="pre-wrap">
                      {agency.description}
                    </Text>
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
                  {!agency.phone && !agency.email && !website && (
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
                  {agency.properties.map((property) => (
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
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
