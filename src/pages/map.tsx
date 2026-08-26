import { Box } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NavBar from "../components/navigation/navbar";

const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function Map() {
  const router = useRouter();

  const propertyQuery =
    typeof router.query.property === "string"
      ? router.query.property
      : undefined;

  return (
    <Box
      h="100vh"
      overflow="hidden"
      bg="#f8f9fa"
      color="#333"
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      display="flex"
      flexDirection="column"
    >
      <NavBar />

      <Box position="relative" flex="1" minH="0" w="100%">
        <MapComponent propertyQuery={propertyQuery} />
      </Box>
    </Box>
  );
}
