import { safeUrl } from "@/utils/api/properties";
import { Box, Image, Text } from "@chakra-ui/react";
import { useState } from "react";

export default function PropertyPhoto({
  src,
  alt,
  height = "200px",
}: {
  src?: string | null;
  alt: string;
  height?: string;
}) {
  const [broken, setBroken] = useState(false);
  const url = safeUrl(src, true);
  return url && !broken ? (
    <Image
      src={url}
      alt={alt}
      w="100%"
      h={height}
      objectFit="cover"
      onError={() => setBroken(true)}
    />
  ) : (
    <Box
      h={height}
      bg="var(--site-muted-surface)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text color="var(--site-muted)">Photo not available</Text>
    </Box>
  );
}
