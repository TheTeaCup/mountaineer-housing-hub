import Footer from "@/components/navigation/footer";
import PropertiesCard from "@/components/properties/card";
import SEO from "@/components/seo";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import NavBar from "../components/navigation/navbar";

const properties = [
  {
    name: "University Highlands",
    slug: "university-highlands",
    price: "$656",
    details: "2 Bed • 2 Bath • AppalCART Bus Route Nearby",
    image: "/assets/properties/university-highlands.png",
    badges: ["🐾 Pet Friendly", "🅿️ Free Parking", "⭐ 4.2/5 Verified"],
  },
  {
    name: "The Standard at Boone",
    slug: "the-standard-at-boone",
    price: "$1,050",
    details: "1 Bed • 1 Bath • Walking Distance to Campus",
    image: "/assets/properties/the-standard.png",
    badges: ["🐾 No Pets", "🅿️ Garage Parking", "⭐ 4.7/5 Verified"],
  },
  {
    name: "The Finmore at 241",
    slug: "the-finmore",
    price: "$799",
    details: "3 Bed • 2 Bath • On-site Laundry",
    image: "/assets/properties/finmore.png",
    badges: ["🐾 Pet Friendly", "🅿️ Permit Required", "⭐ 4.3/5 Verified"],
  },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
              <PropertiesCard key={property.slug} property={property} />
            ))}
          </SimpleGrid>
        </Container>

        <Footer />
      </Box>
    </>
  );
}
