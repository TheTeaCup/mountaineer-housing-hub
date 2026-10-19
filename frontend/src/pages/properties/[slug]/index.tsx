import FavoriteButton from "@/components/properties/favorite-button";
import PropertyPhoto from "@/components/properties/photo";
import PropertyReviews from "@/components/properties/reviews";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import type { Property } from "@/types/properties";
import {
  fetchProperty,
  planRent,
  propertyTypeLabel,
  safeUrl,
} from "@/utils/api/properties";
import { formatPhoneNumber, phoneHref } from "@/utils/format-phone";
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
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function PropertyPage() {
  const router = useRouter();
  const { profile } = useAccount();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const [result, setResult] = useState<{
    slug: string;
    property: Property | null;
    error: string;
  }>({ slug: "", property: null, error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetchProperty(slug, controller.signal)
      .then((property) => {
        if (!controller.signal.aborted)
          setResult({ slug, property, error: "" });
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted)
          setResult({ slug, property: null, error: err.message });
      });
    return () => controller.abort();
  }, [slug, revision]);
  const property = result.slug === slug ? result.property : null;
  const error = result.slug === slug ? result.error : "";
  const website = safeUrl(property?.website_url);
  const agencyWebsite = safeUrl(property?.agency?.website_url);
  const propertyPhoneDigits = property?.phone?.replace(/\D/g, "");
  const agencyPhoneDigits = property?.agency?.phone?.replace(/\D/g, "");
  const hasCoordinates =
    property?.latitude !== null && property?.longitude !== null;
  return (
    <>
      <SEO title={property?.name || "Property"} />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <NextLink href="/properties">← All properties</NextLink>
          {error ? (
            <Box role="alert" mt={6}>
              <Heading as="h1" size="lg">
                {error}
              </Heading>
              <Button mt={4} onClick={() => setRevision((value) => value + 1)}>
                Try again
              </Button>
            </Box>
          ) : !property ? (
            <Text mt={6} role="status">
              Loading property…
            </Text>
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
