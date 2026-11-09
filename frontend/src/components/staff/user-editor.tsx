import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
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
      <Input
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
  return (
    <Box
      borderWidth="1px"
      borderColor="var(--site-border)"
      p={6}
      borderRadius="xl"
    >
      <Heading as="h2" size="lg" mb={3}>
        Edit user
      </Heading>
      <Text mb={4}>
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
          <Stack gap={4}>
            <Field.Root required>
              <Field.Label>Account name</Field.Label>
              <Input
                name="name"
                required
                maxLength={255}
                defaultValue={user.name}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>Public username</Field.Label>
              <Input
                name="username"
                required
                maxLength={100}
                defaultValue={user.username ?? ""}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Role</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field name="role" defaultValue={user.role}>
                  <option value="user">User / property editor</option>
                  {user.account_kind !== "external" && (
                    <option value="staff">Staff</option>
                  )}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Account status</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field name="status" defaultValue={user.status}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              <Field.HelperText>
                Suspending an account blocks sign-in and ends its active
                sessions.
              </Field.HelperText>
            </Field.Root>
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
      p={6}
      borderRadius="xl"
    >
      <Heading as="h2" size="lg" mb={2}>
        Agency property access
      </Heading>
      <Text mb={4}>
        Grant access to all properties currently managed by an agency, including
        listings linked to it in the future. Moving a property to another agency
        removes this inherited access. Individual property grants are separate.
      </Text>
      <Stack gap={3}>
        {assignedAgencies.map((agency) => (
          <Flex key={agency.id} justify="space-between" gap={3} align="center">
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
        {user.role !== "staff" && user.status === "active" && (
          <Flex gap={3} direction={{ base: "column", sm: "row" }}>
            <NativeSelect.Root flex="1">
              <NativeSelect.Field
                aria-label="Agency to assign"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">Select an agency</option>
                {agencies
                  .filter(
                    (agency) =>
                      !assignedAgencies.some(
                        (assigned) => assigned.id === agency.id,
                      ),
                  )
                  .map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Button
              type="button"
              disabled={!selected || pending}
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
