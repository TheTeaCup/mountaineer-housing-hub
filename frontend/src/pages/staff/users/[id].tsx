import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface UserDetail {
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
          <NextLink href="/staff/users">← Registered users</NextLink>
          <Heading as="h1" mt={4} mb={5}>
            User property access
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
              <Box
                borderWidth="1px"
                borderColor="var(--site-border)"
                borderRadius="xl"
                p={6}
              >
                <Heading as="h2" size="lg">
                  {result.user.username || "User without a public username"}
                </Heading>
                <Text mt={2}>{result.user.email}</Text>
                <Text color="var(--site-muted)" mt={1}>
                  {result.user.role} · {result.user.status} · joined{" "}
                  {new Date(result.user.created_at).toLocaleDateString()}
                </Text>
              </Box>

              {result.user.role === "staff" ? (
                <Text>
                  Staff members already have access to every property.
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
                  p={6}
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
                    align="end"
                    direction={{ base: "column", sm: "row" }}
                  >
                    <NativeSelect.Root flex="1" w="100%">
                      <NativeSelect.Field
                        aria-label="Property to assign"
                        value={selectedPropertyId}
                        onChange={(event) =>
                          setSelectedPropertyId(event.target.value)
                        }
                      >
                        <option value="">Select a property</option>
                        {availableProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Button
                      loading={pending}
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
