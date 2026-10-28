import { useAuth } from "@/components/ui/auth-provider";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import SignInRequired from "@/components/ui/sign-in-required";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountFormRequest, accountRequest } from "@/utils/api/account";
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
import ReviewPhotoPicker from "./review-photo-picker";
import StarRating from "./star-rating";

export default function ReviewForm() {
  const { session, loading } = useAuth();
  const [properties, setProperties] = useState<
    { slug: string; name: string; agency_name?: string | null }[]
  >([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [compressingPhotos, setCompressingPhotos] = useState(false);
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
  if (loading) return <FormPageSkeleton />;
  if (!session)
    return (
      <SignInRequired
        title="Sign in to share your experience"
        description="Use your App State account to submit an apartment review or suggest a missing property. Your identity is not displayed with published reviews."
      />
    );
  return (
    <>
      <Heading as="h1" mb={3}>
        Submit an Apartment Review
      </Heading>
      <Text mb={6}>
        Review the community or standalone rental where you lived. Buildings
        within University Highlands share one community listing and its reviews.
        For an agency with properties across town, choose the specific property
        where you lived. You can discuss management in your review. Staff check
        reviews before publication.
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
            photos.forEach((photo) => data.append("photos", photo, photo.name));
            await accountFormRequest("/account/reviews", data);
            notifySuccess(
              "Review submitted",
              "Staff will review it before publication. Track its status in My Account.",
            );
            form.reset();
            setRating(0);
            setPhotos([]);
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
            <StarRating value={rating} onChange={setRating} />
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
          <ReviewPhotoPicker
            photos={photos}
            onChange={setPhotos}
            onProcessingChange={setCompressingPhotos}
          />
          <Text fontSize="sm" color="var(--site-muted)">
            Staff review all text and photos before publication. Do not include
            private contact details or other sensitive information.
          </Text>
          <Button
            type="submit"
            loading={pending}
            disabled={
              propertiesLoading ||
              !properties.length ||
              compressingPhotos ||
              rating === 0
            }
            bg="#ffc72c"
            color="#111111"
            alignSelf="flex-start"
          >
            {compressingPhotos ? "Compressing photos…" : "Submit review"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
