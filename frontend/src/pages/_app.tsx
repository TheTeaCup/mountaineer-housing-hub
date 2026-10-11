import SiteLayout from "@/components/navigation/site-layout";
import { AccountProvider } from "@/components/ui/account-provider";
import { AuthProvider } from "@/components/ui/auth-provider";
import { Provider } from "@/components/ui/provider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <Provider>
      <AuthProvider>
        <AccountProvider>
          <SiteLayout map={router.pathname === "/map"}>
            <Component {...pageProps} />
          </SiteLayout>
        </AccountProvider>
      </AuthProvider>
    </Provider>
  );
}
