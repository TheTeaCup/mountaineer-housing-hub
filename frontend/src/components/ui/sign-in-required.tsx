import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { FiLock } from "react-icons/fi";

export default function SignInRequired({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box
      bg="var(--site-surface)"
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="2xl"
      px={{ base: 6, md: 10 }}
      py={{ base: 8, md: 10 }}
      boxShadow="sm"
      textAlign="center"
    >
      <Stack gap={5} align="center">
        <Box
          aria-hidden="true"
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="56px"
          h="56px"
          borderRadius="full"
          bg="rgba(255, 199, 44, 0.16)"
          color="var(--site-heading)"
          css={{ "& > svg": { width: "26px", height: "26px" } }}
        >
          <FiLock />
        </Box>

        <Box maxW="560px">
          <Heading as="h1" size="xl" color="var(--site-heading)" mb={3}>
            {title}
          </Heading>
          <Text color="var(--site-muted)" lineHeight="1.7">
            {description}
          </Text>
        </Box>

        <Stack
          direction={{ base: "column", sm: "row" }}
          gap={3}
          w={{ base: "100%", sm: "auto" }}
        >
          <Button
            asChild
            size="lg"
            bg="#ffc72c"
            color="#111111"
            w={{ base: "100%", sm: "auto" }}
            _hover={{ bg: "#ffd45c" }}
          >
            <NextLink href="/auth/login">Sign in with App State</NextLink>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            w={{ base: "100%", sm: "auto" }}
          >
            <NextLink href="/properties">Browse properties</NextLink>
          </Button>
        </Stack>

        <Text fontSize="sm" color="var(--site-muted)">
          Sign-in helps keep community submissions trustworthy and lets you
          track their review status.
        </Text>
      </Stack>
    </Box>
  );
}
