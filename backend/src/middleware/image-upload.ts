import type { RequestHandler } from "express";
import multer from "multer";

export const MAX_IMAGE_BYTES = 1_600_000;

export function imageUpload(field: string, maxFiles: number): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: maxFiles, fileSize: MAX_IMAGE_BYTES, fields: 10 },
  }).array(field, maxFiles);
  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) {
        next();
        return;
      }
      res.status(400).json({
        message:
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
            ? "Each compressed image must be 1.6 MB or smaller."
            : `Choose no more than ${maxFiles} valid images.`,
      });
    });
  };
}

export function imageType(
  buffer: Buffer,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return "image/jpeg";
  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

export const imageExtension = (contentType: string) =>
  contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
