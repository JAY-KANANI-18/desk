import type { PropsWithChildren } from "react";
import { AuthProvider } from "../context/AuthContext";
import { AppearanceProvider } from "../context/AppearanceContext";
import { InnerProviders } from "./InnerProviders";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <InnerProviders>{children}</InnerProviders>
      </AuthProvider>
    </AppearanceProvider>
  );
};
