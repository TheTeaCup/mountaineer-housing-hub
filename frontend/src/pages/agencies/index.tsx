import SEO from "@/components/seo";
import FilterSelect from "@/components/ui/filter-select";
import { AgencyGridSkeleton } from "@/components/ui/page-skeletons";
import PaginationControls from "@/components/ui/pagination-controls";
import {
  agencyRatingSummary,
  fetchAgencies,
  type AgencySummary,
} from "@/utils/api/agencies";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { LuArrowRight, LuBuilding2, LuStar } from "react-icons/lu";

const PAGE_SIZE = 10;

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("properties");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
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
  }, [revision]);
  const filteredAgencies = agencies
    .filter((agency) =>
      agency.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "rating")
        return (
          (b.average_rating ?? -1) - (a.average_rating ?? -1) ||
          b.review_count - a.review_count ||
          a.name.localeCompare(b.name)
        );
      return (
        b.property_count - a.property_count || a.name.localeCompare(b.name)
      );
    });
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filteredAgencies.length / PAGE_SIZE)),
  );
  const paginatedAgencies = filteredAgencies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <>
      <SEO title="Rental Agencies" />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <Text
            color="var(--site-accent-fg)"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.12em"
            mb={2}
          >
            THE PEOPLE BEHIND THE PROPERTIES
          </Text>
          <Heading as="h1" fontSize={{ base: "2rem", md: "2.5rem" }} mb={3}>
            Rental agencies
          </Heading>
          <Text color="var(--site-muted)" mb={7} maxW="720px">
            Compare management companies by their local properties and the
            experiences students have shared across those listings.
          </Text>
          <Flex
            align="end"
            gap={4}
            direction={{ base: "column", md: "row" }}
            mb={6}
            p={5}
            bg="var(--site-surface)"
            borderWidth="1px"
            borderColor="var(--site-border)"
            borderRadius="xl"
          >
            <Box as="label" flex="1" w="100%">
              <Text fontWeight="medium" mb={2}>
                Find an agency
              </Text>
              <Input
                value={search}
                placeholder="Search by agency name…"
                minH="48px"
                bg="var(--site-control)"
                borderColor="var(--site-border)"
                borderRadius="xl"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </Box>
            <Box w={{ base: "100%", md: "240px" }}>
              <FilterSelect
                name="agencySort"
                label="Sort agencies"
                defaultValue="properties"
                options={[
                  { value: "properties", label: "Most properties" },
                  { value: "rating", label: "Highest rated" },
                  { value: "name", label: "Name: A–Z" },
                ]}
                onValueChange={(value) => {
                  setSort(value);
                  setPage(1);
                }}
              />
            </Box>
          </Flex>
          {loading ? (
            <AgencyGridSkeleton />
          ) : error ? (
            <Box role="alert">
              <Text mb={3}>{error}</Text>
              <Button
                variant="outline"
                onClick={() => setRevision((value) => value + 1)}
              >
                Try again
              </Button>
            </Box>
          ) : !agencies.length ? (
            <Text>No rental agencies have been added yet.</Text>
          ) : !filteredAgencies.length ? (
            <Stack align="start" gap={3}>
              <Text>No agencies match “{search}”.</Text>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            </Stack>
          ) : (
            <>
              <Text
                mb={4}
                color="var(--site-muted)"
                fontSize="sm"
                aria-live="polite"
              >
                {filteredAgencies.length}{" "}
                {filteredAgencies.length === 1 ? "agency" : "agencies"}
                {search ? ` matching “${search}”` : " to explore"} · Ratings
                reflect published property reviews
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                {paginatedAgencies.map((agency) => (
                  <Box
                    key={agency.id}
                    as="article"
                    position="relative"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                    bg="var(--site-surface)"
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    transition="border-color 0.15s"
                    _hover={{ borderColor: "var(--site-accent-fg)" }}
                  >
                    <Flex
                      gap={4}
                      align="center"
                      p={6}
                      bg="var(--site-control)"
                      borderBottomWidth="1px"
                      borderColor="var(--site-border)"
                    >
                      <Flex
                        w="44px"
                        h="44px"
                        flexShrink={0}
                        align="center"
                        justify="center"
                        borderRadius="lg"
                        bg="var(--site-accent-soft)"
                        color="var(--site-accent-fg)"
                      >
                        <LuBuilding2 size={23} />
                      </Flex>
                      <Heading
                        as="h2"
                        fontSize="1.15rem"
                        lineHeight="1.4"
                        color="var(--site-heading)"
                      >
                        {agency.name}
                      </Heading>
                    </Flex>
                    <Stack p={6} gap={4} flex="1">
                      <Flex gap={3} wrap="wrap" align="center">
                        <Text
                          px={3}
                          py={1}
                          borderRadius="full"
                          bg="var(--site-accent-soft)"
                          color="var(--site-accent-fg)"
                          fontSize="sm"
                          fontWeight="semibold"
                        >
                          {agency.property_count}{" "}
                          {agency.property_count === 1
                            ? "property"
                            : "properties"}
                        </Text>
                        <Flex
                          gap={2}
                          align="center"
                          color="var(--site-muted)"
                          fontSize="sm"
                        >
                          {agency.review_count > 0 && (
                            <LuStar color="var(--site-accent-fg)" />
                          )}
                          <Text>{agencyRatingSummary(agency)}</Text>
                        </Flex>
                      </Flex>
                      <Text
                        lineClamp={3}
                        color="var(--site-muted)"
                        lineHeight="1.7"
                      >
                        {agency.description ||
                          "Explore this agency’s local properties and student reviews."}
                      </Text>
                      <Button
                        asChild
                        variant="outline"
                        mt="auto"
                        w="100%"
                        position="static"
                        _after={{
                          content: '\"\"',
                          position: "absolute",
                          inset: 0,
                        }}
                      >
                        <NextLink
                          href={`/agencies/${encodeURIComponent(agency.slug)}`}
                          aria-label={`View ${agency.name}`}
                        >
                          View agency <LuArrowRight />
                        </NextLink>
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>
              <PaginationControls
                page={currentPage}
                total={filteredAgencies.length}
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
