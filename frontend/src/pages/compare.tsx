import CompareSelect from "@/components/properties/compare-select";
import SEO from "@/components/seo";
import { PropertyGridSkeleton } from "@/components/ui/page-skeletons";
import { useProperties } from "@/hooks/use-properties";
import type { Property } from "@/types/properties";
import { propertyTypeLabel, rentSummary } from "@/utils/api/properties";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const EMPTY_SELECTION = ["", "", ""];

function lowestRent(property: Property) {
  const rents = property.floor_plans.flatMap((plan) =>
    plan.rent_min === null ? [] : [plan.rent_min],
  );
  return rents.length
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Math.min(...rents))
    : "Not published";
}

export default function CompareProperties() {
  const router = useRouter();
  const { properties, loading, error, retry } = useProperties("", 500);
  const [slugs, setSlugs] = useState<string[]>(EMPTY_SELECTION);
  const initialized = useRef(false);

  useEffect(() => {
    if (!router.isReady || initialized.current) return;
    initialized.current = true;
    const value = router.query.properties;
    const requested = (Array.isArray(value) ? value.join(",") : value || "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(
        (slug, index, all) => Boolean(slug) && all.indexOf(slug) === index,
      )
      .slice(0, 3);
    setSlugs([...requested, ...EMPTY_SELECTION].slice(0, 3));
  }, [router.isReady, router.query.properties]);

  const selected = slugs.flatMap((slug) => {
    const property = properties.find((candidate) => candidate.slug === slug);
    return property ? [property] : [];
  });

  function selectProperty(index: number, slug: string) {
    const next = slugs.map((current, slot) =>
      slot === index ? slug : current,
    );
    setSlugs(next);
    const query = next.filter(Boolean).join(",");
    void router.replace(
      query ? `/compare?properties=${encodeURIComponent(query)}` : "/compare",
      undefined,
      { shallow: true },
    );
  }

  const rows: { label: string; value: (property: Property) => string }[] = [
    {
      label: "Property type",
      value: (p) => propertyTypeLabel(p.property_type),
    },
    { label: "Address", value: (p) => p.address },
    { label: "Lowest starting rent", value: lowestRent },
    {
      label: "Published pricing",
      value: (p) => rentSummary(p.floor_plans).join("; ") || "Not published",
    },
    {
      label: "Floor plans",
      value: (p) =>
        p.floor_plans.length
          ? `${p.floor_plans.length} published`
          : "None published",
    },
    {
      label: "Student reviews",
      value: (p) =>
        p.review_count && p.average_rating !== null
          ? `${p.average_rating.toFixed(1)}/5 from ${p.review_count} ${p.review_count === 1 ? "review" : "reviews"}`
          : "No published reviews",
    },
    { label: "Rental agency", value: (p) => p.agency?.name || "Not listed" },
  ];

  return (
    <>
      <SEO title="Compare apartments" />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1200px" py={{ base: 8, md: 12 }}>
          <Text
            color="var(--site-accent-fg)"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.12em"
            textTransform="uppercase"
            mb={3}
          >
            Find your fit
          </Text>
          <Heading
            as="h1"
            size={{ base: "2xl", md: "3xl" }}
            color="var(--site-heading)"
            mb={3}
          >
            Compare apartments
          </Heading>
          <Text mb={8} maxW="640px" color="var(--site-muted)" lineHeight="tall">
            Choose up to three properties to compare their published pricing,
            floor plans, and student reviews side by side.
          </Text>

          {loading ? (
            <PropertyGridSkeleton count={3} />
          ) : error ? (
            <Box role="alert">
              <Text mb={3}>{error}</Text>
              <Button onClick={retry}>Try again</Button>
            </Box>
          ) : (
            <>
              <Flex align="center" justify="space-between" gap={3} mb={4}>
                <Heading as="h2" size="md">
                  Your comparison
                </Heading>
                <Flex align="center" gap={3}>
                  <Text
                    fontSize="sm"
                    color="var(--site-muted)"
                    aria-live="polite"
                  >
                    {selected.length} of 3 selected
                  </Text>
                  {slugs.some(Boolean) && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color="var(--site-accent-fg)"
                      onClick={() => {
                        setSlugs(EMPTY_SELECTION);
                        void router.replace("/compare", undefined, {
                          shallow: true,
                        });
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </Flex>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
                {slugs.map((slug, index) => (
                  <Stack
                    key={index}
                    gap={3}
                    p={5}
                    bg="var(--site-surface)"
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="2xl"
                  >
                    <CompareSelect
                      index={index}
                      value={slug}
                      properties={properties}
                      selectedSlugs={slugs}
                      onChange={(value) => selectProperty(index, value)}
                    />
                    <Flex
                      minH="24px"
                      align="center"
                      justify="space-between"
                      gap={2}
                    >
                      <Text
                        fontSize="xs"
                        color={
                          slug ? "var(--site-accent-fg)" : "var(--site-muted)"
                        }
                      >
                        {slug
                          ? "Added to comparison"
                          : "Add a place to compare"}
                      </Text>
                      {slug && (
                        <Button
                          size="xs"
                          h="24px"
                          variant="ghost"
                          color="var(--site-muted)"
                          aria-label={`Remove apartment ${index + 1}`}
                          onClick={() => selectProperty(index, "")}
                        >
                          Remove
                        </Button>
                      )}
                    </Flex>
                  </Stack>
                ))}
              </SimpleGrid>

              {!selected.length ? (
                <Stack
                  align="center"
                  textAlign="center"
                  gap={3}
                  py={{ base: 10, md: 16 }}
                  px={6}
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor="var(--site-border)"
                  borderRadius="2xl"
                >
                  <Heading as="h2" size="lg" color="var(--site-heading)">
                    Your next home, side by side
                  </Heading>
                  <Text maxW="440px" color="var(--site-muted)">
                    Choose your first property above to get started. Add up to
                    two more to see how they compare.
                  </Text>
                </Stack>
              ) : (
                <Box
                  overflowX="auto"
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="2xl"
                  bg="var(--site-surface)"
                >
                  <Table.Root
                    minW={`${180 + selected.length * 240}px`}
                    color="var(--site-fg)"
                    css={{ tableLayout: "fixed" }}
                  >
                    <Table.Caption srOnly>
                      Published property details compared side by side
                    </Table.Caption>
                    <Table.Header>
                      <Table.Row bg="var(--site-control)">
                        <Table.ColumnHeader
                          w="180px"
                          p={5}
                          color="var(--site-muted)"
                          borderColor="var(--site-border)"
                          verticalAlign="top"
                        >
                          At a glance
                        </Table.ColumnHeader>
                        {selected.map((property) => (
                          <Table.ColumnHeader
                            key={property.slug}
                            p={5}
                            borderColor="var(--site-border)"
                            verticalAlign="top"
                          >
                            <Heading
                              as="h3"
                              size="md"
                              mb={3}
                              color="var(--site-heading)"
                            >
                              {property.name}
                            </Heading>
                            <Box
                              asChild
                              fontSize="sm"
                              fontWeight="semibold"
                              color="var(--site-accent-fg)"
                              _hover={{ textDecoration: "underline" }}
                            >
                              <NextLink
                                href={`/properties/${encodeURIComponent(property.slug)}`}
                              >
                                View listing &rarr;
                              </NextLink>
                            </Box>
                          </Table.ColumnHeader>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {rows.map((row, index) => (
                        <Table.Row
                          key={row.label}
                          bg={
                            index % 2
                              ? "var(--site-control)"
                              : "var(--site-surface)"
                          }
                        >
                          <Table.Cell
                            as="th"
                            scope="row"
                            key={`${row.label}-label`}
                            p={5}
                            borderTopWidth="1px"
                            borderColor="var(--site-border)"
                            fontWeight="semibold"
                            fontSize="sm"
                            verticalAlign="top"
                          >
                            {row.label}
                          </Table.Cell>
                          {selected.map((property) => (
                            <Table.Cell
                              key={`${row.label}-${property.slug}`}
                              p={5}
                              borderTopWidth="1px"
                              borderColor="var(--site-border)"
                              verticalAlign="top"
                              fontSize="sm"
                              lineHeight="tall"
                              color={
                                row.label === "Lowest starting rent"
                                  ? "var(--site-accent-fg)"
                                  : "var(--site-fg)"
                              }
                              fontWeight={
                                row.label === "Lowest starting rent"
                                  ? "bold"
                                  : "normal"
                              }
                            >
                              {row.value(property)}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
