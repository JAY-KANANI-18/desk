import { useEffect, useState } from "react";
import { Loader2 } from "@/components/ui/icons";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";

/** Facebook OAuth redirect target — must match META_ADS_REDIRECT_URI on the API. */
export default function MetaAdsCallback() {
  const [params] = useSearchParams();
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const closeButtonTimer = window.setTimeout(() => {
      setShowCloseButton(true);
    }, 900);

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "meta_ads_oauth",
          code,
          error,
          error_description: errorDescription,
        },
        window.location.origin,
      );
    }

    window.close();

    return () => {
      window.clearTimeout(closeButtonTimer);
    };
  }, [params]);

  return (
    <div className="flex min-h-[260px] items-center justify-center bg-[var(--color-gray-50)] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <Loader2 size={20} className="animate-spin" />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-[var(--color-gray-900)]">
          Finishing Meta Ads connection
        </h1>
        <p className="mt-2 text-sm text-[var(--color-gray-500)]">
          We&apos;re sending Facebook back to AxoDesk. This window should close
          automatically.
        </p>

        {showCloseButton ? (
          <div className="mt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.close()}
            >
              Close window
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
