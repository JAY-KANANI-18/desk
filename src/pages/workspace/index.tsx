import { Outlet } from "react-router-dom";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { workspaceSettingsConfig } from "../../config/settingsNavigation";

export const WorkspaceSettings = () => {
  return (
    <SettingsLayout config={workspaceSettingsConfig}>
      <Outlet />
    </SettingsLayout>
  );
};
