import {
  Box,
  Button,
  Field,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

interface ApartmentFormProps {
  onBack: () => void;
}

export default function ApartmentForm({ onBack }: ApartmentFormProps) {
  return (
    <Stack gap={6}>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="#111111" mb={1}>
          Submit an Apartment
        </Text>

        <Text color="gray.600">
          Don't see your apartment listed? Tell us about it and we'll review
          your submission.
        </Text>
      </Box>

      <Field.Root>
        <Field.Label>
          Apartment Name <Field.RequiredIndicator />
        </Field.Label>

        <Input placeholder="e.g. University Highlands" />
      </Field.Root>

      <Field.Root>
        <Field.Label>
          Address <Field.RequiredIndicator />
        </Field.Label>

        <Input placeholder="Street address" />
      </Field.Root>

      <Field.Root>
        <Field.Label>Website</Field.Label>

        <Input placeholder="https://example.com" />
      </Field.Root>

      <Field.Root>
        <Field.Label>Additional Information</Field.Label>

        <Textarea
          placeholder="Anything else we should know about this apartment?"
          rows={5}
        />
      </Field.Root>

      <Box display="flex" gap={3}>
        <Button variant="outline" onClick={onBack}>
          Back to Reviews
        </Button>

        <Button
          bg="#ffc72c"
          color="#111111"
          fontWeight="bold"
          _hover={{
            bg: "#d9a714",
          }}
        >
          Submit Apartment
        </Button>
      </Box>
    </Stack>
  );
}
