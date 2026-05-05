import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js/min";
import { DEFAULT_PHONE_COUNTRY, normalizePhoneCountry } from "@/lib/phoneNumber";

export interface PhoneCountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  searchText: string;
}

type RegionDisplayNames = {
  of: (code: string) => string | undefined;
};

type RegionDisplayNamesConstructor = new (
  locales: string[],
  options: { type: "region" },
) => RegionDisplayNames;

const COUNTRY_NAME_FALLBACKS: Partial<Record<CountryCode, string>> = {
  AC: "Ascension Island",
  TA: "Tristan da Cunha",
  XK: "Kosovo",
};

const PREFERRED_COUNTRIES = [
  "IN",
  "US",
  "GB",
  "AE",
  "CA",
  "AU",
  "SG",
  "DE",
  "FR",
  "BR",
] satisfies CountryCode[];

function createRegionNames() {
  const displayNamesConstructor = (
    Intl as typeof Intl & {
      DisplayNames?: RegionDisplayNamesConstructor;
    }
  ).DisplayNames;

  return displayNamesConstructor
    ? new displayNamesConstructor(["en"], { type: "region" })
    : undefined;
}

function getCountryName(country: CountryCode, regionNames?: RegionDisplayNames) {
  return COUNTRY_NAME_FALLBACKS[country] ?? regionNames?.of(country) ?? country;
}

export function getCountryFlag(country: CountryCode) {
  if (!/^[A-Z]{2}$/.test(country)) {
    return "";
  }

  return Array.from(country)
    .map((character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0)),
    )
    .join("");
}

function createCountryOption(
  country: CountryCode,
  regionNames?: RegionDisplayNames,
): PhoneCountryOption {
  const name = getCountryName(country, regionNames);
  const dialCode = `+${getCountryCallingCode(country)}`;
  const flag = getCountryFlag(country);

  return {
    code: country,
    name,
    dialCode,
    flag,
    searchText: `${name} ${country} ${dialCode}`.toLowerCase(),
  };
}

function createPhoneCountries() {
  const regionNames = createRegionNames();
  const countries = getCountries()
    .map((country) => createCountryOption(country, regionNames))
    .sort((left, right) => left.name.localeCompare(right.name));
  const preferredCountrySet = new Set<CountryCode>(PREFERRED_COUNTRIES);
  const preferredCountries = PREFERRED_COUNTRIES.map((country) =>
    countries.find((option) => option.code === country),
  ).filter((option): option is PhoneCountryOption => Boolean(option));

  return [
    ...preferredCountries,
    ...countries.filter((option) => !preferredCountrySet.has(option.code)),
  ];
}

export const PHONE_COUNTRIES = createPhoneCountries();

export function getPhoneCountryOption(
  country: string | null | undefined,
  fallback: CountryCode = DEFAULT_PHONE_COUNTRY,
) {
  const code = normalizePhoneCountry(country, fallback);
  return (
    PHONE_COUNTRIES.find((option) => option.code === code) ??
    PHONE_COUNTRIES.find((option) => option.code === fallback) ??
    PHONE_COUNTRIES[0]
  );
}

