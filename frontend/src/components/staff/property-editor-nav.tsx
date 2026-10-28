import { Button, Flex } from "@chakra-ui/react";
import NextLink from "next/link";

export type PropertyEditorSection = "details" | "floor-plans" | "photos";

export default function PropertyEditorNav({
  propertyId,
  assigned,
  active,
}: {
  propertyId: string | number;
  assigned: boolean;
  active: PropertyEditorSection;
}) {
  const base = assigned
    ? `/account/properties/${propertyId}`
    : `/staff/properties/${propertyId}`;
  const sections: {
    key: PropertyEditorSection;
    label: string;
    href: string;
  }[] = [
    { key: "details", label: "Details", href: base },
    { key: "floor-plans", label: "Floor plans", href: `${base}/floor-plans` },
    { key: "photos", label: "Photos", href: `${base}/photos` },
  ];
  return (
    <Flex gap={2} mb={6} flexWrap="wrap" aria-label="Property editor sections">
      {sections.map((section) => (
        <NextLink key={section.key} href={section.href}>
          <Button variant={active === section.key ? "solid" : "outline"}>
            {section.label}
          </Button>
        </NextLink>
      ))}
    </Flex>
  );
}
