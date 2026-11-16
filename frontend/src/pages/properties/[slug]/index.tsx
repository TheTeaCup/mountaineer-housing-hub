import CostCalculator from "@/components/properties/cost-calculator";
import FavoriteButton from "@/components/properties/favorite-button";
import PropertyPhotoGallery from "@/components/properties/photo-gallery";
import PropertyReviews from "@/components/properties/reviews";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { PropertyDetailSkeleton } from "@/components/ui/page-skeletons";
import appalCart from "@/data/appalcart.json";
import type { Property } from "@/types/properties";
import {
  fetchProperty,
  planRent,
  PropertyRequestError,
  propertyTypeLabel,
  safeUrl,
} from "@/utils/api/properties";
import { formatPhoneNumber, phoneHref } from "@/utils/format-phone";
import { propertyDescription } from "@/utils/property-description";
import { siteUrl } from "@/utils/site-url";
import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useRouter } from "next/router";

import { accountRequest } from "@/utils/api/account";
import { API_URL } from "@/utils/api/auth";
import { useEffect, useState } from "react";

type PropertyPageProps = {
  property: Property | null;
  error: string;
  busRouteNames?: string[];
};

export const getServerSideProps: GetServerSideProps<
  PropertyPageProps
> = async ({ params, res }) => {
  const slug = params?.slug;
  if (typeof slug !== "string" || !slug) return { notFound: true };

  // Fetch current public data on every request, including client navigation.
  res.setHeader("Cache-Control", "no-store");
  try {
    const property = await fetchProperty(slug, AbortSignal.timeout(10_000));
    const busRouteNames = appalCart.routes
      .filter(({ id }) => property.bus_route_ids?.includes(id))
      .map(({ name }) => name);
    return { props: { property, error: "", busRouteNames } };
  } catch (error) {
    if (error instanceof PropertyRequestError && error.status === 404) {
      return { notFound: true };
    }
    console.error("Unable to load property page", error);
    res.statusCode = 503;
    res.setHeader("Retry-After", "300");
    return {
      props: {
        property: null,
        error:
          "Property details are temporarily unavailable. Please try again.",
      },
    };
  }
};

export default function PropertyPage({
  property,
  error,
  busRouteNames = [],
}: PropertyPageProps) {
  const router = useRouter();
  const { profile } = useAccount();
  const [editablePropertyId, setEditablePropertyId] = useState<number | null>(
    null,
  );
  const slug = property?.slug;
  const propertyId = property?.id;
  useEffect(() => {
    if (profile?.role !== "property_manager" || !propertyId) return;
    let active = true;
    accountRequest<{ id: number }[]>("/account/managed-properties")
      .then((managedProperties) => {
        if (active) {
          setEditablePropertyId(
            managedProperties.some((managed) => managed.id === propertyId)
              ? propertyId
              : null,
          );
        }
      })
      .catch(() => {
        if (active) setEditablePropertyId(null);
      });
    return () => {
      active = false;
    };
  }, [profile?.role, propertyId]);
  useEffect(() => {
    if (!slug) return;
    // Wait for a visible page and cancel the queued event if React remounts it.
    let timer: ReturnType<typeof setTimeout> | undefined;
    function trackView() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", trackView);
      timer = setTimeout(() => {
        void fetch(`${API_URL}/properties/${encodeURIComponent(slug!)}/views`, {
          method: "POST",
          credentials: "omit",
          keepalive: true,
        }).catch(() => {});
      }, 0);
    }
    document.addEventListener("visibilitychange", trackView);
    trackView();
    return () => {
      document.removeEventListener("visibilitychange", trackView);
      clearTimeout(timer);
    };
  }, [slug]);
  const website = safeUrl(property?.website_url);
  const agencyWebsite = safeUrl(property?.agency?.website_url);
  const propertyPhoneDigits = property?.phone?.replace(/\D/g, "");
  const agencyPhoneDigits = property?.agency?.phone?.replace(/\D/g, "");
  const hasCoordinates =
    property?.latitude !== null && property?.longitude !== null;
  const previewPhoto = property?.photos.find((photo) =>
    safeUrl(photo.image_url, true),
  );
  const startingRent = property?.floor_plans.reduce<number | null>(
    (lowest, plan) =>
      plan.rent_min === null
        ? lowest
        : lowest === null
          ? plan.rent_min
          : Math.min(lowest, plan.rent_min),
    null,
  );
  return (
    <>
      <SEO
        title={property?.name || "Property unavailable"}
        description={property ? propertyDescription(property) : error}
        image={previewPhoto?.image_url}
        imageAlt={previewPhoto?.alt_text || property?.name}
        url={
          property
            ? siteUrl(`/properties/${encodeURIComponent(property.slug)}`)
            : undefined
        }
        noIndex={!property}
      />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <NextLink href="/properties">← All properties</NextLink>
          {error ? (
            <Box role="alert" mt={6}>
              <Heading as="h1" size="lg">
                {error}
              </Heading>
              <Button mt={4} onClick={() => void router.replace(router.asPath)}>
                Try again
              </Button>
            </Box>
          ) : !property ? (
            <PropertyDetailSkeleton />
          ) : (
            <>
              <Heading as="h1" mt={6} mb={3}>
                {property.name}
              </Heading>
              {profile?.role === "staff" && (
                <NextLink href={`/staff/properties/${property.id}`}>
                  <Button variant="outline" mb={4}>
                    Edit property
                  </Button>
                </NextLink>
              )}
              {profile?.role === "property_manager" &&
                editablePropertyId === property.id && (
                  <NextLink href={`/account/properties/${property.id}`}>
                    <Button variant="outline" mb={4}>
                      Edit property
                    </Button>
                  </NextLink>
                )}
              <Text textTransform="capitalize">
                {propertyTypeLabel(property.property_type)}
              </Text>
              <Text mb={5}>{property.address}</Text>
              <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={7}>
                <Stack gap={7}>
                  <PropertyPhotoGallery
                    key={property.slug}
                    photos={property.photos}
                    name={property.name}
                  />
                  <Box>
                    <Heading as="h2" size="lg" mb={3}>
                      About this property
                    </Heading>
                    <Text whiteSpace="pre-wrap">
                      {property.description ||
                        "A description has not been provided yet."}
                    </Text>
                  </Box>
                  <Box>
                    <Heading as="h2" size="lg" mb={4}>
                      Floor plans and pricing
                    </Heading>
                    {property.floor_plans.length ? (
                      <Stack gap={3}>
                        {property.floor_plans.map((plan) => (
                          <Box
                            key={plan.id}
                            p={5}
                            bg="var(--site-surface)"
                            borderWidth="1px"
                            borderColor="var(--site-border)"
                            borderRadius="lg"
                          >
                            <Heading as="h3" size="md">
                              {plan.name}
                            </Heading>
                            <Text my={2}>
                              {plan.bedrooms === 0
                                ? "Studio"
                                : `${plan.bedrooms} beds`}{" "}
                              · {plan.bathrooms} baths
                              {plan.square_feet
                                ? ` · ${plan.square_feet.toLocaleString()} sq ft`
                                : ""}
                            </Text>
                            <Text fontWeight="bold">{planRent(plan)}</Text>
                            {plan.description && (
                              <Text mt={3} whiteSpace="pre-wrap">
                                {plan.description}
                              </Text>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Text>
                        Floor plans and pricing have not been added yet.
                      </Text>
                    )}
                  </Box>
                  <CostCalculator
                    key={`cost-${property.slug}`}
                    initialRent={startingRent}
                  />
                  <PropertyReviews key={property.slug} slug={property.slug} />
                </Stack>
                <Box
                  bg="var(--site-surface)"
                  p={6}
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="xl"
                  alignSelf="start"
                >
                  <Heading as="h2" size="lg" mb={3}>
                    Interested in this property?
                  </Heading>
                  {property.agency && (
                    <Text mb={4}>
                      Managed by{" "}
                      <NextLink href={`/agencies/${property.agency.slug}`}>
                        {property.agency.name}
                      </NextLink>
                    </Text>
                  )}
                  <Stack gap={4}>
                    <FavoriteButton slug={property.slug} />
                    <NextLink
                      href={`/compare?properties=${encodeURIComponent(property.slug)}`}
                    >
                      <Button variant="outline" w="100%">
                        Compare apartments
                      </Button>
                    </NextLink>
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button w="100%">Visit property website</Button>
                      </a>
                    )}
                    {agencyWebsite && (
                      <a
                        href={agencyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" w="100%">
                          Visit rental agency website
                        </Button>
                      </a>
                    )}
                    {property.agency?.phone &&
                      agencyPhoneDigits !== propertyPhoneDigits && (
                        <Text>
                          Agency phone:{" "}
                          <a href={phoneHref(property.agency.phone)}>
                            {formatPhoneNumber(property.agency.phone)}
                          </a>
                        </Text>
                      )}
                    {property.phone && (
                      <Text>
                        Phone:{" "}
                        <a href={phoneHref(property.phone)}>
                          {formatPhoneNumber(property.phone)}
                        </a>
                      </Text>
                    )}
                    {hasCoordinates && (
                      <NextLink
                        href={`/map?property=${encodeURIComponent(property.slug)}`}
                      >
                        <Button variant="outline" w="100%">
                          View on map
                        </Button>
                      </NextLink>
                    )}
                    {profile?.role !== "property_manager" && (
                      <NextLink
                        href={`/submit?property=${encodeURIComponent(property.slug)}`}
                      >
                        <Button variant="outline" w="100%">
                          Write a review
                        </Button>
                      </NextLink>
                    )}
                  </Stack>
                  {busRouteNames.length > 0 && (
                    <Box
                      mt={5}
                      pt={4}
                      borderTopWidth="1px"
                      borderColor="var(--site-border)"
                    >
                      <Heading as="h2" size="sm" mb={2}>
                        AppalCART routes nearby
                      </Heading>
                      <Box
                        as="ul"
                        display="flex"
                        flexWrap="wrap"
                        gap={2}
                        listStyleType="none"
                      >
                        {busRouteNames.map((name) => (
                          <Box
                            as="li"
                            key={name}
                            px={2}
                            py={1}
                            bg="var(--site-muted-surface)"
                            borderRadius="md"
                            fontSize="sm"
                          >
                            {name}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
