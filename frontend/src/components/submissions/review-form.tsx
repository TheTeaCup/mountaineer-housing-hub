import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import FormSelect from "@/components/ui/form-select";
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
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReviewPhotoPicker from "./review-photo-picker";
import StarRating from "./star-rating";
import SubmissionTerms, { useSubmissionTerms } from "./submission-terms";

export default function ReviewForm() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { profile } = useAccount();
  const terms = useSubmissionTerms(!!session);
  const [properties, setProperties] = useState<
    {
      slug: string;
      name: string;
      agency_id: number | null;
      agency_name?: string | null;
    }[]
  >([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(0);
  const [propertySlug, setPropertySlug] = useState("");
  const [agencyId, setAgencyId] = useState("all");
  const [recommendation, setRecommendation] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [compressingPhotos, setCompressingPhotos] = useState(false);
  const [error, setError] = useState("");
  const requestedProperty =
    typeof router.query.property === "string" ? router.query.property : "";
  useEffect(() => {
    setPropertySlug(requestedProperty);
  }, [requestedProperty]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    accountRequest<
      {
        slug: string;
        name: string;
        agency_id: number | null;
        agency_name?: string | null;
      }[]
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
  useEffect(() => {
    if (!requestedProperty || !properties.length) return;
    const property = properties.find((item) => item.slug === requestedProperty);
    if (property)
      setAgencyId(
        property.agency_id === null ? "none" : String(property.agency_id),
      );
  }, [requestedProperty, properties]);
  const visibleProperties = properties.filter(
    (property) =>
      agencyId === "all" ||
      (agencyId === "none"
        ? property.agency_id === null
        : String(property.agency_id) === agencyId),
  );
  const agencyOptions = Array.from(
    new Map(
      properties
        .filter((property) => property.agency_id !== null)
        .map((property) => [
          String(property.agency_id),
          property.agency_name || "Unnamed agency",
        ]),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));
  if (loading || (session && !profile)) return <FormPageSkeleton />;
  if (!session)
    return (
      <SignInRequired
        title="Sign in to share your experience"
        description="Use your App State account to submit an apartment review or suggest a missing property. Your identity is not displayed with published reviews."
      />
    );
  if (profile?.role === "property_manager")
    return (
      <Box>
        <Heading as="h1" mb={3}>
          Apartment reviews are for residents
        </Heading>
        <Text mb={5}>
          Property Manager accounts cannot submit apartment reviews. Use a
          personal User account to share a resident experience.
        </Text>
        <Box
          borderWidth="1px"
          borderColor="var(--site-border)"
          borderRadius="lg"
          p={5}
        >
          <Heading as="h2" size="md" mb={2}>
            Manage a property that is missing?
          </Heading>
          <Text mb={4}>
            Submit its details for staff verification. Once approved, staff can
            connect the property to your manager account.
          </Text>
          <NextLink href="/submit/apartment">
            <Button bg="#ffc72c" color="#111111">
              Submit a managed property
            </Button>
          </NextLink>
        </Box>
      </Box>
    );
  return (
    <>
      <Heading
        as="h1"
        size={{ base: "2xl", md: "3xl" }}
        color="var(--site-heading)"
        mb={3}
      >
        Submit an Apartment Review
      </Heading>
      <Text mb={6} color="var(--site-muted)" lineHeight="tall">
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
        p={{ base: 5, md: 8 }}
        bg="var(--site-surface)"
        borderWidth="1px"
        borderColor="var(--site-border)"
        borderRadius="2xl"
        css={{
          "& input:not([type='hidden']):not([type='checkbox']), & textarea": {
            background: "var(--site-control)",
            color: "var(--site-fg)",
            border: "1px solid var(--site-border)",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            minHeight: "48px",
            width: "100%",
          },
          "& textarea": { resize: "vertical" },
          "& input::placeholder, & textarea::placeholder": {
            color: "var(--site-muted)",
          },
          "& input:focus-visible, & textarea:focus-visible": {
            outline: "2px solid var(--site-accent-fg)",
            outlineOffset: "2px",
          },
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!terms.ready) return;
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
            terms.setAgreed(false);
            setRating(0);
            setPropertySlug(requestedProperty);
            setAgencyId("all");
            setRecommendation("");
            setPhotos([]);
          } catch (err) {
            notifyError("Could not submit review", err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Stack gap={6}>
          <FormSelect
            label="Rental agency"
            value={agencyId}
            disabled={propertiesLoading || pending}
            onValueChange={(value) => {
              setAgencyId(value);
              setPropertySlug("");
            }}
            options={[
              { value: "all", label: "All apartments / not sure" },
              { value: "none", label: "No listed agency" },
              ...agencyOptions.map(([value, label]) => ({ value, label })),
            ]}
            helperText="Choose a rental agency to see its apartments, then select where you lived."
          />
          <Box>
            <FormSelect
              name="slug"
              label="Apartment"
              required
              disabled={propertiesLoading}
              placeholder="Select an apartment"
              value={propertySlug}
              onValueChange={setPropertySlug}
              options={visibleProperties.map((property) => ({
                value: property.slug,
                label: property.name,
                description: property.agency_name
                  ? `Managed by ${property.agency_name}`
                  : undefined,
              }))}
            />
            {propertiesLoading ? (
              <Text>Loading apartments…</Text>
            ) : (
              !visibleProperties.length && (
                <Text>No apartments are available for this selection.</Text>
              )
            )}
          </Box>
          <Button
            asChild
            variant="outline"
            alignSelf="flex-start"
            h="auto"
            minH="44px"
            py={3}
            whiteSpace="normal"
            textAlign="start"
          >
            <NextLink href="/submit/apartment">
              Apartment missing? Suggest a property or agency
            </NextLink>
          </Button>
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
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
            <Field.Root>
              <Field.Label>What did you like?</Field.Label>
              <Input
                name="pros"
                maxLength={2000}
                placeholder="What stood out?"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>What could be improved?</Field.Label>
              <Input
                name="cons"
                maxLength={2000}
                placeholder="What would you change?"
              />
            </Field.Root>
          </SimpleGrid>
          <FormSelect
            name="recommendation"
            label="Would you recommend this apartment?"
            value={recommendation}
            onValueChange={setRecommendation}
            options={[
              { value: "yes", label: "Yes" },
              { value: "maybe", label: "Maybe" },
              { value: "no", label: "No" },
            ]}
          />
          <ReviewPhotoPicker
            photos={photos}
            onChange={setPhotos}
            onProcessingChange={setCompressingPhotos}
          />
          <Text fontSize="sm" color="var(--site-muted)">
            Staff review all text and photos before publication. Do not include
            private contact details or other sensitive information.
          </Text>
          <SubmissionTerms terms={terms} disabled={pending} />
          <Button
            type="submit"
            loading={pending}
            disabled={
              !terms.ready ||
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
