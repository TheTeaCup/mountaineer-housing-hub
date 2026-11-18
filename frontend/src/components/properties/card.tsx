import type { Property } from "@/types/properties";
import { propertyTypeLabel, rentSummary } from "@/utils/api/properties";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import FavoriteButton from "./favorite-button";
import PropertyPhoto from "./photo";

const reviewDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "America/New_York",
});

export default function PropertiesCard({
  property,
  sponsored = false,
}: {
  property: Property;
  sponsored?: boolean;
}) {
  const prices = rentSummary(property.floor_plans);
  return (
    <Box
      position="relative"
      bg="var(--site-surface)"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="var(--site-border)"
      overflow="hidden"
      boxShadow="0 2px 8px rgba(0,0,0,0.1)"
      display="flex"
      flexDirection="column"
      transition="transform 0.2s"
      _hover={{ transform: "translateY(-3px)" }}
    >
      <Box position="absolute" top={2} right={2} zIndex={1}>
        <FavoriteButton slug={property.slug} iconOnly onImage />
      </Box>
      {sponsored && (
        <Text
          position="absolute"
          top={3}
          left={3}
          zIndex={1}
          px={2}
          py={1}
          borderRadius="md"
          bg="var(--site-surface)"
          color="var(--site-heading)"
          fontSize="xs"
          fontWeight="bold"
        >
          Sponsored
        </Text>
      )}
      <PropertyPhoto
        key={property.photos[0]?.image_url || property.slug}
        src={property.photos[0]?.image_url}
        alt={property.photos[0]?.alt_text || `${property.name} exterior`}
      />
      <Box
        px={6}
        py={4}
        borderBottomWidth="1px"
        borderColor="var(--site-border)"
        bg="var(--site-control)"
      >
        <Heading as="h3" fontSize="1.25rem" color="var(--site-heading)">
          {property.name}
        </Heading>
        <Text
          mt={1}
          fontSize="xs"
          color="var(--site-muted)"
          textTransform="uppercase"
          letterSpacing="0.06em"
        >
          {propertyTypeLabel(property.property_type)}
        </Text>
      </Box>
      <Stack px={6} pt={5} pb={6} gap={3} flex="1">
        {prices.length ? (
          prices.map((price) => (
            <Text key={price} color="var(--site-success)" fontWeight="bold">
              {price}
            </Text>
          ))
        ) : (
          <Text color="var(--site-muted)">Contact property for pricing</Text>
        )}
        <Text fontSize="sm" color="var(--site-muted)">
          {property.address}
        </Text>
        {property.agency && (
          <Text fontSize="sm">Managed by {property.agency.name}</Text>
        )}
        {property.parking_type && (
          <Text fontSize="sm" color="var(--site-muted)">
            Parking:{" "}
            {
              {
                free: "Free",
                monthly: "Monthly fee",
                one_time: "One-time fee",
              }[property.parking_type]
            }
          </Text>
        )}
        <Text fontSize="sm" color="var(--site-muted)">
          {property.review_count && property.average_rating !== null
            ? `${property.average_rating.toFixed(1)}/5 · ${property.review_count} published ${property.review_count === 1 ? "review" : "reviews"}`
            : "No published reviews yet"}
        </Text>
        {property.latest_review && (
          <Stack gap={1} p={3} bg="var(--site-muted-surface)" borderRadius="md">
            <Text as="blockquote" lineClamp={3} fontSize="sm">
              {property.latest_review.excerpt}
            </Text>
            <Text fontSize="xs" color="var(--site-muted)">
              {reviewDate.format(new Date(property.latest_review.date))}
            </Text>
          </Stack>
        )}
        <Box mt="auto" pt={2}>
          <Button
            asChild
            position="static"
            w="100%"
            bg="var(--site-accent-soft)"
            color="var(--site-accent-fg)"
            borderWidth="1px"
            borderColor="var(--site-accent-fg)"
            borderRadius="lg"
            fontWeight="semibold"
            _hover={{ bg: "#ffc72c", color: "#111111" }}
            _after={{ content: '""', position: "absolute", inset: 0 }}
          >
            <NextLink
              href={`/properties/${encodeURIComponent(property.slug)}`}
              aria-label={`View More Info about ${property.name}`}
            >
              View More Info
            </NextLink>
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
