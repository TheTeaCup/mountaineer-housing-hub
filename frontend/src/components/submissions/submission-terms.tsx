import { accountRequest } from "@/utils/api/account";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

export function useSubmissionTerms(signedIn: boolean) {
  const [versions, setVersions] = useState<{
    terms_version: string;
    privacy_version: string;
  } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    setVersions(null);
    setAgreed(false);
    setError("");
    accountRequest<{ terms_version: string; privacy_version: string }>(
      "/account/submission-terms",
    )
      .then((data) => {
        if (active) setVersions(data);
      })
      .catch(() => {
        if (active)
          setError(
            "The submission agreement could not load. Please try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [signedIn, revision]);
  return {
    versions,
    agreed,
    setAgreed,
    error,
    ready: !!versions && agreed,
    retry: () => setRevision((value) => value + 1),
  };
}

export default function SubmissionTerms({
  terms,
  disabled,
}: {
  terms: ReturnType<typeof useSubmissionTerms>;
  disabled: boolean;
}) {
  return (
    <Stack
      gap={2}
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="lg"
      p={4}
    >
      {terms.versions && (
        <>
          <input
            type="hidden"
            name="terms_version"
            value={terms.versions.terms_version}
          />
          <input
            type="hidden"
            name="privacy_version"
            value={terms.versions.privacy_version}
          />
        </>
      )}
      <Box display="flex" gap={3} alignItems="flex-start">
        <input
          id="submission-terms-agreement"
          type="checkbox"
          name="terms_accepted"
          value="true"
          required
          checked={terms.agreed}
          disabled={disabled || !terms.versions}
          onChange={(event) => terms.setAgreed(event.target.checked)}
          style={{
            marginTop: "5px",
            width: "18px",
            height: "18px",
            flexShrink: 0,
            accentColor: "#ffc72c",
          }}
        />
        <label
          htmlFor="submission-terms-agreement"
          style={{ fontSize: "0.875rem" }}
        >
          I agree to the{" "}
          <NextLink
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            Terms of Use
          </NextLink>{" "}
          and acknowledge the{" "}
          <NextLink
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            Privacy Policy
          </NextLink>
          . These links open in a new tab.
        </label>
      </Box>
      <Text fontSize="xs" color="var(--site-muted)">
        Your agreement, the policy versions, and the date and time are saved
        with your account when you submit.
      </Text>
      {terms.error ? (
        <>
          <Text role="alert" fontSize="sm" color="fg.error">
            {terms.error}
          </Text>
          <Button
            type="button"
            size="sm"
            variant="outline"
            alignSelf="flex-start"
            onClick={terms.retry}
          >
            Try again
          </Button>
        </>
      ) : (
        !terms.versions && (
          <Text role="status" fontSize="sm">
            Loading submission agreement…
          </Text>
        )
      )}
    </Stack>
  );
}
