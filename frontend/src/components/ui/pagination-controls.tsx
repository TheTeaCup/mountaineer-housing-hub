import { Button, Flex, Text } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

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
      mt={5}
      wrap="wrap"
    >
      <Button
        size="sm"
        variant="outline"
        minW="110px"
        _disabled={{ opacity: 0.55, cursor: "not-allowed" }}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <LuChevronLeft /> Previous
      </Button>
      <Text fontSize="sm" color="var(--site-muted)" aria-live="polite">
        Page {currentPage} of {pageCount}
      </Text>
      <Button
        size="sm"
        variant="outline"
        minW="110px"
        _disabled={{ opacity: 0.55, cursor: "not-allowed" }}
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next <LuChevronRight />
      </Button>
    </Flex>
  );
}
