import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
  defineRecipe,
} from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { Toaster } from "./toaster";

const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      recipes: {
        button: defineRecipe({
          base: {
            borderRadius: "lg",
            fontWeight: "semibold",
            _focusVisible: {
              outline: "2px solid var(--site-accent-fg)",
              outlineOffset: "3px",
            },
          },
          variants: {
            variant: {
              outline: {
                borderWidth: "1px",
                borderColor: "var(--site-border)",
                bg: "var(--site-surface)",
                color: "var(--site-fg)",
                _hover: {
                  bg: "var(--site-control-hover)",
                  borderColor: "var(--site-accent-fg)",
                },
              },
              solid: {
                bg: "#ffc72c",
                color: "#111111",
                _hover: { bg: "#e5b324" },
              },
            },
          },
        }),
      },
    },
  }),
);

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
      <Toaster />
    </ChakraProvider>
  );
}
