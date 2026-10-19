import { Router } from "express";
import { readImage } from "../storage/images.js";
import type { AccountDependencies, CatalogDatabase } from "./account.js";

interface PropertyPhotoRow {
  id: number;
  property_id: number;
  image_url: string;
  alt_text: string | null;
}

export interface PropertyPhoto {
  id: number;
  url: string;
  alt_text: string | null;
}

export function propertyPhotoUrl(
  photo: Pick<PropertyPhotoRow, "id" | "image_url">,
  backendOrigin: string,
) {
  return photo.image_url.startsWith("property-photos/")
    ? new URL(`/property-photos/${photo.id}`, backendOrigin).href
    : photo.image_url;
}

export async function propertyPhotos(
  database: Pick<CatalogDatabase, "query">,
  propertyId: number,
  backendOrigin: string,
): Promise<PropertyPhoto[]> {
  const photos = await database.query<PropertyPhotoRow>(
    "SELECT id, property_id, image_url, alt_text FROM property_photos WHERE property_id = ? ORDER BY sort_order, id",
    [propertyId],
  );
  return photos.map((photo) => ({
    id: photo.id,
    url: propertyPhotoUrl(photo, backendOrigin),
    alt_text: photo.alt_text,
  }));
}

export function createPropertyPhotoRouter(deps: AccountDependencies) {
  const router = Router();
  router.get("/:id", async (req, res) => {
    const photoId = Number(req.params.id);
    if (!Number.isInteger(photoId) || photoId < 1) {
      res.status(404).end();
      return;
    }
    const rows = await deps.query<{
      image_url: string;
      status: string;
    }>(
      "SELECT pp.image_url, p.status FROM property_photos pp JOIN properties p ON p.id = pp.property_id WHERE pp.id = ?",
      [photoId],
    );
    const photo = rows[0];
    if (!photo?.image_url.startsWith("property-photos/")) {
      res.status(404).end();
      return;
    }

    if (photo.status !== "published") {
      const userId = await deps.getUser(req.headers);
      if (!userId) {
        res.status(404).end();
        return;
      }
      const users = await deps.query<{ role: string }>(
        "SELECT role FROM users WHERE id = ?",
        [userId],
      );
      if (users[0]?.role !== "staff") {
        res.status(404).end();
        return;
      }
    }

    try {
      const object = await readImage(photo.image_url);
      if (!object.Body) {
        res.status(404).end();
        return;
      }
      const bytes = await object.Body.transformToByteArray();
      res.setHeader("Content-Type", object.ContentType || "image/webp");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Cache-Control",
        photo.status === "published"
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
      );
      res.send(Buffer.from(bytes));
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") {
        res.status(404).end();
        return;
      }
      throw error;
    }
  });
  return router;
}
