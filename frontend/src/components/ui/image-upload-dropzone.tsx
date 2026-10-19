import { compressUploadImage } from "@/utils/images/compress-upload-image";
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import {
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { FiImage, FiTrash2, FiUploadCloud } from "react-icons/fi";

function ImagePreview({ file, alt }: { file: File; alt: string }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <Image src={url} alt={alt} w="100%" h="120px" objectFit="cover" />;
}

export default function ImageUploadDropzone({
  files,
  maxFiles,
  onChange,
  onProcessingChange,
  ariaLabel = "Add photos",
}: {
  files: File[];
  maxFiles: number;
  onChange: (files: File[]) => void;
  onProcessingChange: (processing: boolean) => void;
  ariaLabel?: string;
}) {
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const helpId = useId();
  const disabled = files.length >= maxFiles || processing;

  const addFiles = useCallback(
    async (selected: File[]) => {
      if (!selected.length || disabled) return;
      const remaining = maxFiles - files.length;
      if (selected.length > remaining) {
        setError(
          remaining === 1
            ? "You can add one more image."
            : `You can add ${remaining} more images.`,
        );
        return;
      }
      setError("");
      setProcessing(true);
      onProcessingChange(true);
      try {
        const compressed: File[] = [];
        for (const file of selected)
          compressed.push(await compressUploadImage(file));
        onChange([...files, ...compressed]);
      } catch (compressionError) {
        setError((compressionError as Error).message);
      } finally {
        setProcessing(false);
        onProcessingChange(false);
      }
    },
    [disabled, files, maxFiles, onChange, onProcessingChange],
  );

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <Box>
      <Input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        aria-label={ariaLabel}
        display="none"
        onChange={(event) => {
          const selected = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          void addFiles(selected);
        }}
      />
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={helpId}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={dragging ? "#ffc72c" : "var(--site-border)"}
        borderRadius="xl"
        bg={dragging ? "rgba(255, 199, 44, 0.12)" : "var(--site-surface)"}
        px={5}
        py={{ base: 7, md: 9 }}
        textAlign="center"
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={files.length >= maxFiles ? 0.65 : 1}
        transition="background-color 150ms ease, border-color 150ms ease, transform 150ms ease"
        transform={dragging ? "scale(1.01)" : undefined}
        _hover={
          disabled
            ? undefined
            : { borderColor: "#ffc72c", bg: "rgba(255, 199, 44, 0.07)" }
        }
        _focusVisible={{ outline: "3px solid #ffc72c", outlineOffset: "3px" }}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          dragDepth.current += 1;
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          void addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <Flex
          mx="auto"
          mb={3}
          w="52px"
          h="52px"
          align="center"
          justify="center"
          borderRadius="full"
          bg="rgba(255, 199, 44, 0.16)"
          color="var(--site-heading)"
          css={{ "& > svg": { width: "25px", height: "25px" } }}
        >
          <FiUploadCloud aria-hidden="true" />
        </Flex>
        <Text fontWeight="semibold" color="var(--site-heading)">
          {processing
            ? "Compressing your images…"
            : dragging
              ? "Drop images here"
              : files.length >= maxFiles
                ? "Image limit reached"
                : "Drag images here or choose files"}
        </Text>
        <Text id={helpId} mt={1} fontSize="sm" color="var(--site-muted)">
          {files.length} of {maxFiles} selected · JPEG, PNG, or WebP · 20 MB
          maximum each
        </Text>
      </Box>
      {error && (
        <Text role="alert" color="fg.error" mt={2}>
          {error}
        </Text>
      )}
      {files.length > 0 && (
        <SimpleGrid columns={{ base: 2, sm: 3 }} gap={3} mt={4}>
          {files.map((file, index) => (
            <Box
              key={`${file.name}-${file.lastModified}-${index}`}
              borderWidth="1px"
              borderColor="var(--site-border)"
              borderRadius="lg"
              overflow="hidden"
              bg="var(--site-surface)"
            >
              <ImagePreview file={file} alt={`Selected image ${index + 1}`} />
              <Flex p={2} align="center" justify="space-between" gap={2}>
                <Flex align="center" gap={1} minW={0}>
                  <FiImage aria-hidden="true" />
                  <Text fontSize="xs" truncate>
                    {file.name} · {(file.size / 1024).toFixed(0)} KB
                  </Text>
                </Flex>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={processing}
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() =>
                    onChange(
                      files.filter((_, fileIndex) => fileIndex !== index),
                    )
                  }
                >
                  <FiTrash2 />
                </Button>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
