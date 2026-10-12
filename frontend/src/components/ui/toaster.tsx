import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
  max: 3,
});

export function notifySuccess(title: string, description?: string) {
  toaster.create({
    title,
    description,
    type: "success",
    duration: 5000,
    closable: true,
  });
}

export function notifyError(title: string, error: unknown) {
  toaster.create({
    title,
    description: error instanceof Error ? error.message : "Please try again.",
    type: "error",
    duration: 10000,
    closable: true,
  });
}

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }} boxShadow="xl" borderRadius="lg">
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
