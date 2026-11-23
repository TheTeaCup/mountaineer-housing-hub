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
  perBedroomRentNote,
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
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  FiArrowLeft,
  FiColumns,
  FiEdit2,
  FiExternalLink,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
} from "react-icons/fi";

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

function trackPropertyEvent(
  slug: string,
  event:
    | "views"
    | "property-website-clicks"
    | "agency-website-clicks"
    | "phone-taps",
) {
  void fetch(`${API_URL}/properties/${encodeURIComponent(slug)}/${event}`, {
    method: "POST",
    credentials: "omit",
    keepalive: true,
  }).catch(() => {});
}

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
        trackPropertyEvent(slug!, "views");
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
  const propertyPhone = property?.phone?.trim();
  const contactPhone = propertyPhone || property?.agency?.phone?.trim();
  let editHref: string | undefined;
  if (property && profile?.role === "staff") {
    editHref = `/staff/properties/${property.id}`;
  } else if (
    property &&
    profile?.role === "property_manager" &&
    editablePropertyId === property.id
  ) {
    editHref = `/account/properties/${property.id}`;
  }
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
          <Button
            asChild
            variant="outline"
            size="sm"
            borderRadius="full"
            px={4}
            borderColor="var(--site-border)"
            color="var(--site-fg)"
            _hover={{
              bg: "var(--site-muted-surface)",
              borderColor: "var(--site-muted)",
            }}
          >
            <NextLink href="/properties">
              <FiArrowLeft aria-hidden="true" /> All properties
            </NextLink>
          </Button>
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
              <Heading
                as="h1"
                mt={6}
                mb={3}
                fontSize={{ base: "2rem", md: "3rem" }}
                lineHeight="1.12"
                letterSpacing="-0.035em"
                fontWeight="bold"
                color="var(--site-heading)"
              >
                {property.name}
              </Heading>
              <Text
                textTransform="uppercase"
                fontSize="xs"
                letterSpacing="0.12em"
                fontWeight="bold"
                color="var(--site-accent-fg)"
                mb={2}
              >
                {propertyTypeLabel(property.property_type)}
              </Text>
              <Text
                display="flex"
                alignItems="start"
                gap={2}
                mb={7}
                color="var(--site-muted)"
                fontSize={{ base: "sm", md: "md" }}
              >
                <FiMapPin
                  aria-hidden="true"
                  style={{ flexShrink: 0, marginTop: 4 }}
                />
                {property.address}
              </Text>
              <Grid
                templateColumns={{
                  base: "minmax(0, 1fr)",
                  lg: "minmax(0, 2fr) minmax(0, 1fr)",
                }}
                gap={{ base: 5, md: 7 }}
              >
                <Stack gap={7} minW={0}>
                  <PropertyPhotoGallery
                    key={property.slug}
                    photos={property.photos}
                    name={property.name}
                  />
                  <Box
                    bg="var(--site-muted-surface)"
                    borderWidth="1px"
                    borderColor="var(--site-border)"
                    borderRadius="xl"
                    p={{ base: 5, md: 7 }}
                    borderLeftWidth="4px"
                    borderLeftColor="#ffc72c"
                    boxShadow="0 8px 24px rgb(0 0 0 / 10%)"
                  >
                    <Heading
                      as="h2"
                      fontSize="xl"
                      color="var(--site-heading)"
                      mb={4}
                    >
                      About this property
                    </Heading>
                    <Text
                      whiteSpace="pre-wrap"
                      fontSize="md"
                      lineHeight="1.85"
                      maxW="68ch"
                      overflowWrap="anywhere"
                    >
                      {property.description ||
                        "A description has not been provided yet."}
                    </Text>
                  </Box>
                </Stack>
                <Box
                  bg="var(--site-surface)"
                  p={6}
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="xl"
                  alignSelf="start"
                  minW={0}
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
                  <Stack
                    gap={3}
                    css={{
                      "& .chakra-button": {
                        width: "100%",
                        minHeight: "48px",
                        height: "auto",
                        padding: "12px 16px",
                        whiteSpace: "normal",
                        borderRadius: "md",
                        borderColor: "var(--site-muted)",
                        color: "var(--site-heading)",
                        _hover: { bg: "var(--site-muted-surface)" },
                        _focusVisible: {
                          outline: "2px solid var(--site-accent-fg)",
                          outlineOffset: "2px",
                        },
                      },
                      "& .chakra-button[data-primary]": {
                        bg: "#ffc72c",
                        borderColor: "#ffc72c",
                        color: "#111111",
                        _hover: { bg: "#e5b025", borderColor: "#e5b025" },
                      },
                    }}
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      color="var(--site-muted)"
                    >
                      Contact &amp; availability
                    </Text>
                    {website && (
                      <Button asChild data-primary="">
                        <a
                          href={website}
                          onClick={() =>
                            trackPropertyEvent(
                              property.slug,
                              "property-website-clicks",
                            )
                          }
                          onAuxClick={(event) => {
                            if (event.button === 1)
                              trackPropertyEvent(
                                property.slug,
                                "property-website-clicks",
                              );
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiExternalLink aria-hidden="true" /> Property website
                        </a>
                      </Button>
                    )}
                    {agencyWebsite && (
                      <Button asChild variant="outline">
                        <a
                          href={agencyWebsite}
                          onClick={() =>
                            trackPropertyEvent(
                              property.slug,
                              "agency-website-clicks",
                            )
                          }
                          onAuxClick={(event) => {
                            if (event.button === 1)
                              trackPropertyEvent(
                                property.slug,
                                "agency-website-clicks",
                              );
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiExternalLink aria-hidden="true" /> Agency website
                        </a>
                      </Button>
                    )}
                    {contactPhone && (
                      <Text
                        display="flex"
                        alignItems="center"
                        gap={2}
                        minH="44px"
                      >
                        <FiPhone aria-hidden="true" />
                        {propertyPhone ? "Phone" : "Agency phone"}:{" "}
                        <a
                          href={phoneHref(contactPhone)}
                          onClick={() =>
                            trackPropertyEvent(property.slug, "phone-taps")
                          }
                        >
                          {formatPhoneNumber(contactPhone)}
                        </a>
                      </Text>
                    )}
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      color="var(--site-muted)"
                      mt={3}
                      pt={4}
                      borderTopWidth="1px"
                      borderColor="var(--site-border)"
                    >
                      Explore &amp; share
                    </Text>
                    <FavoriteButton slug={property.slug} />
                    <Button asChild variant="outline">
                      <NextLink
                        href={`/compare?properties=${encodeURIComponent(property.slug)}`}
                      >
                        <FiColumns aria-hidden="true" /> Compare this apartment
                      </NextLink>
                    </Button>
                    {hasCoordinates && (
                      <Button asChild variant="outline">
                        <NextLink
                          href={`/map?property=${encodeURIComponent(property.slug)}`}
                        >
                          <FiMapPin aria-hidden="true" /> Find on map
                        </NextLink>
                      </Button>
                    )}
                    {profile?.role !== "property_manager" && (
                      <Button asChild variant="outline">
                        <NextLink
                          href={`/submit?property=${encodeURIComponent(property.slug)}`}
                        >
                          <FiMessageSquare aria-hidden="true" /> Write a review
                        </NextLink>
                      </Button>
                    )}
                    {editHref && (
                      <Button asChild variant="outline">
                        <NextLink href={editHref}>
                          <FiEdit2 aria-hidden="true" /> Edit property
                        </NextLink>
                      </Button>
                    )}
                  </Stack>
                  {property.parking_type && (
                    <Box
                      mt={5}
                      pt={4}
                      borderTopWidth="1px"
                      borderColor="var(--site-border)"
                    >
                      <Heading as="h2" size="sm" mb={2}>
                        Parking
                      </Heading>
                      <Text>
                        {
                          {
                            free: "Free parking",
                            monthly: "Monthly parking fee",
                            yearly: "Yearly parking fee",
                            semester: "Per-semester parking fee",
                            one_time: "One-time parking fee",
                          }[property.parking_type]
                        }
                      </Text>
                      {property.parking_type !== "free" &&
                        property.parking_fee != null && (
                          <Text fontWeight="bold" mt={1}>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(property.parking_fee)}
                            {
                              {
                                monthly: "/month",
                                yearly: "/year",
                                semester: "/semester",
                                one_time: " one time",
                                free: "",
                              }[property.parking_type]
                            }
                          </Text>
                        )}
                      {property.parking_notes && (
                        <Text mt={2} fontSize="sm" color="var(--site-muted)">
                          {property.parking_notes}
                        </Text>
                      )}
                    </Box>
                  )}
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
              <Stack
                gap={7}
                mt={8}
                pt={7}
                borderTopWidth="1px"
                borderColor="var(--site-border)"
              >
                <Box>
                  <Heading as="h2" size="lg" mb={4}>
                    Floor plans and pricing
                  </Heading>
                  {property.floor_plans.length ? (
                    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
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
                              : `${plan.bedrooms} ${plan.bedrooms === 1 ? "bed" : "beds"}`}{" "}
                            · {plan.bathrooms}{" "}
                            {plan.bathrooms === 1 ? "bath" : "baths"}
                            {plan.square_feet
                              ? ` · ${plan.square_feet.toLocaleString()} sq ft`
                              : ""}
                          </Text>
                          <Text fontWeight="bold">{planRent(plan)}</Text>
                          {perBedroomRentNote(plan) && (
                            <Text
                              mt={2}
                              fontSize="sm"
                              color="var(--site-muted)"
                            >
                              Per unit is the full apartment price.{" "}
                              {perBedroomRentNote(plan)}
                            </Text>
                          )}
                          {plan.description && (
                            <Text mt={3} whiteSpace="pre-wrap">
                              {plan.description}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text>
                      Floor plans and pricing have not been added yet.
                    </Text>
                  )}
                </Box>
                <CostCalculator
                  key={`cost-${property.slug}`}
                  initialRent={startingRent}
                  initialParkingType={property.parking_type}
                  initialParkingFee={property.parking_fee}
                />
                <PropertyReviews
                  key={property.slug}
                  slug={property.slug}
                  onChange={() =>
                    void router.replace(router.asPath, undefined, {
                      scroll: false,
                    })
                  }
                />
              </Stack>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
