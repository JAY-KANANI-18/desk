import { AuthProvider } from "../context/AuthContext";
import { InnerProviders } from "./InnerProviders";

export const AppProviders = ({ children }: any) => {
  return (
    <AuthProvider>
      <InnerProviders>{children}</InnerProviders>
    </AuthProvider>
  );
};