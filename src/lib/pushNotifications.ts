const PUSH_DEVICE_KEY_STORAGE = "axodesk:push-device-key";

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export const getOrCreatePushDeviceKey = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(PUSH_DEVICE_KEY_STORAGE);
  if (existing) {
    return existing;
  }

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `push_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(PUSH_DEVICE_KEY_STORAGE, next);
  return next;
};

export const base64UrlToUint8Array = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const raw = window.atob(normalized + padding);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

export const uint8ArrayToBase64Url = (value: Uint8Array) => {
  let binary = "";
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const buildPushDeviceMetadata = () => ({
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  timeZone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined,
  standalone:
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
  screen: {
    width: window.screen.width,
    height: window.screen.height,
    pixelRatio: window.devicePixelRatio,
  },
});

export const detectPushPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return isStandalone ? "ios-pwa" : "ios-browser";
  }

  if (/android/.test(userAgent)) {
    return isStandalone ? "android-pwa" : "android-browser";
  }

  if (/mac os/.test(userAgent)) {
    return isStandalone ? "macos-pwa" : "macos-browser";
  }

  if (/windows/.test(userAgent)) {
    return isStandalone ? "windows-pwa" : "windows-browser";
  }

  return isStandalone ? "web-pwa" : "web-browser";
};

export const buildPushDeviceName = () => {
  const platform = detectPushPlatform()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return `${platform} notifications`;
};
