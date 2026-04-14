import { Outlet } from "react-router-dom";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { userSettingsConfig } from "../../config/settingsNavigation";

export const UserSettingsLayout = () => {
  return (
    <SettingsLayout config={userSettingsConfig}>
      <Outlet />
    </SettingsLayout>
  );
};
