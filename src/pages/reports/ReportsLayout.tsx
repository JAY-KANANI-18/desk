import { Outlet, useLocation } from "react-router-dom";
import { Calendar } from "lucide-react";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { ResponsiveModal } from "../../components/ui/modal";
import { reportsSettingsConfig } from "../../config/settingsNavigation";
import { useDisclosure } from "../../hooks/useDisclosure";
import { ReportsDateRangeBar } from "./shared";

export const ReportsLayout = () => {
  const location = useLocation();
  const showFilters = location.pathname !== reportsSettingsConfig.basePath;
  const dateFilterModal = useDisclosure();

  useMobileHeaderActions(
    showFilters
      ? {
          actions: [
            {
              id: "reports-date-filter",
              label: "Date filter",
              icon: <Calendar size={18} />,
              onClick: dateFilterModal.open,
              active: dateFilterModal.isOpen,
              hasIndicator: true,
            },
          ],
        }
      : {},
    [showFilters, dateFilterModal.isOpen, dateFilterModal.open],
  );

  return (
    <>
      <SettingsLayout
        config={reportsSettingsConfig}
        toolbar={showFilters ? <ReportsDateRangeBar /> : undefined}
      >
        <div className="space-y-6">
          <Outlet />
        </div>
      </SettingsLayout>

      <ResponsiveModal
        isOpen={dateFilterModal.isOpen}
        onClose={dateFilterModal.close}
        title="Date filter"
        size="sm"
        mobileBodyClassName="px-4 pb-5"
      >
        <ReportsDateRangeBar />
      </ResponsiveModal>
    </>
  );
};
