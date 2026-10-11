import SEO from "@/components/seo";
import { Box, Container, Heading } from "@chakra-ui/react";

export default function AgenciesList() {
  return (
    <>
      <SEO title="Agencies" />
      <Box
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container maxW="1200px" py={10}>
          <Heading color="var(--site-heading)" mb={2}>
            Agencies List Page
          </Heading>
        </Container>
      </Box>
    </>
  );
}
