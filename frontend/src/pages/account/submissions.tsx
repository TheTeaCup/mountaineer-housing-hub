import SEO from "@/components/seo";
import SubmissionHistory from "@/components/submissions/submission-history";
import { Box, Container } from "@chakra-ui/react";
import NextLink from "next/link";

export default function MySubmissionsPage() {
  return (
    <>
      <SEO title="My listing submissions" noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="950px" py={10}>
          <Box mb={5}>
            <NextLink href="/account">← My account</NextLink>
          </Box>
          <SubmissionHistory />
        </Container>
      </Box>
    </>
  );
}
