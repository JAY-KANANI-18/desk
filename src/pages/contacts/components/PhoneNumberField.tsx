import {
  CUSTOM_PHONE_COUNTRY_CODE,
  PHONE_COUNTRY_OPTIONS,
  normalizeDialCode,
} from "../phoneUtils";

interface PhoneNumberFieldProps {
  phoneCountryCode: string;
  customPhoneCountryCode: string;
  phoneLocalNumber: string;
  onChange: (value: {
    phoneCountryCode?: string;
    customPhoneCountryCode?: string;
    phoneLocalNumber?: string;
  }) => void;
}

const inputClassName =
  "w-full rounded-lg bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 md:border md:border-gray-300 md:bg-white";

export function PhoneNumberField({
  phoneCountryCode,
  customPhoneCountryCode,
  phoneLocalNumber,
  onChange,
}: PhoneNumberFieldProps) {
  const showCustomCodeInput = phoneCountryCode === CUSTOM_PHONE_COUNTRY_CODE;

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <select
          value={phoneCountryCode}
          onChange={(event) =>
            onChange({
              phoneCountryCode: event.target.value,
              ...(event.target.value === CUSTOM_PHONE_COUNTRY_CODE
                ? {}
                : { customPhoneCountryCode: "" }),
            })
          }
          className={inputClassName}
        >
          {PHONE_COUNTRY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label} ({option.dialCode})
            </option>
          ))}
          <option value={CUSTOM_PHONE_COUNTRY_CODE}>Custom country code</option>
        </select>

        <input
          type="tel"
          placeholder="Phone number"
          value={phoneLocalNumber}
          onChange={(event) =>
            onChange({ phoneLocalNumber: event.target.value })
          }
          className={inputClassName}
        />
      </div>

      {showCustomCodeInput ? (
        <input
          type="text"
          placeholder="+998"
          value={customPhoneCountryCode}
          onChange={(event) =>
            onChange({
              customPhoneCountryCode: normalizeDialCode(event.target.value),
            })
          }
          className={inputClassName}
        />
      ) : null}
    </div>
  );
}
