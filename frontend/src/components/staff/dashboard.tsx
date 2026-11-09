import ReviewPhotoGrid, {
  type ReviewPhoto,
} from "@/components/properties/review-photo-grid";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import PaginationControls from "@/components/ui/pagination-controls";
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
  NativeSelect,
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

const ADMIN_PAGE_SIZE = 10;

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
  const [reviewPage, setReviewPage] = useState(1);
  const [apartments, setApartments] = useState<ApartmentSubmission[]>([]);
  const [agencies, setAgencies] = useState<RentalAgency[]>([]);
  const [properties, setProperties] = useState<StaffProperty[]>([]);
  const [propertySearch, setPropertySearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("all");
  const [propertyStatusFilter, setPropertyStatusFilter] = useState("all");
  const [apartmentPage, setApartmentPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);
  const [agencySearch, setAgencySearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [agencyPage, setAgencyPage] = useState(1);
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
      apartments.filter(
        (apartment) =>
          (submissionFilter === "all" ||
            apartment.submission_kind === submissionFilter) &&
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
    [apartments, normalizedPropertySearch, submissionFilter],
  );
  const filteredProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          (propertyStatusFilter === "all" ||
            property.status === propertyStatusFilter) &&
          [
            property.name,
            property.address,
            property.agency_name,
            property.status,
          ].some((value) =>
            value?.toLowerCase().includes(normalizedPropertySearch),
          ),
      ),
    [normalizedPropertySearch, properties, propertyStatusFilter],
  );
  const normalizedAgencySearch = agencySearch.trim().toLowerCase();
  const filteredAgencies = useMemo(
    () =>
      agencies.filter((agency) => {
        const matchesSearch = [
          agency.name,
          agency.website,
          agency.phone,
          agency.email,
        ].some((value) =>
          value?.toLowerCase().includes(normalizedAgencySearch),
        );
        const matchesFilter =
          agencyFilter === "all" ||
          (agencyFilter === "linked" && agency.property_count > 0) ||
          (agencyFilter === "unlinked" && agency.property_count === 0) ||
          (agencyFilter === "missing-contact" &&
            !agency.website &&
            !agency.phone &&
            !agency.email);
        return matchesSearch && matchesFilter;
      }),
    [agencies, agencyFilter, normalizedAgencySearch],
  );
  const currentApartmentPage = Math.min(
    apartmentPage,
    Math.max(1, Math.ceil(filteredApartments.length / ADMIN_PAGE_SIZE)),
  );
  const currentPropertyPage = Math.min(
    propertyPage,
    Math.max(1, Math.ceil(filteredProperties.length / ADMIN_PAGE_SIZE)),
  );
  const currentAgencyPage = Math.min(
    agencyPage,
    Math.max(1, Math.ceil(filteredAgencies.length / ADMIN_PAGE_SIZE)),
  );
  const currentReviewPage = Math.min(
    reviewPage,
    Math.max(1, Math.ceil(reviews.length / ADMIN_PAGE_SIZE)),
  );
  const paginatedApartments = filteredApartments.slice(
    (currentApartmentPage - 1) * ADMIN_PAGE_SIZE,
    currentApartmentPage * ADMIN_PAGE_SIZE,
  );
  const paginatedProperties = filteredProperties.slice(
    (currentPropertyPage - 1) * ADMIN_PAGE_SIZE,
    currentPropertyPage * ADMIN_PAGE_SIZE,
  );
  const paginatedAgencies = filteredAgencies.slice(
    (currentAgencyPage - 1) * ADMIN_PAGE_SIZE,
    currentAgencyPage * ADMIN_PAGE_SIZE,
  );
  const paginatedReviews = reviews.slice(
    (currentReviewPage - 1) * ADMIN_PAGE_SIZE,
    currentReviewPage * ADMIN_PAGE_SIZE,
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
                  {paginatedReviews.map((review) => (
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
                  <PaginationControls
                    page={currentReviewPage}
                    total={reviews.length}
                    pageSize={ADMIN_PAGE_SIZE}
                    label="Pending reviews"
                    onPageChange={setReviewPage}
                  />
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
                      onChange={(event) => {
                        setPropertySearch(event.target.value);
                        setApartmentPage(1);
                        setPropertyPage(1);
                      }}
                    />
                    <Flex gap={4} mt={4} flexWrap="wrap">
                      <Box flex="1" minW="220px">
                        <Text as="label" fontSize="sm" fontWeight="semibold">
                          Pending suggestion type
                        </Text>
                        <NativeSelect.Root mt={1}>
                          <NativeSelect.Field
                            aria-label="Filter pending suggestions by type"
                            value={submissionFilter}
                            onChange={(event) => {
                              setSubmissionFilter(event.currentTarget.value);
                              setApartmentPage(1);
                            }}
                          >
                            <option value="all">All suggestions</option>
                            <option value="property">Properties only</option>
                            <option value="agency">Agencies only</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Box>
                      <Box flex="1" minW="220px">
                        <Text as="label" fontSize="sm" fontWeight="semibold">
                          Existing property status
                        </Text>
                        <NativeSelect.Root mt={1}>
                          <NativeSelect.Field
                            aria-label="Filter existing properties by status"
                            value={propertyStatusFilter}
                            onChange={(event) => {
                              setPropertyStatusFilter(
                                event.currentTarget.value,
                              );
                              setPropertyPage(1);
                            }}
                          >
                            <option value="all">All statuses</option>
                            {Array.from(
                              new Set(
                                properties.map((property) => property.status),
                              ),
                            )
                              .sort()
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status.replace(/_/g, " ")}
                                </option>
                              ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Box>
                    </Flex>
                    {(normalizedPropertySearch ||
                      submissionFilter !== "all" ||
                      propertyStatusFilter !== "all") && (
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
                          onClick={() => {
                            setPropertySearch("");
                            setSubmissionFilter("all");
                            setPropertyStatusFilter("all");
                            setApartmentPage(1);
                            setPropertyPage(1);
                          }}
                        >
                          Clear search and filters
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
                      {normalizedPropertySearch || submissionFilter !== "all"
                        ? "No pending suggestions match this search and filter."
                        : "No apartment suggestions are waiting for review."}
                    </Text>
                  )}
                  {paginatedApartments.map((apartment) => (
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
                  <PaginationControls
                    page={currentApartmentPage}
                    total={filteredApartments.length}
                    pageSize={ADMIN_PAGE_SIZE}
                    label="Pending suggestions"
                    onPageChange={setApartmentPage}
                  />
                  <Heading as="h2" size="lg" mt={6}>
                    Existing properties ({filteredProperties.length})
                  </Heading>
                  {!filteredProperties.length && (
                    <Text>
                      {normalizedPropertySearch ||
                      propertyStatusFilter !== "all"
                        ? "No existing properties match this search and filter."
                        : "No properties are in the catalog yet."}
                    </Text>
                  )}
                  {paginatedProperties.map((property) => (
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
                  <PaginationControls
                    page={currentPropertyPage}
                    total={filteredProperties.length}
                    pageSize={ADMIN_PAGE_SIZE}
                    label="Existing properties"
                    onPageChange={setPropertyPage}
                  />
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
                  <Box {...panel}>
                    <Heading as="h2" size="md" mb={3}>
                      Find an agency
                    </Heading>
                    <Flex gap={4} flexWrap="wrap" align="end">
                      <Box flex="2" minW="240px">
                        <Text as="label" fontSize="sm" fontWeight="semibold">
                          Search
                        </Text>
                        <Input
                          mt={1}
                          type="search"
                          aria-label="Search rental agencies"
                          placeholder="Search name or contact details…"
                          value={agencySearch}
                          onChange={(event) => {
                            setAgencySearch(event.currentTarget.value);
                            setAgencyPage(1);
                          }}
                        />
                      </Box>
                      <Box flex="1" minW="220px">
                        <Text as="label" fontSize="sm" fontWeight="semibold">
                          Filter
                        </Text>
                        <NativeSelect.Root mt={1}>
                          <NativeSelect.Field
                            aria-label="Filter rental agencies"
                            value={agencyFilter}
                            onChange={(event) => {
                              setAgencyFilter(event.currentTarget.value);
                              setAgencyPage(1);
                            }}
                          >
                            <option value="all">All agencies</option>
                            <option value="linked">
                              Has linked properties
                            </option>
                            <option value="unlinked">
                              No linked properties
                            </option>
                            <option value="missing-contact">
                              Missing contact details
                            </option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Box>
                    </Flex>
                    {(normalizedAgencySearch || agencyFilter !== "all") && (
                      <Flex
                        mt={3}
                        align="center"
                        justify="space-between"
                        gap={3}
                      >
                        <Text fontSize="sm">
                          {filteredAgencies.length} matching agencies
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAgencySearch("");
                            setAgencyFilter("all");
                            setAgencyPage(1);
                          }}
                        >
                          Clear search and filter
                        </Button>
                      </Flex>
                    )}
                  </Box>
                  {!filteredAgencies.length && (
                    <Text>
                      {normalizedAgencySearch || agencyFilter !== "all"
                        ? "No agencies match these filters."
                        : "No rental agencies are in the catalog yet."}
                    </Text>
                  )}
                  {paginatedAgencies.map((agency) => (
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
                  <PaginationControls
                    page={currentAgencyPage}
                    total={filteredAgencies.length}
                    pageSize={ADMIN_PAGE_SIZE}
                    label="Rental agencies"
                    onPageChange={setAgencyPage}
                  />
                </Stack>
              ) : (
                <>
                  <Heading as="h2" size="lg" mb={3}>
                    Registered users ({total})
                  </Heading>
                  <NextLink href="/staff/users/new">
                    <Button mb={4}>Create agency / external account</Button>
                  </NextLink>
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
                                    {value} · Edit →
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
