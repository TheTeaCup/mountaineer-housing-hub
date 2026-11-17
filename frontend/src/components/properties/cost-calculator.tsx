import {
  Box,
  Field,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

const costs = [
  { id: "rent", label: "Monthly rent" },
  { id: "electricity", label: "Electricity per month" },
  { id: "water", label: "Water and sewer per month" },
  { id: "internet", label: "Internet per month" },
  { id: "other", label: "Other monthly fees" },
] as const;

type Cost = (typeof costs)[number]["id"];
type ParkingBilling = "included" | "monthly" | "once";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CostCalculator({
  initialRent = null,
}: {
  initialRent?: number | null;
}) {
  const [amounts, setAmounts] = useState<Partial<Record<Cost, number>>>(() =>
    initialRent === null
      ? {}
      : { rent: Math.max(0, Math.round(initialRent * 100)) },
  );
  const [parkingBilling, setParkingBilling] =
    useState<ParkingBilling>("included");
  const [parking, setParking] = useState("");
  const parkingAmount = Math.round(Number(parking) * 100);
  const parkingCents = Number.isFinite(parkingAmount)
    ? Math.max(0, parkingAmount)
    : 0;
  const recurring =
    costs.reduce((total, { id }) => total + (amounts[id] ?? 0), 0) +
    (parkingBilling === "monthly" ? parkingCents : 0);
  const oneTime = parkingBilling === "once" ? parkingCents : 0;

  return (
    <Box
      bg="var(--site-surface)"
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
    >
      <Heading as="h2" size="md" mb={2}>
        True cost of living calculator
      </Heading>
      <Text mb={4} fontSize="sm" color="var(--site-muted)">
        Enter the rent and fees you expect to pay in dollars. Leave included
        costs blank.
        {initialRent !== null &&
          " Rent is prefilled with the lowest published starting price; adjust it for your floor plan."}
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        {costs.map(({ id, label }) => (
          <Field.Root key={id}>
            <Field.Label>{label}</Field.Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0.00"
              defaultValue={
                id === "rent" && initialRent !== null ? initialRent : undefined
              }
              onChange={(event) => {
                const amount = event.currentTarget.valueAsNumber;
                const cents = Number.isFinite(amount)
                  ? Math.max(0, Math.round(amount * 100))
                  : 0;
                setAmounts((current) => ({ ...current, [id]: cents }));
              }}
            />
          </Field.Root>
        ))}
        <Field.Root>
          <Field.Label>Parking billing</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={parkingBilling}
              onChange={(event) =>
                setParkingBilling(event.target.value as ParkingBilling)
              }
            >
              <option value="included">Included / no fee</option>
              <option value="monthly">Monthly</option>
              <option value="once">One time</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        {parkingBilling !== "included" && (
          <Field.Root>
            <Field.Label>Parking fee</Field.Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={parking}
              onChange={(event) => setParking(event.currentTarget.value)}
            />
          </Field.Root>
        )}
      </SimpleGrid>
      <Stack
        role="status"
        mt={4}
        p={4}
        gap={1}
        borderRadius="lg"
        bg="var(--site-muted-surface)"
      >
        <Text fontWeight="semibold">
          Estimated monthly cost {usd.format(recurring / 100)}
        </Text>
        {oneTime > 0 && (
          <>
            <Text fontSize="sm">
              One-time parking {usd.format(oneTime / 100)}
            </Text>
            <Text fontSize="sm">
              First month including parking{" "}
              {usd.format((recurring + oneTime) / 100)}
            </Text>
          </>
        )}
      </Stack>
    </Box>
  );
}
