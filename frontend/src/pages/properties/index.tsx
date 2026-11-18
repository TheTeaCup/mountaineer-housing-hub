import PropertiesCard from "@/components/properties/card";
import SEO from "@/components/seo";
import FilterSelect from "@/components/ui/filter-select";
import { PropertyGridSkeleton } from "@/components/ui/page-skeletons";
import PaginationControls from "@/components/ui/pagination-controls";
import { useProperties } from "@/hooks/use-properties";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Text,
  chakra,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const PAGE_SIZE = 12;

export default function PropertiesList() {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q : "";
  const onAppalCart = router.query.appalcart === "1";
  const param = (name: string) =>
    typeof router.query[name] === "string"
      ? (router.query[name] as string)
      : "";
  const filters = {
    minRent: param("minRent"),
    maxRent: param("maxRent"),
    rentBasis: param("rentBasis"),
    minReviews: param("minReviews"),
    minRating: param("minRating"),
    parking: param("parking"),
  };
  const hasFilters = Boolean(
    query ||
    onAppalCart ||
    filters.minRent ||
    filters.maxRent ||
    filters.minReviews ||
    filters.minRating ||
    filters.parking,
  );
  const [page, setPage] = useState(1);
  const { properties, loading, error, retry } = useProperties(
    query,
    500,
    onAppalCart ? "appalcart" : undefined,
    filters,
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(properties.length / PAGE_SIZE)),
  );
  const paginatedProperties = properties.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  return (
    <>
      <SEO title="Properties" />
      <Box bg="var(--site-bg)" color="var(--site-fg)" flex="1">
        <Container maxW="1200px" py={10}>
          <Flex align="center" justify="space-between" gap={4} mb={3}>
            <Heading as="h1">Find your next home</Heading>
            <Button asChild variant="outline">
              <NextLink href="/compare">Compare apartments</NextLink>
            </Button>
          </Flex>
          <Text mb={6}>
            Explore apartment communities and standalone rentals. A community
            with several buildings has one listing; separate properties managed
            by the same rental agency have their own listings.
          </Text>
          <chakra.form
            key={router.asPath}
            p={{ base: 4, md: 5 }}
            bg="var(--site-surface)"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="var(--site-border)"
            boxShadow="0 4px 20px rgb(0 0 0 / 5%)"
            css={{
              "& input": {
                background: "var(--site-control)",
                borderColor: "var(--site-border)",
                borderRadius: "12px",
                minHeight: "48px",
                color: "var(--site-fg)",
              },
              "& input:focus-visible": {
                outline: "2px solid var(--site-accent-fg)",
                outlineOffset: "2px",
              },
            }}
            mb={7}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              const min = String(data.get("minRent") || "");
              const max = String(data.get("maxRent") || "");
              const maxInput = form.elements.namedItem(
                "maxRent",
              ) as HTMLInputElement;
              maxInput.setCustomValidity(
                min && max && Number(min) > Number(max)
                  ? "Maximum rent must be at least minimum rent."
                  : "",
              );
              if (!form.reportValidity()) return;
              const nextQuery: Record<string, string> = {};
              for (const [key, value] of data.entries()) {
                if (
                  [
                    "rentBasis",
                    "appalcart",
                    "minReviews",
                    "minRating",
                    "parking",
                  ].includes(key) &&
                  value === "__all"
                )
                  continue;
                if (typeof value === "string" && value.trim())
                  nextQuery[key] = value.trim();
              }
              if (!min && !max) delete nextQuery.rentBasis;
              setPage(1);
              const unchanged =
                JSON.stringify(Object.entries(nextQuery).sort()) ===
                JSON.stringify(Object.entries(router.query).sort());
              if (unchanged) {
                retry();
                return;
              }
              void router.push({
                pathname: router.pathname,
                query: nextQuery,
              });
            }}
          >
            <Box as="label" display="block" mb={4}>
              <Text mb={2} fontWeight="medium">
                Search properties
              </Text>
              <Input
                name="q"
                placeholder="Search by property, agency, or address…"
                defaultValue={query}
              />
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              <Box as="label">
                <Text mb={2} fontWeight="medium">
                  Minimum monthly rent ($)
                </Text>
                <Input
                  name="minRent"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="No minimum"
                  defaultValue={filters.minRent}
                  onInput={(e) => {
                    const form = e.currentTarget.form;
                    (
                      form?.elements.namedItem(
                        "maxRent",
                      ) as HTMLInputElement | null
                    )?.setCustomValidity("");
                  }}
                />
              </Box>
              <Box as="label">
                <Text mb={2} fontWeight="medium">
                  Maximum monthly rent ($)
                </Text>
                <Input
                  name="maxRent"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="No maximum"
                  defaultValue={filters.maxRent}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                />
              </Box>
              <FilterSelect
                name="rentBasis"
                label="Rent quoted per"
                defaultValue={filters.rentBasis || "per_bedroom"}
                options={[
                  { value: "per_bedroom", label: "Bedroom / month" },
                  { value: "per_unit", label: "Whole unit / month" },
                ]}
              />
              <FilterSelect
                name="appalcart"
                label="AppalCART access"
                defaultValue={onAppalCart ? "1" : ""}
                options={[
                  { value: "", label: "Any property" },
                  { value: "1", label: "On an AppalCART route" },
                ]}
              />
              <FilterSelect
                name="minReviews"
                label="Published reviews"
                defaultValue={filters.minReviews}
                options={[
                  { value: "", label: "Any review count" },
                  { value: "1", label: "At least 1 review" },
                  { value: "3", label: "At least 3 reviews" },
                  { value: "5", label: "At least 5 reviews" },
                ]}
              />
              <FilterSelect
                name="minRating"
                label="Minimum average rating"
                defaultValue={filters.minRating}
                options={[
                  { value: "", label: "Any rating" },
                  { value: "3", label: "3+ stars" },
                  { value: "4", label: "4+ stars" },
                  { value: "4.5", label: "4.5+ stars" },
                ]}
              />
              <FilterSelect
                name="parking"
                label="Parking"
                defaultValue={filters.parking}
                options={[
                  { value: "", label: "Any parking type" },
                  { value: "free", label: "Free parking" },
                  { value: "monthly", label: "Monthly fee" },
                  { value: "one_time", label: "One-time fee" },
                ]}
              />
            </SimpleGrid>
            <Text mt={3} fontSize="sm" color="var(--site-muted)">
              Price matches advertised floor plan ranges; properties without
              listed prices are excluded when a price is set. AppalCART access
              reflects listed routes; check stop locations before choosing a
              home.
            </Text>
            <Flex gap={3} mt={4} wrap="wrap">
              <Button
                type="submit"
                loading={loading}
                loadingText="Searching…"
                bg="#ffc72c"
                color="#111111"
                _hover={{ bg: "#e5b324" }}
              >
                Search &amp; apply filters
              </Button>
              {hasFilters && (
                <Button asChild variant="outline" onClick={() => setPage(1)}>
                  <NextLink href={router.pathname}>Clear all filters</NextLink>
                </Button>
              )}
            </Flex>
          </chakra.form>
          {query && <Text mb={5}>Results for “{query}”</Text>}
          {loading ? (
            <PropertyGridSkeleton />
          ) : error ? (
            <Box role="alert">
              <Text>{error}</Text>
              <Button mt={3} onClick={retry}>
                Try again
              </Button>
            </Box>
          ) : !properties.length ? (
            <Text>
              {hasFilters
                ? "No properties match your search."
                : "No properties have been published yet."}
            </Text>
          ) : (
            <>
              <Text mb={4} color="var(--site-muted)">
                {properties.length}{" "}
                {properties.length === 1 ? "property" : "properties"}
                {properties.length === 500 ? " (showing the first 500)" : ""}
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={7}>
                {paginatedProperties.map((property) => (
                  <PropertiesCard key={property.slug} property={property} />
                ))}
              </SimpleGrid>
              <PaginationControls
                page={currentPage}
                total={properties.length}
                pageSize={PAGE_SIZE}
                label="Properties"
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
