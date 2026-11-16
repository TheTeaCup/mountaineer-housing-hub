import SEO from "@/components/seo";
import { PropertyGridSkeleton } from "@/components/ui/page-skeletons";
import { useProperties } from "@/hooks/use-properties";
import type { Property } from "@/types/properties";
import { propertyTypeLabel, rentSummary } from "@/utils/api/properties";
import {
  Box,
  Button,
  Container,
  Heading,
  NativeSelect,
  SimpleGrid,
  Stack,
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
      .filter(Boolean)
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

  const columns = `minmax(150px, 0.7fr) repeat(${Math.max(1, selected.length)}, minmax(220px, 1fr))`;
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
        <Container maxW="1200px" py={10}>
          <Heading as="h1" mb={3}>
            Compare apartments
          </Heading>
          <Text mb={6} color="var(--site-muted)">
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
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
                {slugs.map((slug, index) => (
                  <Stack key={index} gap={2}>
                    <Text fontWeight="semibold">Apartment {index + 1}</Text>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        id={`compare-property-${index}`}
                        aria-label={`Apartment ${index + 1}`}
                        value={slug}
                        onChange={(event) =>
                          selectProperty(index, event.target.value)
                        }
                      >
                        <option value="">Choose a property</option>
                        {properties.map((property) => (
                          <option
                            key={property.slug}
                            value={property.slug}
                            disabled={
                              property.slug !== slug &&
                              slugs.includes(property.slug)
                            }
                          >
                            {property.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Stack>
                ))}
              </SimpleGrid>

              {!selected.length ? (
                <Text>Choose at least one apartment to start comparing.</Text>
              ) : (
                <Box
                  overflowX="auto"
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="xl"
                >
                  <Box
                    display="grid"
                    gridTemplateColumns={columns}
                    minW="650px"
                  >
                    <Box p={4} bg="var(--site-muted-surface)" fontWeight="bold">
                      Compare
                    </Box>
                    {selected.map((property) => (
                      <Box
                        key={property.slug}
                        p={4}
                        bg="var(--site-muted-surface)"
                      >
                        <Heading as="h2" size="md" mb={2}>
                          {property.name}
                        </Heading>
                        <NextLink
                          href={`/properties/${encodeURIComponent(property.slug)}`}
                        >
                          View listing
                        </NextLink>
                      </Box>
                    ))}
                    {rows.flatMap((row) => [
                      <Box
                        key={`${row.label}-label`}
                        p={4}
                        borderTopWidth="1px"
                        borderColor="var(--site-border)"
                        fontWeight="semibold"
                      >
                        {row.label}
                      </Box>,
                      ...selected.map((property) => (
                        <Box
                          key={`${row.label}-${property.slug}`}
                          p={4}
                          borderTopWidth="1px"
                          borderColor="var(--site-border)"
                        >
                          {row.value(property)}
                        </Box>
                      )),
                    ])}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
