import FormInput from "@/components/ui/form-input";
import FormSelect from "@/components/ui/form-select";
import type { Property } from "@/types/properties";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiDollarSign } from "react-icons/fi";

const costs = [
  { id: "rent", label: "Monthly rent" },
  { id: "electricity", label: "Electricity" },
  { id: "water", label: "Water & sewer" },
  { id: "internet", label: "Internet" },
  { id: "other", label: "Other monthly fees" },
] as const;
type Cost = (typeof costs)[number]["id"];
type ParkingBilling =
  "unknown" | "included" | "monthly" | "yearly" | "semester" | "one_time";
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const cents = (value: string) =>
  Number.isFinite(Number(value))
    ? Math.max(0, Math.round(Number(value) * 100))
    : 0;

export default function CostCalculator({
  initialRent = null,
  initialParkingType,
  initialParkingFee = null,
}: {
  initialRent?: number | null;
  initialParkingType?: Property["parking_type"];
  initialParkingFee?: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [amounts, setAmounts] = useState<Partial<Record<Cost, number>>>(() =>
    initialRent === null
      ? {}
      : { rent: Math.max(0, Math.round(initialRent * 100)) },
  );
  const [parkingBilling, setParkingBilling] = useState<ParkingBilling>(
    initialParkingType === "free"
      ? "included"
      : initialParkingType || "unknown",
  );
  const [parking, setParking] = useState(
    initialParkingFee == null ? "" : String(initialParkingFee),
  );
  const [semesterMonths, setSemesterMonths] = useState("4");
  const parkingCents = cents(parking);
  const parkingMonthly =
    parkingBilling === "monthly"
      ? parkingCents
      : parkingBilling === "yearly"
        ? Math.round(parkingCents / 12)
        : parkingBilling === "semester"
          ? Math.round(parkingCents / Math.max(1, Number(semesterMonths) || 4))
          : 0;
  const recurring =
    costs.reduce((total, { id }) => total + (amounts[id] ?? 0), 0) +
    parkingMonthly;
  const oneTime = parkingBilling === "one_time" ? parkingCents : 0;
  const moneyInput = (id: Cost, label: string) => (
    <Field.Root key={id}>
      <Field.Label fontSize="sm" fontWeight="semibold">
        {label}
      </Field.Label>
      <Box position="relative" w="100%">
        <Text
          position="absolute"
          left={4}
          top="12px"
          zIndex={1}
          color="var(--site-muted)"
          aria-hidden="true"
        >
          $
        </Text>
        <FormInput
          aria-label={label}
          type="number"
          fontSize="16px"
          inputMode="decimal"
          min={0}
          step="0.01"
          ps={8}
          pe={16}
          placeholder="0.00"
          defaultValue={
            id === "rent" && initialRent !== null ? initialRent : undefined
          }
          onChange={(event) =>
            setAmounts((current) => ({
              ...current,
              [id]: cents(event.currentTarget.value),
            }))
          }
        />
        <Text
          position="absolute"
          right={4}
          top="14px"
          fontSize="xs"
          color="var(--site-muted)"
          pointerEvents="none"
        >
          / month
        </Text>
      </Box>
    </Field.Root>
  );
  return (
    <Box
      bg="var(--site-surface)"
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="2xl"
      overflow="hidden"
    >
      <Box p={{ base: 5, md: 7 }}>
        <Flex
          align={{ base: "start", sm: "center" }}
          justify="space-between"
          gap={4}
          direction={{ base: "column", sm: "row" }}
        >
          <Flex align="center" gap={3}>
            <Box
              p={3}
              borderRadius="xl"
              bg="var(--site-accent-soft)"
              color="var(--site-accent-fg)"
            >
              <FiDollarSign size={22} aria-hidden="true" />
            </Box>
            <Heading as="h2" fontSize={{ base: "xl", md: "2xl" }}>
              Plan your monthly budget
            </Heading>
          </Flex>
          <Button
            type="button"
            variant="outline"
            flexShrink={0}
            aria-expanded={expanded}
            aria-controls="monthly-budget-calculator"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Hide calculator" : "Open calculator"}
            {expanded ? (
              <FiChevronUp aria-hidden="true" />
            ) : (
              <FiChevronDown aria-hidden="true" />
            )}
          </Button>
        </Flex>
        {!expanded && (
          <Text mt={3} fontSize="sm" color="var(--site-muted)">
            Estimate rent, utilities, and parking in a personal monthly budget.
          </Text>
        )}
        <Box
          id="monthly-budget-calculator"
          display={expanded ? "block" : "none"}
          mt={expanded ? 5 : 0}
        >
          <Text
            mb={6}
            fontSize="sm"
            color="var(--site-muted)"
            lineHeight="tall"
          >
            Add expected costs in dollars. Leave included utilities blank.
            {initialRent !== null &&
              " Rent starts at the lowest published price; adjust it for your floor plan."}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 6, md: 8 }}>
            <Stack gap={4}>
              <Heading as="h3" fontSize="md">
                Rent &amp; utilities
              </Heading>
              {costs.map(({ id, label }) => moneyInput(id, label))}
            </Stack>
            <Stack
              gap={4}
              bg="var(--site-control)"
              p={{ base: 4, md: 5 }}
              borderRadius="xl"
              alignSelf="start"
            >
              <Heading as="h3" fontSize="md">
                Parking
              </Heading>
              <FormSelect
                label="Parking billing"
                value={parkingBilling}
                onValueChange={(value) =>
                  setParkingBilling(value as ParkingBilling)
                }
                options={[
                  {
                    value: "unknown",
                    label: "Not verified / add your estimate",
                  },
                  { value: "included", label: "Included / no fee" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                  { value: "semester", label: "Per semester" },
                  { value: "one_time", label: "One time" },
                ]}
              />
              {!["included", "unknown"].includes(parkingBilling) && (
                <Field.Root>
                  <Field.Label>Parking fee (USD)</Field.Label>
                  <FormInput
                    type="number"
                    fontSize="16px"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={parking}
                    onChange={(event) => setParking(event.target.value)}
                  />
                  <Field.HelperText>
                    Enter the full amount for the selected billing period.
                  </Field.HelperText>
                </Field.Root>
              )}
              {parkingBilling === "semester" && (
                <Field.Root>
                  <Field.Label>Months covered by the semester fee</Field.Label>
                  <FormInput
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    value={semesterMonths}
                    onChange={(event) => setSemesterMonths(event.target.value)}
                  />
                </Field.Root>
              )}
              <Text fontSize="xs" color="var(--site-muted)" lineHeight="tall">
                {parkingBilling === "yearly"
                  ? "The annual fee is divided by 12 for your monthly budget. The full fee may be due upfront."
                  : parkingBilling === "semester"
                    ? "The semester fee is spread over the months you enter. The full fee may be due upfront."
                    : parkingBilling === "unknown"
                      ? "Parking is unverified and is not included in this estimate."
                      : "Use verified pricing or enter your own estimate."}
              </Text>
            </Stack>
          </SimpleGrid>
        </Box>
      </Box>
      {expanded && (
        <Stack
          role="status"
          aria-live="polite"
          p={{ base: 5, md: 7 }}
          gap={2}
          borderTopWidth="1px"
          borderColor="var(--site-border)"
          bg="var(--site-accent-soft)"
        >
          <Text fontSize="sm" fontWeight="semibold">
            Estimated monthly budget
          </Text>
          <Text
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="bold"
            color="var(--site-accent-fg)"
            lineHeight="1.1"
          >
            {usd.format(recurring / 100)}
            <Text as="span" fontSize="sm" fontWeight="normal">
              {" "}
              / month
            </Text>
          </Text>
          {oneTime > 0 && (
            <Text fontSize="sm">
              One-time parking: {usd.format(oneTime / 100)} · First month with
              parking: {usd.format((recurring + oneTime) / 100)}
            </Text>
          )}
          {["yearly", "semester"].includes(parkingBilling) &&
            parkingCents > 0 && (
              <Text fontSize="sm">
                Full parking payment: {usd.format(parkingCents / 100)}{" "}
                {parkingBilling === "yearly" ? "per year" : "per semester"}.
              </Text>
            )}
          <Text fontSize="xs" color="var(--site-muted)">
            Planning estimate based on your entries. Confirm charges and due
            dates with management.
          </Text>
        </Stack>
      )}
    </Box>
  );
}
