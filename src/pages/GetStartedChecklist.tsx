import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementType, ReactNode } from "react";
import {
  Plug,
  Users,
  GitBranch,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  X,
  Zap,
} from "lucide-react";

interface GetStartedSteps {
  connectChannel: boolean;
  setupLifecycle: boolean;
  inviteTeam: boolean;
  [key: string]: boolean;
}

interface Step {
  key: string;
  icon: ElementType;
  title: string;
  subtitle: string;
  description: ReactNode;
  cta: string;
  path: string;
  visual: string;
}

const STEPS: Step[] = [
  {
    key: "connectChannel",
    icon: Plug,
    title: "Connect a channel",
    subtitle: "WhatsApp · Instagram · Email",
    description: (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "WhatsApp",
              src: "https://cdn.simpleicons.org/whatsapp",
            },
            {
              label: "Instagram",
              src: "https://cdn.simpleicons.org/instagram",
            },
            {
              label: "Messenger",
              src: "https://cdn.simpleicons.org/messenger",
            },
            {
              label: "Telegram",
              src: "https://cdn.simpleicons.org/googlechat",
            },
            {
              label: "Email",
              src: "https://cdn.simpleicons.org/maildotru",
            },
          ].map((channel) => (
            <span
              key={channel.label}
              className="inline-flex items-center gap-2 rounded-full  px-3 py-1.5 text-xs font-medium text-slate-600 "
            >
              <img
                src={channel.src}
                alt={channel.label}
                className="h-8 w-8 object-contain"
              />
              {/* {channel.label} */}
            </span>
          ))}
        </div>

        <p className="text-sm leading-7 text-[var(--color-text,#475569)]">
          Connect your customer channels like WhatsApp, Instagram and Messenger,
          and manage every conversation from one powerful inbox.
        </p>
      </div>
    ),
    cta: "Connect your first channel",
    path: "/channels/connect",
    visual: "",
  },
  {
    key: "setupLifecycle",
    icon: GitBranch,
    title: "Set up lifecycles",
    subtitle: "Turn prospects into customers",
    description:
      "Lifecycles help you track where every contact stands — from first hello to loyal customer. Set up stages that match how your team actually works.",
    cta: "Configure lifecycle stages",
    path: "/workspace/settings/lifecycle",
    visual: "🔁",
  },
  {
    key: "inviteTeam",
    icon: Users,
    title: "Invite your team",
    subtitle: "Collaborate from day one",
    description:
      "Better conversations happen with the right people in the room. Invite teammates, assign roles, and start handling customer queries together.",
    cta: "Invite team members",
    path: "/workspace/settings/users",
    visual: "👥",
  },
];

export const GetStartedChecklist = ({
  completedSteps = {} as GetStartedSteps,
  userName = "there",
  onDismiss,
  onComplete,
}: {
  completedSteps: GetStartedSteps;
  userName: string;
  onDismiss: () => void;
  onComplete: () => void;
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const completedCount = useMemo(
    () => STEPS.filter((s) => completedSteps[s.key]).length,
    [completedSteps],
  );

  const totalCount = STEPS.length;
  const pct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const firstIncomplete = STEPS.find((s) => !completedSteps[s.key]);
    if (firstIncomplete) setExpanded(firstIncomplete.key);
  }, [completedSteps]);

  const toggle = (key: string, done: boolean) => {
    if (done) return;
    setExpanded((prev) => (prev === key ? null : key));
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const mobileCircumference = 2 * Math.PI * 28;
  const mobileStrokeDashoffset =
    mobileCircumference - (pct / 100) * mobileCircumference;

  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto bg-[var(--color-bg,#f8fafc)] px-3 py-6 text-[var(--color-text,#0f172a)] transition-all duration-500 sm:px-4 sm:py-8 md:px-6 md:py-14 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:mb-10 md:gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 md:gap-3">
              <span className="text-3xl">👋</span>
              <h1 className="text-xl font-bold leading-tight tracking-tight text-[var(--color-text,#0f172a)] sm:text-2xl md:text-3xl">
                Hey {userName}, let’s get you set up.
              </h1>
            </div>
            <p className="ml-9 text-sm text-[var(--color-text-secondary,#64748b)] md:ml-11">
              Three steps. Takes under 5 minutes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-card,#ffffff)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary,#64748b)] transition hover:border-indigo-600 hover:text-indigo-600 sm:w-auto md:py-2"
              >
                <X size={16} />
                Don't Show Again
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left: Steps */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-card,#ffffff)] p-4 shadow-sm md:hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary,#94a3b8)]">
                    Progress
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--color-text,#0f172a)]">
                    {completedCount} of {totalCount} completed
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary,#64748b)]">
                    {allDone
                      ? "Everything is ready for your team."
                      : "Finish the next step to unlock your full workspace."}
                  </p>
                </div>

                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 72 72"
                  className="shrink-0"
                >
                  <defs>
                    <linearGradient
                      id="mobile-pg"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="6"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="url(#mobile-pg)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={mobileCircumference}
                    strokeDashoffset={mobileStrokeDashoffset}
                    transform="rotate(-90 36 36)"
                    style={{
                      transition:
                        "stroke-dashoffset 0.9s cubic-bezier(.34,1.56,.64,1)",
                    }}
                  />

                  <text
                    x="36"
                    y="34"
                    textAnchor="middle"
                    className="fill-slate-900 text-[12px] font-bold"
                  >
                    {pct}%
                  </text>
                  <text
                    x="36"
                    y="46"
                    textAnchor="middle"
                    className="fill-slate-400 text-[7px]"
                  >
                    done
                  </text>
                </svg>
              </div>
            </div>

            {STEPS.map((step, i) => {
              const done = completedSteps[step.key];
              const isOpen = expanded === step.key && !done;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className="flex gap-3 md:gap-4"
                  style={{
                    animation: `fadeInUp 0.45s ease ${i * 0.08}s both`,
                  }}
                >
                  {/* Timeline */}
                  <div className="flex w-8 flex-col items-center pt-4 md:w-10 md:pt-5">
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 md:h-9 md:w-9 md:text-sm
                        ${
                          done
                            ? "border-transparent bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md"
                            : isOpen
                              ? "border-[var(--color-primary,#6366f1)] bg-indigo-600 text-white shadow-[0_0_0_6px_rgba(99,102,241,0.10)]"
                              : "border-[var(--color-border,#cbd5e1)] bg-[var(--color-card,#ffffff)] text-[var(--color-text-secondary,#94a3b8)]"
                        }`}
                    >
                      {done ? <CheckCircle2 size={18} /> : i + 1}
                    </div>

                    {i < STEPS.length - 1 && (
                      <div
                        className={`mt-2 w-[2px] flex-1 rounded-full ${
                          done
                            ? "bg-gradient-to-b from-indigo-600 to-slate-200"
                            : "bg-[var(--color-border,#e2e8f0)]"
                        }`}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 overflow-hidden rounded-[20px] border bg-[var(--color-card,#ffffff)] transition-all duration-300 md:rounded-2xl
                      ${
                        isOpen
                          ? "border-indigo-600 shadow-xl shadow-slate-200/50"
                          : done
                            ? "border-[var(--color-border,#eef2f7)] opacity-70"
                            : "border-[var(--color-border,#e2e8f0)] shadow-sm"
                      }`}
                  >
                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => toggle(step.key, done)}
                      className={`flex w-full items-start gap-3 px-4 py-4 text-left md:items-center md:gap-4 md:px-5 md:py-5 ${
                        done ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all md:h-11 md:w-11
                          ${
                            done
                              ? "bg-slate-100 text-slate-300"
                              : isOpen
                                ? "bg-indigo-600  text-white"
                                : "bg-[var(--color-muted,#f1f5f9)] text-[var(--color-text,#334155)]"
                          }`}
                      >
                        <Icon size={19} strokeWidth={2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm sm:text-[15px] font-semibold ${
                              done
                                ? "text-slate-400 line-through"
                                : "text-[var(--color-text,#0f172a)]"
                            }`}
                          >
                            {step.title}
                          </h3>

                          {done && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                              Done ✓
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--color-text-secondary,#94a3b8)]">
                          {step.subtitle}
                        </p>
                      </div>

                      {!done && (
                        <ChevronDown
                          size={18}
                          className={`mt-1 shrink-0 text-slate-400 transition-transform duration-300 md:mt-0 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Expandable body */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1 md:px-5 md:pb-5 md:pt-5">
                          <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-slate-50/80 p-4 md:mb-5 md:flex-row md:items-start md:gap-4 md:bg-transparent">
                            <span className="text-3xl leading-none">
                              {step.visual}
                            </span>
                            <div className="min-w-0 text-sm leading-7 text-[var(--color-text,#475569)]">
                              {step.description}
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(step.path)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:shadow-lg sm:w-auto"
                          >
                            {step.cta}
                            <ArrowRight size={16} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* All done banner */}
            {allDone && (
              <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 p-5 text-white shadow-2xl sm:mt-6 sm:flex-row sm:items-center sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Zap size={22} className="text-violet-300" />
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-bold tracking-tight">
                    Workspace fully set up. Time to ship. 🚀
                  </h3>
                  <p className="mt-1 text-sm text-violet-200">
                    All three steps complete — your team is ready.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onComplete();
                    navigate("/inbox");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-lg sm:w-auto"
                >
                  Open inbox
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="hidden space-y-4 md:block">
            {/* Progress Card */}
            <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-card,#ffffff)] p-5 shadow-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary,#94a3b8)]">
                Progress
              </p>

              <div className="mb-5 flex justify-center">
                <svg width="110" height="110" viewBox="0 0 96 96">
                  <defs>
                    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="7"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="url(#pg)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 48 48)"
                    style={{
                      transition:
                        "stroke-dashoffset 0.9s cubic-bezier(.34,1.56,.64,1)",
                    }}
                  />

                  <text
                    x="48"
                    y="44"
                    textAnchor="middle"
                    className="fill-slate-900 text-[18px] font-bold"
                  >
                    {pct}%
                  </text>
                  <text
                    x="48"
                    y="60"
                    textAnchor="middle"
                    className="fill-slate-400 text-[11px]"
                  >
                    complete
                  </text>
                </svg>
              </div>

              <div className="space-y-2">
                {STEPS.map((s) => {
                  const isDone = completedSteps[s.key];
                  return (
                    <div
                      key={s.key}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                        isDone ? "bg-emerald-50" : "bg-slate-50"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isDone ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isDone ? "text-emerald-700" : "text-slate-600"
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resources */}
            {/* <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-[var(--color-card,#ffffff)] p-5 shadow-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary,#94a3b8)]">
                Resources
              </p>

              <div className="space-y-2">
                {[
                  {
                    icon: PlayCircle,
                    label: "Watch intro video",
                    onClick: () => {},
                  },
                  {
                    icon: MessageCircleQuestion,
                    label: "Contact support",
                    onClick: () => {},
                  },
                  {
                    icon: CalendarDays,
                    label: "Book a demo",
                    onClick: () => {},
                  },
                  {
                    icon: LifeBuoy,
                    label: "Help center",
                    onClick: () => {},
                  },
                  {
                    icon: Clapperboard,
                    label: "Video guides",
                    onClick: () => {},
                  },
                ].map((item) => {
                  const ResourceIcon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <ResourceIcon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* optional tiny animation helper */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default GetStartedChecklist;
