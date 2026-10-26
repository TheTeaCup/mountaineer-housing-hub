import { useAccount } from "@/components/ui/account-provider";
import { useAuth } from "@/components/ui/auth-provider";
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from "@/components/ui/toaster";
import { Box, Button, IconButton, Text } from "@chakra-ui/react";
import { useState } from "react";
import { FiHeart } from "react-icons/fi";

export default function FavoriteButton({
  slug,
  iconOnly = false,
  onImage = false,
}: {
  slug: string;
  iconOnly?: boolean;
  onImage?: boolean;
}) {
  const { session, loading } = useAuth();
  const { favorites, toggleFavorite, error: accountError } = useAccount();
  const [pending, setPending] = useState(false);
  const saved = favorites.some((favorite) => favorite.slug === slug);
  const Control = iconOnly ? IconButton : Button;
  const label = saved ? "Remove apartment from favorites" : "Save apartment";
  return (
    <Box mt={iconOnly ? 0 : 3} position="relative">
      <Control
        variant={iconOnly ? "plain" : "outline"}
        aria-label={label}
        title={accountError || label}
        color={iconOnly && onImage ? "#111111" : undefined}
        bg={iconOnly && onImage ? "rgba(255, 255, 255, 0.92)" : undefined}
        borderRadius={iconOnly ? "lg" : undefined}
        boxShadow={
          iconOnly && onImage ? "0 2px 8px rgba(0, 0, 0, 0.12)" : undefined
        }
        _hover={iconOnly && onImage ? { bg: "white" } : undefined}
        boxSize={iconOnly ? "44px" : undefined}
        css={
          iconOnly
            ? {
                "& > svg": {
                  width: "24px",
                  height: "24px",
                },
              }
            : undefined
        }
        aria-pressed={saved}
        disabled={loading || !!accountError}
        loading={pending}
        onClick={async () => {
          if (!session) {
            notifyInfo(
              "Sign in to save properties",
              "Use the account menu to sign in with your App State account and save your favorites.",
            );
            return;
          }
          setPending(true);
          try {
            await toggleFavorite(slug);
            notifySuccess(
              saved
                ? "Apartment removed from favorites"
                : "Apartment saved to favorites",
            );
          } catch (err) {
            notifyError("Could not update favorites", err);
          } finally {
            setPending(false);
          }
        }}
      >
        <FiHeart
          fill={saved ? (onImage ? "#ffc72c" : "currentColor") : "none"}
        />
        {!iconOnly && (saved ? "Saved apartment" : "Save apartment")}
      </Control>
      {!iconOnly && accountError && (
        <Text
          role="alert"
          fontSize="sm"
          color="fg.error"
          {...(iconOnly
            ? {
                position: "absolute",
                top: "100%",
                right: 0,
                w: "240px",
                bg: "var(--site-surface)",
                p: 3,
                borderRadius: "md",
                boxShadow: "md",
                zIndex: 2,
              }
            : {})}
        >
          {accountError}
        </Text>
      )}
    </Box>
  );
}
