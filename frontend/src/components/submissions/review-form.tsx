import { useAuth } from "@/components/ui/auth-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

export default function ReviewForm() {
  const { session, loading } = useAuth();
  const [properties, setProperties] = useState<
    { slug: string; name: string; agency_name?: string | null }[]
  >([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) return;
    let active = true;
    accountRequest<
      { slug: string; name: string; agency_name?: string | null }[]
    >("/account/properties")
      .then((data) => {
        if (active) setProperties(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setPropertiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);
  if (loading) return <Text>Loading…</Text>;
  if (!session)
    return (
      <Text>
        <NextLink href="/auth/login">
          Sign in with your App State account
        </NextLink>{" "}
        to submit a review or suggest an apartment.
      </Text>
    );
  return (
    <>
      <Heading as="h1" mb={3}>
        Submit an Apartment Review
      </Heading>
      <Text mb={6}>
        Review the building or community where you lived. You can discuss its
        management in the review, but choose the property rather than a rental
        company. Reviews are checked by staff before publication.
      </Text>
      {error && (
        <Text role="alert" color="fg.error" mb={3}>
          {error}
        </Text>
      )}
      <Box
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as unknown as HTMLFormElement;
          const data = new FormData(form);
          setPending(true);
          setError("");
          try {
            await accountRequest("/account/reviews", "POST", {
              slug: data.get("slug"),
              rating: Number(data.get("rating")),
              body: data.get("body"),
              pros: data.get("pros"),
              cons: data.get("cons"),
              recommendation: data.get("recommendation") || null,
            });
            notifySuccess(
              "Review submitted",
              "Staff will review it before publication. Track its status in My Account.",
            );
            form.reset();
          } catch (err) {
            notifyError("Could not submit review", err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Stack gap={5}>
          <Field.Root required>
            <Field.Label>
              Apartment <Field.RequiredIndicator />
            </Field.Label>
            <NativeSelect.Root disabled={propertiesLoading}>
              <NativeSelect.Field name="slug" placeholder="Select an apartment">
                {properties.map((property) => (
                  <option key={property.slug} value={property.slug}>
                    {property.name}
                    {property.agency_name
                      ? ` — managed by ${property.agency_name}`
                      : ""}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="var(--site-muted)" />
            </NativeSelect.Root>
            {propertiesLoading ? (
              <Text>Loading apartments…</Text>
            ) : (
              !properties.length && (
                <Text>No apartments are available for reviews yet.</Text>
              )
            )}
          </Field.Root>
          <NextLink href="/submit/apartment">
            <Button variant="outline">
              Apartment missing? Suggest a property or agency
            </Button>
          </NextLink>
          <Field.Root required>
            <Field.Label>
              Overall rating <Field.RequiredIndicator />
            </Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field name="rating" placeholder="Select a rating">
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}/5
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="var(--site-muted)" />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              Your review <Field.RequiredIndicator />
            </Field.Label>
            <Textarea
              name="body"
              required
              maxLength={10000}
              rows={7}
              placeholder="Tell us about your experience living here…"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>What did you like?</Field.Label>
            <Input name="pros" maxLength={2000} />
          </Field.Root>
          <Field.Root>
            <Field.Label>What could be improved?</Field.Label>
            <Input name="cons" maxLength={2000} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Would you recommend this apartment?</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="recommendation"
                placeholder="Select an option"
              >
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator color="var(--site-muted)" />
            </NativeSelect.Root>
          </Field.Root>
          <Text fontSize="sm" color="var(--site-muted)">
            Photo uploads are not available yet. Submit text only for now. Do
            not include private contact details or other sensitive information.
          </Text>
          <Button
            type="submit"
            loading={pending}
            disabled={propertiesLoading || !properties.length}
            bg="#ffc72c"
            color="#111111"
            alignSelf="flex-start"
          >
            Submit review
          </Button>
        </Stack>
      </Box>
    </>
  );
}
