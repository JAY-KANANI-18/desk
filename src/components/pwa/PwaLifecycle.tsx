import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const INSTALL_DISMISS_KEY = "axodesk-pwa-install-dismissed";

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: fullscreen)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;

export function PwaLifecycle() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) {
        return;
      }

      if (import.meta.env.DEV) {
        console.info("[PWA] Registered service worker:", swUrl);
      }
    },
    onRegisterError(error) {
      console.error("[PWA] Service worker registration failed", error);
    },
  });

  useEffect(() => {
    const dismissed = window.localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
    setInstallDismissed(dismissed);
    setIsStandalone(isStandaloneMode());

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const handleStandaloneChange = () => setIsStandalone(isStandaloneMode());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPrompt(null);
      setInstallDismissed(true);
      setIsStandalone(true);
      window.localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof displayModeMedia.addEventListener === "function") {
      displayModeMedia.addEventListener("change", handleStandaloneChange);
    } else {
      displayModeMedia.addListener(handleStandaloneChange);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (typeof displayModeMedia.removeEventListener === "function") {
        displayModeMedia.removeEventListener("change", handleStandaloneChange);
      } else {
        displayModeMedia.removeListener(handleStandaloneChange);
      }
    };
  }, []);

  const canInstall = useMemo(
    () =>
      Boolean(installPrompt) &&
      !installDismissed &&
      !isStandalone &&
      !needRefresh,
    [installDismissed, installPrompt, isStandalone, needRefresh],
  );

  const dismissInstallPrompt = () => {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    setInstallDismissed(true);
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setInstallPrompt(null);
      setInstallDismissed(true);
      window.localStorage.setItem(INSTALL_DISMISS_KEY, "1");
      return;
    }

    setInstallPrompt(null);
  };

  const handleRefresh = async () => {
    await updateServiceWorker(true);
  };

  return (
    <>
      {needRefresh && (
        <div className="fixed bottom-[5.5rem] right-3 z-[70] w-[min(100%-1.5rem,24rem)] rounded-3xl bg-slate-950 p-4 text-white shadow-[0_24px_80px_rgba(15,23,42,0.3)] md:bottom-6 md:right-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
              <RefreshCw size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Update ready</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                A newer Axodesk build is available. Reload to apply the latest
                fixes and improvements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Dismiss update prompt"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <RefreshCw size={16} />
              Reload now
            </button>

            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {canInstall && (
        <div className="fixed bottom-[5.5rem] right-3 z-[69] w-[min(100%-1.5rem,24rem)] rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.16)] md:bottom-6 md:right-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Download size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Install Axodesk</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Add Axodesk to the home screen for faster launch, offline shell
                support, and a more app-like workspace experience.
              </p>
            </div>

            <button
              type="button"
              onClick={dismissInstallPrompt}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss install prompt"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Download size={16} />
              Install app
            </button>

            <button
              type="button"
              onClick={dismissInstallPrompt}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* {offlineReady && !needRefresh && (
        <div className="fixed left-3 right-3 top-3 z-[68] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm md:left-auto md:right-6 md:top-6 md:w-[22rem]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <WifiOff size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Offline support is ready</p>
              <p className="mt-1 text-sm text-emerald-800/80">
                Core screens and assets are now available even with unstable
                connectivity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOfflineReady(false)}
              className="rounded-xl p-2 text-emerald-700 transition hover:bg-emerald-100"
              aria-label="Dismiss offline ready notice"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )} */}

      {!isOnline && (
        <div className="fixed left-3 right-3 top-3 z-[67] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm md:left-6 md:right-auto md:top-6 md:w-[22rem]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <WifiOff size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold">You&apos;re offline</p>
              <p className="mt-1 text-sm text-amber-900/80">
                Cached screens remain available, but live inbox and API data
                will resume once the connection returns.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
