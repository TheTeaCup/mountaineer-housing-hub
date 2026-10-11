import SEO from "@/components/seo";
import ApartmentForm from "@/components/submissions/apartment-form";
import { Box, Container } from "@chakra-ui/react";

export default function SubmitApartmentPage() {
  return (
    <>
      <SEO title="Suggest a Property or Rental Agency" />
      <Box
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container maxW="800px" py={10}>
          <ApartmentForm />
        </Container>
      </Box>
    </>
  );
}
