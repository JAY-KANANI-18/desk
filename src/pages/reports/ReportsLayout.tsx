import { Outlet, useLocation } from "react-router-dom";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { reportsSettingsConfig } from "../../config/settingsNavigation";
import { ReportsDateRangeBar } from "./shared";

export const ReportsLayout = () => {
  const location = useLocation();
  const showFilters = location.pathname !== reportsSettingsConfig.basePath;

  return (
    <SettingsLayout config={reportsSettingsConfig}>
      <div className="space-y-6">
        {showFilters && <ReportsDateRangeBar />}
        <Outlet />
      </div>
    </SettingsLayout>
  );
};
