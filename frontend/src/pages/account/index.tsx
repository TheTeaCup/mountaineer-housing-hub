import FavoriteButton from "@/components/properties/favorite-button";
import ReviewPhotoGrid from "@/components/properties/review-photo-grid";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import { ColorModeButton } from "@/components/ui/color-mode";
import ProfileCustomization from "@/components/ui/profile-customization";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest, type MyReview } from "@/utils/api/account";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function ReviewEditor({
  review,
  refresh,
}: {
  review: MyReview;
  refresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(review.body);
  const [rating, setRating] = useState(review.rating);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState(false);
  async function mutate(method: string) {
    setPending(true);
    try {
      await accountRequest(
        `/account/reviews/${review.id}`,
        method,
        method === "PATCH" ? { rating, body } : undefined,
      );
      notifySuccess(
        method === "DELETE" ? "Review deleted" : "Review updated",
        method === "PATCH"
          ? "Your edits have been sent to staff for approval."
          : undefined,
      );
      await refresh();
      setEditing(false);
    } catch (err) {
      notifyError("Could not update review", err);
    } finally {
      setPending(false);
    }
  }
  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      p={5}
      borderRadius="lg"
    >
      <NextLink href={`/properties/${review.slug}`}>
        <Heading as="h3" size="md">
          {review.name}
        </Heading>
      </NextLink>
      <Text color="var(--site-muted)" my={2}>
        {review.rating}/5 · {review.status}
      </Text>
      {editing ? (
        <Stack gap={3}>
          <NativeSelect.Root>
            <NativeSelect.Field
              aria-label="Review rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}/5
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="var(--site-muted)" />
          </NativeSelect.Root>
          <Textarea
            aria-label="Review text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={10000}
          />
          <Text fontSize="sm">
            Saving edits sends this review back to staff for approval.
          </Text>
          <Button loading={pending} onClick={() => mutate("PATCH")}>
            Save changes
          </Button>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <>
          <Text whiteSpace="pre-wrap">{review.body}</Text>
          <ReviewPhotoGrid photos={review.photos} />
          <Flex gap={3} mt={3}>
            <Button
              variant="outline"
              onClick={() => {
                setBody(review.body);
                setRating(review.rating);
                setEditing(true);
              }}
            >
              Edit
            </Button>
            <Button variant="outline" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </Flex>
        </>
      )}
      {deleting && (
        <Box mt={3}>
          <Text>Delete this review permanently?</Text>
          <Button
            loading={pending}
            colorPalette="red"
            onClick={() => mutate("DELETE")}
          >
            Confirm deletion
          </Button>
          <Button variant="ghost" onClick={() => setDeleting(false)}>
            Keep review
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { session, loading, logout } = useAuth();
  const { favorites, error: accountError } = useAccount();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const refreshReviews = async () =>
    setReviews(await accountRequest<MyReview[]>("/account/reviews"));
  useEffect(() => {
    if (!session) return;
    let active = true;
    accountRequest<MyReview[]>("/account/reviews")
      .then((data) => {
        if (active) setReviews(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);
  const panel = {
    bg: "var(--site-surface)",
    p: 6,
    borderRadius: "xl",
    borderWidth: "1px",
    borderColor: "var(--site-border)",
  };
  return (
    <>
      <SEO title="My Account" noIndex />
      <Box bg="var(--site-bg)" color="var(--site-fg)" flex="1">
        <Container maxW="950px" py={10}>
          <Heading as="h1" mb={6}>
            My Account
          </Heading>
          {loading ? (
            <Text role="status">Loading your account…</Text>
          ) : !session ? (
            <Text>
              <NextLink href="/auth/login">Sign in</NextLink> to view your saved
              apartments and reviews.
            </Text>
          ) : (
            <Stack gap={7}>
              <Text>
                Your favorites and account details are private. Published
                reviews display your public username.
              </Text>
              {(error || accountError) && (
                <Text role="alert" color="fg.error">
                  {error || accountError}
                </Text>
              )}

              <Box {...panel}>
                <Heading as="h2" size="lg" mb={4}>
                  Saved apartments
                </Heading>
                {favorites.length ? (
                  <Stack gap={4}>
                    {favorites.map((favorite) => (
                      <Box key={favorite.slug}>
                        <NextLink href={`/properties/${favorite.slug}`}>
                          {favorite.name}
                        </NextLink>
                        {favorite.status !== "published" && (
                          <Text>Currently unavailable</Text>
                        )}
                        <FavoriteButton slug={favorite.slug} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Text>
                    No saved apartments yet.{" "}
                    <NextLink href="/properties">Browse apartments</NextLink> to
                    save your favorites.
                  </Text>
                )}
              </Box>
              <Box {...panel}>
                <Heading as="h2" size="lg" mb={4}>
                  My reviews
                </Heading>
                {reviewsLoading ? (
                  <Text>Loading reviews…</Text>
                ) : reviews.length ? (
                  <Stack gap={4}>
                    {reviews.map((review) => (
                      <ReviewEditor
                        key={review.id}
                        review={review}
                        refresh={refreshReviews}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Text>
                    No reviews yet.{" "}
                    <NextLink href="/submit">Share your experience</NextLink>.
                  </Text>
                )}
              </Box>
              <Box {...panel}>
                <Heading as="h2" size="lg" mb={4}>
                  Account settings
                </Heading>
                <Text mb={4}>Private email: {session.user.email}</Text>
                <ProfileCustomization />
                <Flex align="center" gap={3} mt={5}>
                  <Text>Appearance</Text>
                  <ColorModeButton />
                </Flex>
                <Box mt={7}>
                  <Heading as="h3" size="md">
                    Delete account
                  </Heading>
                  <Text my={3}>
                    Permanently deletes your account, favorites, and reviews.
                    Apartment suggestions may remain without your account
                    association. Type DELETE to confirm.
                  </Text>
                  <Input
                    aria-label="Account deletion confirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                  <Button
                    mt={3}
                    colorPalette="red"
                    disabled={confirmation !== "DELETE"}
                    loading={pending}
                    onClick={async () => {
                      setPending(true);
                      setError("");
                      try {
                        await accountRequest("/account", "DELETE", {
                          confirmation,
                        });
                        try {
                          await logout();
                        } catch {
                          router.reload();
                        }
                      } catch (err) {
                        notifyError("Could not delete account", err);
                      } finally {
                        setPending(false);
                      }
                    }}
                  >
                    Delete my account
                  </Button>
                </Box>
              </Box>
            </Stack>
          )}
        </Container>
      </Box>
    </>
  );
}
