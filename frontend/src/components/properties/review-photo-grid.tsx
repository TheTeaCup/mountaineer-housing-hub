import { Image, SimpleGrid } from "@chakra-ui/react";

export interface ReviewPhoto {
  id: number;
  url: string;
}

export default function ReviewPhotoGrid({
  photos,
}: {
  photos?: ReviewPhoto[];
}) {
  if (!photos?.length) return null;
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3} mt={4}>
      {photos.map((photo, index) => (
        <Image
          key={photo.id}
          src={photo.url}
          alt={`Review photo ${index + 1}`}
          w="100%"
          h="180px"
          objectFit="cover"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="var(--site-border)"
          loading="lazy"
        />
      ))}
    </SimpleGrid>
  );
}
