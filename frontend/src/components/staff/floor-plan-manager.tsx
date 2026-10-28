import type { FloorPlan } from "@/types/properties";
import { accountRequest } from "@/utils/api/account";
import { planRent } from "@/utils/api/properties";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { notifyError, notifySuccess } from "../ui/toaster";

const emptyPlan = {
  name: "",
  bedrooms: "1",
  bathrooms: "1",
  square_feet: "",
  rent_min: "",
  rent_max: "",
  rent_basis: "per_unit" as FloorPlan["rent_basis"],
  description: "",
};

export default function FloorPlanManager({
  propertyId,
  floorPlans,
  onChange,
}: {
  propertyId: number;
  floorPlans: FloorPlan[];
  onChange: (floorPlans: FloorPlan[]) => void;
}) {
  const [plan, setPlan] = useState(emptyPlan);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  function update(name: keyof typeof plan, value: string) {
    setPlan((current) => ({ ...current, [name]: value }));
  }
  async function add() {
    if (!plan.name.trim()) return;
    setAdding(true);
    try {
      const result = await accountRequest<{ floor_plans: FloorPlan[] }>(
        `/staff/properties/${propertyId}/floor-plans`,
        "POST",
        plan,
      );
      onChange(result.floor_plans);
      setPlan(emptyPlan);
      notifySuccess(
        "Floor plan added",
        "It is now visible on the public listing.",
      );
    } catch (error) {
      notifyError("Could not add floor plan", error);
    } finally {
      setAdding(false);
    }
  }
  async function remove(floorPlanId: number) {
    setDeletingId(floorPlanId);
    try {
      await accountRequest(
        `/staff/properties/${propertyId}/floor-plans/${floorPlanId}`,
        "DELETE",
      );
      onChange(floorPlans.filter((item) => item.id !== floorPlanId));
      setConfirmDeleteId(null);
      notifySuccess("Floor plan removed");
    } catch (error) {
      notifyError("Could not remove floor plan", error);
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
    >
      <Heading as="h2" size="lg" mb={2}>
        Floor plans
      </Heading>
      <Text color="var(--site-muted)" fontSize="sm" mb={5}>
        Add each advertised layout and its monthly rent. Use zero bedrooms for a
        studio; leave pricing blank when it is not published.
      </Text>
      {floorPlans.length > 0 ? (
        <Stack gap={3} mb={6}>
          {floorPlans.map((item) => (
            <Box
              key={item.id}
              borderWidth="1px"
              borderColor="var(--site-border)"
              borderRadius="lg"
              p={4}
            >
              <Flex
                gap={4}
                align={{ base: "stretch", sm: "center" }}
                justify="space-between"
                direction={{ base: "column", sm: "row" }}
              >
                <Box>
                  <Heading as="h3" size="md">
                    {item.name}
                  </Heading>
                  <Text mt={1}>
                    {item.bedrooms === 0
                      ? "Studio"
                      : `${item.bedrooms} ${item.bedrooms === 1 ? "bed" : "beds"}`}{" "}
                    · {item.bathrooms} baths
                    {item.square_feet
                      ? ` · ${item.square_feet.toLocaleString()} sq ft`
                      : ""}
                  </Text>
                  <Text fontWeight="semibold" mt={1}>
                    {planRent(item)}
                  </Text>
                  {item.description && (
                    <Text
                      color="var(--site-muted)"
                      mt={2}
                      whiteSpace="pre-wrap"
                    >
                      {item.description}
                    </Text>
                  )}
                </Box>
                {confirmDeleteId === item.id ? (
                  <Flex gap={2} flexWrap="wrap">
                    <Button
                      type="button"
                      size="sm"
                      colorPalette="red"
                      loading={deletingId === item.id}
                      onClick={() => void remove(item.id)}
                    >
                      Confirm removal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={deletingId !== null}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </Flex>
            </Box>
          ))}
        </Stack>
      ) : (
        <Text mb={6}>No floor plans have been added yet.</Text>
      )}
      <Heading as="h3" size="md" mb={4}>
        Add a floor plan
      </Heading>
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>
            Name <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={plan.name}
            onChange={(event) => update("name", event.target.value)}
            maxLength={100}
            placeholder="2 bedroom / 2 bathroom"
          />
        </Field.Root>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
          <Field.Root required>
            <Field.Label>
              Bedrooms <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="number"
              min={0}
              max={255}
              step={1}
              value={plan.bedrooms}
              onChange={(event) => update("bedrooms", event.target.value)}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              Bathrooms <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="number"
              min={0.5}
              max={99.9}
              step={0.5}
              value={plan.bathrooms}
              onChange={(event) => update("bathrooms", event.target.value)}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Square feet</Field.Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={plan.square_feet}
              onChange={(event) => update("square_feet", event.target.value)}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>Rent basis</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={plan.rent_basis}
                onChange={(event) => update("rent_basis", event.target.value)}
              >
                <option value="per_unit">Per unit</option>
                <option value="per_bedroom">Per bedroom</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root>
            <Field.Label>Minimum monthly rent</Field.Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={plan.rent_min}
              onChange={(event) => update("rent_min", event.target.value)}
              placeholder="Optional"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Maximum monthly rent</Field.Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={plan.rent_max}
              onChange={(event) => update("rent_max", event.target.value)}
              placeholder="Optional"
            />
            <Field.HelperText>
              Only use a maximum when the property advertises a rent range.
            </Field.HelperText>
          </Field.Root>
        </SimpleGrid>
        <Field.Root>
          <Field.Label>Additional notes</Field.Label>
          <Textarea
            value={plan.description}
            onChange={(event) => update("description", event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Optional details such as utilities, furnishing, lease terms, or layout notes"
          />
          <Field.HelperText>
            Shown on the public property page.
          </Field.HelperText>
        </Field.Root>
        <Button
          type="button"
          alignSelf="flex-start"
          bg="#ffc72c"
          color="#111111"
          loading={adding}
          disabled={!plan.name.trim()}
          onClick={() => void add()}
        >
          Add floor plan
        </Button>
      </Stack>
    </Box>
  );
}
