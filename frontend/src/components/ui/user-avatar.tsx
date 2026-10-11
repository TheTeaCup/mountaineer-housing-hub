import type { AccountProfile } from "@/utils/api/account";
import Avatar from "boring-avatars";

export const avatarPalettes = {
  gold: ["#ffc72c", "#f6d879", "#263344", "#89a7b1", "#e9ecef"],
  forest: ["#285943", "#8ab17d", "#bed5a4", "#f4e9cd", "#495d63"],
  ocean: ["#164b73", "#3f88c5", "#95d5e7", "#e9f6fb", "#345c72"],
};
export default function UserAvatar({
  seed,
  variant = "beam",
  palette = "gold",
  size = 36,
}: {
  seed: string;
  variant?: AccountProfile["avatar_variant"];
  palette?: AccountProfile["avatar_palette"];
  size?: number;
}) {
  return (
    <Avatar
      size={size}
      name={seed}
      variant={variant}
      colors={avatarPalettes[palette] || avatarPalettes.gold}
    />
  );
}
