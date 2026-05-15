import { type ReactNode, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthorization } from "../../context/AuthorizationContext";
import { useAuth } from "../../context/AuthContext";
import { useFeatureFlags } from "../../context/FeatureFlagContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { PageLayout } from "../ui/PageLayout";
import {
  MobileHeaderActionButtons,
  useMobileHeaderActionState,
} from "../mobileHeaderActions";
import { SettingsSidebar } from "./SettingsSidebar";
import {
  buildSettingsStorageKey,
  filterSettingsSections,
  findActiveSettingsMatch,
  type SettingsModuleConfig,
} from "./navigation";
import { BackButton } from "../channels/BackButton";

interface SettingsLayoutProps {
  config: SettingsModuleConfig;
  children: ReactNode;
  contentClassName?: string;
  toolbar?: ReactNode;
}

export const SettingsLayout = ({
  config,
  children,
  contentClassName = "",
  toolbar,
}: SettingsLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { canOrg, canWs } = useAuthorization();
  const { flags } = useFeatureFlags();
  const { registration: mobileHeaderRegistration } =
    useMobileHeaderActionState();

  const visibleSections = useMemo(
    () => filterSettingsSections(config.sections, canOrg, canWs, flags),
    [config.sections, canOrg, canWs, flags],
  );

  const activeMatch = useMemo(
    () => findActiveSettingsMatch(visibleSections, location.pathname),
    [location.pathname, visibleSections],
  );

  const scopedStorageKey = useMemo(
    () => buildSettingsStorageKey(config.storageKey, user?.id),
    [config.storageKey, user?.id],
  );
  const isSelectionScreen = location.pathname === config.basePath;
  const desktopTitle = useMemo(() => {
    if (!activeMatch) {
      return config.title;
    }

    if (config.basePath === "/reports") {
      return `${activeMatch.item.label} report`;
    }

    return activeMatch.item.label;
  }, [activeMatch, config.basePath, config.title]);
  const desktopHeaderTitle = mobileHeaderRegistration.title ?? desktopTitle;
  const desktopHeaderEyebrow = mobileHeaderRegistration.title
    ? mobileHeaderRegistration.eyebrow
    : activeMatch
      ? config.title
      : undefined;
  const desktopHeaderLeading =
    mobileHeaderRegistration.backTo || mobileHeaderRegistration.leading ? (
      <div className="flex items-center gap-2">
        {mobileHeaderRegistration.backTo ? (
          <BackButton
            ariaLabel="Back"
            onClick={() => navigate(mobileHeaderRegistration.backTo ?? config.basePath)}
            size="sm"
          />
        ) : null}
        {mobileHeaderRegistration.leading ? (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
            {mobileHeaderRegistration.leading}
          </div>
        ) : null}
      </div>
    ) : undefined;
  const desktopHeaderToolbar = mobileHeaderRegistration.desktopToolbar ?? toolbar;

  useEffect(() => {
    if (!activeMatch?.item.to || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(scopedStorageKey, activeMatch.item.to);
    } catch {
      // Ignore storage failures and keep navigation functional.
    }
  }, [activeMatch?.item.to, scopedStorageKey]);

  const handleMobileBack = () => {
    if (mobileHeaderRegistration.backTo) {
      navigate(mobileHeaderRegistration.backTo);
      return;
    }

    if (activeMatch) {
      navigate(config.basePath);
      return;
    }

    navigate("/more");
  };

  return (
    <div className="settings-workspace flex h-full min-h-0 overflow-hidden bg-white">
      <div className="hidden md:flex md:flex-shrink-0">
        <SettingsSidebar sections={visibleSections} title={config.title} />
      </div>

      <div className="settings-main-panel relative flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white md:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {(!isSelectionScreen || isMobile) && (
                <BackButton ariaLabel="Back" onClick={handleMobileBack} size="sm"/>
              )}

              {mobileHeaderRegistration.leading ? (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
                  {mobileHeaderRegistration.leading}
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">
                  {mobileHeaderRegistration.eyebrow ?? config.title}
                </p>
                <h1 className="truncate text-base font-semibold text-slate-900">
                  {mobileHeaderRegistration.title ?? (activeMatch ? activeMatch.item.label : "")}
                </h1>
              </div>

              <MobileHeaderActionButtons
                actions={mobileHeaderRegistration.actions}
              />
            </div>
            {mobileHeaderRegistration.panel ? (
              <div className="px-4 pb-3">{mobileHeaderRegistration.panel}</div>
            ) : null}
          </div>

          <div
            className={`min-h-0 flex-1 ${
              isMobile ? "overflow-y-auto" : "overflow-hidden"
            }`}
          >
            {isMobile ? (
              <div
                className={`mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pb-24 pt-2 md:px-6 md:pb-8 md:pt-8 lg:px-8 ${
                  !activeMatch ? "" : ""
                } ${contentClassName}`}
              >
             
                    {children}
                
              </div>
            ) : (
              <PageLayout
                leading={desktopHeaderLeading}
                eyebrow={desktopHeaderEyebrow}
                title={desktopHeaderTitle}
                subtitle={mobileHeaderRegistration.subtitle}
                toolbar={desktopHeaderToolbar}
                className="bg-white"
                contentClassName="min-h-0 flex-1 overflow-y-auto px-0 py-0"
              >
                <div
                  className={`settings-content-area mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-6 md:px-6 md:py-8 lg:px-8 ${contentClassName}`}
                >
                  {children}
                </div>
              </PageLayout>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
