import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";

interface ReviewFormProps {
  onSubmitApartment: () => void;
}

export default function ReviewForm({ onSubmitApartment }: ReviewFormProps) {
  const [photos, setPhotos] = useState<File[]>([]);

  const MAX_PHOTOS = 10;

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files);

    setPhotos((current) => [...current, ...selectedFiles].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index: number) => {
    setPhotos((current) =>
      current.filter((_, photoIndex) => photoIndex !== index),
    );
  };

  return (
    <>
      <Heading color="#111111" mb={2}>
        Submit an Apartment Review
      </Heading>

      <Text color="gray.600" mb={8}>
        Share your experience to help other students find the right place to
        live in Boone.
      </Text>

      <Stack gap={6}>
        {/* Apartment */}
        <Field.Root>
          <Field.Label>
            Apartment <Field.RequiredIndicator />
          </Field.Label>

          <NativeSelect.Root>
            <NativeSelect.Field placeholder="Select your apartment">
              <option value="university-highlands">University Highlands</option>

              <option value="the-standard-at-boone">
                The Standard at Boone
              </option>

              <option value="cp-west-apartments">CP West Apartments</option>
            </NativeSelect.Field>

            <NativeSelect.Indicator />
          </NativeSelect.Root>

          <Text fontSize="sm" color="gray.600" mt={2}>
            Don't see your apartment?{" "}
            <Button
              variant="plain"
              size="sm"
              color="#111111"
              fontWeight="600"
              textDecoration="underline"
              textUnderlineOffset="2px"
              p={0}
              h="auto"
              onClick={onSubmitApartment}
            >
              Submit it here.
            </Button>
          </Text>
        </Field.Root>

        {/* Rating */}
        <Field.Root>
          <Field.Label>
            Overall Rating <Field.RequiredIndicator />
          </Field.Label>

          <NativeSelect.Root>
            <NativeSelect.Field placeholder="Select a rating">
              <option value="5">★★★★★ — 5/5</option>
              <option value="4">★★★★☆ — 4/5</option>
              <option value="3">★★★☆☆ — 3/5</option>
              <option value="2">★★☆☆☆ — 2/5</option>
              <option value="1">★☆☆☆☆ — 1/5</option>
            </NativeSelect.Field>

            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        {/* Review */}
        <Field.Root>
          <Field.Label>
            Your Review <Field.RequiredIndicator />
          </Field.Label>

          <Textarea
            placeholder="Tell us about your experience living here..."
            rows={7}
          />

          <Field.HelperText>
            Share details about the apartment, management, maintenance,
            amenities, noise, location, or anything else you think other
            students should know.
          </Field.HelperText>
        </Field.Root>

        {/* Pros */}
        <Field.Root>
          <Field.Label>What did you like?</Field.Label>

          <Input placeholder="e.g. Great location, quiet, friendly management..." />
        </Field.Root>

        {/* Cons */}
        <Field.Root>
          <Field.Label>What could be improved?</Field.Label>

          <Input placeholder="e.g. Parking, noise, maintenance response time..." />
        </Field.Root>

        {/* Photos */}
        <Field.Root>
          <Field.Label>Photos</Field.Label>

          <Text fontSize="sm" color="gray.600" mb={2}>
            Add photos to help other students see what the apartment is really
            like.
          </Text>

          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="md"
            p={8}
            textAlign="center"
            cursor="pointer"
            _hover={{
              borderColor: "#ffc72c",
              bg: "gray.50",
            }}
            onClick={() => document.getElementById("review-photos")?.click()}
          >
            <Text fontWeight="600" color="#111111">
              Click to upload photos
            </Text>

            <Text fontSize="sm" color="gray.500" mt={1}>
              JPG, PNG, or HEIC
            </Text>

            <Input
              id="review-photos"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              multiple
              display="none"
              onChange={handlePhotoUpload}
            />
          </Box>

          {/* Selected photos */}
          {photos.length > 0 && (
            <Stack gap={2} mt={3}>
              {photos.map((photo, index) => (
                <HStack
                  key={`${photo.name}-${index}`}
                  justify="space-between"
                  bg="gray.100"
                  p={3}
                  borderRadius="md"
                >
                  <Text fontSize="sm" truncate>
                    {photo.name}
                  </Text>

                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => removePhoto(index)}
                  >
                    Remove
                  </Button>
                </HStack>
              ))}
            </Stack>
          )}
        </Field.Root>

        {/* Recommendation */}
        <Field.Root>
          <Field.Label>Would you recommend this apartment?</Field.Label>

          <NativeSelect.Root>
            <NativeSelect.Field placeholder="Select an option">
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </NativeSelect.Field>

            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        {/* Submit */}
        <Button
          bg="#ffc72c"
          color="#111111"
          fontWeight="bold"
          _hover={{
            bg: "#d9a714",
          }}
          alignSelf="flex-start"
        >
          Submit Review
        </Button>
      </Stack>
    </>
  );
}
