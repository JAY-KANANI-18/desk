import {
  CUSTOM_PHONE_COUNTRY_CODE,
  PHONE_COUNTRY_OPTIONS,
  normalizeDialCode,
} from "../phoneUtils";
import { Select } from "../../../components/ui/Select";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";

interface PhoneNumberFieldProps {
  phoneCountryCode: string;
  customPhoneCountryCode: string;
  phoneLocalNumber: string;
  variant?: "default" | "sidebar";
  onChange: (value: {
    phoneCountryCode?: string;
    customPhoneCountryCode?: string;
    phoneLocalNumber?: string;
  }) => void;
}

export function PhoneNumberField({
  phoneCountryCode,
  customPhoneCountryCode,
  phoneLocalNumber,
  variant = "default",
  onChange,
}: PhoneNumberFieldProps) {
  const showCustomCodeInput = phoneCountryCode === CUSTOM_PHONE_COUNTRY_CODE;
  const fieldAppearance = variant === "sidebar" ? "sidebar" : "default";

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <Select
          value={phoneCountryCode}
          onChange={(event) =>
            onChange({
              phoneCountryCode: event.target.value,
              ...(event.target.value === CUSTOM_PHONE_COUNTRY_CODE
                ? {}
                : { customPhoneCountryCode: "" }),
            })
          }
          appearance={fieldAppearance}
          options={[
            ...PHONE_COUNTRY_OPTIONS.map((option) => ({
              value: option.code,
              label: `${option.label} (${option.dialCode})`,
            })),
            {
              value: CUSTOM_PHONE_COUNTRY_CODE,
              label: "Custom country code",
            },
          ]}
        />

        <BaseInput
          appearance={fieldAppearance}
          type="tel"
          placeholder="Phone number"
          value={phoneLocalNumber}
          onChange={(event) =>
            onChange({ phoneLocalNumber: event.target.value })
          }
        />
      </div>

      {showCustomCodeInput ? (
        <BaseInput
          appearance={fieldAppearance}
          type="text"
          placeholder="+998"
          value={customPhoneCountryCode}
          onChange={(event) =>
            onChange({
              customPhoneCountryCode: normalizeDialCode(event.target.value),
            })
          }
        />
      ) : null}
    </div>
  );
}
