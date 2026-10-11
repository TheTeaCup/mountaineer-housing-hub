import SEO from "@/components/seo";
import { Box } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

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
    <>
      <SEO title="Map" />
      <Box
        flex="1"
        minH="0"
        overflow="hidden"
        bg="var(--site-bg)"
        color="var(--site-fg)"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
        display="flex"
        flexDirection="column"
      >
        <Box position="relative" flex="1" minH="0" w="100%">
          <MapComponent propertyQuery={propertyQuery} />
        </Box>
      </Box>
    </>
  );
}
