import type { FloorPlan } from "@/types/properties";
import { accountRequest } from "@/utils/api/account";
import { Box, Container, Heading, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SEO from "../seo";
import { useAccount } from "../ui/account-provider";
import FloorPlanManager from "./floor-plan-manager";
import PropertyEditorNav, {
  type PropertyEditorSection,
} from "./property-editor-nav";
import PropertyPhotoManager, {
  type StaffPropertyPhoto,
} from "./property-photo-manager";

interface AssetProperty {
  id: number;
  name: string;
  floor_plans: FloorPlan[];
  photos: StaffPropertyPhoto[];
}

export default function PropertyAssetsPage({
  assigned,
  section,
}: {
  assigned: boolean;
  section: Exclude<PropertyEditorSection, "details">;
}) {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { profile, error: accessError } = useAccount();
  const role = profile?.role;
  const [property, setProperty] = useState<AssetProperty | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id || !role || (!assigned && role !== "staff")) return;
    let active = true;
    accountRequest<AssetProperty>(`/staff/properties/${id}`)
      .then((data) => {
        if (active) {
          setError("");
          setProperty({
            ...data,
            floor_plans: data.floor_plans ?? [],
            photos: data.photos ?? [],
          });
        }
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [assigned, id, role]);

  const title = section === "floor-plans" ? "Floor plans" : "Property photos";
  return (
    <>
      <SEO title={`${title} · Edit property`} noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="850px" py={10}>
          <NextLink href={assigned ? "/account" : "/staff/apartments"}>
            ← {assigned ? "My account" : "Property submissions and listings"}
          </NextLink>
          <Heading as="h1" mt={5} mb={2}>
            {title}
          </Heading>
          {property && <Text mb={5}>{property.name}</Text>}
          {id && (
            <PropertyEditorNav
              propertyId={id}
              assigned={assigned}
              active={section}
            />
          )}
          {accessError || error ? (
            <Text role="alert" color="fg.error">
              {accessError || error}
            </Text>
          ) : !profile ? (
            <Text role="status">Checking property access…</Text>
          ) : !assigned && profile.role !== "staff" ? (
            <Text role="alert">Staff access is required.</Text>
          ) : !property || String(property.id) !== id ? (
            <Text role="status">Loading property…</Text>
          ) : section === "floor-plans" ? (
            <FloorPlanManager
              propertyId={property.id}
              floorPlans={property.floor_plans}
              onChange={(floorPlans) =>
                setProperty((current) =>
                  current ? { ...current, floor_plans: floorPlans } : current,
                )
              }
            />
          ) : (
            <PropertyPhotoManager
              propertyId={property.id}
              photos={property.photos}
              onChange={(photos) =>
                setProperty((current) =>
                  current ? { ...current, photos } : current,
                )
              }
            />
          )}
        </Container>
      </Box>
    </>
  );
}
