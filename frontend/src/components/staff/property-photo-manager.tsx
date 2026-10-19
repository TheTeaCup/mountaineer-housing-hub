import ImageUploadDropzone from "@/components/ui/image-upload-dropzone";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountFormRequest, accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

export interface StaffPropertyPhoto {
  id: number;
  url: string;
  alt_text: string | null;
}

const MAX_PROPERTY_PHOTOS = 10;

export default function PropertyPhotoManager({
  propertyId,
  photos,
  onChange,
}: {
  propertyId: number;
  photos: StaffPropertyPhoto[];
  onChange: (photos: StaffPropertyPhoto[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const remaining = MAX_PROPERTY_PHOTOS - photos.length;

  async function upload() {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((file) => form.append("photos", file, file.name));
      const result = await accountFormRequest<{
        photos: StaffPropertyPhoto[];
      }>(`/staff/properties/${propertyId}/photos`, form);
      onChange(result.photos);
      setFiles([]);
      notifySuccess("Property photos uploaded");
    } catch (error) {
      notifyError("Could not upload property photos", error);
    } finally {
      setUploading(false);
    }
  }

  async function remove(photoId: number) {
    setDeletingId(photoId);
    try {
      await accountRequest(
        `/staff/properties/${propertyId}/photos/${photoId}`,
        "DELETE",
      );
      onChange(photos.filter((photo) => photo.id !== photoId));
      setConfirmDeleteId(null);
      notifySuccess("Property photo removed");
    } catch (error) {
      notifyError("Could not remove property photo", error);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
    >
      <Heading as="h2" size="lg" mb={2}>
        Property photos
      </Heading>
      <Text color="var(--site-muted)" fontSize="sm" mb={4}>
        The first photo is the listing cover. Add up to ten photos; new images
        are resized and compressed in your browser before upload.
      </Text>

      {photos.length > 0 && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3} mb={5}>
          {photos.map((photo, index) => (
            <Box
              key={photo.id}
              borderWidth="1px"
              borderColor="var(--site-border)"
              borderRadius="lg"
              overflow="hidden"
            >
              <Image
                src={photo.url}
                alt={photo.alt_text || `Property photo ${index + 1}`}
                w="100%"
                h="150px"
                objectFit="cover"
              />
              <Box p={3}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {index === 0 ? "Cover photo" : `Photo ${index + 1}`}
                </Text>
                {confirmDeleteId === photo.id ? (
                  <Flex gap={2} align="center" flexWrap="wrap">
                    <Button
                      type="button"
                      size="sm"
                      colorPalette="red"
                      loading={deletingId === photo.id}
                      onClick={() => void remove(photo.id)}
                    >
                      Confirm removal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(photo.id)}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {remaining > 0 ? (
        <>
          <ImageUploadDropzone
            files={files}
            maxFiles={remaining}
            onChange={setFiles}
            onProcessingChange={setProcessing}
            ariaLabel="Add property photos"
          />
          {files.length > 0 && (
            <Button
              type="button"
              mt={4}
              bg="#ffc72c"
              color="#111111"
              loading={uploading}
              disabled={processing}
              onClick={() => void upload()}
            >
              Upload {files.length} {files.length === 1 ? "photo" : "photos"}
            </Button>
          )}
        </>
      ) : (
        <Text fontSize="sm">
          This property has reached the ten-photo limit.
        </Text>
      )}
    </Box>
  );
}
