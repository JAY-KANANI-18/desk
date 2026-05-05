import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export type PhoneCountryCode = CountryCode;

export interface PhoneNumberParseResult {
  rawInput: string;
  displayValue: string;
  e164: string;
  country: PhoneCountryCode;
  isEmpty: boolean;
  isPossible: boolean;
  isValid: boolean;
  error?: string;
}

export interface PhoneNumberValidationResult {
  e164: string;
  country: PhoneCountryCode;
  isEmpty: boolean;
  isPossible: boolean;
  isValid: boolean;
  error?: string;
}

export interface PhoneNumberFormValidationOptions {
  required?: boolean;
  defaultCountry?: string | null;
  requiredMessage?: string;
  invalidMessage?: string;
}

export const DEFAULT_PHONE_COUNTRY = "IN" satisfies PhoneCountryCode;

const E164_PATTERN = /^\+\d{1,15}$/;
const PHONE_INPUT_CHARACTER_PATTERN = /^[\d+\-().\s]+$/;
const PREFERRED_COUNTRY_BY_CALLING_CODE = {
  "1": "US",
  "7": "RU",
  "44": "GB",
  "47": "NO",
  "61": "AU",
  "212": "MA",
  "262": "RE",
  "290": "SH",
  "358": "FI",
  "590": "GP",
  "599": "CW",
  "672": "NF",
} satisfies Partial<Record<string, CountryCode>>;
let countriesByCallingCode: Map<string, CountryCode[]> | null = null;

function getParseOptions(input: string, defaultCountry: PhoneCountryCode) {
  return input.startsWith("+")
    ? ({ extract: false } as const)
    : ({ defaultCountry, extract: false } as const);
}

function createEmptyParseResult(
  country: PhoneCountryCode,
): PhoneNumberParseResult {
  return {
    rawInput: "",
    displayValue: "",
    e164: "",
    country,
    isEmpty: true,
    isPossible: false,
    isValid: false,
  };
}

function getCountriesByCallingCode() {
  if (!countriesByCallingCode) {
    countriesByCallingCode = getCountries().reduce<Map<string, CountryCode[]>>(
      (map, country) => {
        const callingCode = getCountryCallingCode(country);
        const countries = map.get(callingCode) ?? [];
        countries.push(country);
        map.set(callingCode, countries);
        return map;
      },
      new Map(),
    );
  }

  return countriesByCallingCode;
}

function getCountryFromCallingCode(
  input: string,
  currentCountry: PhoneCountryCode,
) {
  if (!input.trim().startsWith("+")) {
    return undefined;
  }

  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }

  for (let length = Math.min(3, digits.length); length > 0; length -= 1) {
    const callingCode = digits.slice(0, length);
    const countries = getCountriesByCallingCode().get(callingCode);

    if (countries?.length) {
      const preferredCountry = PREFERRED_COUNTRY_BY_CALLING_CODE[callingCode];

      if (countries.includes(currentCountry)) {
        return currentCountry;
      }

      if (preferredCountry && countries.includes(preferredCountry)) {
        return preferredCountry;
      }

      return countries[0];
    }
  }

  return undefined;
}

export function normalizePhoneCountry(
  country: string | null | undefined,
  fallback: PhoneCountryCode = DEFAULT_PHONE_COUNTRY,
) {
  const normalized = country?.trim().toUpperCase();
  return normalized && isSupportedCountry(normalized) ? normalized : fallback;
}

export function isAllowedPhoneInput(value: string) {
  return value.length === 0 || PHONE_INPUT_CHARACTER_PATTERN.test(value);
}

export function sanitizePhoneInput(value: string) {
  let nextValue = "";
  let hasPlus = false;

  for (const character of value) {
    if (/\d/.test(character)) {
      nextValue += character;
      continue;
    }

    if (character === "+") {
      if (!hasPlus && nextValue.trim().length === 0) {
        nextValue += character;
        hasPlus = true;
      }
      continue;
    }

    if (/[\-().\s]/.test(character)) {
      nextValue += character;
    }
  }

  return nextValue.replace(/\s+/g, " ").trimStart();
}

export function parsePhoneNumberValue(
  value: string | null | undefined,
  defaultCountry: string | null | undefined = DEFAULT_PHONE_COUNTRY,
): PhoneNumberParseResult {
  const country = normalizePhoneCountry(defaultCountry);
  const rawInput = sanitizePhoneInput(value ?? "");

  if (!rawInput.trim()) {
    return createEmptyParseResult(country);
  }

  const parseOptions = getParseOptions(rawInput.trim(), country);
  const formatter = new AsYouType(
    rawInput.trim().startsWith("+") ? undefined : country,
  );
  const displayValue = formatter.input(rawInput);
  const formatterNumber = formatter.getNumber();

  let parsedNumber = formatterNumber;
  try {
    parsedNumber = parsePhoneNumber(rawInput, parseOptions);
  } catch {
    parsedNumber =
      parsePhoneNumberFromString(rawInput, parseOptions) ?? formatterNumber;
  }

  const resolvedCountry =
    parsedNumber?.country ??
    formatter.getCountry() ??
    getCountryFromCallingCode(rawInput, country) ??
    country;
  const e164 =
    parsedNumber?.number && E164_PATTERN.test(parsedNumber.number)
      ? parsedNumber.number
      : "";
  const isPossible = parsedNumber?.isPossible() ?? false;
  const isValid = parsedNumber?.isValid() ?? false;
  const error = !parsedNumber
    ? "Enter a phone number with a valid country code."
    : !isPossible
      ? "Enter a possible phone number."
      : !isValid
        ? "Enter a valid phone number."
        : undefined;

  return {
    rawInput,
    displayValue: displayValue || rawInput,
    e164,
    country: resolvedCountry,
    isEmpty: false,
    isPossible,
    isValid,
    error,
  };
}

export function validatePhoneNumber(
  value: string | null | undefined,
  defaultCountry: string | null | undefined = DEFAULT_PHONE_COUNTRY,
): PhoneNumberValidationResult {
  const country = normalizePhoneCountry(defaultCountry);
  const rawInput = sanitizePhoneInput(value ?? "");

  if (!rawInput.trim()) {
    return {
      e164: "",
      country,
      isEmpty: true,
      isPossible: false,
      isValid: false,
    };
  }

  try {
    const phoneNumber = parsePhoneNumber(rawInput, getParseOptions(rawInput, country));
    const isPossible = phoneNumber.isPossible();
    const isValid = phoneNumber.isValid();
    const e164 = E164_PATTERN.test(phoneNumber.number) ? phoneNumber.number : "";

    return {
      e164,
      country:
        phoneNumber.country ??
        getCountryFromCallingCode(rawInput, country) ??
        country,
      isEmpty: false,
      isPossible,
      isValid,
      error: !isPossible
        ? "Enter a possible phone number."
        : !isValid
          ? "Enter a valid phone number."
          : undefined,
    };
  } catch {
    return {
      e164: "",
      country: getCountryFromCallingCode(rawInput, country) ?? country,
      isEmpty: false,
      isPossible: false,
      isValid: false,
      error: "Enter a phone number with a valid country code.",
    };
  }
}

export function validatePhoneNumberForForm(
  value: string | null | undefined,
  options: PhoneNumberFormValidationOptions = {},
): true | string {
  const validation = validatePhoneNumber(value, options.defaultCountry);

  if (validation.isEmpty) {
    return options.required
      ? options.requiredMessage ?? "Enter a phone number."
      : true;
  }

  if (!validation.isPossible || !validation.isValid) {
    return options.invalidMessage ?? validation.error ?? "Enter a valid phone number.";
  }

  return true;
}

export function normalizePhoneE164(
  value: string | null | undefined,
  defaultCountry: string | null | undefined = DEFAULT_PHONE_COUNTRY,
) {
  return parsePhoneNumberValue(value, defaultCountry).e164;
}

export function getPhoneCountryFromValue(
  value: string | null | undefined,
  defaultCountry: string | null | undefined = DEFAULT_PHONE_COUNTRY,
) {
  return parsePhoneNumberValue(value, defaultCountry).country;
}

export function formatPhoneNumberForInput(
  value: string | null | undefined,
  defaultCountry: string | null | undefined = DEFAULT_PHONE_COUNTRY,
) {
  const country = normalizePhoneCountry(defaultCountry);
  const parsed = parsePhoneNumberValue(value, country);

  if (parsed.isEmpty) {
    return {
      displayValue: "",
      country,
    };
  }

  const phoneNumber = parsed.e164
    ? parsePhoneNumberFromString(parsed.e164)
    : undefined;

  if (phoneNumber?.nationalNumber) {
    const displayCountry = phoneNumber.country ?? parsed.country;
    const formatter = new AsYouType(displayCountry);

    return {
      displayValue: formatter.input(phoneNumber.nationalNumber),
      country: displayCountry,
    };
  }

  if (parsed.rawInput.startsWith("+")) {
    const inputDigits = parsed.rawInput.replace(/\D/g, "");
    const dialDigits = getCountryCallingCode(parsed.country);

    if (inputDigits.startsWith(dialDigits)) {
      const nationalDraft = inputDigits.slice(dialDigits.length);
      const formatter = new AsYouType(parsed.country);

      return {
        displayValue: nationalDraft ? formatter.input(nationalDraft) : "",
        country: parsed.country,
      };
    }
  }

  return {
    displayValue: parsed.displayValue,
    country: parsed.country,
  };
}
