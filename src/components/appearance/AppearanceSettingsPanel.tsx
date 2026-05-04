import type { CSSProperties, ReactNode } from "react";
import {
  AlignRight,
  Check,
  Contrast,
  Menu,
  Moon,
  Palette,
  PanelLeft,
  RotateCcw,
  Sun,
  Type,
} from "lucide-react";
import {
  APPEARANCE_COLOR_PRESETS,
  APPEARANCE_FONT_OPTIONS,
  useAppearance,
  type AppearanceColorPreset,
  type AppearanceFontFamily,
  type AppearanceNavigation,
} from "../../context/AppearanceContext";
import { Button } from "../ui/Button";
import { MobileSheet, SideModal } from "../ui/modal";
import { ToggleSwitch } from "../ui/toggle/ToggleSwitch";

interface AppearanceSettingsPanelProps {
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;

const sectionClassName =
  "rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm";

function PanelSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={sectionClassName}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function SettingTile({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-[4.75rem] items-start justify-between gap-3 rounded-[8px] border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <div className="mb-3 text-slate-600">{icon}</div>
        <div className="truncate text-xs font-semibold text-slate-700">
          {label}
        </div>
      </div>
      <ToggleSwitch
        size="sm"
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

function ChoiceButton({
  selected,
  icon,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="unstyled"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-[3.25rem] rounded-[8px] border px-3 py-2 text-left transition-colors ${
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
      style={classDrivenButtonStyle}
      fullWidth
      contentAlign="start"
      preserveChildLayout
    >
      <span className="flex w-full items-center gap-2">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {label}
        </span>
        {children}
        {selected ? <Check size={14} className="shrink-0" /> : null}
      </span>
    </Button>
  );
}

function ColorButton({
  value,
  selected,
  onSelect,
}: {
  value: AppearanceColorPreset;
  selected: boolean;
  onSelect: (value: AppearanceColorPreset) => void;
}) {
  const preset = APPEARANCE_COLOR_PRESETS.find((item) => item.value === value);
  if (!preset) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={preset.label}
      aria-pressed={selected}
      title={preset.label}
      onClick={() => onSelect(value)}
      className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-[8px] border px-2 py-2 transition-colors ${
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
          : "border-transparent bg-transparent hover:bg-slate-50"
      }`}
    >
      <span
        className="relative flex h-6 w-6 items-center justify-center rounded-[6px] text-white shadow-sm"
        style={{ backgroundColor: preset.color }}
      >
        <Menu size={13} />
        {selected ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white">
            <Check size={10} />
          </span>
        ) : null}
      </span>
      <span className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-slate-500">
        {preset.label}
      </span>
    </button>
  );
}

function FontButton({
  value,
  selected,
  onSelect,
}: {
  value: AppearanceFontFamily;
  selected: boolean;
  onSelect: (value: AppearanceFontFamily) => void;
}) {
  const font = APPEARANCE_FONT_OPTIONS.find((item) => item.value === value);
  if (!font) {
    return null;
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`min-h-[4.25rem] rounded-[8px] border px-3 py-2 text-center transition-colors ${
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      <span
        className="block text-lg font-bold leading-none"
        style={{ fontFamily: font.stack }}
      >
        Aa
      </span>
      <span className="mt-2 block truncate text-[11px] font-semibold">
        {font.label}
      </span>
    </button>
  );
}

function AppearancePanelContent() {
  const { settings, setSetting, resetSettings } = useAppearance();

  const selectNavigation = (value: AppearanceNavigation) => {
    setSetting("navigation", value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SettingTile
          icon={settings.theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          label="Mode"
          checked={settings.theme === "dark"}
          onChange={(checked) => setSetting("theme", checked ? "dark" : "light")}
        />
        <SettingTile
          icon={<Contrast size={18} />}
          label="Contrast"
          checked={settings.contrast === "high"}
          onChange={(checked) =>
            setSetting("contrast", checked ? "high" : "standard")
          }
        />
        <SettingTile
          icon={<AlignRight size={18} />}
          label="Right to left"
          checked={settings.direction === "rtl"}
          onChange={(checked) =>
            setSetting("direction", checked ? "rtl" : "ltr")
          }
        />
        <SettingTile
          icon={<Menu size={18} />}
          label="Compact"
          checked={settings.density === "compact"}
          onChange={(checked) =>
            setSetting("density", checked ? "compact" : "comfortable")
          }
        />
      </div>

      <PanelSection title="Nav" icon={<PanelLeft size={12} />}>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-500">
              Layout
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton
                selected={settings.navigation === "integrated"}
                icon={<PanelLeft size={15} />}
                label="Integrated"
                onClick={() => selectNavigation("integrated")}
              />
              <ChoiceButton
                selected={settings.navigation === "apparent"}
                icon={<PanelLeft size={15} />}
                label="Apparent"
                onClick={() => selectNavigation("apparent")}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-500">
              Color
            </p>
            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_COLOR_PRESETS.map((preset) => (
                <ColorButton
                  key={preset.value}
                  value={preset.value}
                  selected={settings.colorPreset === preset.value}
                  onSelect={(value) => setSetting("colorPreset", value)}
                />
              ))}
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Font" icon={<Type size={12} />}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-500">
              Family
            </p>
            <div className="grid grid-cols-2 gap-2">
              {APPEARANCE_FONT_OPTIONS.map((font) => (
                <FontButton
                  key={font.value}
                  value={font.value}
                  selected={settings.fontFamily === font.value}
                  onSelect={(value) => setSetting("fontFamily", value)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-slate-500">Size</p>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">
                {settings.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={13}
              max={18}
              step={1}
              value={settings.fontSize}
              onChange={(event) =>
                setSetting("fontSize", Number(event.target.value))
              }
              className="appearance-slider w-full"
              aria-label="Font size"
            />
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-300">
              <span>13</span>
              <span>14</span>
              <span>15</span>
              <span>16</span>
              <span>17</span>
              <span>18</span>
            </div>
          </div>
        </div>
      </PanelSection>

      <Button
        type="button"
        variant="secondary"
        leftIcon={<RotateCcw size={14} />}
        onClick={resetSettings}
        fullWidth
      >
        Reset appearance
      </Button>
    </div>
  );
}

export function AppearanceSettingsPanel({
  open,
  isMobile,
  onClose,
}: AppearanceSettingsPanelProps) {
  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Settings
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Appearance
            </h2>
          </div>
        }
        onClose={onClose}
      >
        <div className="p-4">
          <AppearancePanelContent />
        </div>
      </MobileSheet>
    );
  }

  return (
    <SideModal
      isOpen={open}
      onClose={onClose}
      title="Appearance"
      headerIcon={<Palette size={18} className="text-[var(--color-primary)]" />}
      width={360}
      bodyPadding="sm"
    >
      <AppearancePanelContent />
    </SideModal>
  );
}
