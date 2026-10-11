import { Box, Flex, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export default function Footer() {
  return (
    <Box
      as="footer"
      bg="#111111"
      color="white"
      textAlign="center"
      py={6}
      px={4}
      flexShrink={0}
      borderTop="4px solid"
      borderColor="#ffc72c"
    >
      <Text fontSize="sm">
        © 2026 Mountaineer Housing Hub • App State CIS 4850 Project Team
      </Text>
      <Flex
        as="nav"
        aria-label="Legal"
        justify="center"
        gap={6}
        mt={3}
        fontSize="sm"
        color="#ffc72c"
        textDecoration="underline"
        flexWrap="wrap"
      >
        <NextLink href="/legal/privacy">Privacy Policy</NextLink>
        <NextLink href="/legal/terms">Terms of Use</NextLink>
      </Flex>
    </Box>
  );
}
