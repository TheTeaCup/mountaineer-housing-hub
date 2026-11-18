import { useAccount } from "@/components/ui/account-provider";
import PaginationControls from "@/components/ui/pagination-controls";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import UserAvatar from "@/components/ui/user-avatar";
import { accountRequest, type AccountProfile } from "@/utils/api/account";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import ReviewPhotoGrid, { type ReviewPhoto } from "./review-photo-grid";

const PAGE_SIZE = 5;

export default function PropertyReviews({
  slug,
  onChange,
}: {
  slug: string;
  onChange?: () => void;
}) {
  const { profile } = useAccount();
  const [reviews, setReviews] = useState<
    {
      id: number;
      username: string;
      rating: number;
      body: string;
      avatar_seed: string;
      avatar_variant: AccountProfile["avatar_variant"];
      avatar_palette: AccountProfile["avatar_palette"];
      photos: ReviewPhoto[];
    }[]
  >([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    accountRequest<typeof reviews>(
      `/properties/${encodeURIComponent(slug)}/reviews`,
    )
      .then((data) => {
        if (active) {
          setReviews(data);
          setPage(1);
        }
      })
      .catch(() => {
        if (active) setError("Reviews are temporarily unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(reviews.length / PAGE_SIZE)),
  );
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  return (
    <Box mt={8}>
      <Heading as="h2" size="lg" mb={4}>
        Student reviews
      </Heading>
      {loading ? (
        <Text>Loading reviews…</Text>
      ) : error ? (
        <Text role="status">{error}</Text>
      ) : !reviews.length ? (
        <Box>
          <Text mb={3}>No published reviews yet.</Text>
          {profile?.role === "property_manager" ? (
            <Text fontSize="sm" color="var(--site-muted)">
              Property Manager accounts cannot submit resident reviews.
            </Text>
          ) : (
            <NextLink href={`/submit?property=${encodeURIComponent(slug)}`}>
              <Button bg="#ffc72c" color="#111111">
                Submit yours today
              </Button>
            </NextLink>
          )}
        </Box>
      ) : (
        <Stack gap={4}>
          {paginatedReviews.map((review) => (
            <Box
              key={review.id}
              p={5}
              bg="var(--site-surface)"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="var(--site-border)"
            >
              <Flex gap={3} align="center">
                <UserAvatar
                  seed={review.avatar_seed}
                  variant={review.avatar_variant}
                  palette={review.avatar_palette}
                />
                <Text fontWeight="bold">
                  {review.username} · {review.rating}/5
                </Text>
              </Flex>
              <Text mt={2} whiteSpace="pre-wrap">
                {review.body}
              </Text>
              <ReviewPhotoGrid photos={review.photos} />
              {profile?.role === "staff" && (
                <Button
                  mt={4}
                  minH="44px"
                  variant="outline"
                  colorPalette="red"
                  disabled={deleting !== null}
                  loading={deleting === review.id}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Permanently delete this review and its photos? This cannot be undone.",
                      )
                    )
                      return;
                    setDeleting(review.id);
                    try {
                      await accountRequest(
                        `/staff/reviews/${review.id}`,
                        "DELETE",
                      );
                      setReviews((current) =>
                        current.filter((item) => item.id !== review.id),
                      );
                      notifySuccess("Review deleted");
                      onChange?.();
                    } catch (error) {
                      notifyError("Could not delete review", error);
                    } finally {
                      setDeleting(null);
                    }
                  }}
                >
                  <FiTrash2 aria-hidden="true" /> Delete review
                </Button>
              )}
            </Box>
          ))}
          <PaginationControls
            page={currentPage}
            total={reviews.length}
            pageSize={PAGE_SIZE}
            label="Student reviews"
            onPageChange={setPage}
          />
        </Stack>
      )}
    </Box>
  );
}
