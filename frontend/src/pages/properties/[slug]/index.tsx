import SEO from "@/components/seo";
import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import NavBar from "../../../components/navigation/navbar";

export default async function PropertySlug() {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <>
      <SEO title="Property" />
      <Box
        minH="100vh"
        bg="#f8f9fa"
        color="#333"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <NavBar />

        <Container maxW="1200px" py={10}>
          <Heading color="#111111" mb={2}>
            Property
          </Heading>

          <Text color="#666">
            Viewing property: <strong>{slug}</strong>
          </Text>
        </Container>
      </Box>
    </>
  );
}
