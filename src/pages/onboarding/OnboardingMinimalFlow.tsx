import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Building2, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { BaseInput } from "../../components/ui/inputs";
import { useAuth } from "../../context/AuthContext";
import { useOrganization } from "../../context/OrganizationContext";
import { workspaceApi } from "../../lib/workspaceApi";
import { OnboardingOptionCard } from "./OnboardingOptionCard";
import { OnboardingProgress } from "./OnboardingProgress";
import {
  BUSINESS_TYPE_OPTIONS,
  CHANNEL_OPTIONS,
  FULL_ONBOARDING_STEPS,
  INDUSTRY_OPTIONS,
  MONTHLY_CONVERSATION_OPTIONS,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  PROFILE_ONLY_STEPS,
  TEAM_SIZE_OPTIONS,
} from "./onboarding.config";
import type {
  OnboardingData,
  OnboardingField,
  OnboardingStepKey,
} from "./onboarding.types";
import { BackButton } from "../../components/channels/BackButton";

const DRAFT_STORAGE_KEY = "axodesk-onboarding-draft";
const PAYLOAD_STORAGE_KEY = "axodesk-onboarding-payload";
const PERSONALIZATION_STORAGE_KEY = "axodesk-dashboard-personalization";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail",
  "googlemail",
  "hotmail",
  "outlook",
  "live",
  "msn",
  "icloud",
  "me",
  "yahoo",
  "proton",
  "zoho",
]);

const LOADING_STEPS = [
  "Creating your workspace",
  "Saving your profile",
  "Personalizing your dashboard",
];

const PROFILE_LOADING_STEPS = [
  "Saving your profile",
  "Personalizing your dashboard",
];

const STEP_SUPPORT_TEXT: Record<OnboardingStepKey, string> = {
  welcome: "Just a few quick things to get started.",
  businessType: "Pick the closest fit. We'll tailor the setup around it.",
  industry: "Optional, but useful for a better starting point.",
  teamSize: "A quick estimate is all you need here.",
  monthlyConversations: "A rough range is enough.",
  channels: "Select all the channels you use today.",
  primaryGoal: "Choose the main outcome you want first.",
  painPoint: "We'll help you solve this first.",
  workspaceName: "This becomes your workspace URL.",
  profile: "This helps personalize the workspace.",
};

const readStorageJson = (key: string) => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatToken = (value: string) =>
  value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const getEmailNameParts = (email = "") => {
  const localPart = email.split("@")[0] ?? "";
  const segments = localPart
    .replace(/[0-9]+/g, "")
    .split(/[._-]+/)
    .map((segment) => formatToken(segment))
    .filter(Boolean);

  return {
    firstName: segments[0] ?? "",
    lastName: segments.slice(1).join(" "),
  };
};

const getSuggestedWorkspaceName = (
  email = "",
  fallbackFirstName = "",
  fallbackLastName = "",
) => {
  const domain = email.split("@")[1] ?? "";
  const root = domain.split(".")[0] ?? "";

  if (root && !FREE_EMAIL_DOMAINS.has(root.toLowerCase())) {
    return formatToken(root);
  }

  const personalName = [fallbackFirstName, fallbackLastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (personalName) {
    return `${personalName}'s Workspace`;
  }

  return "AxoDesk Workspace";
};

const slugifyWorkspaceName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getStepValidationMessage = (stepKey: OnboardingStepKey) => {
  switch (stepKey) {
    case "channels":
      return "Choose at least one customer channel to continue.";
    case "workspaceName":
      return "Add a workspace name to continue.";
    case "profile":
      return "Add your first and last name to finish setup.";
    default:
      return "Choose an option to continue.";
  }
};

const buildOnboardingPayload = (data: OnboardingData): OnboardingData => ({
  businessType: data.businessType,
  industry: data.industry,
  teamSize: data.teamSize,
  monthlyConversations: data.monthlyConversations,
  channels: [...data.channels],
  primaryGoal: data.primaryGoal,
  painPoint: data.painPoint,
  workspaceName: data.workspaceName.trim(),
  firstName: data.firstName.trim(),
  lastName: data.lastName.trim(),
});

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const getSupportText = (
  stepKey: OnboardingStepKey,
  hasExistingOrganization: boolean,
) => {
  if (stepKey === "welcome" && hasExistingOrganization) {
    return "Just one quick detail and you'll be inside.";
  }

  return STEP_SUPPORT_TEXT[stepKey];
};

export const OnboardingMinimalFlow = () => {
  const navigate = useNavigate();
  const { user, setUserOnce } = useAuth();
  const { organizations, organizationSetup, refreshOrganizations } =
    useOrganization();

  const hasExistingOrganization = (organizations?.length ?? 0) > 0;
  const steps = hasExistingOrganization
    ? PROFILE_ONLY_STEPS
    : FULL_ONBOARDING_STEPS;
  const initialDraft = readStorageJson(DRAFT_STORAGE_KEY) as {
    data?: Partial<OnboardingData>;
    skippedFields?: OnboardingField[];
  } | null;

  const suggestedNames = getEmailNameParts(user?.email ?? "");
  const [data, setData] = useState<OnboardingData>({
    businessType: initialDraft?.data?.businessType ?? "",
    industry: initialDraft?.data?.industry ?? "",
    teamSize: initialDraft?.data?.teamSize ?? "",
    monthlyConversations: initialDraft?.data?.monthlyConversations ?? "",
    channels: Array.isArray(initialDraft?.data?.channels)
      ? initialDraft?.data?.channels
      : [],
    primaryGoal: initialDraft?.data?.primaryGoal ?? "",
    painPoint: initialDraft?.data?.painPoint ?? "",
    workspaceName:
      initialDraft?.data?.workspaceName ??
      getSuggestedWorkspaceName(
        user?.email ?? "",
        initialDraft?.data?.firstName ??
          user?.firstName ??
          suggestedNames.firstName,
        initialDraft?.data?.lastName ??
          user?.lastName ??
          suggestedNames.lastName,
      ),
    firstName:
      initialDraft?.data?.firstName ??
      user?.firstName ??
      suggestedNames.firstName,
    lastName:
      initialDraft?.data?.lastName ?? user?.lastName ?? suggestedNames.lastName,
  });
  const [skippedFields, setSkippedFields] = useState<OnboardingField[]>(
    initialDraft?.skippedFields ?? [],
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [industryQuery, setIndustryQuery] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const advanceTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );
  const loadingTimeoutsRef = useRef<ReturnType<typeof window.setTimeout>[]>([]);

  const currentStepConfig = steps[currentStep];
  const loadingSteps = hasExistingOrganization
    ? PROFILE_LOADING_STEPS
    : LOADING_STEPS;
  const workspaceSlug =
    slugifyWorkspaceName(data.workspaceName) || "yourworkspace";
  const visibleIndustryOptions = INDUSTRY_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(industryQuery.trim().toLowerCase()),
  );
  const supportText = getSupportText(
    currentStepConfig.key,
    hasExistingOrganization,
  );
  const loadingMessage =
    loadingSteps[Math.min(loadingStep, loadingSteps.length - 1)] ??
    "Setting up your workspace";
  const loadingProgress = `${Math.max(
    ((loadingStep + 1) / loadingSteps.length) * 100,
    25,
  )}%`;

  const canContinue = (() => {
    switch (currentStepConfig.key) {
      case "welcome":
        return true;
      case "industry":
        return true;
      case "businessType":
        return Boolean(data.businessType);
      case "teamSize":
        return Boolean(data.teamSize);
      case "monthlyConversations":
        return Boolean(data.monthlyConversations);
      case "channels":
        return data.channels.length > 0;
      case "primaryGoal":
        return Boolean(data.primaryGoal);
      case "painPoint":
        return Boolean(data.painPoint);
      case "workspaceName":
        return data.workspaceName.trim().length >= 2;
      case "profile":
        return Boolean(data.firstName.trim() && data.lastName.trim());
      default:
        return false;
    }
  })();

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
      loadingTimeoutsRef.current.forEach((timeout) =>
        window.clearTimeout(timeout),
      );
    };
  }, []);

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(Math.max(steps.length - 1, 0));
    }
  }, [currentStep, steps.length]);

  useEffect(() => {
    if (typeof window === "undefined" || isSubmitting) return;

    window.sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        data,
        skippedFields,
      }),
    );
  }, [data, skippedFields, isSubmitting]);

  const clearPendingAdvance = () => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  };

  const clearLoadingSequence = () => {
    loadingTimeoutsRef.current.forEach((timeout) =>
      window.clearTimeout(timeout),
    );
    loadingTimeoutsRef.current = [];
  };

  const playLoadingSequence = () =>
    new Promise<void>((resolve) => {
      clearLoadingSequence();
      setLoadingStep(0);

      const stepDuration = hasExistingOrganization ? 900 : 820;

      for (let index = 1; index < loadingSteps.length; index += 1) {
        const timeout = window.setTimeout(() => {
          setLoadingStep(index);
        }, index * stepDuration);

        loadingTimeoutsRef.current.push(timeout);
      }

      const finishTimeout = window.setTimeout(
        () => {
          resolve();
        },
        loadingSteps.length * stepDuration + 280,
      );

      loadingTimeoutsRef.current.push(finishTimeout);
    });

  const updateField = (
    field: OnboardingField,
    value: OnboardingData[OnboardingField],
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSkippedFields((prev) => prev.filter((item) => item !== field));
    setError("");
  };

  const goToStep = (nextStep: number) => {
    clearPendingAdvance();
    setDirection(nextStep > currentStep ? 1 : -1);
    setCurrentStep(nextStep);
    setError("");
  };

  const queueAdvance = () => {
    clearPendingAdvance();
    advanceTimeoutRef.current = window.setTimeout(() => {
      if (currentStep < steps.length - 1) {
        goToStep(currentStep + 1);
      }
    }, 180);
  };

  const handleSingleSelect = (
    field: OnboardingField,
    value: string,
    autoAdvance = false,
  ) => {
    updateField(field, value);

    if (autoAdvance) {
      queueAdvance();
    }
  };

  const toggleChannel = (value: string) => {
    setData((prev) => {
      const nextChannels = prev.channels.includes(value)
        ? prev.channels.filter((channel) => channel !== value)
        : [...prev.channels, value];

      return {
        ...prev,
        channels: nextChannels,
      };
    });
    setSkippedFields((prev) => prev.filter((item) => item !== "channels"));
    setError("");
  };

  const handleSkip = () => {
    if (!currentStepConfig.optional) return;

    setSkippedFields((prev) =>
      prev.includes(currentStepConfig.key as OnboardingField)
        ? prev
        : [...prev, currentStepConfig.key as OnboardingField],
    );
    goToStep(currentStep + 1);
  };

  const completeOnboarding = async () => {
    if (!user || !canContinue || isSubmitting) {
      if (!canContinue) {
        setError(getStepValidationMessage(currentStepConfig.key));
      }
      return;
    }

    const payload = buildOnboardingPayload(data);
    setIsSubmitting(true);
    setError("");
    clearPendingAdvance();
    const loadingAnimation = playLoadingSequence();

    try {
      const persistOnboarding = (async () => {
        if (!hasExistingOrganization) {
          await organizationSetup(
            payload.workspaceName,
            payload.workspaceName,
            payload,
          );
        }

        const updatedUser = await workspaceApi.updateUserProfile({
          firstName: payload.firstName,
          lastName: payload.lastName,
          avatarUrl: user.avatarUrl ?? "",
        });
        setUserOnce(updatedUser);

        if (!hasExistingOrganization) {
          await refreshOrganizations();
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
          window.localStorage.setItem(
            PAYLOAD_STORAGE_KEY,
            JSON.stringify({
              submittedAt: new Date().toISOString(),
              payload,
              skippedFields,
            }),
          );
          window.localStorage.setItem(
            PERSONALIZATION_STORAGE_KEY,
            JSON.stringify({
              businessType: payload.businessType,
              primaryGoal: payload.primaryGoal,
              channels: payload.channels,
              workspaceName: payload.workspaceName,
            }),
          );
        }
      })();

      await Promise.all([persistOnboarding, loadingAnimation]);
      clearLoadingSequence();
      await wait(150);
      navigate("/inbox", { replace: true });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't finish your setup right now.";
      clearLoadingSequence();
      setError(message);
      setIsSubmitting(false);
      setLoadingStep(0);
    }
  };

  const handleContinue = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (isSubmitting) return;

    if (!canContinue) {
      setError(getStepValidationMessage(currentStepConfig.key));
      return;
    }

    if (currentStepConfig.key === "profile") {
      await completeOnboarding();
      return;
    }

    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    switch (currentStepConfig.key) {
      case "welcome":
        return (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div className="rounded-2xl shadow-lg shadow-indigo-200">
              <Avatar
                src={user?.avatarUrl ?? undefined}
                name={
                  [user?.firstName, user?.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                  user?.email ||
                  "AxoDesk user"
                }
                alt="Profile avatar"
                size="xl"
                shape="square"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-sm leading-6 text-gray-500">
                {hasExistingOrganization
                  ? "Your workspace is nearly ready."
                  : "We'll tailor AxoDesk around your team in under a minute."}
              </p>
            </div>

            <div className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700">
              {hasExistingOrganization
                ? "You're almost ready"
                : "Quick setup, then you're in"}
            </div>
          </div>
        );

      case "businessType":
        return (
          <div className="grid gap-2.5">
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.businessType === option.value}
                onSelect={() =>
                  handleSingleSelect("businessType", option.value, true)
                }
                showIcon={false}
              />
            ))}
          </div>
        );

      case "industry":
        return (
          <div className="space-y-3">
            <div className="grid gap-2.5">
              {visibleIndustryOptions.map((option) => (
                <OnboardingOptionCard
                  key={option.value}
                  option={option}
                  selected={data.industry === option.value}
                  onSelect={() =>
                    handleSingleSelect("industry", option.value, true)
                  }
                  variant="pill"
                  showIcon={false}
                />
              ))}
            </div>
          </div>
        );

      case "teamSize":
        return (
          <div className="grid gap-2.5">
            {TEAM_SIZE_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.teamSize === option.value}
                onSelect={() =>
                  handleSingleSelect("teamSize", option.value, true)
                }
                showIcon={false}
              />
            ))}
          </div>
        );

      case "monthlyConversations":
        return (
          <div className="grid gap-2.5">
            {MONTHLY_CONVERSATION_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.monthlyConversations === option.value}
                onSelect={() =>
                  handleSingleSelect("monthlyConversations", option.value, true)
                }
                showIcon={false}
              />
            ))}
          </div>
        );

      case "channels":
        return (
          <div className="space-y-3">
            <div className="grid gap-2.5">
              {CHANNEL_OPTIONS.map((option) => (
                <OnboardingOptionCard
                  key={option.value}
                  option={option}
                  selected={data.channels.includes(option.value)}
                  onSelect={() => toggleChannel(option.value)}
                  multi
                />
              ))}
            </div>
          </div>
        );

      case "primaryGoal":
        return (
          <div className="grid gap-2.5">
            {PRIMARY_GOAL_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.primaryGoal === option.value}
                onSelect={() =>
                  handleSingleSelect("primaryGoal", option.value, true)
                }
                showDescription
                showIcon={false}
              />
            ))}
          </div>
        );

      case "painPoint":
        return (
          <div className="grid gap-2.5">
            {PAIN_POINT_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.painPoint === option.value}
                onSelect={() =>
                  handleSingleSelect("painPoint", option.value, true)
                }
                showIcon
                showDescription={false}
              />
            ))}
          </div>
        );

      case "workspaceName":
        return (
          <div className="space-y-3">
            <BaseInput
              value={data.workspaceName}
              onChange={(event) =>
                updateField("workspaceName", event.target.value)
              }
              label="Workspace name"
              labelVariant="sidebar"
              placeholder="AxoDesk HQ"
              autoFocus
              size="lg"
              appearance="auth"
              leftIcon={<Building2 size={16} />}
            />

            <p className="text-center text-sm text-gray-500">
              <span className="font-medium text-gray-900">{workspaceSlug}</span>
              <span className="text-gray-400">.axodesk.com</span>
            </p>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-3">
            <BaseInput
              value={data.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              autoFocus
              placeholder="First name"
              size="lg"
              appearance="auth"
            />
            <BaseInput
              value={data.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder="Last name"
              size="lg"
              appearance="auth"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <div className="relative h-[100dvh] overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
        <motion.div
          aria-hidden
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl"
          animate={{ x: [0, 24, -8, 0], y: [0, -10, 16, 0] }}
          transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-12 right-0 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"
          animate={{ x: [0, -20, 12, 0], y: [0, 16, -12, 0] }}
          transition={{ repeat: Infinity, duration: 13, ease: "easeInOut" }}
        />

        <div className="relative mx-auto flex h-full w-full max-w-xl items-center justify-center px-4 py-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full rounded-[28px] border border-white/80 bg-white/92 p-7 text-center shadow-[0_24px_90px_-50px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8"
          >
            <div className="relative mx-auto h-24 w-24">
              <motion.div
                className="absolute inset-0 rounded-full border border-indigo-200"
                animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.2, 0.55] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-3 rounded-full border border-indigo-300"
                animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.3, 0.7] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.12,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              </div>
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-gray-950">
              Setting up your workspace...
            </h1>
            <p className="mt-3 text-sm text-gray-500">{loadingMessage}</p>

            <div className="mt-8 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-1.5 rounded-full bg-indigo-600"
                initial={false}
                animate={{ width: loadingProgress }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {loadingSteps.map((item, index) => (
                <motion.span
                  key={item}
                  className={[
                    "h-2 rounded-full transition-all",
                    index <= loadingStep
                      ? "w-6 bg-indigo-600"
                      : "w-2 bg-indigo-100",
                  ].join(" ")}
                  animate={{ opacity: index <= loadingStep ? 1 : 0.55 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <motion.div
        aria-hidden
        className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl"
        animate={{ x: [0, 22, -8, 0], y: [0, -12, 18, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl"
        animate={{ x: [0, -18, 10, 0], y: [0, 18, -10, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl items-stretch justify-center px-3 py-3 sm:items-center sm:px-5 sm:py-4">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex h-[calc(100dvh-24px)] min-h-0 w-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/92 p-4 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.28)] backdrop-blur sm:h-[min(760px,calc(100dvh-32px))] sm:p-6"
        >
          <OnboardingProgress steps={steps} currentStep={currentStep} />

          <form
            onSubmit={handleContinue}
            className="mt-3 flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 py-3 text-center sm:py-4">
              <h1 className="mx-auto max-w-[18ch] text-2xl font-semibold leading-tight text-gray-950 sm:text-3xl md:text-4xl">
                {currentStepConfig.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-indigo-600 sm:mt-5">
                {supportText}
              </p>
            </div>

            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto overscroll-contain py-2 sm:py-3">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStepConfig.key}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 28 : -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mx-auto w-full max-w-[28rem] overflow-visible px-1 py-1"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {error && (
              <div className="mt-2 shrink-0 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-2 shrink-0 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                {currentStep > 0 ? (
                  <BackButton
                    ariaLabel="Back"
                    onClick={() => goToStep(currentStep - 1)}
                    size="sm"
                  />
                ) : (
                  <div className="h-10 min-w-[102px]" />
                )}

                <div className="text-center">
                  {currentStepConfig.optional ? (
                    <Button
                      type="button"
                      onClick={handleSkip}
                      variant="link"
                      size="sm"
                    >
                      Skip
                    </Button>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  disabled={!canContinue && !currentStepConfig.optional}
                  radius="full"
                  rightIcon={<ChevronRight size={15} />}
                >
                  {currentStepConfig.key === "welcome"
                    ? "Get Started"
                    : currentStepConfig.key === "profile"
                      ? hasExistingOrganization
                        ? "Finish Setup"
                        : "Create Workspace"
                      : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </motion.section>
      </div>
    </div>
  );
};
