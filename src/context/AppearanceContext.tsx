import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

const STORAGE_KEY = "axodesk:appearance-settings";


export const APPEARANCE_THEMES = ["light", "dark"] as const;
export const APPEARANCE_CONTRASTS = ["standard", "high"] as const;
export const APPEARANCE_DIRECTIONS = ["ltr", "rtl"] as const;
export const APPEARANCE_DENSITIES = ["comfortable", "compact"] as const;
export const APPEARANCE_NAVIGATION = ["integrated", "apparent"] as const;
export const APPEARANCE_ICON_LIBRARIES = ["phosphor", "lucide"] as const;

export type AppearanceTheme = (typeof APPEARANCE_THEMES)[number];
export type AppearanceContrast = (typeof APPEARANCE_CONTRASTS)[number];
export type AppearanceDirection = (typeof APPEARANCE_DIRECTIONS)[number];
export type AppearanceDensity = (typeof APPEARANCE_DENSITIES)[number];
export type AppearanceNavigation = (typeof APPEARANCE_NAVIGATION)[number];
export type AppearanceIconLibrary = (typeof APPEARANCE_ICON_LIBRARIES)[number];

export type AppearanceColorPreset =
  | "axodesk"
  | "mono"
  | "blue"
  | "emerald"
  | "teal"
  | "violet"
  | "royal"
  | "amber"
  | "rose";

export type AppearanceFontFamily =
  | "public-sans"
  | "inter"
  | "dm-sans"
  | "nunito-sans"
  | "roboto";

export interface AppearanceColorPresetOption {
  value: AppearanceColorPreset;
  label: string;
  color: string;
  hover: string;
  light: string;
}

export interface AppearanceFontOption {
  value: AppearanceFontFamily;
  label: string;
  stack: string;
}

export interface AppearanceSettings {
  theme: AppearanceTheme;
  contrast: AppearanceContrast;
  direction: AppearanceDirection;
  density: AppearanceDensity;
  navigation: AppearanceNavigation;
  iconLibrary: AppearanceIconLibrary;
  colorPreset: AppearanceColorPreset;
  fontFamily: AppearanceFontFamily;
  fontSize: number;
}

interface AppearanceContextValue {
  settings: AppearanceSettings;
  setSetting: <Key extends keyof AppearanceSettings>(
    key: Key,
    value: AppearanceSettings[Key],
  ) => void;
  updateSettings: (settings: Partial<AppearanceSettings>) => void;
  resetSettings: () => void;
}

export const APPEARANCE_COLOR_PRESETS: AppearanceColorPresetOption[] = [
  {
    value: "axodesk",
    label: "AxoDesk",
    color: "#4f46e5",
    hover: "#4338ca",
    light: "#e0e7ff",
  },
  {
    value: "mono",
    label: "Black & White",
    color: "#111827",
    hover: "#030712",
    light: "#f3f4f6",
  },
  {
    value: "blue",
    label: "SaaS Blue",
    color: "#2563eb",
    hover: "#1d4ed8",
    light: "#dbeafe",
  },
 
  {
    value: "teal",
    label: "Executive Teal",
    color: "#0f766e",
    hover: "#115e59",
    light: "#ccfbf1",
  },
  
  {
    value: "royal",
    label: "Royal Purple",
    color: "#6d28d9",
    hover: "#5b21b6",
    light: "#f3e8ff",
  },
  
];

export const APPEARANCE_FONT_OPTIONS: AppearanceFontOption[] = [
  {
    value: "public-sans",
    label: "Public Sans",
    stack:
      "'Public Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    value: "inter",
    label: "Inter",
    stack:
      "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    value: "dm-sans",
    label: "DM Sans",
    stack:
      "'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    value: "nunito-sans",
    label: "Nunito Sans",
    stack:
      "'Nunito Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    value: "roboto",
    label: "Roboto",
    stack:
      "'Roboto', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
];

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "light",
  contrast: "standard",
  direction: "ltr",
  density: "comfortable",
  navigation: "integrated",
  iconLibrary: "lucide",
  colorPreset: "axodesk",
  fontFamily: "roboto",
  fontSize: 16,
};

const LEGACY_PHOSPHOR_DEFAULT_SETTINGS: AppearanceSettings = {
  ...DEFAULT_APPEARANCE_SETTINGS,
  iconLibrary: "phosphor",
};

const LEGACY_GENERATED_DEFAULT_SETTINGS: AppearanceSettings = {
  ...DEFAULT_APPEARANCE_SETTINGS,
  colorPreset: "blue",
  fontFamily: "public-sans",
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<Option extends string>(
  value: unknown,
  options: readonly Option[],
): value is Option {
  return typeof value === "string" && options.includes(value as Option);
}

function isColorPreset(value: unknown): value is AppearanceColorPreset {
  return APPEARANCE_COLOR_PRESETS.some((preset) => preset.value === value);
}

function isFontFamily(value: unknown): value is AppearanceFontFamily {
  return APPEARANCE_FONT_OPTIONS.some((font) => font.value === value);
}

function normalizeFontSize(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_APPEARANCE_SETTINGS.fontSize;
  }

  return Math.min(18, Math.max(13, Math.round(value)));
}

function isSameAppearanceSettings(
  first: AppearanceSettings,
  second: AppearanceSettings,
) {
  return (
    first.theme === second.theme &&
    first.contrast === second.contrast &&
    first.direction === second.direction &&
    first.density === second.density &&
    first.navigation === second.navigation &&
    first.iconLibrary === second.iconLibrary &&
    first.colorPreset === second.colorPreset &&
    first.fontFamily === second.fontFamily &&
    first.fontSize === second.fontSize
  );
}

function readStoredSettings(): AppearanceSettings {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE_SETTINGS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return DEFAULT_APPEARANCE_SETTINGS;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) {
      return DEFAULT_APPEARANCE_SETTINGS;
    }

    const normalized: AppearanceSettings = {
      ...DEFAULT_APPEARANCE_SETTINGS,
      theme: isOneOf(parsed.theme, APPEARANCE_THEMES)
        ? parsed.theme
        : DEFAULT_APPEARANCE_SETTINGS.theme,
      contrast: isOneOf(parsed.contrast, APPEARANCE_CONTRASTS)
        ? parsed.contrast
        : DEFAULT_APPEARANCE_SETTINGS.contrast,
      direction: isOneOf(parsed.direction, APPEARANCE_DIRECTIONS)
        ? parsed.direction
        : DEFAULT_APPEARANCE_SETTINGS.direction,
      density: isOneOf(parsed.density, APPEARANCE_DENSITIES)
        ? parsed.density
        : DEFAULT_APPEARANCE_SETTINGS.density,
      navigation: isOneOf(parsed.navigation, APPEARANCE_NAVIGATION)
        ? parsed.navigation
        : DEFAULT_APPEARANCE_SETTINGS.navigation,
      iconLibrary: isOneOf(parsed.iconLibrary, APPEARANCE_ICON_LIBRARIES)
        ? parsed.iconLibrary
        : DEFAULT_APPEARANCE_SETTINGS.iconLibrary,
      colorPreset: isColorPreset(parsed.colorPreset)
        ? parsed.colorPreset
        : DEFAULT_APPEARANCE_SETTINGS.colorPreset,
      fontFamily: isFontFamily(parsed.fontFamily)
        ? parsed.fontFamily
        : DEFAULT_APPEARANCE_SETTINGS.fontFamily,
      fontSize: normalizeFontSize(parsed.fontSize),
    };

    if (
      isSameAppearanceSettings(normalized, LEGACY_GENERATED_DEFAULT_SETTINGS) ||
      isSameAppearanceSettings(normalized, LEGACY_PHOSPHOR_DEFAULT_SETTINGS)
    ) {
      return DEFAULT_APPEARANCE_SETTINGS;
    }

    return normalized;
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
}

function getColorPreset(value: AppearanceColorPreset) {
  return (
    APPEARANCE_COLOR_PRESETS.find((preset) => preset.value === value) ??
    APPEARANCE_COLOR_PRESETS[0]
  );
}

function getFontOption(value: AppearanceFontFamily) {
  return (
    APPEARANCE_FONT_OPTIONS.find((font) => font.value === value) ??
    APPEARANCE_FONT_OPTIONS[0]
  );
}

function applyAppearanceToDocument(settings: AppearanceSettings) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const color = getColorPreset(settings.colorPreset);
  const font = getFontOption(settings.fontFamily);

  root.dataset.appearanceTheme = settings.theme;
  root.dataset.appearanceContrast = settings.contrast;
  root.dataset.appearanceDirection = settings.direction;
  root.dataset.appearanceDensity = settings.density;
  root.dataset.appearanceNavigation = settings.navigation;
  root.dataset.appearanceIconLibrary = settings.iconLibrary;
  root.dataset.appearanceFontSize = String(settings.fontSize);
  root.dir = settings.direction;
  root.classList.toggle("dark", settings.theme === "dark");
  root.style.fontSize = `${settings.fontSize}px`;
  root.style.setProperty("--font-family-base", font.stack);
  root.style.setProperty("--appearance-font-family", font.stack);
  root.style.setProperty("--color-primary", color.color);
  root.style.setProperty("--color-primary-hover", color.hover);
  root.style.setProperty("--color-primary-light", color.light);
  root.style.setProperty("--color-info", color.color);
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppearanceSettings>(
    readStoredSettings,
  );

  useEffect(() => {
    applyAppearanceToDocument(settings);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((next: Partial<AppearanceSettings>) => {
    setSettings((current) => ({ ...current, ...next }));
  }, []);

  const setSetting = useCallback(
    <Key extends keyof AppearanceSettings>(
      key: Key,
      value: AppearanceSettings[Key],
    ) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_APPEARANCE_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setSetting,
      updateSettings,
      resetSettings,
    }),
    [resetSettings, setSetting, settings, updateSettings],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider");
  }

  return context;
}
