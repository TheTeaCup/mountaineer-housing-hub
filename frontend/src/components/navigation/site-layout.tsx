import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";
import Footer from "./footer";
import NavBar from "./navbar";

export default function SiteLayout({
  children,
  map = false,
}: {
  children: ReactNode;
  map?: boolean;
}) {
  return (
    <Box
      minH="100dvh"
      h={map ? "100dvh" : undefined}
      display="flex"
      flexDirection="column"
      bg="var(--site-bg)"
      color="var(--site-fg)"
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      overflow={map ? "hidden" : undefined}
    >
      <NavBar />
      <Box
        as="main"
        flex="1"
        minH={map ? "0" : undefined}
        display="flex"
        flexDirection="column"
        w="100%"
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
