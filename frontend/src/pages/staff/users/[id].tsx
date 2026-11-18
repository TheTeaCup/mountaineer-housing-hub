import SEO from "@/components/seo";
import UserEditor, {
  AgencyAccessEditor,
  type ManagedUser,
} from "@/components/staff/user-editor";
import { useAccount } from "@/components/ui/account-provider";
import FormSelect from "@/components/ui/form-select";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest, accountRoleLabel } from "@/utils/api/account";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface UserDetail extends ManagedUser {
  id: number;
  username: string | null;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
}
interface EditableProperty {
  id: number;
  name: string;
  slug: string;
  status: string;
  assigned_at?: string;
}
interface UserAccessResult {
  user: UserDetail;
  assignedProperties: EditableProperty[];
  properties: EditableProperty[];
  assignedAgencies: { id: number; name: string }[];
  agencies: { id: number; name: string }[];
  legalAcceptances: {
    terms_version: string;
    privacy_version: string;
    accepted_at: string;
  }[];
}

export default function StaffUserDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { profile, error: profileError } = useAccount();
  const [result, setResult] = useState<UserAccessResult | null>(null);
  const [error, setError] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (profile?.role !== "staff" || !id) return;
    let active = true;
    accountRequest<UserAccessResult>(`/staff/users/${id}`)
      .then((data) => {
        if (active) {
          setError("");
          setResult(data);
        }
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [id, profile?.role, revision]);

  const availableProperties = useMemo(() => {
    const assigned = new Set(
      result?.assignedProperties.map((property) => property.id) ?? [],
    );
    return (
      result?.properties.filter((property) => !assigned.has(property.id)) ?? []
    );
  }, [result]);

  async function assignProperty() {
    if (!selectedPropertyId) return;
    setPending(true);
    try {
      await accountRequest(
        `/staff/users/${id}/properties/${selectedPropertyId}`,
        "PUT",
      );
      setSelectedPropertyId("");
      setRevision((value) => value + 1);
      notifySuccess("Property access granted");
    } catch (requestError) {
      notifyError("Could not grant property access", requestError);
    } finally {
      setPending(false);
    }
  }

  async function removeProperty(propertyId: number) {
    setPending(true);
    try {
      await accountRequest(
        `/staff/users/${id}/properties/${propertyId}`,
        "DELETE",
      );
      setRevision((value) => value + 1);
      notifySuccess("Property access removed");
    } catch (requestError) {
      notifyError("Could not remove property access", requestError);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <SEO title="Staff · User access" noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="850px" py={10}>
          <NextLink href="/staff/users">← Registered Users</NextLink>
          <Heading as="h1" size="2xl" color="var(--site-heading)" mt={4} mb={5}>
            Edit user and access
          </Heading>
          {profileError || error ? (
            <Text role="alert" color="fg.error">
              {profileError || error}
            </Text>
          ) : !profile ? (
            <Text role="status">Checking staff access…</Text>
          ) : profile.role !== "staff" ? (
            <Text role="alert">Staff access is required.</Text>
          ) : !result || String(result.user.id) !== id ? (
            <Text role="status">Loading user…</Text>
          ) : (
            <Stack gap={6}>
              <UserEditor
                key={`${result.user.id}-${revision}`}
                user={result.user}
                onChange={() => setRevision((value) => value + 1)}
              />
              <AgencyAccessEditor
                user={result.user}
                agencies={result.agencies}
                assignedAgencies={result.assignedAgencies}
                onChange={() => setRevision((value) => value + 1)}
              />
              <Box
                borderWidth="1px"
                borderColor="var(--site-border)"
                borderRadius="xl"
                bg="var(--site-surface)"
                p={{ base: 5, md: 6 }}
              >
                <Heading as="h2" size="lg">
                  {result.user.username || "User without a public username"}
                </Heading>
                <Text mt={2}>{result.user.email}</Text>
                <Text color="var(--site-muted)" mt={1}>
                  {accountRoleLabel(result.user.role)} · {result.user.status} ·
                  joined {new Date(result.user.created_at).toLocaleString()}
                </Text>
                <Text mt={2}>
                  Last sign-in:{" "}
                  {result.user.last_login
                    ? new Date(result.user.last_login).toLocaleString()
                    : "Never"}
                </Text>
                <Heading as="h3" size="md" mt={5} mb={2}>
                  Policy agreements
                </Heading>
                {result.legalAcceptances.length ? (
                  result.legalAcceptances.map((acceptance) => (
                    <Text
                      key={`${acceptance.terms_version}-${acceptance.privacy_version}`}
                      fontSize="sm"
                    >
                      Terms {acceptance.terms_version} · Privacy{" "}
                      {acceptance.privacy_version} · Accepted{" "}
                      {new Date(acceptance.accepted_at).toLocaleString()}
                    </Text>
                  ))
                ) : (
                  <Text>No saved agreement yet.</Text>
                )}
              </Box>

              {result.user.role === "staff" ? (
                <Text>
                  Staff members already have access to every property.
                </Text>
              ) : result.user.role !== "property_manager" ? (
                <Text>
                  Change this account’s role to Property Manager before
                  assigning property or agency access.
                </Text>
              ) : result.user.status !== "active" ? (
                <Text role="alert">
                  Property access cannot be assigned while this account is
                  inactive.
                </Text>
              ) : (
                <Box
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="xl"
                  bg="var(--site-surface)"
                  p={{ base: 5, md: 6 }}
                >
                  <Heading as="h2" size="lg" mb={2}>
                    Assign a property
                  </Heading>
                  <Text color="var(--site-muted)" mb={4}>
                    Assigned users can edit property details, floor plans, and
                    photos.
                  </Text>
                  <Flex
                    gap={3}
                    align={{ base: "stretch", sm: "end" }}
                    direction={{ base: "column", sm: "row" }}
                  >
                    <Box flex="1" minW={0}>
                      <FormSelect
                        label="Property to assign"
                        placeholder="Select a property"
                        value={selectedPropertyId}
                        onValueChange={setSelectedPropertyId}
                        disabled={pending || !availableProperties.length}
                        options={availableProperties.map((property) => ({
                          value: String(property.id),
                          label: property.name,
                        }))}
                      />
                    </Box>
                    <Button
                      loading={pending}
                      minH="48px"
                      disabled={!selectedPropertyId}
                      onClick={() => void assignProperty()}
                    >
                      Grant access
                    </Button>
                  </Flex>
                  {!availableProperties.length && (
                    <Text mt={3} fontSize="sm">
                      Every property is already assigned to this user.
                    </Text>
                  )}
                </Box>
              )}

              <Box>
                <Heading as="h2" size="lg" mb={4}>
                  Assigned properties
                </Heading>
                {!result.assignedProperties.length ? (
                  <Text>No properties are assigned to this user.</Text>
                ) : (
                  <Stack gap={3}>
                    {result.assignedProperties.map((property) => (
                      <Flex
                        key={property.id}
                        borderWidth="1px"
                        borderColor="var(--site-border)"
                        borderRadius="lg"
                        bg="var(--site-surface)"
                        p={4}
                        justify="space-between"
                        align={{ base: "stretch", sm: "center" }}
                        gap={3}
                        direction={{ base: "column", sm: "row" }}
                      >
                        <Box>
                          <Text fontWeight="semibold">{property.name}</Text>
                          <Text color="var(--site-muted)" fontSize="sm">
                            {property.status}
                          </Text>
                        </Box>
                        <Button
                          size="sm"
                          variant="outline"
                          colorPalette="red"
                          disabled={pending}
                          onClick={() => void removeProperty(property.id)}
                        >
                          Remove access
                        </Button>
                      </Flex>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </Container>
      </Box>
    </>
  );
}
