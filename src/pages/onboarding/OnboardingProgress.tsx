import { motion } from "framer-motion";
import type { OnboardingStepDefinition } from "./onboarding.types";

interface OnboardingProgressProps {
  steps: OnboardingStepDefinition[];
  currentStep: number;
}

export const OnboardingProgress = ({
  steps,
  currentStep,
}: OnboardingProgressProps) => {
  const progress = ((currentStep + 1) / steps.length) * 100;
  const progressMessage =
    progress < 35
      ? "Getting things ready..."
      : progress < 75
        ? "Shaping your workspace..."
        : "Almost there...";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.02em] text-gray-500">
          {progressMessage}
        </p>
        {steps[currentStep]?.optional && (
          <p className="text-xs font-medium text-gray-400">Optional</p>
        )}
      </div>

      <div className="overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-1.5 rounded-full bg-indigo-600"
          style={{ width: `${progress}%` }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
