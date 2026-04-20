import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ClipboardList,
  ConciergeBell,
  Headphones,
  Languages,
  LockKeyhole,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { PageHeader, PageShell } from "../components/AiAgentPrimitives";
import type { AiAgentType } from "../types";

type WizardStep = "template" | "identity" | "channels" | "permissions" | "publish";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "template", label: "Template" },
  { id: "identity", label: "Identity" },
  { id: "channels", label: "Channels" },
  { id: "permissions", label: "Permissions" },
  { id: "publish", label: "Publish" },
];

const templates: Array<{
  id: string;
  title: string;
  type: AiAgentType;
  description: string;
  icon: React.ReactNode;
  tone: string;
  tools: string[];
  prompt: string;
}> = [
  {
    id: "sales",
    title: "Sales Agent",
    type: "sales",
    description: "Qualifies inbound prospects, captures budget and timeline, and creates leads.",
    icon: <BriefcaseBusiness size={20} />,
    tone: "consultative",
    tools: ["createLead", "updateContactField", "changeLifecycleStage", "assignConversation", "triggerWorkflow", "escalateHuman"],
    prompt: "Qualify prospects using need, budget, authority, timeline, and next step. Do not promise discounts or pricing that is not in knowledge.",
  },
  {
    id: "support",
    title: "Support Agent",
    type: "support",
    description: "Answers product questions from knowledge and escalates unresolved issues.",
    icon: <Headphones size={20} />,
    tone: "clear",
    tools: ["createTicket", "assignConversation", "closeConversation", "triggerWorkflow", "escalateHuman"],
    prompt: "Resolve support questions from verified knowledge. Ask concise clarifying questions and escalate refunds, legal, and angry customers.",
  },
  {
    id: "receptionist",
    title: "Receptionist",
    type: "receptionist",
    description: "Greets customers, routes conversations, and gathers missing details.",
    icon: <ConciergeBell size={20} />,
    tone: "warm",
    tools: ["assignConversation", "updateContactField", "bookMeeting", "escalateHuman"],
    prompt: "Welcome customers, identify the right team, collect context, and route the conversation quickly.",
  },
  {
    id: "lead_qualifier",
    title: "Lead Qualifier",
    type: "sales",
    description: "Scores new leads and moves qualified contacts to the right lifecycle stage.",
    icon: <ClipboardList size={20} />,
    tone: "direct",
    tools: ["createLead", "updateContactField", "changeLifecycleStage", "assignConversation", "escalateHuman"],
    prompt: "Ask only the minimum questions needed to qualify the lead and route it to the sales team.",
  },
  {
    id: "custom",
    title: "Custom Blank",
    type: "custom",
    description: "Start from a clean agent and choose only the behavior you want.",
    icon: <Bot size={20} />,
    tone: "professional",
    tools: ["escalateHuman"],
    prompt: "Be accurate, concise, and grounded in Axodesk knowledge.",
  },
];

const channelOptions = ["whatsapp", "instagram", "messenger", "email", "webchat"];
const languageOptions = ["auto", "English", "Hindi", "Spanish", "Arabic", "Portuguese"];

export function CreateAgentWizardPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    templateId: "support",
    name: "Support Agent",
    description: "Handles common customer questions and escalates when needed.",
    avatar: "spark",
    tone: "clear",
    defaultLanguage: "auto",
    channels: ["whatsapp", "instagram", "messenger", "email"],
    toolsAllowed: ["createTicket", "assignConversation", "closeConversation", "triggerWorkflow", "escalateHuman"],
    approvalMode: "tools_only",
    canReply: true,
  });

  const currentStep = steps[stepIndex].id;
  const selectedTemplate = templates.find((template) => template.id === form.templateId) || templates[0];
  const canNext = useMemo(() => {
    if (currentStep === "identity") return form.name.trim().length >= 2;
    if (currentStep === "channels") return form.channels.length > 0;
    return true;
  }, [currentStep, form.name, form.channels.length]);

  const update = (patch: Partial<typeof form>) => setForm((state) => ({ ...state, ...patch }));

  const chooseTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId) || templates[0];
    update({
      templateId,
      name: template.title,
      description: template.description,
      tone: template.tone,
      toolsAllowed: template.tools,
    });
  };

  const save = async (publish: boolean) => {
    setSaving(true);
    try {
      const created = await aiAgentsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        agentType: selectedTemplate.type,
        tone: form.tone,
        defaultLanguage: form.defaultLanguage,
        channelAllowlist: form.channels,
        toolsAllowed: form.canReply ? form.toolsAllowed : form.toolsAllowed.filter((tool) => tool !== "sendTemplate"),
        runtimeConfig: {
          maxAutoReplies: 5,
          confidenceThreshold: 0.65,
        },
        guardrails: {
          noHallucinatedPricing: true,
          noUnsupportedRefunds: true,
          noLegalAdvice: true,
          noMedicalClaims: true,
        },
        systemPrompt: selectedTemplate.prompt,
      });

      if (publish) {
        await aiAgentsApi.publish(created.agent.id);
        toast.success("Agent published");
      } else {
        toast.success("Agent saved as draft");
      }

      navigate(`/ai-agents/${created.agent.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Create Agent"
        title="Launch a supervised AI teammate"
        description="Start from a proven workflow, connect channels, choose permissions, then test before going live."
        actions={
          <button
            onClick={() => navigate("/ai-agents")}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setStepIndex(index)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                  index === stepIndex ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                  index < stepIndex ? "bg-emerald-500 text-white" : index === stepIndex ? "bg-white text-slate-950" : "bg-slate-100 text-slate-500"
                }`}>
                  {index < stepIndex ? <Check size={14} /> : index + 1}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-h-0 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            {currentStep === "template" ? (
              <section>
                <h2 className="text-lg font-semibold text-slate-950">Choose a template</h2>
                <p className="mt-1 text-sm text-slate-500">You can tune every setting after creation.</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => chooseTemplate(template.id)}
                      className={`rounded-lg border bg-white p-4 text-left transition hover:border-slate-400 ${
                        form.templateId === template.id ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                          {template.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{template.title}</p>
                          <p className="text-xs text-slate-500">{template.type}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-slate-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {currentStep === "identity" ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-slate-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Identity</h2>
                    <p className="text-sm text-slate-500">This is how teammates recognize the agent in Axodesk.</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Name" value={form.name} onChange={(name) => update({ name })} />
                  <Field label="Tone" value={form.tone} onChange={(tone) => update({ tone })} />
                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => update({ description: event.target.value })}
                      className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>
                  <label>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Languages size={15} />
                      Language
                    </span>
                    <select
                      value={form.defaultLanguage}
                      onChange={(event) => update({ defaultLanguage: event.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm outline-none focus:border-slate-400"
                    >
                      {languageOptions.map((language) => (
                        <option key={language} value={language}>{language}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            ) : null}

            {currentStep === "channels" ? (
              <section>
                <h2 className="text-lg font-semibold text-slate-950">Channels</h2>
                <p className="mt-1 text-sm text-slate-500">Choose where this agent is allowed to reply.</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {channelOptions.map((channel) => {
                    const checked = form.channels.includes(channel);
                    return (
                      <button
                        key={channel}
                        onClick={() =>
                          update({
                            channels: checked
                              ? form.channels.filter((item) => item !== channel)
                              : [...form.channels, channel],
                          })
                        }
                        className={`flex items-center justify-between rounded-lg border bg-white p-4 text-left ${
                          checked ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-sm font-semibold capitalize text-slate-800">
                          <MessageCircle size={18} />
                          {channel}
                        </span>
                        {checked ? <Check size={18} className="text-emerald-600" /> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {currentStep === "permissions" ? (
              <section>
                <h2 className="text-lg font-semibold text-slate-950">Permissions</h2>
                <p className="mt-1 text-sm text-slate-500">Start conservative. Managers can loosen approvals after testing.</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Toggle label="Can reply automatically" checked={form.canReply} onChange={(canReply) => update({ canReply })} />
                  <PermissionTool name="assignConversation" label="Can assign conversations" form={form} update={update} />
                  <PermissionTool name="createLead" label="Can create leads" form={form} update={update} />
                  <PermissionTool name="updateContactField" label="Can update CRM fields" form={form} update={update} />
                  <PermissionTool name="triggerWorkflow" label="Can trigger workflows" form={form} update={update} />
                  <PermissionTool name="escalateHuman" label="Can escalate to humans" form={form} update={update} />
                </div>
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                  <label className="flex items-center gap-3">
                    <LockKeyhole size={18} className="text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">Needs approval for actions</span>
                    <select
                      value={form.approvalMode}
                      onChange={(event) => update({ approvalMode: event.target.value })}
                      className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none"
                    >
                      <option value="off">No approval</option>
                      <option value="first_reply">First reply</option>
                      <option value="all_replies">All replies</option>
                      <option value="tools_only">Tools only</option>
                    </select>
                  </label>
                </div>
              </section>
            ) : null}

            {currentStep === "publish" ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-950">Review</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Review label="Template" value={selectedTemplate.title} />
                  <Review label="Name" value={form.name} />
                  <Review label="Tone" value={form.tone} />
                  <Review label="Language" value={form.defaultLanguage} />
                  <Review label="Channels" value={form.channels.join(", ")} />
                  <Review label="Approval mode" value={form.approvalMode.replace(/_/g, " ")} />
                </div>
              </section>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                Back
              </button>
              {currentStep === "publish" ? (
                <div className="flex gap-2">
                  <button
                    disabled={saving}
                    onClick={() => save(false)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => save(true)}
                    className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Publish
                  </button>
                </div>
              ) : (
                <button
                  disabled={!canNext}
                  onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-lg border p-4 text-left ${
        checked ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-emerald-500" : "bg-slate-200"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function PermissionTool({
  name,
  label,
  form,
  update,
}: {
  name: string;
  label: string;
  form: { toolsAllowed: string[] };
  update: (patch: any) => void;
}) {
  const checked = form.toolsAllowed.includes(name);
  return (
    <Toggle
      label={label}
      checked={checked}
      onChange={() =>
        update({
          toolsAllowed: checked
            ? form.toolsAllowed.filter((tool) => tool !== name)
            : [...form.toolsAllowed, name],
        })
      }
    />
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{value || "Not set"}</p>
    </div>
  );
}
