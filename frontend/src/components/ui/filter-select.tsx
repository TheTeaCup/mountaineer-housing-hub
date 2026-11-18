import { Portal, Select, createListCollection } from "@chakra-ui/react";

// Menus keep the same keyboard and form behavior as the other search controls.
export default function FilterSelect({
  name,
  label,
  defaultValue,
  options,
  onValueChange,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}) {
  const collection = createListCollection({
    items: options.map((option) => ({
      ...option,
      value: option.value || "__all",
    })),
  });
  return (
    <Select.Root
      collection={collection}
      name={name}
      defaultValue={[defaultValue || "__all"]}
      onValueChange={(details) =>
        onValueChange?.(
          details.value[0] === "__all" ? "" : details.value[0] || "",
        )
      }
      positioning={{ sameWidth: true }}
    >
      <Select.HiddenSelect />
      <Select.Label color="var(--site-fg)" fontWeight="medium" mb={1}>
        {label}
      </Select.Label>
      <Select.Control>
        <Select.Trigger
          minH="48px"
          px={4}
          borderRadius="xl"
          borderColor="var(--site-border)"
          bg="var(--site-control)"
          color="var(--site-fg)"
          cursor="pointer"
          transition="background 0.15s, border-color 0.15s"
          _hover={{
            bg: "var(--site-control-hover)",
            borderColor: "var(--site-accent-fg)",
          }}
          _focusVisible={{
            outline: "2px solid var(--site-accent-fg)",
            outlineOffset: "2px",
          }}
          _open={{ borderColor: "var(--site-accent-fg)" }}
        >
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup pr={4} color="var(--site-accent-fg)">
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner zIndex={1500}>
          <Select.Content
            p={1.5}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="var(--site-border)"
            bg="var(--site-surface)"
            color="var(--site-fg)"
            boxShadow="0 12px 32px rgb(0 0 0 / 20%)"
            maxH="320px"
          >
            {collection.items.map((item) => (
              <Select.Item
                item={item}
                key={item.value}
                minH="42px"
                px={3}
                borderRadius="lg"
                cursor="pointer"
                _highlighted={{
                  bg: "var(--site-control-hover)",
                  color: "var(--site-heading)",
                }}
                _selected={{
                  bg: "var(--site-accent-soft)",
                  color: "var(--site-accent-fg)",
                  fontWeight: "semibold",
                }}
              >
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator color="var(--site-accent-fg)" />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
