let sdkPromise: Promise<any> | null = null;

export function getMetaSDK(): Promise<any> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"));
      return;
    }

    if ((window as any).FB) {
      resolve((window as any).FB);
      return;
    }

    (window as any).fbAsyncInit = function () {
      const FB = (window as any).FB;

      FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });

      resolve(FB);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;

    script.onerror = reject;

    document.head.appendChild(script);
  });

  return sdkPromise;
}