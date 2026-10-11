import UserAvatar from "@/components/ui/user-avatar";
import { accountRequest, type AccountProfile } from "@/utils/api/account";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function PropertyReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<
    {
      id: number;
      username: string;
      rating: number;
      body: string;
      avatar_seed: string;
      avatar_variant: AccountProfile["avatar_variant"];
      avatar_palette: AccountProfile["avatar_palette"];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    accountRequest<typeof reviews>(
      `/properties/${encodeURIComponent(slug)}/reviews`,
    )
      .then((data) => {
        if (active) setReviews(data);
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
        <Text>No published reviews yet.</Text>
      ) : (
        <Stack gap={4}>
          {reviews.map((review) => (
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
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
