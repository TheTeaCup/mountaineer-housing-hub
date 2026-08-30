import { Box, Container, Heading, Text } from "@chakra-ui/react";
import NavBar from "../components/navigation/navbar";
export default function Submit() {
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
          Submit Page
        </Heading>
        <Text>
          This would start off as a form to submit a review but if the apartment
          is not listed from the drop down then the form would turn into a
          submission form.
        </Text>
      </Container>
    </Box>
  );
}
