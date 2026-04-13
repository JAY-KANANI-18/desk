import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  SUMMARY_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from "./onboarding.config";
import type {
  OnboardingData,
  OnboardingField,
  OnboardingOption,
  OnboardingStepDefinition,
  OnboardingStepKey,
} from "./onboarding.types";

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

const getInitials = ({
  firstName,
  lastName,
  email,
}: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  const seed = [firstName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (seed) {
    return seed
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }

  return (email ?? "AX").slice(0, 2).toUpperCase();
};

const getOptionLabel = (options: OnboardingOption[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

const createInitialData = (user: {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) => {
  const draft = readStorageJson(DRAFT_STORAGE_KEY) as
    | { data?: Partial<OnboardingData> }
    | null;
  const suggestedNames = getEmailNameParts(user.email ?? "");
  const firstName = draft?.data?.firstName || user.firstName || suggestedNames.firstName;
  const lastName = draft?.data?.lastName || user.lastName || suggestedNames.lastName;

  return {
    businessType: draft?.data?.businessType ?? "",
    industry: draft?.data?.industry ?? "",
    teamSize: draft?.data?.teamSize ?? "",
    monthlyConversations: draft?.data?.monthlyConversations ?? "",
    channels: Array.isArray(draft?.data?.channels) ? draft?.data?.channels : [],
    primaryGoal: draft?.data?.primaryGoal ?? "",
    painPoint: draft?.data?.painPoint ?? "",
    workspaceName:
      draft?.data?.workspaceName ??
      getSuggestedWorkspaceName(user.email ?? "", firstName ?? "", lastName ?? ""),
    firstName: firstName ?? "",
    lastName: lastName ?? "",
  } satisfies OnboardingData;
};

const getFieldSummary = (field: OnboardingField, data: OnboardingData) => {
  if (field === "channels") {
    return data.channels.map((value) => getOptionLabel(CHANNEL_OPTIONS, value));
  }

  const fieldOptions = SUMMARY_OPTIONS[field as keyof typeof SUMMARY_OPTIONS];
  const value = data[field];

  if (!value) return "";

  return fieldOptions ? getOptionLabel(fieldOptions, value) : value;
};

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

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user, setUserOnce } = useAuth();
  const { organizations, organizationSetup, refreshOrganizations } =
    useOrganization();

  const hasExistingOrganization = (organizations?.length ?? 0) > 0;
  const steps = hasExistingOrganization
    ? PROFILE_ONLY_STEPS
    : FULL_ONBOARDING_STEPS;
  const initialDraft = readStorageJson(DRAFT_STORAGE_KEY) as
    | { skippedFields?: OnboardingField[] }
    | null;

  const [data, setData] = useState<OnboardingData>(() => createInitialData(user ?? {}));
  const [skippedFields, setSkippedFields] = useState<OnboardingField[]>(
    () => initialDraft?.skippedFields ?? [],
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

  const currentStepConfig = steps[currentStep];
  const loadingSteps = hasExistingOrganization
    ? PROFILE_LOADING_STEPS
    : LOADING_STEPS;
  const workspaceSlug = slugifyWorkspaceName(data.workspaceName) || "yourworkspace";
  const visibleIndustryOptions = INDUSTRY_OPTIONS.filter((option) =>
    `${option.label} ${option.description ?? ""}`
      .toLowerCase()
      .includes(industryQuery.trim().toLowerCase()),
  );

  const canContinue = (() => {
    switch (currentStepConfig?.key) {
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
    }, 220);
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
    if (!currentStepConfig?.optional) return;

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

    try {
      setLoadingStep(0);

      if (!hasExistingOrganization) {
        await organizationSetup(payload.workspaceName, payload.workspaceName);
        setLoadingStep(1);
      }

      const updatedUser = await workspaceApi.updateUserProfile({
        firstName: payload.firstName,
        lastName: payload.lastName,
        avatarUrl: user.avatarUrl ?? "",
      });
      setUserOnce(updatedUser);

      if (!hasExistingOrganization) {
        setLoadingStep(2);
        await refreshOrganizations();
      } else {
        setLoadingStep(1);
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

      await wait(180);
      navigate("/dashboard", { replace: true });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't finish your setup right now.";
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

  const summaryCards = [
    {
      label: "Business",
      value: getFieldSummary("businessType", data),
    },
    {
      label: "Channels",
      value: getFieldSummary("channels", data),
    },
    {
      label: "Goal",
      value: getFieldSummary("primaryGoal", data),
    },
    {
      label: "Workspace",
      value: data.workspaceName.trim(),
    },
  ];

  const renderStep = (step: OnboardingStepDefinition) => {
    switch (step.key) {
      case "welcome":
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-lg font-semibold text-white shadow-lg shadow-indigo-200">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(user ?? {})
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                      Welcome aboard
                    </p>
                    <h2 className="mt-1 text-3xl font-semibold text-gray-950">
                      {hasExistingOrganization
                        ? "Let's finish your setup"
                        : "Welcome to AxoDesk"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-gray-600 shadow-sm shadow-indigo-100/50 backdrop-blur">
                  <p className="font-semibold text-gray-900">Expected time</p>
                  <p className="mt-1">
                    {hasExistingOrganization ? "Under 20 seconds" : "About 60 seconds"}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Tell us about your business",
                "Pick the channels you use",
                "Launch with a tailored workspace",
              ]
                .slice(0, hasExistingOrganization ? 1 : 3)
                .map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Check size={16} />
                      </div>
                      <p className="text-sm font-medium text-gray-700">{item}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "businessType":
        return (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.businessType === option.value}
                onSelect={() =>
                  handleSingleSelect("businessType", option.value, true)
                }
              />
            ))}
          </div>
        );

      case "industry":
        return (
          <div className="space-y-5">
          

            <div className="grid gap-3 sm:grid-cols-2">
              {visibleIndustryOptions.map((option) => (
                <OnboardingOptionCard
                  key={option.value}
                  option={option}
                  variant="pill"
                  selected={data.industry === option.value}
                  onSelect={() => handleSingleSelect("industry", option.value, true)}
                />
              ))}
            </div>

            {visibleIndustryOptions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                No industry matches that search yet.
              </div>
            )}
          </div>
        );

      case "teamSize":
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TEAM_SIZE_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                variant="pill"
                selected={data.teamSize === option.value}
                onSelect={() => handleSingleSelect("teamSize", option.value, true)}
              />
            ))}
          </div>
        );

      case "monthlyConversations":
        return (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
              <Sparkles size={14} />
              Helps us optimize your experience
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {MONTHLY_CONVERSATION_OPTIONS.map((option) => (
                <OnboardingOptionCard
                  key={option.value}
                  option={option}
                  selected={data.monthlyConversations === option.value}
                  onSelect={() =>
                    handleSingleSelect("monthlyConversations", option.value, true)
                  }
                />
              ))}
            </div>
          </div>
        );

      case "channels":
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Multi-select
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Pick every channel you actively use
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {CHANNEL_OPTIONS.map((option) => (
                <OnboardingOptionCard
                  key={option.value}
                  option={option}
                  multi
                  selected={data.channels.includes(option.value)}
                  onSelect={() => toggleChannel(option.value)}
                />
              ))}
            </div>
          </div>
        );

      case "primaryGoal":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {PRIMARY_GOAL_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.primaryGoal === option.value}
                onSelect={() => handleSingleSelect("primaryGoal", option.value, true)}
              />
            ))}
          </div>
        );

      case "painPoint":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {PAIN_POINT_OPTIONS.map((option) => (
              <OnboardingOptionCard
                key={option.value}
                option={option}
                selected={data.painPoint === option.value}
                onSelect={() => handleSingleSelect("painPoint", option.value, true)}
              />
            ))}
          </div>
        );

      case "workspaceName":
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-5">
              <label className="block text-sm font-medium text-gray-700">
                Workspace name
              </label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
                <Building2 size={18} className="text-gray-400" />
                <input
                  value={data.workspaceName}
                  onChange={(event) =>
                    updateField("workspaceName", event.target.value)
                  }
                  placeholder="AxoDesk HQ"
                  autoFocus
                  className="w-full bg-transparent text-lg font-semibold text-gray-900 outline-none"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Live preview
              </p>
              <div className="mt-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <span>{workspaceSlug}</span>
                <span className="text-gray-400">.</span>
                <span className="text-gray-500">axodesk.com</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your slug is generated automatically from the workspace name.
              </p>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                value={data.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                autoFocus
                placeholder="Jay"
                className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                value={data.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Kanani"
                className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              We use this to personalize assignments, notifications, and team visibility.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4 py-8">
        <motion.div
          aria-hidden
          className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl"
          animate={{ x: [0, 30, -10, 0], y: [0, -10, 20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl"
          animate={{ x: [0, -24, 12, 0], y: [0, 20, -18, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_90px_-40px_rgba(79,70,229,0.5)] backdrop-blur"
          >
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Loader2 size={26} className="animate-spin" />
              </div>
              <h1 className="mt-6 text-3xl font-semibold text-gray-950">
                Setting up your workspace...
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                We are getting AxoDesk ready around your team, channels, and goals.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {loadingSteps.map((item, index) => {
                const active = index <= loadingStep;
                const completed = index < loadingStep;

                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={[
                      "flex items-center gap-3 rounded-2xl border px-4 py-4 transition-all",
                      active
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400",
                      ].join(" ")}
                    >
                      {completed ? (
                        <Check size={16} />
                      ) : active ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{item}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4 py-8">
      <motion.div
        aria-hidden
        className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-indigo-100/80 blur-3xl"
        animate={{ x: [0, 36, -12, 0], y: [0, -20, 16, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"
        animate={{ x: [0, -28, 10, 0], y: [0, 22, -18, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <aside className="hidden rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.35)] backdrop-blur xl:flex xl:flex-col">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
              AxoDesk Setup
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-gray-950">
              A cleaner inbox starts with a sharper first minute.
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-500">
              We will keep this lightweight, guide you one decision at a time,
              and shape the workspace around how your team actually works.
            </p>
          </div>

          <div className="mt-8 rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-500 p-6 text-white shadow-[0_24px_80px_-40px_rgba(79,70,229,0.8)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-base font-semibold text-white">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user ?? {})
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {data.firstName || user?.firstName || "Your"} workspace
                </p>
                <p className="text-sm text-indigo-100">{user?.email}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                Recommended starting point
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {getOptionLabel(
                  PRIMARY_GOAL_OPTIONS,
                  data.primaryGoal || "conversation-hub",
                )}
              </p>
              <p className="mt-2 text-sm leading-6 text-indigo-100">
                {data.channels.length > 0
                  ? `Built around ${data.channels
                      .map((channel) => getOptionLabel(CHANNEL_OPTIONS, channel))
                      .join(", ")}.`
                  : "Once you pick your channels, we will tailor the first dashboard view around them."}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            {summaryCards.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {item.label}
                </p>
                <div className="mt-2">
                  {Array.isArray(item.value) ? (
                    item.value.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.value.map((value) => (
                          <span
                            key={value}
                            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Not selected yet</p>
                    )
                  ) : item.value ? (
                    <p className="text-sm font-medium text-gray-700">{item.value}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Not selected yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-4rem)] flex-col rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <OnboardingProgress steps={steps} currentStep={currentStep} />

          <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50/70 p-5 xl:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-sm font-semibold text-white">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user ?? {})
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                <p className="text-sm text-gray-500">
                  {summaryCards.find((card) => card.label === "Workspace")?.value ||
                    "Your workspace is taking shape"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleContinue} className="flex flex-1 flex-col">
            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                {currentStepConfig.optional ? "Optional" : "AxoDesk Setup"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
                {currentStepConfig.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                {currentStepConfig.description}
              </p>
            </div>

            <div className="mt-8 flex-1">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStepConfig.key}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -28 : 28 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {renderStep(currentStepConfig)}
                </motion.div>
              </AnimatePresence>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(currentStep - 1)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {currentStepConfig.optional && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm font-medium text-gray-500 transition hover:text-gray-700"
                  >
                    Skip for now
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!canContinue && !currentStepConfig.optional}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
                  !canContinue && !currentStepConfig.optional
                    ? "cursor-not-allowed bg-indigo-300 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700",
                ].join(" ")}
              >
                {currentStepConfig.key === "welcome"
                  ? "Get Started"
                  : currentStepConfig.key === "profile"
                    ? hasExistingOrganization
                      ? "Finish Setup"
                      : "Create Workspace"
                    : "Continue"}
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
