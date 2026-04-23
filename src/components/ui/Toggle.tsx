interface ToggleProps {
  checked?: boolean;
  enabled?: boolean;
  onChange?: (value: boolean) => void;
  onToggle?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const Toggle = ({
  checked,
  enabled,
  onChange,
  onToggle,
  disabled = false,
  ariaLabel,
  className = "",
}: ToggleProps) => {
  const isChecked = checked ?? enabled ?? false;

  const handleClick = () => {
    if (disabled) return;
    onChange?.(!isChecked);
    onToggle?.();
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${isChecked ? "bg-indigo-600" : "bg-gray-200"} ${className}`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isChecked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
};
