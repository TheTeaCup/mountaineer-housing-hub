import FormInput from "@/components/ui/form-input";
import FormSelect from "@/components/ui/form-select";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { notifyError, notifySuccess } from "../ui/toaster";

export interface ManagedUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: string;
  status: string;
  account_kind: string;
  activated_at: string | null;
}
export function SetupLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      bg="var(--site-control)"
      p={4}
      borderRadius="lg"
    >
      <Text fontWeight="semibold" mb={2}>
        Password setup link
      </Text>
      <Text fontSize="sm" mb={3}>
        Share this link privately with the account owner. It expires in 24 hours
        and works once. Creating a new link replaces the previous one.
      </Text>
      <FormInput
        aria-label="Password setup link"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
      />
      <Button
        type="button"
        mt={3}
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            notifyError(
              "Could not copy link",
              new Error("Select and copy the link above."),
            );
          }
        }}
      >
        {copied ? "Copied" : "Copy setup link"}
      </Button>
    </Box>
  );
}
export default function UserEditor({
  user,
  onChange,
}: {
  user: ManagedUser;
  onChange: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [setupUrl, setSetupUrl] = useState("");
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      bg="var(--site-surface)"
      p={{ base: 5, md: 6 }}
      borderRadius="xl"
    >
      <Heading as="h2" size="lg" mb={3}>
        Edit user
      </Heading>
      <Text mb={5} color="var(--site-muted)" overflowWrap="anywhere">
        {user.email} ·{" "}
        {user.account_kind === "external"
          ? user.activated_at
            ? "External account"
            : "External account awaiting password setup"
          : "App State account"}
      </Text>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setPending(true);
          try {
            await accountRequest(`/staff/users/${user.id}`, "PATCH", {
              name: data.get("name"),
              username: data.get("username"),
              role: data.get("role"),
              status: data.get("status"),
            });
            notifySuccess("User updated");
            onChange();
          } catch (error) {
            notifyError("Could not update user", error);
          } finally {
            setPending(false);
          }
        }}
      >
        <fieldset
          disabled={pending}
          style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
        >
          <Stack gap={5}>
            <Field.Root required>
              <Field.Label>Account name</Field.Label>
              <FormInput
                name="name"
                required
                maxLength={255}
                defaultValue={user.name}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>Public username</Field.Label>
              <FormInput
                name="username"
                required
                maxLength={100}
                defaultValue={user.username ?? ""}
              />
            </Field.Root>
            <FormSelect
              name="role"
              label="Role"
              value={role}
              onValueChange={setRole}
              disabled={pending}
              options={[
                { value: "user", label: "User" },
                { value: "property_manager", label: "Property Manager" },
                { value: "staff", label: "Staff" },
              ]}
              helperText="Property managers receive access only to assigned properties or agencies. Staff can manage the entire site."
            />
            <FormSelect
              name="status"
              label="Account status"
              value={status}
              onValueChange={setStatus}
              disabled={pending}
              options={[
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
              ]}
              helperText="Suspending an account blocks sign-in and ends its active sessions."
            />
            <Button type="submit" loading={pending} alignSelf="flex-start">
              Save user
            </Button>
          </Stack>
        </fieldset>
      </form>
      {user.account_kind === "external" && (
        <Stack gap={3} mt={6}>
          <Text fontSize="sm">
            If the account owner needs to set or reset their password, create a
            setup link. Passwords are chosen by the owner.
          </Text>
          <Button
            type="button"
            variant="outline"
            alignSelf="flex-start"
            disabled={pending || user.status !== "active"}
            onClick={async () => {
              setPending(true);
              try {
                const data = await accountRequest<{ setup_url: string }>(
                  `/staff/users/${user.id}/setup-link`,
                  "POST",
                  {},
                );
                setSetupUrl(data.setup_url);
              } catch (error) {
                notifyError("Could not create setup link", error);
              } finally {
                setPending(false);
              }
            }}
          >
            Create password setup link
          </Button>
          {setupUrl && <SetupLink url={setupUrl} />}
        </Stack>
      )}
    </Box>
  );
}

export function AgencyAccessEditor({
  user,
  agencies,
  assignedAgencies,
  onChange,
}: {
  user: ManagedUser;
  agencies: { id: number; name: string }[];
  assignedAgencies: { id: number; name: string }[];
  onChange: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState(false);
  async function update(id: string | number, method: string) {
    setPending(true);
    try {
      await accountRequest(`/staff/users/${user.id}/agencies/${id}`, method);
      setSelected("");
      onChange();
      notifySuccess(
        method === "PUT" ? "Agency access granted" : "Agency access removed",
      );
    } catch (error) {
      notifyError("Could not update agency access", error);
    } finally {
      setPending(false);
    }
  }
  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      bg="var(--site-surface)"
      p={{ base: 5, md: 6 }}
      borderRadius="xl"
    >
      <Heading as="h2" size="lg" mb={2}>
        Agency property access
      </Heading>
      <Text mb={4} color="var(--site-muted)" lineHeight="tall">
        Grant access to all properties currently managed by an agency, including
        listings linked to it in the future. Moving a property to another agency
        removes this inherited access. Individual property grants are separate.
      </Text>
      <Stack gap={3}>
        {assignedAgencies.map((agency) => (
          <Flex
            key={agency.id}
            justify="space-between"
            gap={3}
            align={{ base: "start", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
          >
            <Text>{agency.name}</Text>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => void update(agency.id, "DELETE")}
            >
              Remove agency access
            </Button>
          </Flex>
        ))}
        {!assignedAgencies.length && (
          <Text color="var(--site-muted)">No agency access assigned.</Text>
        )}
        {user.role === "property_manager" && user.status === "active" && (
          <Flex
            gap={3}
            align={{ base: "stretch", sm: "end" }}
            direction={{ base: "column", sm: "row" }}
          >
            <Box flex="1" minW={0}>
              <FormSelect
                label="Agency to assign"
                placeholder="Select an agency"
                value={selected}
                onValueChange={setSelected}
                disabled={pending}
                options={agencies
                  .filter(
                    (agency) =>
                      !assignedAgencies.some(
                        (assigned) => assigned.id === agency.id,
                      ),
                  )
                  .map((agency) => ({
                    value: String(agency.id),
                    label: agency.name,
                  }))}
              />
            </Box>
            <Button
              type="button"
              disabled={!selected || pending}
              minH="48px"
              onClick={() => void update(selected, "PUT")}
            >
              Grant agency access
            </Button>
          </Flex>
        )}
      </Stack>
    </Box>
  );
}
