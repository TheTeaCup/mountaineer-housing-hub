import { Router } from "express";
import { readImage } from "../storage/images.js";
import type { AccountDependencies, CatalogDatabase } from "./account.js";

interface ReviewPhotoRow {
  id: number;
  review_id: number;
}

export interface ReviewPhoto {
  id: number;
  url: string;
}

export async function attachReviewPhotos<T extends { id: number }>(
  database: Pick<CatalogDatabase, "query">,
  reviews: T[],
  backendOrigin: string,
): Promise<(T & { photos: ReviewPhoto[] })[]> {
  if (!reviews.length) return [];
  const placeholders = reviews.map(() => "?").join(",");
  const photos = await database.query<ReviewPhotoRow>(
    `SELECT id, review_id FROM review_photos WHERE review_id IN (${placeholders}) ORDER BY sort_order, id`,
    reviews.map((review) => review.id),
  );
  return reviews.map((review) => ({
    ...review,
    photos: photos
      .filter((photo) => photo.review_id === review.id)
      .map((photo) => ({
        id: photo.id,
        url: new URL(`/review-photos/${photo.id}`, backendOrigin).href,
      })),
  }));
}

export function createReviewPhotoRouter(deps: AccountDependencies) {
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
      user_id: string;
    }>(
      "SELECT rp.image_url, r.status, r.user_id FROM review_photos rp JOIN reviews r ON r.id = rp.review_id WHERE rp.id = ?",
      [photoId],
    );
    const photo = rows[0];
    if (!photo) {
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
      if (
        String(photo.user_id) !== String(userId) &&
        users[0]?.role !== "staff"
      ) {
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
