import ReviewPhotoGrid, {
  type ReviewPhoto,
} from "@/components/properties/review-photo-grid";
import SEO from "@/components/seo";
import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import FormSelect from "@/components/ui/form-select";
import PaginationControls from "@/components/ui/pagination-controls";
import { notifyError, notifySuccess } from "@/components/ui/toaster";
import { accountRequest, accountRoleLabel } from "@/utils/api/account";
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
import { FiArrowLeft, FiRefreshCw, FiUserPlus } from "react-icons/fi";

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
  status: string;
  created_at: string;
  slug: string;
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
interface PropertyCorrectionReport {
  id: number;
  property_id: number;
  reported_field: string;
  details: string;
  created_at: string;
  property_name: string;
  property_slug: string;
  username: string | null;
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
  section: "reviews" | "apartments" | "agencies" | "users" | "corrections";
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
          : section === "corrections"
            ? "Property updates"
            : "Review submissions";
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [reviewTotal, setReviewTotal] = useState(0);
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
  const [corrections, setCorrections] = useState<PropertyCorrectionReport[]>(
    [],
  );
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
          const data = await accountRequest<{
            reviews: StaffReview[];
            total: number;
          }>(`/staff/reviews?status=${reviewStatus}&page=${reviewPage}`);
          if (active) {
            if (reviewPage > 1 && !data.reviews.length)
              setReviewPage((value) => value - 1);
            setReviews(data.reviews);
            setReviewTotal(data.total);
          }
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
        } else if (tab === "corrections") {
          const data =
            await accountRequest<PropertyCorrectionReport[]>(
              "/staff/corrections",
            );
          if (active) setCorrections(data);
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
  }, [profile?.role, tab, page, revision, reviewStatus, reviewPage]);
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
  async function reviewCorrection(
    id: number,
    status: "reviewed" | "dismissed",
  ) {
    setPending(id);
    setError("");
    try {
      await accountRequest(`/staff/corrections/${id}`, "PATCH", { status });
      notifySuccess(
        status === "reviewed" ? "Report marked reviewed" : "Report dismissed",
        "The report was removed from the pending queue.",
      );
      setRevision((value) => value + 1);
    } catch (err) {
      notifyError("Could not update report", err);
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
  const currentReviewPage = reviewPage;
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
  const paginatedReviews = reviews;
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
          <Button
            asChild
            size="sm"
            variant="outline"
            borderRadius="full"
            px={4}
            minH="36px"
            borderColor="var(--site-border)"
            bg="var(--site-surface)"
            _hover={{
              borderColor: "var(--site-accent-fg)",
              bg: "var(--site-control-hover)",
            }}
          >
            <NextLink href="/staff">
              <FiArrowLeft aria-hidden="true" />
              Staff Dashboard
            </NextLink>
          </Button>
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
                  borderRadius="lg"
                  minH="44px"
                  px={5}
                  borderColor="var(--site-border)"
                  bg="var(--site-surface)"
                  _hover={{
                    borderColor: "var(--site-accent-fg)",
                    bg: "var(--site-control-hover)",
                  }}
                  onClick={() => setRevision((value) => value + 1)}
                >
                  <FiRefreshCw aria-hidden="true" />
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
                    Manage reviews
                  </Heading>
                  <Text fontSize="sm">
                    Browse pending, published, and rejected reviews. Reject a
                    published review to remove it from public view, or delete it
                    permanently.
                  </Text>
                  <FormSelect
                    label="Review status"
                    value={reviewStatus}
                    onValueChange={(value) => {
                      setReviewStatus(value);
                      setReviewPage(1);
                    }}
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "published", label: "Published" },
                      { value: "rejected", label: "Rejected" },
                      { value: "all", label: "All reviews" },
                    ]}
                  />
                  {!reviews.length && (
                    <Text>No reviews match this status.</Text>
                  )}
                  {paginatedReviews.map((review) => (
                    <Box {...panel} key={review.id}>
                      <Heading as="h3" size="md">
                        {review.name}
                      </Heading>
                      <Text my={2}>
                        {review.username || "Unknown user"} · {review.rating}/5
                      </Text>
                      <Text fontSize="sm" color="var(--site-muted)" mb={2}>
                        {review.status} ·{" "}
                        {new Date(review.created_at).toLocaleString()}
                      </Text>
                      <NextLink href={`/properties/${review.slug}`}>
                        View property →
                      </NextLink>
                      <Text whiteSpace="pre-wrap" mt={2}>
                        {review.body}
                      </Text>
                      {review.pros && <Text mt={2}>Pros: {review.pros}</Text>}
                      {review.cons && <Text mt={2}>Cons: {review.cons}</Text>}
                      {review.recommendation && (
                        <Text mt={2}>
                          Recommendation: {review.recommendation}
                        </Text>
                      )}
                      <ReviewPhotoGrid photos={review.photos} />
                      <Flex gap={3} mt={4} wrap="wrap">
                        <Button
                          disabled={
                            pending !== null || review.status === "published"
                          }
                          onClick={() =>
                            moderate("reviews", review.id, "published")
                          }
                        >
                          Approve review
                        </Button>
                        <Button
                          disabled={
                            pending !== null || review.status === "rejected"
                          }
                          variant="outline"
                          onClick={() =>
                            moderate("reviews", review.id, "rejected")
                          }
                        >
                          {review.status === "published"
                            ? "Unpublish review"
                            : "Reject"}
                        </Button>
                        <Button
                          variant="outline"
                          colorPalette="red"
                          disabled={pending !== null}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Permanently delete this review and its photos? This cannot be undone.",
                              )
                            )
                              return;
                            setPending(review.id);
                            try {
                              await accountRequest(
                                `/staff/reviews/${review.id}`,
                                "DELETE",
                              );
                              notifySuccess("Review deleted");
                              setRevision((value) => value + 1);
                            } catch (err) {
                              notifyError("Could not delete review", err);
                            } finally {
                              setPending(null);
                            }
                          }}
                        >
                          Delete review
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                  <PaginationControls
                    page={currentReviewPage}
                    total={reviewTotal}
                    pageSize={25}
                    label="Reviews"
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
                        <FormSelect
                          label="Pending suggestion type"
                          value={submissionFilter}
                          onValueChange={(value) => {
                            setSubmissionFilter(value);
                            setApartmentPage(1);
                          }}
                          options={[
                            { value: "all", label: "All suggestions" },
                            { value: "property", label: "Properties only" },
                            { value: "agency", label: "Agencies only" },
                          ]}
                        />
                      </Box>
                      <Box flex="1" minW="220px">
                        <FormSelect
                          label="Existing property status"
                          value={propertyStatusFilter}
                          onValueChange={(value) => {
                            setPropertyStatusFilter(value);
                            setPropertyPage(1);
                          }}
                          options={[
                            { value: "all", label: "All statuses" },
                            ...Array.from(
                              new Set(
                                properties.map((property) => property.status),
                              ),
                            )
                              .sort()
                              .filter((status) => status !== "all")
                              .map((status) => ({
                                value: status,
                                label: status.replace(/_/g, " "),
                              })),
                          ]}
                        />
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
                        <FormSelect
                          label="Filter rental agencies"
                          value={agencyFilter}
                          onValueChange={(value) => {
                            setAgencyFilter(value);
                            setAgencyPage(1);
                          }}
                          options={[
                            { value: "all", label: "All agencies" },
                            { value: "linked", label: "Has linked properties" },
                            {
                              value: "unlinked",
                              label: "No linked properties",
                            },
                            {
                              value: "missing-contact",
                              label: "Missing contact details",
                            },
                          ]}
                        />
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
              ) : tab === "corrections" ? (
                <Stack gap={4}>
                  <Text fontSize="sm" color="var(--site-muted)">
                    Review user reports about inaccurate or outdated property
                    information. Update the listing before marking a report
                    reviewed.
                  </Text>
                  {!corrections.length && (
                    <Text>No property updates are waiting for review.</Text>
                  )}
                  {corrections.map((report) => (
                    <Box {...panel} key={report.id}>
                      <Flex
                        align="start"
                        justify="space-between"
                        gap={4}
                        wrap="wrap"
                      >
                        <Box minW={0}>
                          <Heading as="h3" size="md">
                            {report.property_name}
                          </Heading>
                          <Text mt={1} fontSize="sm" color="var(--site-muted)">
                            {report.reported_field.replace(/_/g, " ")} ·
                            reported by {report.username || "Deleted account"} ·{" "}
                            {new Date(report.created_at).toLocaleString()}
                          </Text>
                          <Text mt={3} whiteSpace="pre-wrap">
                            {report.details}
                          </Text>
                          <Button asChild variant="outline" size="sm" mt={4}>
                            <NextLink
                              href={`/staff/properties/${report.property_id}`}
                            >
                              Open property listing
                            </NextLink>
                          </Button>
                        </Box>
                        <Flex gap={2}>
                          <Button
                            size="sm"
                            disabled={pending !== null}
                            onClick={() =>
                              void reviewCorrection(report.id, "reviewed")
                            }
                          >
                            Mark reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorPalette="red"
                            disabled={pending !== null}
                            onClick={() =>
                              void reviewCorrection(report.id, "dismissed")
                            }
                          >
                            Dismiss
                          </Button>
                        </Flex>
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <>
                  <Heading as="h2" size="lg" mb={3}>
                    Registered users ({total})
                  </Heading>
                  <Button
                    asChild
                    mb={4}
                    minH="44px"
                    px={5}
                    borderRadius="lg"
                    fontWeight="semibold"
                    boxShadow="0 2px 8px rgb(0 0 0 / 16%)"
                    _hover={{
                      transform: "translateY(-1px)",
                      boxShadow: "0 5px 14px rgb(0 0 0 / 22%)",
                    }}
                    transition="transform 0.15s ease, box-shadow 0.15s ease"
                  >
                    <NextLink href="/staff/users/new">
                      <FiUserPlus aria-hidden="true" />
                      Create agency / external account
                    </NextLink>
                  </Button>
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
                            "Edit",
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
                              user.username || "No username",
                              user.email,
                              accountRoleLabel(user.role),
                              user.status,
                              new Date(user.created_at).toLocaleString(),
                              user.last_login
                                ? new Date(user.last_login).toLocaleString()
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
                            <td
                              style={{
                                padding: 12,
                                borderTop: "1px solid var(--site-border)",
                              }}
                            >
                              <Button asChild size="sm" variant="outline">
                                <NextLink href={`/staff/users/${user.id}`}>
                                  Edit
                                </NextLink>
                              </Button>
                            </td>
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
