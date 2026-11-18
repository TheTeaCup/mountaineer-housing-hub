import type { Property } from "@/types/properties";
import {
  Box,
  Portal,
  Select,
  Text,
  createListCollection,
} from "@chakra-ui/react";

export default function CompareSelect({
  index,
  value,
  properties,
  selectedSlugs,
  onChange,
}: {
  index: number;
  value: string;
  properties: Property[];
  selectedSlugs: string[];
  onChange: (slug: string) => void;
}) {
  const collection = createListCollection({
    items: properties.map((property) => ({
      label: property.name,
      value: property.slug,
      address: property.address,
      disabled:
        property.slug !== value && selectedSlugs.includes(property.slug),
    })),
  });

  return (
    <Select.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(details) => onChange(details.value[0] || "")}
      positioning={{ sameWidth: true }}
    >
      <Select.HiddenSelect />
      <Select.Label fontSize="sm" fontWeight="semibold" mb={2}>
        Apartment {index + 1}
      </Select.Label>
      <Select.Control>
        <Select.Trigger
          minH="52px"
          px={4}
          pe={10}
          borderRadius="xl"
          borderColor="var(--site-border)"
          bg="var(--site-control)"
          color="var(--site-heading)"
          cursor="pointer"
          textAlign="start"
          transition="background 0.15s, border-color 0.15s"
          _hover={{
            bg: "var(--site-control-hover)",
            borderColor: "var(--site-accent-fg)",
          }}
          _open={{ borderColor: "var(--site-accent-fg)" }}
          _focusVisible={{
            outline: "2px solid var(--site-accent-fg)",
            outlineOffset: "2px",
          }}
        >
          <Select.ValueText placeholder="Choose a property" lineClamp={1} />
        </Select.Trigger>
        <Select.IndicatorGroup pe={4} color="var(--site-accent-fg)">
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner zIndex={1500}>
          <Select.Content
            p={1.5}
            maxH="340px"
            overflowY="auto"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="var(--site-border)"
            bg="var(--site-surface)"
            color="var(--site-fg)"
            boxShadow="0 16px 40px rgb(0 0 0 / 24%)"
          >
            {collection.items.map((item) => (
              <Select.Item
                key={item.value}
                item={item}
                px={3}
                py={3}
                borderRadius="lg"
                cursor="pointer"
                alignItems="center"
                _highlighted={{ bg: "var(--site-control-hover)" }}
                _selected={{
                  bg: "var(--site-accent-soft)",
                  color: "var(--site-accent-fg)",
                }}
                _disabled={{ opacity: 0.45, cursor: "not-allowed" }}
              >
                <Box flex="1" minW={0}>
                  <Select.ItemText fontWeight="semibold">
                    {item.label}
                  </Select.ItemText>
                  <Text
                    fontSize="xs"
                    color="var(--site-muted)"
                    mt={0.5}
                    lineClamp={1}
                  >
                    {item.disabled
                      ? "Already in your comparison"
                      : item.address}
                  </Text>
                </Box>
                <Select.ItemIndicator color="var(--site-accent-fg)" />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
