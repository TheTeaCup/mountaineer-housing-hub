import SEO from "@/components/seo";
import { Box, Container, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";

import NavBar from "../../../components/navigation/navbar";

export default function AgenciesSlug() {
  const router = useRouter();
  const { slug } = router.query;

  if (!router.isReady) {
    return null;
  }

  return (
    <>
      <SEO title={`NAME | Agency`} />

      <Box
        minH="100vh"
        bg="#f8f9fa"
        color="#333"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <NavBar />

        <Container maxW="1200px" py={10}>
          <Heading color="#111111" mb={2}>
            Agency Information Page
          </Heading>
        </Container>
      </Box>
    </>
  );
}
