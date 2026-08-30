import { Box, Text } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box
      as="footer"
      bg="#111111"
      color="white"
      textAlign="center"
      py={6}
      mt={12}
      borderTop="4px solid"
      borderColor="#ffc72c"
    >
      <Text fontSize="sm">
        © 2026 Mountaineer Housing Hub • App State CIS 4850 Project Team
      </Text>
    </Box>
  );
}
