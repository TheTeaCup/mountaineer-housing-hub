import { Button, Flex, Text } from "@chakra-ui/react";

export default function PaginationControls({
  page,
  total,
  pageSize,
  label,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  if (pageCount === 1) return null;
  return (
    <Flex
      as="nav"
      aria-label={`${label} pagination`}
      align="center"
      justify="center"
      gap={4}
      py={3}
    >
      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      <Text fontSize="sm">
        Page {currentPage} of {pageCount}
      </Text>
      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </Flex>
  );
}
