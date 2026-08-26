import Footer from "@/components/navigation/footer";
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
import NavBar from "../components/navigation/navbar";

const properties = [
  {
    name: "University Highlands",
    slug: "university-highlands",
    price: "$850",
    details: "2 Bed • 2 Bath • AppalCART Bus Route Nearby",
    image: "https://picsum.photos/400/200?random=1",
    badges: ["🐾 Pet Friendly", "🅿️ Free Parking", "⭐ 4.2/5 Verified"],
  },
  {
    name: "The Standard at Boone",
    slug: "the-standard-at-boone",
    price: "$1,050",
    details: "1 Bed • 1 Bath • Walking Distance to Campus",
    image: "https://picsum.photos/400/200?random=2",
    badges: ["🐾 No Pets", "🅿️ Garage Parking", "⭐ 4.7/5 Verified"],
  },
  {
    name: "CP West Apartments",
    slug: "cp-west-apartments",
    price: "$720",
    details: "3 Bed • 2 Bath • On-site Laundry",
    image: "https://picsum.photos/400/200?random=3",
    badges: ["🐾 Pet Friendly", "🅿️ Permit Required", "⭐ 3.9/5 Verified"],
  },
];

export default function Home() {
  return (
    <Box
      minH="100vh"
      bg="#f8f9fa"
      color="#333"
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    >
      <NavBar />

      {/* Hero */}
      <Box
        as="section"
        position="relative"
        backgroundImage="linear-gradient(rgba(17, 17, 17, 0.8), rgba(17, 17, 17, 0.8)), url('https://picsum.photos/1200/500')"
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
              bg="white"
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
                color="#333"
                fontSize="1rem"
                px={3}
                _focus={{
                  boxShadow: "none",
                }}
                placeholder="Search by name, price, or 'pet friendly, near bus stop'..."
              />

              <Button
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
        <Heading
          as="h2"
          display="inline-block"
          fontSize={{ base: "1.5rem", md: "1.8rem" }}
          color="#111111"
          mb={6}
          pb={1}
          borderBottom="2px solid"
          borderColor="#ffc72c"
        >
          Featured Student Properties
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
          {properties.map((property) => (
            <Box
              key={property.name}
              bg="white"
              borderRadius="8px"
              overflow="hidden"
              boxShadow="0 2px 8px rgba(0,0,0,0.1)"
              transition="transform 0.2s"
              _hover={{
                transform: "translateY(-5px)",
              }}
            >
              {/* Property Image */}
              <Box
                h="200px"
                bgImage={`url('${property.image}')`}
                bgSize="cover"
                position="center"
                bgColor="#ccc"
              />

              {/* Property Content */}
              <Box p={6}>
                <Heading as="h3" fontSize="1.25rem" color="#111111" mb={2}>
                  {property.name}
                </Heading>

                <Text
                  color="#27ae60"
                  fontWeight="bold"
                  fontSize="1.1rem"
                  mb={4}
                >
                  From {property.price} / mo
                </Text>

                <Text fontSize="0.9rem" color="#666" mb={4}>
                  {property.details}
                </Text>

                {/* Badges */}
                <Flex wrap="wrap" gap={2}>
                  {property.badges.map((badge) => (
                    <Box
                      key={badge}
                      bg="#e2e8f0"
                      px={2}
                      py={1}
                      borderRadius="4px"
                      fontSize="0.8rem"
                    >
                      {badge}
                    </Box>
                  ))}
                </Flex>

                {/* Details Button */}
                <NextLink href={`/properties/${property.slug}`}>
                  <Button
                    display="block"
                    w="100%"
                    mt={4}
                    bg="#111111"
                    color="white"
                    borderRadius="4px"
                    fontWeight="bold"
                    _hover={{
                      background: "#333333",
                    }}
                  >
                    View Full Profile
                  </Button>
                </NextLink>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Container>

      <Footer />
    </Box>
  );
}
