import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";

const footerSections = [
  {
    label: "Explore",
    links: [
      { label: "Browse properties", href: "/properties" },
      { label: "Explore the map", href: "/map" },
      { label: "Rental agencies", href: "/agencies" },
      { label: "Search housing", href: "/search" },
    ],
  },
  {
    label: "Contribute",
    links: [
      { label: "Write a review", href: "/submit" },
      { label: "Suggest a property", href: "/submit/apartment" },
      { label: "Suggest an agency", href: "/submit/apartment" },
    ],
  },
];

export default function Footer() {
  return (
    <Box
      as="footer"
      bg="#111111"
      color="white"
      flexShrink={0}
      borderTop="4px solid"
      borderColor="#ffc72c"
    >
      <Container
        maxW="1200px"
        px={{ base: 6, md: 8 }}
        py={{ base: 10, md: 12 }}
      >
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          gap={{ base: 9, md: 12 }}
          textAlign={{ base: "center", md: "left" }}
        >
          <Box>
            <NextLink href="/" style={{ textDecoration: "none" }}>
              <Text fontSize="xl" fontWeight="bold">
                Mountaineer{" "}
                <Text as="span" color="#ffc72c">
                  Housing Hub
                </Text>
              </Text>
            </NextLink>
            <Text
              mt={3}
              maxW="430px"
              mx={{ base: "auto", md: 0 }}
              color="whiteAlpha.700"
              lineHeight="tall"
            >
              A student-built guide to off-campus housing in Boone. Compare
              properties, rental agencies, pricing, and student experiences in
              one place.
            </Text>
          </Box>

          {footerSections.map((section) => (
            <Box key={section.label}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="#ffc72c"
                textTransform="uppercase"
                letterSpacing="0.08em"
                mb={3}
              >
                {section.label}
              </Text>
              <Stack
                as="nav"
                aria-label={`${section.label} links`}
                gap={2}
                align={{ base: "center", md: "flex-start" }}
              >
                {section.links.map((link) => (
                  <NextLink
                    key={link.label}
                    href={link.href}
                    style={{ textDecoration: "none" }}
                  >
                    <Text
                      color="whiteAlpha.800"
                      _hover={{
                        color: "#ffc72c",
                        textDecoration: "underline",
                      }}
                    >
                      {link.label}
                    </Text>
                  </NextLink>
                ))}
              </Stack>
            </Box>
          ))}
        </SimpleGrid>

        <Flex
          borderTop="1px solid"
          borderColor="whiteAlpha.300"
          mt={{ base: 9, md: 10 }}
          pt={5}
          align="center"
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={3}
          fontSize="sm"
          color="whiteAlpha.700"
          textAlign="center"
        >
          <Text>
            © 2026 Mountaineer Housing Hub · App State CIS 4850 Project Team
          </Text>
          <Flex as="nav" aria-label="Legal" gap={5}>
            <NextLink href="/legal/privacy">
              <Text _hover={{ color: "#ffc72c" }}>Privacy</Text>
            </NextLink>
            <NextLink href="/legal/terms">
              <Text _hover={{ color: "#ffc72c" }}>Terms</Text>
            </NextLink>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
