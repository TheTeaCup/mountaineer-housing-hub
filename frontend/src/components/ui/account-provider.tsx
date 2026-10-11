import {
  accountRequest,
  type AccountProfile,
  type Favorite,
} from "@/utils/api/account";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-provider";

const AccountContext = createContext<{
  profile: AccountProfile | null;
  favorites: Favorite[];
  error: string;
  refresh: () => Promise<void>;
  toggleFavorite: (slug: string) => Promise<void>;
}>({
  profile: null,
  favorites: [],
  error: "",
  refresh: async () => {},
  toggleFavorite: async () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [error, setError] = useState("");
  const refresh = async () => {
    const [nextProfile, nextFavorites] = await Promise.all([
      accountRequest<AccountProfile>("/account"),
      accountRequest<Favorite[]>("/account/favorites"),
    ]);
    setProfile(nextProfile);
    setFavorites(nextFavorites);
    setError("");
  };
  useEffect(() => {
    let active = true;
    if (session) {
      Promise.all([
        accountRequest<AccountProfile>("/account"),
        accountRequest<Favorite[]>("/account/favorites"),
      ])
        .then(([nextProfile, nextFavorites]) => {
          if (active) {
            setProfile(nextProfile);
            setFavorites(nextFavorites);
            setError("");
          }
        })
        .catch((err: Error) => {
          if (active) setError(err.message);
        });
    }
    return () => {
      active = false;
    };
  }, [session]);
  const toggleFavorite = async (slug: string) => {
    const saved = favorites.some((favorite) => favorite.slug === slug);
    await accountRequest(
      `/account/favorites/${encodeURIComponent(slug)}`,
      saved ? "DELETE" : "PUT",
    );
    await refresh();
  };
  return (
    <AccountContext.Provider
      value={{
        profile: session ? profile : null,
        favorites: session ? favorites : [],
        error: session ? error : "",
        refresh,
        toggleFavorite,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
export const useAccount = () => useContext(AccountContext);
