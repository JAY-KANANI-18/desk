interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const Toggle = ({ checked, onChange }: ToggleProps) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
