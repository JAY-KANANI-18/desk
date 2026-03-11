
import { AuthProvider } from "../context/AuthContext";
import { OrganizationProvider } from "../context/OrganizationContext";


export const AppProviders = ({ children }: any) => {
  return (
  
        <AuthProvider>
                      <OrganizationProvider>
          
            {children}
            </OrganizationProvider>
        </AuthProvider>
            
  );
};
