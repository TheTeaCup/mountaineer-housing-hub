import { useAuth } from "@/components/ui/auth-provider";
import FormSelect from "@/components/ui/form-select";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
import { Box, Button, Field, Stack, Text, Textarea } from "@chakra-ui/react";
import NextLink from "next/link";
import { useState } from "react";
import { FiFlag } from "react-icons/fi";

const fields = [
  { value: "address", label: "Address" },
  { value: "contact", label: "Phone or website" },
  { value: "rent", label: "Rent or pricing" },
  { value: "floor_plan", label: "Floor plan" },
  { value: "description", label: "Property description" },
  { value: "amenities", label: "Amenities or other details" },
  { value: "other", label: "Something else" },
];

export default function PropertyCorrectionForm({
  propertyId,
  propertyName,
}: {
  propertyId: number;
  propertyName: string;
}) {
  const { session, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <Box
      mt={8}
      p={{ base: 4, md: 5 }}
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="xl"
      bg="var(--site-surface)"
    >
      <Stack
        direction={{ base: "column", sm: "row" }}
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        gap={3}
      >
        <Box>
          <Text fontWeight="semibold">See something that needs updating?</Text>
          <Text fontSize="sm" color="var(--site-muted)" mt={1}>
            Let us know what is incorrect about {propertyName}.
          </Text>
        </Box>
        <Button
          variant="outline"
          borderRadius="lg"
          borderColor="var(--site-border)"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <FiFlag aria-hidden="true" />
          {open ? "Close" : "Report an update"}
        </Button>
      </Stack>

      {open && (
        <Box
          mt={5}
          pt={5}
          borderTopWidth="1px"
          borderColor="var(--site-border)"
        >
          {submitted ? (
            <Box role="status">
              <Text fontWeight="semibold">
                Thanks for helping keep this listing accurate.
              </Text>
              <Text fontSize="sm" color="var(--site-muted)" mt={1}>
                Your report was sent to the site staff for review.
              </Text>
            </Box>
          ) : loading ? (
            <Text fontSize="sm" color="var(--site-muted)">
              Checking sign-in status…
            </Text>
          ) : !session ? (
            <Text>
              Please <NextLink href="/auth/login">sign in</NextLink> to report
              an update.
            </Text>
          ) : (
            <Box
              as="form"
              onSubmit={async (event) => {
                event.preventDefault();
                setPending(true);
                try {
                  await accountRequest(
                    "/account/property-corrections",
                    "POST",
                    {
                      property_id: propertyId,
                      reported_field: field,
                      details,
                    },
                  );
                  setSubmitted(true);
                  notifySuccess(
                    "Report received",
                    "Staff will review this listing update.",
                  );
                } catch (error) {
                  notifyError("Could not send report", error);
                } finally {
                  setPending(false);
                }
              }}
            >
              <Stack gap={4}>
                <FormSelect
                  label="What needs updating?"
                  value={field}
                  onValueChange={setField}
                  options={fields}
                  placeholder="Choose a listing detail"
                  required
                />
                <Field.Root required>
                  <Field.Label fontWeight="semibold">
                    What should we know?
                  </Field.Label>
                  <Textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    required
                    minLength={5}
                    maxLength={3000}
                    rows={4}
                    placeholder="Describe what is out of date or incorrect. Include the correct information if you know it."
                    borderColor="var(--site-border)"
                    bg="var(--site-control)"
                    color="var(--site-fg)"
                    _placeholder={{ color: "var(--site-muted)" }}
                    _focusVisible={{
                      outline: "2px solid var(--site-accent-fg)",
                      outlineOffset: "2px",
                    }}
                  />
                  <Field.HelperText>
                    Reports are reviewed by staff before any listing changes are
                    made.
                  </Field.HelperText>
                </Field.Root>
                <Button
                  type="submit"
                  alignSelf="start"
                  disabled={pending || !field}
                >
                  {pending ? "Sending report…" : "Send report"}
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
