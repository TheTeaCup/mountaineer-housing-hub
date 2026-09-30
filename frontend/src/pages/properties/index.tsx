import Footer from "@/components/navigation/footer";
import SEO from "@/components/seo";
import { properties } from "@/data/properties";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";
import NavBar from "../../components/navigation/navbar";

export default function PropertiesList() {
  const [query, setQuery] = useState("");

  const visibleProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return properties;

    return properties.filter((property) =>
      [
        property.name,
        property.details,
        property.address,
        property.amenities.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <>
      <SEO title="Properties List" />
      <Box
        minH="100vh"
        bg="#f8f9fa"
        color="#333"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <NavBar />
        <Container maxW="1100px" py={{ base: 7, md: 10 }} px={{ base: 4, md: 6 }}>
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "end" }}
            direction={{ base: "column", md: "row" }}
            gap={5}
            mb={7}
          >
            <Box>
              <Text
                color="#725600"
                fontWeight="800"
                fontSize="sm"
                letterSpacing="0.08em"
                textTransform="uppercase"
                mb={2}
              >
                Quick list
              </Text>

              <Text color="#666" mt={2} fontSize="1rem">
                Compare the essentials, then open a property for full details.
              </Text>
            </Box>

            <Text color="#666" fontWeight="600" whiteSpace="nowrap">
              {visibleProperties.length} {visibleProperties.length === 1 ? "property" : "properties"}
            </Text>
          </Flex>

          <Flex
            bg="white"
            border="1px solid"
            borderColor="#dddddd"
            borderRadius="10px"
            align="center"
            px={4}
            mb={5}
            boxShadow="0 2px 8px rgba(0,0,0,0.04)"
          >
            <Box color="#777" fontSize="1.1rem" aria-hidden="true">
              <FiSearch />
            </Box>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by property, amenity, or location"
              aria-label="Search the property list"
              border="none"
              fontSize="1rem"
              minH="52px"
              _focus={{ boxShadow: "none" }}
            />
          </Flex>

          <Stack gap={3}>
            {visibleProperties.map((property) => (
              <Flex
                key={property.slug}
                as="article"
                bg="white"
                border="1px solid"
                borderColor="#e1e1e1"
                borderRadius="12px"
                overflow="hidden"
                direction={{ base: "column", sm: "row" }}
                minH={{ sm: "168px" }}
                boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                transition="border-color 0.2s ease, transform 0.2s ease"
                _hover={{ borderColor: "#c99c11", transform: "translateY(-2px)" }}
              >
                <Box
                  position="relative"
                  w={{ base: "100%", sm: "220px" }}
                  minH={{ base: "180px", sm: "168px" }}
                  flexShrink={0}
                >
                  <Image
                    src={property.image}
                    alt={`${property.name} exterior`}
                    fill
                    sizes="(max-width: 480px) 100vw, 220px"
                    style={{ objectFit: "cover" }}
                  />
                </Box>

                <Flex
                  flex="1"
                  p={{ base: 5, md: 6 }}
                  align={{ base: "stretch", md: "center" }}
                  justify="space-between"
                  direction={{ base: "column", md: "row" }}
                  gap={5}
                >
                  <Box>
                    <Flex gap={2} align="center" wrap="wrap" mb={2}>
                      <Badge bg="#fff3c4" color="#5b4500" px={2} py={1} borderRadius="full">
                        {property.available}
                      </Badge>
                      <Text fontSize="sm" color="#777">
                        {property.type}
                      </Text>
                    </Flex>

                    <Heading as="h2" fontSize="1.3rem" color="#111" mb={2}>
                      {property.name}
                    </Heading>
                    <Text color="#555" mb={2}>
                      {property.bedrooms} bed · {property.bathrooms} bath · {property.sqft.toLocaleString()} sq ft
                    </Text>
                    <Flex align="center" gap={2} color="#777" fontSize="sm">
                      <FiMapPin aria-hidden="true" />
                      <Text>{property.address}</Text>
                    </Flex>
                  </Box>

                  <Box minW={{ md: "155px" }} textAlign={{ md: "right" }}>
                    <Text color="#111" fontSize="1.35rem" fontWeight="800">
                      From {property.price}
                    </Text>
                    <Text color="#777" fontSize="sm" mb={3}>
                      per month
                    </Text>
                    <NextLink href={`/properties/${property.slug}`} style={{ textDecoration: "none" }}>
                      <Button
                        bg="#111111"
                        color="white"
                        w={{ base: "100%", md: "auto" }}
                        px={5}
                        _hover={{ bg: "#333333" }}
                      >
                        View details
                      </Button>
                    </NextLink>
                  </Box>
                </Flex>
              </Flex>
            ))}

            {visibleProperties.length === 0 && (
              <Box
                bg="white"
                border="1px dashed"
                borderColor="#cccccc"
                borderRadius="12px"
                textAlign="center"
                py={12}
                px={5}
              >
                <Heading as="h2" fontSize="1.25rem" color="#222" mb={2}>
                  No matching properties
                </Heading>
                <Text color="#666" mb={4}>
                  Try another property name, amenity, or location.
                </Text>
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              </Box>
            )}
          </Stack>
        </Container>
        <Footer />
      </Box>
    </>
  );
}
