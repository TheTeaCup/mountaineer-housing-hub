import SEO from "@/components/seo";
import { useAuth } from "@/components/ui/auth-provider";
import SignInRequired from "@/components/ui/sign-in-required";
import { accountRequest } from "@/utils/api/account";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  NativeSelect,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

interface ListingAnalytics {
  id: number;
  name: string;
  slug: string;
  status: string;
  views: number;
  property_website_clicks?: number;
  agency_website_clicks?: number;
  phone_taps?: number;
}

const number = new Intl.NumberFormat("en-US");
const actions = [
  { key: "property_website_clicks", label: "Property website clicks" },
  { key: "agency_website_clicks", label: "Agency website clicks" },
  { key: "phone_taps", label: "Phone taps" },
] as const;

function AnalyticsReport({ days }: { days: string }) {
  const [rows, setRows] = useState<ListingAnalytics[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    accountRequest<ListingAnalytics[]>(`/account/analytics?days=${days}`)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [days, attempt]);

  if (error) {
    return (
      <Stack align="start">
        <Text role="alert">Listing analytics are temporarily unavailable.</Text>
        <Button
          variant="outline"
          onClick={() => {
            setError(false);
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </Button>
      </Stack>
    );
  }
  if (!rows) return <Text role="status">Loading listing analytics…</Text>;
  if (rows.length === 0)
    return <Text>There are no listings available to your account.</Text>;

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const maxViews = Math.max(1, rows[0].views);
  const panel = {
    borderWidth: "1px",
    borderColor: "var(--site-border)",
    borderRadius: "xl",
    bg: "var(--site-surface)",
  };

  return (
    <Stack gap={6}>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        {[
          ["Listing views", totalViews],
          ...actions.map(({ key, label }) => [
            label,
            rows.reduce((sum, row) => sum + (row[key] ?? 0), 0),
          ]),
        ].map(([label, value]) => (
          <Box key={label} {...panel} p={5}>
            <Text color="var(--site-muted)">{label}</Text>
            <Text fontSize="3xl" fontWeight="bold">
              {number.format(Number(value))}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
      <Box {...panel} overflow="hidden">
        <Heading as="h2" size="md" px={5} pt={5} pb={2}>
          Activity by listing
        </Heading>
        <Text px={5} pb={3} fontSize="sm" color="var(--site-muted)">
          {number.format(rows.filter((row) => row.views > 0).length)} of{" "}
          {number.format(rows.length)} listings had views in this period.
        </Text>
        <Table.ScrollArea>
          <Table.Root minW="760px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader scope="col">Listing</Table.ColumnHeader>
                <Table.ColumnHeader scope="col">Status</Table.ColumnHeader>
                <Table.ColumnHeader scope="col" textAlign="end">
                  Views
                </Table.ColumnHeader>
                {actions.map(({ key, label }) => (
                  <Table.ColumnHeader key={key} scope="col" textAlign="end">
                    {label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>
                    {row.status === "published" ? (
                      <NextLink
                        href={`/properties/${encodeURIComponent(row.slug)}`}
                      >
                        {row.name}
                      </NextLink>
                    ) : (
                      row.name
                    )}
                  </Table.Cell>
                  <Table.Cell textTransform="capitalize">
                    {row.status}
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {number.format(row.views)}
                    <Box aria-hidden="true" mt={1} ml="auto" maxW="120px">
                      <Box
                        h="3px"
                        borderRadius="full"
                        bg="#ffc72c"
                        w={`${(row.views / maxViews) * 100}%`}
                      />
                    </Box>
                  </Table.Cell>
                  {actions.map(({ key }) => (
                    <Table.Cell
                      key={key}
                      textAlign="end"
                      fontVariantNumeric="tabular-nums"
                    >
                      {number.format(row[key] ?? 0)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>
    </Stack>
  );
}

export default function AnalyticsPage() {
  const { session, loading } = useAuth();
  const [days, setDays] = useState("30");

  return (
    <Box flex="1" bg="var(--site-bg)" color="var(--site-fg)">
      <SEO title="Listing analytics" noIndex />
      <Container maxW="1100px" py={10}>
        {loading ? (
          <Text role="status">Checking your session…</Text>
        ) : !session ? (
          <SignInRequired
            title="Sign in to view listing analytics"
            description="Use your staff or property manager account to see listing activity."
          />
        ) : (
          <Stack gap={6}>
            <NextLink href="/account">← My account</NextLink>
            <Flex
              justify="space-between"
              align={{ base: "start", md: "end" }}
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <Box>
                <Heading as="h1" size="2xl" mb={2}>
                  Listing analytics
                </Heading>
                <Text color="var(--site-muted)">
                  Views, website clicks, and phone taps come from listing detail
                  pages and include repeat activity. Phone taps count clicks on
                  the contact number. Date ranges include today in UTC.
                </Text>
              </Box>
              <NativeSelect.Root width="auto" minW="160px">
                <NativeSelect.Field
                  aria-label="Date range"
                  value={days}
                  onChange={(event) => setDays(event.currentTarget.value)}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Flex>
            <AnalyticsReport key={`${session.user.id}-${days}`} days={days} />
          </Stack>
        )}
      </Container>
    </Box>
  );
}
