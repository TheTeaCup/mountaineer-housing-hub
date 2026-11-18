import FormSelect from "@/components/ui/form-select";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AgencyActions({
  agency,
}: {
  agency: { id: number; name: string };
}) {
  const router = useRouter();
  const [agencies, setAgencies] = useState<{ id: number; name: string }[]>([]);
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    accountRequest<{ id: number; name: string }[]>("/staff/agencies")
      .then((data) => {
        if (active) setAgencies(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [agency.id]);
  async function act(mode: "reassign" | "merge" | "delete") {
    const destination = agencies.find((item) => String(item.id) === target);
    const message =
      mode === "delete"
        ? `Delete ${agency.name}? Only agencies without linked properties or suggestions can be deleted. Agency editor access will be removed.`
        : `Move all properties and linked suggestions from ${agency.name} to ${destination?.name}? Properties and reviews will be preserved. ${mode === "merge" ? "The old agency will be deleted and its agency editor access removed." : "The old agency will remain in the directory."} Destination agency editors will gain access to the moved properties. Direct property assignments remain unchanged.`;
    if (!window.confirm(message)) return;
    setPending(true);
    try {
      await accountRequest(
        `/staff/agencies/${agency.id}${mode === "delete" ? "" : "/transfer"}`,
        mode === "delete" ? "DELETE" : "POST",
        mode === "delete"
          ? undefined
          : { targetAgencyId: Number(target), mode },
      );
      notifySuccess(
        mode === "delete"
          ? "Agency deleted"
          : mode === "merge"
            ? "Agencies merged"
            : "Properties reassigned",
      );
      await router.push("/staff/agencies");
    } catch (err) {
      notifyError("Could not update agency", err);
    } finally {
      setPending(false);
    }
  }
  return (
    <Box mt={8} pt={6} borderTopWidth="1px" borderColor="var(--site-border)">
      <Heading as="h2" size="lg" mb={3}>
        Change management or merge agencies
      </Heading>
      <Stack gap={4}>
        <Text>
          Move every property and linked suggestion to another agency. Reviews
          stay with their properties. Merge also removes the old agency; its
          editors are not granted access to the destination agency.
        </Text>
        {error && (
          <Text role="alert" color="fg.error">
            {error}
          </Text>
        )}
        <FormSelect
          label="Destination rental agency"
          value={target}
          onValueChange={setTarget}
          disabled={pending}
          options={agencies
            .filter((item) => item.id !== agency.id)
            .map((item) => ({ value: String(item.id), label: item.name }))}
        />
        <Stack direction={{ base: "column", sm: "row" }} gap={3}>
          <Button
            minH="48px"
            disabled={!target || pending}
            onClick={() => void act("reassign")}
          >
            Reassign all properties
          </Button>
          <Button
            minH="48px"
            variant="outline"
            disabled={!target || pending}
            onClick={() => void act("merge")}
          >
            Merge into selected agency
          </Button>
        </Stack>
        <Text fontSize="sm" color="var(--site-muted)">
          For a single property, change its rental agency in the property
          editor. Delete is available once no properties or suggestions are
          linked.
        </Text>
        <Button
          minH="48px"
          variant="outline"
          colorPalette="red"
          disabled={pending}
          onClick={() => void act("delete")}
        >
          Delete this agency
        </Button>
      </Stack>
    </Box>
  );
}
