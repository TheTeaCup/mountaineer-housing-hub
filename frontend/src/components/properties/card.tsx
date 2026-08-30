import { Property } from "@/types/properties";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import NextLink from "next/link";

interface PropertiesCardProps {
  property: Property;
}

export default function PropertiesCard({ property }: PropertiesCardProps) {
  return (
    <>
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

          <Text color="#27ae60" fontWeight="bold" fontSize="1.1rem" mb={4}>
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
    </>
  );
}
