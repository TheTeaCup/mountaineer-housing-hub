import { Input, type InputProps } from "@chakra-ui/react";

export default function FormInput(props: InputProps) {
  return (
    <Input
      minH="48px"
      px={4}
      borderWidth="1px"
      borderRadius="xl"
      borderColor="var(--site-border)"
      bg="var(--site-control)"
      color="var(--site-fg)"
      _placeholder={{ color: "var(--site-muted)" }}
      _hover={{ borderColor: "var(--site-accent-fg)" }}
      _focusVisible={{
        outline: "2px solid var(--site-accent-fg)",
        outlineOffset: "2px",
      }}
      {...props}
    />
  );
}
