import SEO from "@/components/seo";
import ReviewForm from "@/components/submissions/review-form";
import { Box, Container } from "@chakra-ui/react";

export default function Submit() {
  return (
    <>
      <SEO title="Submit" />

      <Box
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container maxW="800px" py={10}>
          <ReviewForm />
        </Container>
      </Box>
    </>
  );
}
