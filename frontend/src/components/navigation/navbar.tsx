import { Box, Flex, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Search", href: "/search" },
    { label: "Map", href: "/map" },
    { label: "Submit", href: "/submit" },
    { label: "Login", href: "/auth/login" },
  ];

  return (
    <Box
      as="header"
      bg="#111111"
      color="white"
      px={{ base: 4, md: 8 }}
      py={4}
      borderBottom="4px solid"
      borderColor="#ffc72c"
    >
      <Flex
        maxW="1200px"
        mx="auto"
        align="center"
        justify="space-between"
        gap={6}
        flexWrap="wrap"
      >
        {/* Logo */}
        <NextLink href="/" style={{ textDecoration: "none" }}>
          <Text
            fontSize="1.5rem"
            fontWeight="bold"
            color="white"
            whiteSpace="nowrap"
            _hover={{
              color: "#ffc72c",
            }}
          >
            Mountaineer
            <Text as="span" color="#ffc72c">
              Housing Hub
            </Text>
          </Text>
        </NextLink>

        {/* Navigation */}
        <Flex as="nav" gap={{ base: 3, md: 5 }} align="center" flexWrap="wrap">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <NextLink
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                <Text
                  fontWeight="500"
                  color={isActive ? "#ffc72c" : "white"}
                  position="relative"
                  pb="2px"
                  _after={{
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: isActive ? "100%" : "0%",
                    height: "2px",
                    bg: "#ffc72c",
                    transition: "width 0.2s ease",
                  }}
                  _hover={{
                    color: "#ffc72c",
                    _after: {
                      width: "100%",
                    },
                  }}
                >
                  {item.label}
                </Text>
              </NextLink>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}
