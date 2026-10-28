import FavoriteButton from "@/components/properties/favorite-button";
import PropertyPhoto from "@/components/properties/photo";
import PropertyReviews from "@/components/properties/reviews";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { PropertyDetailSkeleton } from "@/components/ui/page-skeletons";
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
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useRouter } from "next/router";

type PropertyPageProps = {
  property: Property | null;
  error: string;
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
    return { props: { property, error: "" } };
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

export default function PropertyPage({ property, error }: PropertyPageProps) {
  const router = useRouter();
  const { profile } = useAccount();
  const website = safeUrl(property?.website_url);
  const agencyWebsite = safeUrl(property?.agency?.website_url);
  const propertyPhoneDigits = property?.phone?.replace(/\D/g, "");
  const agencyPhoneDigits = property?.agency?.phone?.replace(/\D/g, "");
  const hasCoordinates =
    property?.latitude !== null && property?.longitude !== null;
  const previewPhoto = property?.photos.find((photo) =>
    safeUrl(photo.image_url, true),
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
              <Text textTransform="capitalize">
                {propertyTypeLabel(property.property_type)}
              </Text>
              <Text mb={5}>{property.address}</Text>
              <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={7}>
                <Stack gap={7}>
                  <PropertyPhoto
                    key={property.photos[0]?.image_url || property.slug}
                    src={property.photos[0]?.image_url}
                    alt={
                      property.photos[0]?.alt_text ||
                      `${property.name} exterior`
                    }
                    height="340px"
                  />
                  {property.photos.length > 1 && (
                    <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
                      {property.photos.slice(1).map((photo) => (
                        <PropertyPhoto
                          key={photo.image_url}
                          src={photo.image_url}
                          alt={photo.alt_text || property.name}
                          height="150px"
                        />
                      ))}
                    </SimpleGrid>
                  )}
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
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Text>
                        Floor plans and pricing have not been added yet.
                      </Text>
                    )}
                  </Box>
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
                    <NextLink href="/submit">
                      <Button variant="outline" w="100%">
                        Write a review
                      </Button>
                    </NextLink>
                  </Stack>
                </Box>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
