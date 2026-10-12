import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
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
import { useEffect, useState } from "react";

interface StaffReview {
  id: number;
  name: string;
  username: string | null;
  rating: number;
  body: string;
  pros: string | null;
  cons: string | null;
  recommendation: string | null;
}
interface ApartmentSubmission {
  id: number;
  name: string;
  username: string | null;
  address: string | null;
  submission_kind: "property" | "agency";
  property_type: string | null;
  agency_name: string | null;
  proposed_agency_name: string | null;
  proposed_agency_website: string | null;
  website: string | null;
  information: string | null;
}
interface SiteUser {
  id: number;
  username: string | null;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
}

export default function StaffDashboard({
  section,
}: {
  section: "reviews" | "apartments" | "users";
}) {
  const { session, loading } = useAuth();
  const { profile, error: profileError } = useAccount();
  const tab = section;
  const title =
    section === "users"
      ? "Registered users"
      : section === "apartments"
        ? "Apartment submissions"
        : "Review submissions";
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [apartments, setApartments] = useState<ApartmentSubmission[]>([]);
  const [properties, setProperties] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [editId, setEditId] = useState<number | null>(null);
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (profile?.role !== "staff") return;
    let active = true;
    async function load() {
      setBusy(true);
      setError("");
      try {
        if (tab === "reviews") {
          const data = await accountRequest<StaffReview[]>("/staff/reviews");
          if (active) setReviews(data);
        } else if (tab === "apartments") {
          const data =
            await accountRequest<ApartmentSubmission[]>("/staff/apartments");
          const listings =
            await accountRequest<{ id: number; name: string }[]>(
              "/staff/properties",
            );
          if (active) {
            setApartments(data);
            setProperties(listings);
          }
        } else {
          const data = await accountRequest<{
            users: SiteUser[];
            total: number;
          }>(`/staff/users?page=${page}`);
          if (active) {
            setUsers(data.users);
            setTotal(data.total);
          }
        }
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [profile?.role, tab, page, revision]);
  async function moderate(
    kind: "reviews" | "apartments",
    id: number,
    status: string,
  ) {
    setPending(id);
    setError("");
    try {
      const result = await accountRequest<{ propertyId?: number }>(
        `/staff/${kind}/${id}`,
        "PATCH",
        { status },
      );
      setEditId(result.propertyId ?? null);
      notifySuccess(
        "Submission reviewed",
        kind === "apartments" && status === "approved"
          ? "Suggestion approved and added to the catalog."
          : `Submission ${status}.`,
      );
      setRevision((value) => value + 1);
    } catch (err) {
      notifyError("Could not review submission", err);
    } finally {
      setPending(null);
    }
  }
  const panel = {
    bg: "var(--site-surface)",
    borderWidth: "1px",
    borderColor: "var(--site-border)",
    borderRadius: "lg",
    p: 5,
  };
  return (
    <>
      <SEO title={`Staff · ${title}`} noIndex />
      <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
        <Container maxW="1100px" py={10}>
          <NextLink href="/staff">← Staff dashboard</NextLink>
          <Heading as="h1" mt={4} mb={3}>
            {title}
          </Heading>
          {loading ? (
            <Text>Checking access…</Text>
          ) : !session ? (
            <Text>
              <NextLink href="/auth/login">Sign in</NextLink> with a staff
              account.
            </Text>
          ) : profileError ? (
            <Text role="alert">{profileError}</Text>
          ) : !profile ? (
            <Text>Checking staff access…</Text>
          ) : profile.role !== "staff" ? (
            <Text role="alert">
              Staff access is required to view submissions and users.
            </Text>
          ) : (
            <>
              <Text mb={5}>
                Review submissions and view registered users. Account
                information is for site administration only.
              </Text>
              <Flex gap={3} mb={6} flexWrap="wrap">
                <Button
                  variant="outline"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Refresh
                </Button>
              </Flex>
              {error && (
                <Text role="alert" color="fg.error" mb={4}>
                  {error}
                </Text>
              )}
              {editId && (
                <Box mb={4}>
                  <NextLink href={`/staff/properties/${editId}`}>
                    Edit property details and coordinates →
                  </NextLink>
                </Box>
              )}
              {busy ? (
                <Text role="status">Loading…</Text>
              ) : error ? null : tab === "reviews" ? (
                <Stack gap={4}>
                  <Heading as="h2" size="lg">
                    Pending reviews
                  </Heading>
                  <Text fontSize="sm">
                    Showing up to 100 oldest pending reviews. Approve to
                    publish; reject to keep a review private.
                  </Text>
                  {!reviews.length && (
                    <Text>No reviews waiting for approval.</Text>
                  )}
                  {reviews.map((review) => (
                    <Box {...panel} key={review.id}>
                      <Heading as="h3" size="md">
                        {review.name}
                      </Heading>
                      <Text my={2}>
                        {review.username || "Unknown user"} · {review.rating}/5
                      </Text>
                      <Text whiteSpace="pre-wrap">{review.body}</Text>
                      {review.pros && <Text mt={2}>Pros: {review.pros}</Text>}
                      {review.cons && <Text mt={2}>Cons: {review.cons}</Text>}
                      {review.recommendation && (
                        <Text mt={2}>
                          Recommendation: {review.recommendation}
                        </Text>
                      )}
                      <Flex gap={3} mt={4}>
                        <Button
                          disabled={pending !== null}
                          onClick={() =>
                            moderate("reviews", review.id, "published")
                          }
                        >
                          Approve review
                        </Button>
                        <Button
                          disabled={pending !== null}
                          variant="outline"
                          onClick={() =>
                            moderate("reviews", review.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              ) : tab === "apartments" ? (
                <Stack gap={4}>
                  <Heading as="h2" size="lg">
                    Pending property and agency suggestions
                  </Heading>
                  <Text fontSize="sm">
                    Showing up to 100 oldest suggestions. Approval publishes a
                    property listing or adds a rental agency to the catalog.
                    Edit properties below to add coordinates and verify details.
                  </Text>
                  {!apartments.length && (
                    <Text>No apartment suggestions waiting for review.</Text>
                  )}
                  {apartments.map((apartment) => (
                    <Box {...panel} key={apartment.id}>
                      <Heading as="h3" size="md">
                        {apartment.name}
                      </Heading>
                      <Text my={2}>
                        Submitted by {apartment.username || "Deleted account"}
                      </Text>
                      <Text fontWeight="bold" my={2}>
                        {apartment.submission_kind === "agency"
                          ? "Rental agency / management company"
                          : (apartment.property_type || "property").replace(
                              /_/g,
                              " ",
                            )}
                      </Text>
                      {apartment.address && (
                        <Text>Property address: {apartment.address}</Text>
                      )}
                      {apartment.submission_kind === "property" && (
                        <Text mt={2}>
                          Managed by:{" "}
                          {apartment.agency_name ||
                            (apartment.proposed_agency_name
                              ? `${apartment.proposed_agency_name} (new agency suggested)`
                              : "Unknown")}
                        </Text>
                      )}
                      {apartment.proposed_agency_website && (
                        <Text overflowWrap="anywhere">
                          Suggested agency website:{" "}
                          {apartment.proposed_agency_website}
                        </Text>
                      )}
                      {apartment.website && (
                        <Text overflowWrap="anywhere">
                          Website: {apartment.website}
                        </Text>
                      )}
                      <Text whiteSpace="pre-wrap" mt={2}>
                        {apartment.information}
                      </Text>
                      <Flex gap={3} mt={4}>
                        <NextLink href={`/staff/apartments/${apartment.id}`}>
                          Review and edit before approval →
                        </NextLink>
                        <Button
                          disabled={pending !== null}
                          variant="outline"
                          onClick={() =>
                            moderate("apartments", apartment.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                  <Heading as="h2" size="lg" mt={6}>
                    Edit properties
                  </Heading>
                  {!properties.length && (
                    <Text>No properties in the catalog yet.</Text>
                  )}
                  {properties.map((property) => (
                    <Box {...panel} key={property.id}>
                      <NextLink href={`/staff/properties/${property.id}`}>
                        {property.name} — Edit details and coordinates →
                      </NextLink>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <>
                  <Heading as="h2" size="lg" mb={3}>
                    Registered users ({total})
                  </Heading>
                  <Box overflowX="auto" {...panel}>
                    <table
                      style={{
                        width: "100%",
                        textAlign: "left",
                        borderCollapse: "collapse",
                      }}
                    >
                      <caption style={{ textAlign: "left", paddingBottom: 16 }}>
                        25 accounts per page. Private information is visible
                        only to staff.
                      </caption>
                      <thead>
                        <tr>
                          {[
                            "Username",
                            "Email",
                            "Role",
                            "Status",
                            "Joined",
                            "Last sign-in",
                          ].map((label) => (
                            <th key={label} scope="col" style={{ padding: 12 }}>
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            {[
                              user.username || "—",
                              user.email,
                              user.role,
                              user.status,
                              new Date(user.created_at).toLocaleDateString(),
                              user.last_login
                                ? new Date(user.last_login).toLocaleDateString()
                                : "—",
                            ].map((value, index) => (
                              <td
                                key={index}
                                style={{
                                  padding: 12,
                                  borderTop: "1px solid var(--site-border)",
                                }}
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!users.length && <Text>No accounts on this page.</Text>}
                  </Box>
                  <Flex align="center" gap={4} mt={4}>
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Previous
                    </Button>
                    <Text>
                      Page {page} of {Math.max(1, Math.ceil(total / 25))}
                    </Text>
                    <Button
                      variant="outline"
                      disabled={page * 25 >= total}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </Button>
                  </Flex>
                </>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
