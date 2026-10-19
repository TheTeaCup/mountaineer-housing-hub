import ImageUploadDropzone from "@/components/ui/image-upload-dropzone";
import { Box, Text } from "@chakra-ui/react";

export default function ReviewPhotoPicker({
  photos,
  onChange,
  onProcessingChange,
}: {
  photos: File[];
  onChange: (photos: File[]) => void;
  onProcessingChange: (processing: boolean) => void;
}) {
  return (
    <Box>
      <Text fontWeight="medium" mb={2}>
        Photos{" "}
        <Text as="span" color="var(--site-muted)">
          (optional)
        </Text>
      </Text>
      <Text fontSize="sm" color="var(--site-muted)" mb={3}>
        Add up to five photos. They are resized and compressed in your browser
        before upload. Avoid faces, license plates, mail, or other private
        details.
      </Text>
      <ImageUploadDropzone
        files={photos}
        maxFiles={5}
        onChange={onChange}
        onProcessingChange={onProcessingChange}
        ariaLabel="Add review photos"
      />
    </Box>
  );
}
