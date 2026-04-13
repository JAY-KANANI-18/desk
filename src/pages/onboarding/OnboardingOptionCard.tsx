import { useState } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { OnboardingOption } from "./onboarding.types";

interface OnboardingOptionCardProps {
  option: OnboardingOption;
  selected: boolean;
  onSelect: () => void;
  multi?: boolean;
  variant?: "card" | "pill";
  showDescription?: boolean;
  showIcon?: boolean;
}

export const OnboardingOptionCard = ({
  option,
  selected,
  onSelect,
  multi = false,
  variant = "card",
  showDescription = false,
  showIcon = true,
}: OnboardingOptionCardProps) => {
  const Icon = option.icon;
  const isPill = variant === "pill";
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "group relative w-full border text-left transition-all duration-200",
               "rounded-2xl px-4 py-3" ,
        selected
          ? "border-indigo-500 bg-indigo-50"
          : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40",
      ].join(" ")}
    >
      <div
        className={[
          "relative flex items-center",
         "gap-3" ,
        ].join(" ")}
      >
        {showIcon && (
          <div
            className={[
              "flex shrink-0 items-center justify-center rounded-xl transition-all",
               "h-9 w-9" ,
              selected
                ? " text-indigo-700"
                : " text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600",
            ].join(" ")}
          >
            {option.iconUrl && !iconFailed ? (
              <img
                src={option.iconUrl}
                alt={`${option.label} icon`}
                className="h-4 w-4 object-contain"
                onError={() => setIconFailed(true)}
              />
            ) : option.emoji ? (
              <span className="text-base">{option.emoji}</span>
            ) : Icon ? (
              <Icon size={16} />
            ) : null}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={[
                "text-sm font-medium leading-tight break-words",
                selected ? "text-indigo-900" : "text-gray-900",
              ].join(" ")}
            >
              {option.label}
            </span>
          </div>

          {/* {showDescription && option.description && (
            <p
              className={[
                "mt-1 text-xs leading-5",
                selected ? "text-indigo-700" : "text-gray-500",
              ].join(" ")}
            >
              {option.description}
            </p>
          )} */}

          {option.helper && (
            <p className="mt-2 text-xs font-medium text-indigo-600">
              {option.helper}
            </p>
          )}
        </div>

        <div
          className={[
            "relative flex shrink-0 items-center justify-center rounded-full border transition-all",
             "h-5 w-5" ,
            selected
              ? "border-indigo-500 bg-indigo-600 text-white"
              : "border-gray-200 bg-white text-transparent group-hover:border-indigo-200",
          ].join(" ")}
        >
          <Check size={12} />
        </div>
      </div>
    </motion.button>
  );
};
