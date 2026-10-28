import ReviewPhotoGrid, {
  type ReviewPhoto,
} from "@/components/properties/review-photo-grid";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest } from "@/utils/api/account";
import { formatPhoneNumber } from "@/utils/format-phone";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";

interface StaffReview {
  id: number;
  name: string;
  username: string | null;
  rating: number;
  body: string;
  pros: string | null;
  cons: string | null;
  recommendation: string | null;
  photos: ReviewPhoto[];
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
interface RentalAgency {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  property_count: number;
  published_property_count: number;
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
interface StaffProperty {
  id: number;
  name: string;
  slug: string;
  status: string;
  address: string;
  agency_name: string | null;
}

export default function StaffDashboard({
  section,
}: {
  section: "reviews" | "apartments" | "agencies" | "users";
}) {
  const { session, loading } = useAuth();
  const { profile, error: profileError } = useAccount();
  const tab = section;
  const title =
    section === "users"
      ? "Registered users"
      : section === "agencies"
        ? "Rental agencies"
        : section === "apartments"
          ? "Apartment submissions"
          : "Review submissions";
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [apartments, setApartments] = useState<ApartmentSubmission[]>([]);
  const [agencies, setAgencies] = useState<RentalAgency[]>([]);
  const [properties, setProperties] = useState<StaffProperty[]>([]);
  const [propertySearch, setPropertySearch] = useState("");
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
            await accountRequest<StaffProperty[]>("/staff/properties");
          if (active) {
            setApartments(data);
            setProperties(listings);
          }
        } else if (tab === "agencies") {
          const data = await accountRequest<RentalAgency[]>("/staff/agencies");
          if (active) setAgencies(data);
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
  const normalizedPropertySearch = propertySearch.trim().toLowerCase();
  const filteredApartments = useMemo(
    () =>
      apartments.filter((apartment) =>
        [
          apartment.name,
          apartment.address,
          apartment.agency_name,
          apartment.proposed_agency_name,
          apartment.username,
        ].some((value) =>
          value?.toLowerCase().includes(normalizedPropertySearch),
        ),
      ),
    [apartments, normalizedPropertySearch],
  );
  const filteredProperties = useMemo(
    () =>
      properties.filter((property) =>
        [
          property.name,
          property.address,
          property.agency_name,
          property.status,
        ].some((value) =>
          value?.toLowerCase().includes(normalizedPropertySearch),
        ),
      ),
    [normalizedPropertySearch, properties],
  );
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
                Review submissions and manage catalog records or registered
                users. Account information is for site administration only.
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
                      <ReviewPhotoGrid photos={review.photos} />
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
                  <Box {...panel}>
                    <Heading as="h2" size="lg" mb={2}>
                      Find a submission or property
                    </Heading>
                    <Text color="var(--site-muted)" mb={4}>
                      Search by property, address, rental agency, submitter, or
                      publication status.
                    </Text>
                    <Input
                      type="search"
                      aria-label="Search property administration"
                      placeholder="Search properties and pending suggestions…"
                      value={propertySearch}
                      onChange={(event) =>
                        setPropertySearch(event.target.value)
                      }
                    />
                    {normalizedPropertySearch && (
                      <Flex
                        align="center"
                        justify="space-between"
                        gap={3}
                        mt={3}
                      >
                        <Text fontSize="sm">
                          {filteredApartments.length} pending and{" "}
                          {filteredProperties.length} existing results
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPropertySearch("")}
                        >
                          Clear search
                        </Button>
                      </Flex>
                    )}
                  </Box>
                  <Heading as="h2" size="lg">
                    Pending property and agency suggestions ({" "}
                    {filteredApartments.length})
                  </Heading>
                  <Text fontSize="sm">
                    Showing up to 100 oldest suggestions. Approval publishes a
                    property listing or adds a rental agency to the catalog.
                    Edit properties below to add coordinates and verify details.
                  </Text>
                  {!filteredApartments.length && (
                    <Text>
                      {normalizedPropertySearch
                        ? "No pending suggestions match this search."
                        : "No apartment suggestions are waiting for review."}
                    </Text>
                  )}
                  {filteredApartments.map((apartment) => (
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
                      <Flex mt={4}>
                        <NextLink href={`/staff/apartments/${apartment.id}`}>
                          Review and edit before approval →
                        </NextLink>
                      </Flex>
                    </Box>
                  ))}
                  <Heading as="h2" size="lg" mt={6}>
                    Existing properties ({filteredProperties.length})
                  </Heading>
                  {!filteredProperties.length && (
                    <Text>
                      {normalizedPropertySearch
                        ? "No existing properties match this search."
                        : "No properties are in the catalog yet."}
                    </Text>
                  )}
                  {filteredProperties.map((property) => (
                    <Box {...panel} key={property.id}>
                      <Heading as="h3" size="md" mb={2}>
                        {property.name}
                      </Heading>
                      <Text color="var(--site-muted)" mb={1}>
                        {property.address}
                      </Text>
                      <Text fontSize="sm" mb={3}>
                        {property.agency_name
                          ? `Managed by ${property.agency_name} · `
                          : ""}
                        {property.status}
                      </Text>
                      <NextLink href={`/staff/properties/${property.id}`}>
                        Edit property →
                      </NextLink>
                    </Box>
                  ))}
                </Stack>
              ) : tab === "agencies" ? (
                <Stack gap={4}>
                  <Heading as="h2" size="lg">
                    Rental agencies
                  </Heading>
                  <Text fontSize="sm">
                    Agencies are management companies, not property or community
                    names. Every agency appears in the public directory; link
                    its properties here so its public profile is useful.
                  </Text>
                  {!agencies.length && (
                    <Text>No rental agencies are in the catalog yet.</Text>
                  )}
                  {agencies.map((agency) => (
                    <Box {...panel} key={agency.id}>
                      <Heading as="h3" size="md">
                        {agency.name}
                      </Heading>
                      <Text color="var(--site-muted)" my={2}>
                        {formatPhoneNumber(agency.phone) ||
                          agency.email ||
                          "No contact details"}
                      </Text>
                      <Text mb={2}>
                        {agency.property_count}{" "}
                        {agency.property_count === 1
                          ? "property"
                          : "properties"}
                        {agency.published_property_count !==
                        agency.property_count
                          ? ` · ${agency.published_property_count} published`
                          : ""}
                      </Text>
                      {agency.property_count === 0 && (
                        <Text color="fg.warning" mb={2}>
                          No properties are linked yet. If this is a property
                          name, keep it as a property record instead of an
                          agency.
                        </Text>
                      )}
                      {agency.website && (
                        <Text overflowWrap="anywhere" mb={3}>
                          {agency.website}
                        </Text>
                      )}
                      <NextLink href={`/staff/agencies/${agency.id}`}>
                        Edit agency details →
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
                              user.username || "View user",
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
                                {index === 0 ? (
                                  <NextLink href={`/staff/users/${user.id}`}>
                                    {value}
                                  </NextLink>
                                ) : (
                                  value
                                )}
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
