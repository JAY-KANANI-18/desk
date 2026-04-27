import { useState } from "react";
import { motion } from "framer-motion";
import { SelectableCard } from "../../components/ui/SelectableCard";
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
  variant = "card",
  showIcon = true,
}: OnboardingOptionCardProps) => {
  const Icon = option.icon;
  const isPill = variant === "pill";
  const [iconFailed, setIconFailed] = useState(false);

  const leading =
    showIcon && (option.iconUrl || option.emoji || Icon) ? (
      option.iconUrl && !iconFailed ? (
        <img
          src={option.iconUrl}
          alt={`${option.label} icon`}
          className="h-4 w-4 object-contain"
          onError={() => setIconFailed(true)}
        />
      ) : option.emoji ? (
        <span className="text-base">{option.emoji}</span>
      ) : Icon ? (
        <Icon size={16} className={selected ? "text-indigo-700" : undefined} />
      ) : null
    ) : undefined;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <SelectableCard
        type="button"
        onClick={onSelect}
        selected={selected}
        size={isPill ? "md" : "lg"}
        title={option.label}
        helper={option.helper}
        leading={leading}
      />
    </motion.div>
  );
};
