import PropertiesCard from "@/components/properties/card";
import SEO from "@/components/seo";
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
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { properties, loading, error, retry } = useProperties("", 6, true);

  const handleSearch = () => {
    const query = searchQuery.trim();

    if (!query) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <SEO />
      <Box
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        {/* Hero */}
        <Box
          as="section"
          position="relative"
          backgroundImage="linear-gradient(rgba(17, 17, 17, 0.8), rgba(17, 17, 17, 0.8)), url('/assets/background.jpeg')"
          backgroundPosition="center"
          backgroundSize="cover"
          color="white"
          textAlign="center"
          px={4}
          py={{ base: 16, md: 20 }}
        >
          <Container maxW="900px">
            <VStack gap={4}>
              <Heading
                as="h1"
                fontSize={{ base: "2rem", md: "2.5rem" }}
                lineHeight="1.2"
              >
                Find Your Off-Campus Home in Boone
              </Heading>

              <Text fontSize={{ base: "1rem", md: "1.1rem" }} color="#dddddd">
                Real apartments. Real students. Real experiences.
              </Text>

              {/* Search */}
              <Flex
                as="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                bg="var(--site-surface)"
                p="10px"
                borderRadius="8px"
                maxW="700px"
                w="100%"
                boxShadow="0 4px 15px rgba(0,0,0,0.3)"
                gap={2}
                mt={4}
              >
                <Input
                  flex="1"
                  border="none"
                  color="var(--site-fg)"
                  fontSize="1rem"
                  px={3}
                  _focus={{
                    boxShadow: "none",
                  }}
                  placeholder="Search by property name, rental agency, or address…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Button
                  type="submit"
                  bg="#ffc72c"
                  color="#111111"
                  px={6}
                  fontWeight="bold"
                  borderRadius="5px"
                  _hover={{
                    bg: "#d9a714",
                  }}
                >
                  Search
                </Button>
              </Flex>
            </VStack>
          </Container>
        </Box>

        {/* Listings */}
        <Container maxW="1200px" py={8} px={{ base: 4, md: 6 }}>
          <Flex align="center" justify="space-between" gap={4} mb={6}>
            <Heading
              as="h2"
              display="inline-block"
              fontSize={{ base: "1.5rem", md: "1.8rem" }}
              color="var(--site-heading)"
              pb={1}
              borderBottom="2px solid"
              borderColor="#ffc72c"
            >
              Explore Student Properties
            </Heading>

            <NextLink href="/properties" style={{ textDecoration: "none" }}>
              <Text
                color="var(--site-accent-fg)"
                fontWeight="700"
                whiteSpace="nowrap"
                _hover={{ color: "var(--site-heading)" }}
              >
                View all properties
              </Text>
            </NextLink>
          </Flex>

          {loading ? (
            <Text role="status">Loading properties…</Text>
          ) : error ? (
            <Box role="alert">
              <Text mb={3}>{error}</Text>
              <Button variant="outline" onClick={retry}>
                Try again
              </Button>
            </Box>
          ) : !properties.length ? (
            <Text>No properties have been published yet. Check back soon.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
              {properties.map((property) => (
                <PropertiesCard key={property.slug} property={property} />
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>
    </>
  );
}
