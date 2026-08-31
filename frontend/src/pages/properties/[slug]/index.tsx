import SEO from "@/components/seo";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Separator,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { FaBath, FaBed } from "react-icons/fa";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiMail,
  FiMapPin,
  FiMaximize,
  FiPhone,
} from "react-icons/fi";
import NavBar from "../../../components/navigation/navbar";

const properties = [
  {
    name: "University Highlands",
    slug: "university-highlands",
    price: "$656",
    details: "2 Bed • 2 Bath • AppalCART Bus Route Nearby",
    image: "/assets/properties/university-highlands.png",
    badges: ["🐾 Pet Friendly", "🅿️ Free Parking", "⭐ 4.2/5 Verified"],

    bedrooms: 2,
    bathrooms: 2,
    sqft: 900,
    type: "Apartment",
    available: "Available Now",

    address: "University Highlands, Boone, NC",

    description:
      "University Highlands offers comfortable student housing in Boone with convenient access to Appalachian State University and the AppalCART bus system. The community provides a convenient location for students looking for an affordable place to live near campus.",

    amenities: [
      "Pet friendly",
      "Free parking",
      "AppalCART nearby",
      "Washer & dryer",
      "High-speed internet",
      "Air conditioning",
      "Furnished options",
      "Near campus",
    ],
  },

  {
    name: "The Standard at Boone",
    slug: "the-standard-at-boone",
    price: "$1,050",
    details: "1 Bed • 1 Bath • Walking Distance to Campus",
    image: "/assets/properties/the-standard.png",
    badges: ["🐾 No Pets", "🅿️ Garage Parking", "⭐ 4.7/5 Verified"],

    bedrooms: 1,
    bathrooms: 1,
    sqft: 700,
    type: "Apartment",
    available: "Available Now",

    address: "The Standard at Boone, Boone, NC",

    description:
      "The Standard at Boone offers modern student apartments within walking distance of Appalachian State University. Residents have convenient access to campus, downtown Boone, restaurants, and other amenities.",

    amenities: [
      "Garage parking",
      "Walking distance to campus",
      "Fitness center",
      "Clubhouse",
      "AppalCART nearby",
      "Washer & dryer",
      "High-speed internet",
      "Air conditioning",
    ],
  },

  {
    name: "The Finmore at 241",
    slug: "the-finmore",
    price: "$799",
    details: "3 Bed • 2 Bath • On-site Laundry",
    image: "/assets/properties/finmore.png",
    badges: ["🐾 Pet Friendly", "🅿️ Permit Required", "⭐ 4.3/5 Verified"],

    bedrooms: 3,
    bathrooms: 2,
    sqft: 1_100,
    type: "Apartment",
    available: "Available Now",

    address: "The Finmore at 241, Boone, NC",

    description:
      "The Finmore at 241 provides affordable student housing with spacious three-bedroom floor plans and convenient access to the Boone area. With on-site laundry and a student-friendly location, it is a practical option for Appalachian State students.",

    amenities: [
      "Pet friendly",
      "On-site laundry",
      "Permit parking",
      "High-speed internet",
      "Air conditioning",
      "Near AppalCART",
      "Student friendly",
      "Spacious floor plans",
    ],
  },
];

export default function PropertySlug() {
  const router = useRouter();
  const { slug } = router.query;

  if (!router.isReady) {
    return null;
  }

  const property = properties.find((property) => property.slug === slug);

  if (!property) {
    return (
      <>
        <SEO title="Property Not Found" />

        <Box
          minH="100vh"
          bg="#f8f9fa"
          color="#333"
          fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
        >
          <NavBar />

          <Container maxW="1200px" py={10}>
            <Heading color="#111">Property Not Found</Heading>

            <Text color="#666" mt={2}>
              We couldn't find a property matching "{slug}".
            </Text>

            <Button mt={6} onClick={() => router.push("/")}>
              Back to map
            </Button>
          </Container>
        </Box>
      </>
    );
  }

  return (
    <>
      <SEO title={`${property.name} | Property`} />

      <Box
        minH="100vh"
        bg="#f8f9fa"
        color="#333"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <NavBar />

        <Container maxW="1200px" py={{ base: 6, md: 10 }}>
          {/* Back */}
          <Button
            variant="ghost"
            mb={6}
            px={0}
            color="#555"
            _hover={{
              bg: "transparent",
              color: "#111",
            }}
            onClick={() => router.back()}
          >
            <FiArrowLeft />
            Back to map
          </Button>

          {/* Header */}
          <Stack gap={2} mb={6}>
            <HStack gap={2} flexWrap="wrap">
              <Badge
                bg="#e8f5e9"
                color="#2e7d32"
                px={3}
                py={1}
                borderRadius="full"
              >
                {property.available}
              </Badge>

              <Badge
                bg="#eeeeee"
                color="#555"
                px={3}
                py={1}
                borderRadius="full"
              >
                {property.type}
              </Badge>

              {property.badges.map((badge) => (
                <Badge
                  key={badge}
                  bg="white"
                  color="#555"
                  border="1px solid"
                  borderColor="#e5e5e5"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {badge}
                </Badge>
              ))}
            </HStack>

            <Heading
              fontSize={{ base: "2xl", md: "4xl" }}
              color="#111"
              fontWeight="700"
            >
              {property.name}
            </Heading>

            <HStack color="#666" gap={2}>
              <FiMapPin />
              <Text>{property.address}</Text>
            </HStack>
          </Stack>

          {/* Property image */}
          <Box
            borderRadius="xl"
            overflow="hidden"
            bg="#ddd"
            mb={8}
            boxShadow="sm"
          >
            <Image
              src={property.image}
              alt={property.name}
              width={1200}
              height={500}
              style={{
                width: "100%",
                height: "500px",
                objectFit: "cover",
              }}
            />
          </Box>

          {/* Main content */}
          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 1fr) 350px",
            }}
            gap={10}
            alignItems="start"
          >
            {/* Left */}
            <GridItem>
              <Flex
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap={4}
                mb={6}
              >
                <Box>
                  <Text
                    fontSize="3xl"
                    fontWeight="700"
                    color="#111"
                    lineHeight="1"
                  >
                    {property.price}
                    <Text as="span" fontSize="md" fontWeight="400" color="#777">
                      {" "}
                      / month
                    </Text>
                  </Text>
                </Box>

                <HStack gap={5} color="#555">
                  <HStack gap={2}>
                    <FaBed />
                    <Text>{property.bedrooms} Beds</Text>
                  </HStack>

                  <HStack gap={2}>
                    <FaBath />
                    <Text>{property.bathrooms} Baths</Text>
                  </HStack>

                  <HStack gap={2}>
                    <FiMaximize />
                    <Text>{property.sqft} sq ft</Text>
                  </HStack>
                </HStack>
              </Flex>

              <Separator mb={8} />

              {/* Description */}
              <Box mb={10}>
                <Heading fontSize="xl" color="#111" mb={4}>
                  About this property
                </Heading>

                <Text color="#666" lineHeight="1.8">
                  {property.description}
                </Text>
              </Box>

              {/* Amenities */}
              <Box mb={10}>
                <Heading fontSize="xl" color="#111" mb={5}>
                  Amenities
                </Heading>

                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                  {property.amenities.map((amenity) => (
                    <HStack key={amenity} gap={3}>
                      <Box color="#2e7d32">
                        <FiCheck />
                      </Box>

                      <Text color="#555">{amenity}</Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>

              {/* Location */}
              <Box>
                <Heading fontSize="xl" color="#111" mb={4}>
                  Location
                </Heading>

                <Box
                  height="300px"
                  bg="#e5e5e5"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="#777"
                >
                  <Stack align="center" gap={2}>
                    <Icon fontSize="2xl">
                      <FiMapPin />
                    </Icon>

                    <Text>Map coming soon</Text>
                  </Stack>
                </Box>
              </Box>
            </GridItem>

            {/* Contact card */}
            <GridItem>
              <Box
                bg="white"
                border="1px solid"
                borderColor="#e5e5e5"
                borderRadius="xl"
                p={6}
                position={{ lg: "sticky" }}
                top={{ lg: "20px" }}
                boxShadow="sm"
              >
                <Heading fontSize="xl" color="#111" mb={2}>
                  Interested in this property?
                </Heading>

                <Text color="#777" fontSize="sm" mb={6} lineHeight="1.6">
                  Learn more about {property.name}, schedule a tour, or contact
                  the property manager.
                </Text>

                <Stack gap={3}>
                  <Button
                    bg="#111"
                    color="white"
                    size="lg"
                    width="100%"
                    _hover={{
                      bg: "#333",
                    }}
                  >
                    <FiMail />
                    Contact Property
                  </Button>

                  <Button variant="outline" size="lg" width="100%">
                    <FiCalendar />
                    Schedule a Tour
                  </Button>
                </Stack>

                <Separator my={6} />

                <Stack gap={4}>
                  <HStack gap={3}>
                    <Box bg="#f1f1f1" p={2.5} borderRadius="md">
                      <FiPhone />
                    </Box>

                    <Box>
                      <Text fontSize="xs" color="#888">
                        Property Manager
                      </Text>

                      <Text fontWeight="600">(828) 888-8888</Text>
                    </Box>
                  </HStack>

                  <HStack gap={3}>
                    <Box bg="#f1f1f1" p={2.5} borderRadius="md">
                      <FiMail />
                    </Box>

                    <Box>
                      <Text fontSize="xs" color="#888">
                        Email
                      </Text>

                      <Text fontWeight="600" fontSize="sm">
                        leasing@example.com
                      </Text>
                    </Box>
                  </HStack>
                </Stack>
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
