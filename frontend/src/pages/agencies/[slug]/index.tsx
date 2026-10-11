import SEO from "@/components/seo";
import { Box, Container, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";

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
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container maxW="1200px" py={10}>
          <Heading color="var(--site-heading)" mb={2}>
            Agency Information Page
          </Heading>
        </Container>
      </Box>
    </>
  );
}
