export interface PhoneCountryOption {
  code: string;
  label: string;
  dialCode: string;
}

export const DEFAULT_PHONE_COUNTRY_CODE = "IN";
export const CUSTOM_PHONE_COUNTRY_CODE = "__custom__";

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: "IN", label: "India", dialCode: "+91" },
  { code: "US", label: "United States", dialCode: "+1" },
  { code: "GB", label: "United Kingdom", dialCode: "+44" },
  { code: "AE", label: "United Arab Emirates", dialCode: "+971" },
  { code: "SA", label: "Saudi Arabia", dialCode: "+966" },
  { code: "SG", label: "Singapore", dialCode: "+65" },
  { code: "AU", label: "Australia", dialCode: "+61" },
  { code: "CA", label: "Canada", dialCode: "+1" },
  { code: "DE", label: "Germany", dialCode: "+49" },
  { code: "FR", label: "France", dialCode: "+33" },
  { code: "ES", label: "Spain", dialCode: "+34" },
  { code: "IT", label: "Italy", dialCode: "+39" },
  { code: "NL", label: "Netherlands", dialCode: "+31" },
  { code: "BR", label: "Brazil", dialCode: "+55" },
  { code: "MX", label: "Mexico", dialCode: "+52" },
  { code: "AR", label: "Argentina", dialCode: "+54" },
  { code: "ZA", label: "South Africa", dialCode: "+27" },
  { code: "NG", label: "Nigeria", dialCode: "+234" },
  { code: "EG", label: "Egypt", dialCode: "+20" },
  { code: "TR", label: "Turkey", dialCode: "+90" },
  { code: "JP", label: "Japan", dialCode: "+81" },
  { code: "KR", label: "South Korea", dialCode: "+82" },
  { code: "CN", label: "China", dialCode: "+86" },
  { code: "HK", label: "Hong Kong", dialCode: "+852" },
  { code: "ID", label: "Indonesia", dialCode: "+62" },
  { code: "MY", label: "Malaysia", dialCode: "+60" },
  { code: "PH", label: "Philippines", dialCode: "+63" },
  { code: "TH", label: "Thailand", dialCode: "+66" },
  { code: "VN", label: "Vietnam", dialCode: "+84" },
  { code: "PK", label: "Pakistan", dialCode: "+92" },
  { code: "BD", label: "Bangladesh", dialCode: "+880" },
  { code: "LK", label: "Sri Lanka", dialCode: "+94" },
  { code: "NP", label: "Nepal", dialCode: "+977" },
];

const PHONE_COUNTRY_OPTIONS_BY_PREFIX = [...PHONE_COUNTRY_OPTIONS].sort(
  (left, right) => right.dialCode.length - left.dialCode.length,
);

export function normalizeDialCode(value: string) {
  const digits = value.replace(/[^\d]/g, "").slice(0, 4);
  return digits ? `+${digits}` : "";
}

export function splitPhoneNumber(value?: string | null) {
  const raw = value?.trim() ?? "";

  if (!raw) {
    return {
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      customPhoneCountryCode: "",
      phoneLocalNumber: "",
    };
  }

  if (!raw.startsWith("+")) {
    return {
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      customPhoneCountryCode: "",
      phoneLocalNumber: raw,
    };
  }

  const compact = raw.replace(/[^\d+]/g, "");
  const matchingOption = PHONE_COUNTRY_OPTIONS_BY_PREFIX.find((option) =>
    compact.startsWith(option.dialCode),
  );

  if (matchingOption) {
    return {
      phoneCountryCode: matchingOption.code,
      customPhoneCountryCode: "",
      phoneLocalNumber: compact.slice(matchingOption.dialCode.length),
    };
  }

  const customCode = compact.match(/^\+\d{1,4}/)?.[0] ?? "";

  return {
    phoneCountryCode: CUSTOM_PHONE_COUNTRY_CODE,
    customPhoneCountryCode: customCode,
    phoneLocalNumber: customCode ? compact.slice(customCode.length) : compact,
  };
}

export function buildPhoneNumber(
  phoneCountryCode: string,
  customPhoneCountryCode: string,
  phoneLocalNumber: string,
) {
  const localNumber = phoneLocalNumber.trim();
  if (!localNumber) {
    return "";
  }

  if (localNumber.startsWith("+")) {
    return localNumber;
  }

  const selectedCountry = PHONE_COUNTRY_OPTIONS.find(
    (option) => option.code === phoneCountryCode,
  );
  const dialCode =
    phoneCountryCode === CUSTOM_PHONE_COUNTRY_CODE
      ? normalizeDialCode(customPhoneCountryCode)
      : selectedCountry?.dialCode ?? "";

  return dialCode ? `${dialCode} ${localNumber}`.trim() : localNumber;
}
