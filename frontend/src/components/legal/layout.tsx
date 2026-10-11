import SEO from "@/components/seo";
import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SEO title={title} />
      <Box
        flex="1"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <Container
          maxW="850px"
          py={{ base: 8, md: 12 }}
          px={{ base: 4, md: 6 }}
        >
          <Text color="var(--site-accent-fg)" fontWeight="bold" mb={2}>
            Mountaineer Housing Hub · Legal
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: "2rem", md: "2.5rem" }}
            color="var(--site-heading)"
          >
            {title}
          </Heading>
          <Text color="var(--site-muted)" mt={3}>
            Last updated: October 10, 2026
          </Text>
          <Flex
            as="nav"
            aria-label="Legal pages"
            gap={5}
            mt={5}
            mb={8}
            color="var(--site-accent-fg)"
            textDecoration="underline"
            flexWrap="wrap"
          >
            <NextLink href="/legal/privacy">Privacy Policy</NextLink>
            <NextLink href="/legal/terms">Terms of Use</NextLink>
          </Flex>
          <Box
            as="article"
            bg="var(--site-surface)"
            borderWidth="1px"
            borderColor="var(--site-border)"
            borderRadius="xl"
            p={{ base: 5, md: 8 }}
            lineHeight="1.8"
          >
            {children}
          </Box>
        </Container>
      </Box>
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box as="section" mb={7}>
      <Heading as="h2" fontSize="xl" color="var(--site-heading)" mb={3}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

export function LegalContact() {
  return (
    <Text>
      For questions, privacy requests, account deletion, or reports about
      content, email{" "}
      <a
        href="mailto:example@example.com"
        style={{ textDecoration: "underline", color: "var(--site-accent-fg)" }}
      >
        example@example.com
      </a>
      . Please describe your request and the account or content involved; do not
      send passwords or other sensitive information.
    </Text>
  );
}
