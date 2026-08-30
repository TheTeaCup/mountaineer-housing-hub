import { Box, Container, Heading } from "@chakra-ui/react";
import NavBar from "../../components/navigation/navbar";
export default function AuthRegister() {
  return (
    <Box
      minH="100vh"
      bg="#f8f9fa"
      color="#333"
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    >
      <NavBar />
      <Container maxW="1200px" py={10}>
        <Heading color="#111111" mb={2}>
          Register Page
        </Heading>
      </Container>
    </Box>
  );
}
