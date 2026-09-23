import SEO from "@/components/seo";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";

import NavBar from "../../components/navigation/navbar";

export default function AuthLogin() {
  const handleGoogleLogin = () => {
    // Replace this with your actual backend OAuth endpoint
    //window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <>
      <SEO title="Login" />

      <Box
        minH="100vh"
        bg="#f8f9fa"
        color="#333"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <NavBar />

        <Container maxW="500px" py={{ base: 12, md: 20 }}>
          <Box
            bg="white"
            borderWidth="1px"
            borderColor="#e2e8f0"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
            boxShadow="sm"
          >
            <VStack gap={6} align="stretch">
              <Box textAlign="center">
                <Heading as="h1" size="xl" color="#111111" mb={3}>
                  Welcome
                </Heading>

                <Text color="#666" fontSize="md">
                  Sign in to continue to Mountaineer Housing Hub.
                </Text>
              </Box>

              <Button
                size="lg"
                width="100%"
                bg="#ffffff"
                color="#333333"
                borderWidth="1px"
                borderColor="#dadce0"
                _hover={{
                  bg: "#f8f9fa",
                  borderColor: "#c6c6c6",
                }}
                onClick={handleGoogleLogin}
              >
                <FaGoogle />
                Sign in with your App State Email
              </Button>

              <Text
                textAlign="center"
                fontSize="sm"
                color="#777"
                lineHeight="1.6"
              >
                Mountaineer Housing Hub uses Google for authentication. Please
                use your App State email account to continue.
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
