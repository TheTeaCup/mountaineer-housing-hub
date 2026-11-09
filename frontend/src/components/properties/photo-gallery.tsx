import type { Property } from "@/types/properties";
import { safeUrl } from "@/utils/api/properties";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Portal,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import PropertyPhoto from "./photo";

export default function PropertyPhotoGallery({
  photos,
  name,
}: {
  photos: Property["photos"];
  name: string;
}) {
  const images = photos.filter((photo) => safeUrl(photo.image_url, true));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const index =
    activeIndex === null ? 0 : Math.min(activeIndex, images.length - 1);
  const active = images[index];
  function advance(direction: number) {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current + direction + images.length) % images.length,
    );
  }
  function thumbnail(
    photo: Property["photos"][number],
    photoIndex: number,
    height: string,
  ) {
    return (
      <Button
        key={`${photo.image_url}-${photoIndex}`}
        type="button"
        variant="plain"
        display="block"
        p={0}
        h="auto"
        w="100%"
        overflow="hidden"
        borderRadius="lg"
        cursor="zoom-in"
        aria-label={`Open photo ${photoIndex + 1} of ${images.length} of ${name}`}
        onClick={(event) => {
          opener.current = event.currentTarget;
          setActiveIndex(photoIndex);
        }}
      >
        <PropertyPhoto
          src={photo.image_url}
          alt={photo.alt_text || `${name}, photo ${photoIndex + 1}`}
          height={height}
        />
      </Button>
    );
  }
  if (!images.length)
    return <PropertyPhoto alt={`${name} exterior`} height="340px" />;
  return (
    <>
      <Stack gap={3}>
        {thumbnail(images[0], 0, "340px")}
        {images.length > 1 && (
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
            {images
              .slice(1)
              .map((photo, photoIndex) =>
                thumbnail(photo, photoIndex + 1, "150px"),
              )}
          </SimpleGrid>
        )}
        <Text fontSize="sm" color="var(--site-muted)">
          Select a photo to enlarge
          {images.length > 1 ? " and browse the gallery" : ""}.
        </Text>
      </Stack>
      <Dialog.Root
        open={activeIndex !== null}
        onOpenChange={({ open }) => {
          if (!open) setActiveIndex(null);
        }}
        placement="center"
        size="xl"
        lazyMount
        unmountOnExit
        initialFocusEl={() => closeButton.current}
        finalFocusEl={() => opener.current}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner p={{ base: 2, md: 6 }}>
            <Dialog.Content
              maxW="1000px"
              maxH="95dvh"
              overflowY="auto"
              bg="var(--site-surface)"
              color="var(--site-fg)"
              onKeyDown={(event) => {
                if (
                  images.length < 2 ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.metaKey
                )
                  return;
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  advance(event.key === "ArrowLeft" ? -1 : 1);
                }
              }}
            >
              <Dialog.Header>
                <Flex align="center" justify="space-between" gap={3} w="100%">
                  <Dialog.Title>{name} photos</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <Button
                      ref={closeButton}
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      Close
                    </Button>
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Header>
              <Dialog.Body>
                <Box
                  bg="var(--site-muted-surface)"
                  borderRadius="lg"
                  overflow="hidden"
                >
                  {active && (
                    <PropertyPhoto
                      key={active.image_url}
                      src={active.image_url}
                      alt={active.alt_text || `${name}, photo ${index + 1}`}
                      height="min(60dvh, 650px)"
                      fit="contain"
                    />
                  )}
                </Box>
                <Box
                  mt={3}
                  textAlign="center"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Text fontWeight="semibold">
                    Photo {index + 1} of {images.length}
                  </Text>
                  {active?.alt_text && <Text mt={1}>{active.alt_text}</Text>}
                </Box>
              </Dialog.Body>
              {images.length > 1 && (
                <Dialog.Footer
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={3}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => advance(-1)}
                    aria-label="Previous photo"
                  >
                    ← Previous
                  </Button>
                  <Text fontSize="sm" color="var(--site-muted)">
                    Use the buttons or left and right arrow keys.
                  </Text>
                  <Button
                    type="button"
                    onClick={() => advance(1)}
                    aria-label="Next photo"
                  >
                    Next →
                  </Button>
                </Dialog.Footer>
              )}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
