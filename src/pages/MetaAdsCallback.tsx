import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/** Facebook OAuth redirect target — must match META_ADS_REDIRECT_URI on the API. */
export default function MetaAdsCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "meta_ads_oauth",
          code,
          error,
          error_description: errorDescription,
        },
        window.location.origin
      );
    }

    window.close();
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center", fontFamily: "system-ui" }}>
      Finishing Meta Ads connection…
    </div>
  );
}
