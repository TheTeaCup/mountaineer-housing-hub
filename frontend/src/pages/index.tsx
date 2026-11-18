import PropertiesCard from "@/components/properties/card";
import SEO from "@/components/seo";
import { PropertyGridSkeleton } from "@/components/ui/page-skeletons";
import { useProperties } from "@/hooks/use-properties";
import type { Property } from "@/types/properties";
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
import type { ReactNode } from "react";
import { useState } from "react";

function PropertyRow({
  title,
  properties,
  action,
  status,
  sponsored = false,
}: {
  title: string;
  properties: Property[];
  action?: ReactNode;
  status?: ReactNode;
  sponsored?: boolean;
}) {
  return (
    <Box as="section" mb={9}>
      <Flex align="baseline" justify="space-between" wrap="wrap" gap={3} mb={5}>
        <Heading
          as="h2"
          fontSize={{ base: "1.5rem", md: "1.8rem" }}
          color="var(--site-heading)"
        >
          {title}
        </Heading>
        {action}
      </Flex>
      {status ?? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {properties.map((property) => (
            <PropertiesCard
              key={property.slug}
              property={property}
              sponsored={sponsored}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const discover = useProperties("", 6, "random");
  const recent = useProperties("", 3, "recently-reviewed");
  const top = useProperties("", 3, "top-rated");
  const sponsored = useProperties("", 3, "sponsored");

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
      <SEO title="Off-Campus Housing in Boone, NC" />
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
                  aria-label="Search by property name, rental agency, or address"
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
              <Flex
                as="nav"
                aria-label="Property shortcuts"
                wrap="wrap"
                justify="center"
                gap={2}
              >
                {[
                  { href: "/properties?appalcart=1", label: "On AppalCART" },
                  { href: "/map", label: "Browse map" },
                  { href: "/properties", label: "All properties" },
                ].map(({ href, label }) => (
                  <Button
                    key={href}
                    asChild
                    variant="outline"
                    size="sm"
                    color="white"
                    borderColor="whiteAlpha.700"
                    bg="blackAlpha.400"
                    _hover={{ bg: "whiteAlpha.300" }}
                  >
                    <NextLink href={href}>{label}</NextLink>
                  </Button>
                ))}
              </Flex>
            </VStack>
          </Container>
        </Box>

        <Container maxW="1200px" py={9} px={{ base: 4, md: 6 }}>
          <PropertyRow
            title="Explore places to live"
            properties={discover.properties}
            action={
              <Flex gap={3} wrap="wrap">
                <Button
                  variant="outline"
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  bg="var(--site-surface)"
                  color="var(--site-fg)"
                  _hover={{
                    bg: "var(--site-control-hover)",
                    borderColor: "var(--site-accent-fg)",
                  }}
                  onClick={discover.retry}
                  disabled={discover.loading}
                >
                  Shuffle places
                </Button>
                <Button
                  asChild
                  bg="#ffc72c"
                  color="#111111"
                  borderWidth="1px"
                  borderColor="#ffc72c"
                  fontWeight="semibold"
                  _hover={{ bg: "#e5b324" }}
                >
                  <NextLink href="/properties">View all properties</NextLink>
                </Button>
              </Flex>
            }
            status={
              discover.loading ? (
                <PropertyGridSkeleton count={6} />
              ) : discover.error ? (
                <Box role="alert">
                  <Text mb={3}>{discover.error}</Text>
                  <Button variant="outline" onClick={discover.retry}>
                    Try again
                  </Button>
                </Box>
              ) : !discover.properties.length ? (
                <Text color="var(--site-muted)">
                  No properties have been published yet.
                </Text>
              ) : undefined
            }
          />
          <PropertyRow
            title="Recently reviewed"
            properties={recent.properties}
            action={
              <Button
                asChild
                variant="outline"
                color="var(--site-accent-fg)"
                borderColor="currentColor"
              >
                <NextLink href="/submit">Write a review</NextLink>
              </Button>
            }
            status={
              recent.loading ? (
                <PropertyGridSkeleton count={3} />
              ) : recent.error ? (
                <Box role="alert">
                  <Text mb={3}>{recent.error}</Text>
                  <Button variant="outline" onClick={recent.retry}>
                    Try again
                  </Button>
                </Box>
              ) : !recent.properties.length ? (
                <Text color="var(--site-muted)">
                  No student reviews have been published yet.
                </Text>
              ) : undefined
            }
          />
          {top.properties.length >= 2 && (
            <PropertyRow title="Top rated" properties={top.properties} />
          )}
          {sponsored.properties.length > 0 && (
            <PropertyRow
              title="Sponsored properties"
              properties={sponsored.properties}
              sponsored
            />
          )}
        </Container>
      </Box>
    </>
  );
}
