const MAX_DIMENSION = 1600;
const MAX_OUTPUT_BYTES = 1_500_000;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not compress the image.")),
      "image/webp",
      quality,
    );
  });
}

export async function compressUploadImage(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type))
    throw new Error(`${file.name} is not a JPEG, PNG, or WebP image.`);
  if (file.size > 20_000_000)
    throw new Error(`${file.name} is larger than 20 MB.`);

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    let quality = 0.82;
    let blob: Blob | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image compression is unavailable.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await canvasBlob(canvas, quality);
      if (blob.size <= MAX_OUTPUT_BYTES) break;
      scale *= 0.8;
      quality = Math.max(0.55, quality - 0.08);
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES)
      throw new Error(`${file.name} could not be compressed below 1.5 MB.`);
    const basename = file.name.replace(/\.[^.]+$/, "") || "uploaded-image";
    return new File([blob], `${basename}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
