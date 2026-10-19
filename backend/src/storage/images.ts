import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "../config.js";

const client = new S3Client({
  region: "auto",
  endpoint: config.CLOUDFLARE_R2.CONNECTION_STRING,
  credentials: {
    accessKeyId: config.CLOUDFLARE_R2.ACCESS_KEY_ID,
    secretAccessKey: config.CLOUDFLARE_R2.SECRET_ACCESS_KEY,
  },
});

export async function uploadImage(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await client.send(
    new PutObjectCommand({
      Bucket: config.CLOUDFLARE_R2.BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function readImage(key: string) {
  return client.send(
    new GetObjectCommand({
      Bucket: config.CLOUDFLARE_R2.BUCKET_NAME,
      Key: key,
    }),
  );
}

export async function deleteImages(keys: string[]) {
  await Promise.allSettled(
    keys.map((key) =>
      client.send(
        new DeleteObjectCommand({
          Bucket: config.CLOUDFLARE_R2.BUCKET_NAME,
          Key: key,
        }),
      ),
    ),
  );
}
