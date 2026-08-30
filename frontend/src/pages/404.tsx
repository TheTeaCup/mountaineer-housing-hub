import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import NavBar from "../components/navigation/navbar";

export default function NotFound() {
  return (
    <Box
      minH="100vh"
      bg="#f8f9fa"
      color="#333"
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      display="flex"
      flexDirection="column"
    >
      <NavBar />

      <Container
        flex="1"
        display="flex"
        alignItems="center"
        justifyContent="center"
        maxW="700px"
        textAlign="center"
        px={4}
      >
        <VStack gap={5}>
          <Heading
            fontSize={{ base: "5rem", md: "7rem" }}
            lineHeight="1"
            fontWeight="bold"
            color="#111111"
          >
            404
          </Heading>

          <Box w="60px" h="4px" bg="#ffc72c" borderRadius="full" />

          <Heading
            as="h1"
            fontSize={{ base: "1.5rem", md: "2rem" }}
            color="#111111"
          >
            We couldn't find that page
          </Heading>

          <Text
            color="#666"
            fontSize={{ base: "1rem", md: "1.1rem" }}
            maxW="500px"
          >
            The page you're looking for may have been moved, removed, or never
            existed in the first place.
          </Text>

          <NextLink href="/">
            <Button
              bg="#111111"
              color="white"
              px={8}
              mt={2}
              borderRadius="5px"
              fontWeight="bold"
              _hover={{
                bg: "#333333",
              }}
            >
              Return Home
            </Button>
          </NextLink>
        </VStack>
      </Container>
    </Box>
  );
}
