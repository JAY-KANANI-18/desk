import { Outlet } from "react-router-dom";
import { SettingsLayout } from "../components/settings/SettingsLayout";
import { organizationSettingsConfig } from "../config/settingsNavigation";

export const Organization = () => {
  return (
    <SettingsLayout config={organizationSettingsConfig}>
      <Outlet />
    </SettingsLayout>
  );
};
