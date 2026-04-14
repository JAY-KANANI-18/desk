import { type ReactNode, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthorization } from "../../context/AuthorizationContext";
import { useAuth } from "../../context/AuthContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { SettingsSidebar } from "./SettingsSidebar";
import {
  buildSettingsStorageKey,
  filterSettingsSections,
  findActiveSettingsMatch,
  type SettingsModuleConfig,
} from "./navigation";

interface SettingsLayoutProps {
  config: SettingsModuleConfig;
  children: ReactNode;
  contentClassName?: string;
}

export const SettingsLayout = ({
  config,
  children,
  contentClassName = "",
}: SettingsLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { canOrg, canWs } = useAuthorization();

  const visibleSections = useMemo(
    () => filterSettingsSections(config.sections, canOrg, canWs),
    [config.sections, canOrg, canWs],
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
    if (activeMatch) {
      navigate(config.basePath);
      return;
    }

    navigate(-1);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <div className="hidden md:flex md:flex-shrink-0">
        <SettingsSidebar sections={visibleSections} title={config.title} />
      </div>

      <div className="relative flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white md:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {!isSelectionScreen && (
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-50"
                  onClick={handleMobileBack}
                  type="button"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {config.title}
                </p>
                <h1 className="truncate text-base font-semibold text-slate-900">
                  {activeMatch ? activeMatch.item.label : ""}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div
              className={`mx-auto w-full max-w-7xl px-4 pb-24 pt-2 md:px-6 md:pb-8 md:pt-8 lg:px-8 ${
                !isMobile && !activeMatch ? "pt-8" : ""
              } ${contentClassName}`}
            >
              {isMobile ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isSelectionScreen ? 28 : -28 }}
                    initial={{ opacity: 0, x: isSelectionScreen ? -28 : 28 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
