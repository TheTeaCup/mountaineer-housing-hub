import { useAuth } from "@/components/ui/auth-provider";
import PaginationControls from "@/components/ui/pagination-controls";
import { accountRequest } from "@/utils/api/account";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

interface SubmissionResult {
  submissions: {
    id: number;
    name: string;
    address: string | null;
    submission_kind: "property" | "agency";
    status: "pending" | "approved" | "rejected";
    created_at: string;
  }[];
  total: number;
}
export default function SubmissionHistory({
  preview = false,
}: {
  preview?: boolean;
}) {
  const { session, loading } = useAuth();
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const limit = preview ? 5 : 10;
  useEffect(() => {
    if (!session) return;
    let active = true;
    setBusy(true);
    setError("");
    accountRequest<SubmissionResult>(
      `/account/submissions?page=${page}&limit=${limit}`,
    )
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [session, page, limit, revision]);
  return (
    <Box
      bg="var(--site-surface)"
      p={6}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="var(--site-border)"
    >
      <Flex
        justify="space-between"
        align="center"
        gap={3}
        mb={3}
        flexWrap="wrap"
      >
        <Heading as={preview ? "h2" : "h1"} size={preview ? "lg" : "xl"}>
          My listing submissions
        </Heading>
        {session && (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={() => setRevision((value) => value + 1)}
          >
            Refresh status
          </Button>
        )}
      </Flex>
      <Text color="var(--site-muted)" mb={4}>
        Property and rental agency suggestions you submitted. These are separate
        from your apartment reviews.{" "}
        {preview
          ? "Showing your latest five."
          : "Newest submissions appear first."}
      </Text>
      {loading ? (
        <Text>Checking access…</Text>
      ) : !session ? (
        <Text>
          <NextLink href="/auth/login">Sign in</NextLink> to see your
          submissions.
        </Text>
      ) : error ? (
        <Text role="alert" color="fg.error">
          {error} Use Refresh status to try again.
        </Text>
      ) : busy ? (
        <Text role="status">Loading submissions…</Text>
      ) : !result?.submissions.length ? (
        <Text>
          No listing submissions yet.{" "}
          <NextLink href="/submit/apartment">
            Suggest a property or agency
          </NextLink>
          .
        </Text>
      ) : (
        <Stack gap={4}>
          {result.submissions.map((submission) => (
            <Box
              key={submission.id}
              borderWidth="1px"
              borderColor="var(--site-border)"
              borderRadius="lg"
              p={4}
            >
              <Flex
                justify="space-between"
                gap={3}
                align="start"
                flexWrap="wrap"
              >
                <Heading as={preview ? "h3" : "h2"} size="md">
                  {submission.name}
                </Heading>
                <Badge
                  colorPalette={
                    submission.status === "approved"
                      ? "green"
                      : submission.status === "rejected"
                        ? "red"
                        : "yellow"
                  }
                >
                  {submission.status === "pending"
                    ? "Pending review"
                    : submission.status === "approved"
                      ? "Approved"
                      : "Rejected"}
                </Badge>
              </Flex>
              <Text mt={2} fontSize="sm" color="var(--site-muted)">
                {submission.submission_kind === "agency"
                  ? "Rental agency"
                  : "Property"}{" "}
                · Submitted{" "}
                {new Date(submission.created_at).toLocaleDateString()}
              </Text>
              {submission.address && <Text mt={1}>{submission.address}</Text>}
            </Box>
          ))}
          {!preview && (
            <PaginationControls
              page={page}
              total={result.total}
              pageSize={limit}
              label="My listing submissions"
              onPageChange={setPage}
            />
          )}
        </Stack>
      )}
      {preview && session && (
        <Box mt={4}>
          <NextLink href="/account/submissions">
            <Button variant="outline">
              View all submissions{result ? ` (${result.total})` : ""} →
            </Button>
          </NextLink>
        </Box>
      )}
    </Box>
  );
}
