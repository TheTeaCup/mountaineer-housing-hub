import { Button, Flex, Input, Text } from "@chakra-ui/react";
import { type KeyboardEvent, useState } from "react";
import { FaStar } from "react-icons/fa";

const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"];

export default function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const visibleValue = hovered || value;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let next = value || 1;
    if (["ArrowRight", "ArrowUp"].includes(event.key))
      next = Math.min(5, next + 1);
    else if (["ArrowLeft", "ArrowDown"].includes(event.key))
      next = Math.max(1, next - 1);
    else if (event.key === "Home") next = 1;
    else if (event.key === "End") next = 5;
    else return;
    event.preventDefault();
    onChange(next);
  };

  return (
    <>
      <Input type="hidden" name="rating" value={value || ""} />
      <Flex
        role="radiogroup"
        aria-label="Overall rating"
        gap={{ base: 1, sm: 2 }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} ${rating === 1 ? "star" : "stars"}: ${labels[rating - 1]}`}
            variant="ghost"
            minW={{ base: "44px", sm: "50px" }}
            h={{ base: "44px", sm: "50px" }}
            p={1}
            color={rating <= visibleValue ? "#ffc72c" : "var(--site-border)"}
            _hover={{ color: "#ffc72c", transform: "scale(1.08)" }}
            _focusVisible={{
              outline: "3px solid #ffc72c",
              outlineOffset: "2px",
            }}
            css={{ "& > svg": { width: "32px", height: "32px" } }}
            onMouseEnter={() => setHovered(rating)}
            onFocus={() => setHovered(rating)}
            onBlur={() => setHovered(0)}
            onKeyDown={handleKeyDown}
            onClick={() => onChange(rating)}
          >
            <FaStar aria-hidden="true" />
          </Button>
        ))}
      </Flex>
      <Text mt={2} fontSize="sm" color="var(--site-muted)" minH="1.4em">
        {visibleValue
          ? `${visibleValue} out of 5 — ${labels[visibleValue - 1]}`
          : "Select a rating"}
      </Text>
    </>
  );
}
