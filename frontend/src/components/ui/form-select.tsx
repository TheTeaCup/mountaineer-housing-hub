import {
  Box,
  Portal,
  Select,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { useId } from "react";

export default function FormSelect({
  name,
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  helperText,
}: {
  name?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}) {
  const helperId = useId();
  const collection = createListCollection({ items: options });
  return (
    <Select.Root
      collection={collection}
      name={name}
      value={value ? [value] : []}
      onValueChange={(details) => onValueChange(details.value[0] || "")}
      required={required}
      disabled={disabled}
      positioning={{ sameWidth: true }}
    >
      <Select.HiddenSelect />
      <Select.Label
        color="var(--site-fg)"
        fontSize="sm"
        fontWeight="semibold"
        mb={1}
      >
        {label}
        {required && (
          <Text as="span" color="fg.error" ms={1} aria-hidden="true">
            *
          </Text>
        )}
      </Select.Label>
      <Select.Control>
        <Select.Trigger
          aria-describedby={helperText ? helperId : undefined}
          minH="48px"
          px={4}
          pe={10}
          borderWidth="1px"
          borderRadius="xl"
          borderColor="var(--site-border)"
          bg="var(--site-control)"
          color="var(--site-fg)"
          cursor="pointer"
          textAlign="start"
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
          <Select.ValueText placeholder={placeholder} lineClamp={1} />
        </Select.Trigger>
        <Select.IndicatorGroup pe={4} color="var(--site-accent-fg)">
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner zIndex={1500}>
          <Select.Content
            p={1.5}
            maxH="320px"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="xl"
            borderColor="var(--site-border)"
            bg="var(--site-surface)"
            color="var(--site-fg)"
            boxShadow="0 12px 32px rgb(0 0 0 / 20%)"
          >
            {collection.items.map((item) => (
              <Select.Item
                item={item}
                key={item.value}
                minH="44px"
                px={3}
                py={2}
                borderRadius="lg"
                cursor="pointer"
                _highlighted={{ bg: "var(--site-control-hover)" }}
                _selected={{
                  bg: "var(--site-accent-soft)",
                  color: "var(--site-accent-fg)",
                  fontWeight: "semibold",
                }}
              >
                <Box flex="1" minW={0}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  {item.description && (
                    <Text
                      fontSize="xs"
                      fontWeight="normal"
                      color="var(--site-muted)"
                      mt={1}
                    >
                      {item.description}
                    </Text>
                  )}
                </Box>
                <Select.ItemIndicator color="var(--site-accent-fg)" />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
      {helperText && (
        <Text
          id={helperId}
          fontSize="xs"
          color="var(--site-muted)"
          lineHeight="tall"
        >
          {helperText}
        </Text>
      )}
    </Select.Root>
  );
}
