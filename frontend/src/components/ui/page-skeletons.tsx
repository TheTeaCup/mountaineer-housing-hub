import { Box, Flex, Grid, SimpleGrid, Skeleton, Stack } from "@chakra-ui/react";

function LoadingRegion({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box role="status" aria-label={label} aria-busy="true">
      <Box aria-hidden="true">{children}</Box>
    </Box>
  );
}

function PropertyCardSkeleton() {
  return (
    <Box
      bg="var(--site-surface)"
      borderRadius="8px"
      overflow="hidden"
      boxShadow="0 2px 8px rgba(0,0,0,0.1)"
    >
      <Skeleton h="200px" />
      <Stack p={6} gap={3}>
        <Skeleton h="6" w="72%" />
        <Skeleton h="5" w="44%" />
        <Skeleton h="4" w="30%" />
        <Skeleton h="4" w="82%" />
        <Skeleton h="4" w="58%" />
        <Skeleton h="10" w="100%" mt={2} />
      </Stack>
    </Box>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading properties">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={7}>
        {Array.from({ length: count }, (_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    </LoadingRegion>
  );
}

export function AgencyGridSkeleton() {
  return (
    <LoadingRegion label="Loading rental agencies">
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
        {Array.from({ length: 4 }, (_, index) => (
          <Stack
            key={index}
            bg="var(--site-surface)"
            borderWidth="1px"
            borderColor="var(--site-border)"
            borderRadius="xl"
            p={6}
            gap={3}
          >
            <Skeleton h="7" w="58%" />
            <Skeleton h="5" w="32%" />
            <Skeleton h="4" w="48%" />
            <Skeleton h="4" w="100%" mt={2} />
            <Skeleton h="4" w="78%" />
          </Stack>
        ))}
      </SimpleGrid>
    </LoadingRegion>
  );
}

export function AgencyDetailSkeleton() {
  return (
    <LoadingRegion label="Loading rental agency">
      <Flex
        mt={6}
        mb={8}
        gap={6}
        justify="space-between"
        align={{ base: "stretch", md: "start" }}
        direction={{ base: "column", md: "row" }}
      >
        <Stack flex="1" gap={4} maxW="720px">
          <Skeleton h="10" w="55%" />
          <Skeleton h="5" w="42%" />
          <Skeleton h="4" w="100%" mt={3} />
          <Skeleton h="4" w="88%" />
        </Stack>
        <Stack
          minW={{ md: "280px" }}
          borderWidth="1px"
          borderColor="var(--site-border)"
          borderRadius="xl"
          p={5}
          gap={4}
        >
          <Skeleton h="6" w="38%" />
          <Skeleton h="4" w="70%" />
          <Skeleton h="10" w="100%" />
        </Stack>
      </Flex>
      <Skeleton h="7" w="230px" mb={4} />
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
        {Array.from({ length: 4 }, (_, index) => (
          <Stack
            key={index}
            borderWidth="1px"
            borderColor="var(--site-border)"
            borderRadius="xl"
            p={5}
            gap={3}
          >
            <Skeleton h="6" w="58%" />
            <Skeleton h="4" w="28%" />
            <Skeleton h="4" w="72%" />
          </Stack>
        ))}
      </SimpleGrid>
    </LoadingRegion>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <LoadingRegion label="Loading property">
      <Stack mt={6} mb={5} gap={3}>
        <Skeleton h="10" w={{ base: "78%", md: "48%" }} />
        <Skeleton h="4" w="140px" />
        <Skeleton h="4" w={{ base: "72%", md: "38%" }} />
      </Stack>
      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={7}>
        <Stack gap={7}>
          <Skeleton h="340px" borderRadius="8px" />
          <Box>
            <Skeleton h="7" w="220px" mb={4} />
            <Stack gap={3}>
              <Skeleton h="4" w="100%" />
              <Skeleton h="4" w="92%" />
              <Skeleton h="4" w="76%" />
            </Stack>
          </Box>
          <Box>
            <Skeleton h="7" w="250px" mb={4} />
            <Stack gap={3}>
              {Array.from({ length: 2 }, (_, index) => (
                <Stack
                  key={index}
                  p={5}
                  borderWidth="1px"
                  borderColor="var(--site-border)"
                  borderRadius="lg"
                  gap={3}
                >
                  <Skeleton h="5" w="38%" />
                  <Skeleton h="4" w="55%" />
                  <Skeleton h="4" w="30%" />
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
        <Stack
          alignSelf="start"
          bg="var(--site-surface)"
          p={6}
          borderWidth="1px"
          borderColor="var(--site-border)"
          borderRadius="xl"
          gap={4}
        >
          <Skeleton h="7" w="82%" />
          <Skeleton h="4" w="64%" />
          <Skeleton h="10" w="100%" />
          <Skeleton h="10" w="100%" />
          <Skeleton h="10" w="100%" />
        </Stack>
      </Grid>
    </LoadingRegion>
  );
}

export function FormPageSkeleton() {
  return (
    <LoadingRegion label="Loading form">
      <Stack gap={5}>
        <Skeleton h="10" w={{ base: "82%", md: "58%" }} />
        <Stack gap={3} mb={2}>
          <Skeleton h="4" w="100%" />
          <Skeleton h="4" w="94%" />
          <Skeleton h="4" w="72%" />
        </Stack>
        {Array.from({ length: 4 }, (_, index) => (
          <Stack key={index} gap={2}>
            <Skeleton h="4" w="150px" />
            <Skeleton h={index === 2 ? "32" : "10"} w="100%" />
          </Stack>
        ))}
        <Skeleton h="10" w="150px" />
      </Stack>
    </LoadingRegion>
  );
}
