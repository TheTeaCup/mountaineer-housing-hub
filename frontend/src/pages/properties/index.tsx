import PropertiesCard from "@/components/properties/card";
import SEO from "@/components/seo";
import { PropertyGridSkeleton } from "@/components/ui/page-skeletons";
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
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function PropertiesList() {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q : "";
  const [input, setInput] = useState("");
  const { properties, loading, error, retry } = useProperties(query, 500);
  return (
    <>
      <SEO title="Properties" />
      <Box bg="var(--site-bg)" color="var(--site-fg)" flex="1">
        <Container maxW="1200px" py={10}>
          <Heading as="h1" mb={3}>
            Find your next home
          </Heading>
          <Text mb={6}>
            Explore apartment communities and standalone rentals. A community
            with several buildings has one listing; separate properties managed
            by the same rental agency have their own listings.
          </Text>
          <Flex
            as="form"
            gap={3}
            mb={7}
            onSubmit={(e) => {
              e.preventDefault();
              void router.push(
                `/properties${input.trim() ? `?q=${encodeURIComponent(input.trim())}` : ""}`,
              );
            }}
          >
            <Input
              aria-label="Search properties"
              placeholder="Search by property, agency, or address…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit">Search</Button>
          </Flex>
          {query && (
            <Flex gap={4} mb={5} align="center">
              <Text>Results for “{query}”</Text>
              <Button
                variant="outline"
                onClick={() => {
                  setInput("");
                  void router.push("/properties");
                }}
              >
                Clear search
              </Button>
            </Flex>
          )}
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
              {query
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
                {properties.map((property) => (
                  <PropertiesCard key={property.slug} property={property} />
                ))}
              </SimpleGrid>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
