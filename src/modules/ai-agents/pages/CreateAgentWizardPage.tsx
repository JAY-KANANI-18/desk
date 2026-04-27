import { useMemo, useState, type ReactNode } from "react";
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
import { Button } from "../../../components/ui/Button";
import { BaseInput, TextareaInput } from "../../../components/ui/inputs";
import { Select } from "../../../components/ui/Select";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { AiPageLayout } from "../components/AiAgentPrimitives";
import type { AiAgentType } from "../types";

type WizardStep = "template" | "identity" | "channels" | "permissions" | "publish";

type AgentWizardForm = {
  templateId: string;
  name: string;
  description: string;
  avatar: string;
  tone: string;
  defaultLanguage: string;
  channels: string[];
  toolsAllowed: string[];
  approvalMode: string;
  canReply: boolean;
};

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
  icon: ReactNode;
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
const approvalModeOptions = [
  { value: "off", label: "No approval" },
  { value: "first_reply", label: "First reply" },
  { value: "all_replies", label: "All replies" },
  { value: "tools_only", label: "Tools only" },
];

export function CreateAgentWizardPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AgentWizardForm>({
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

  const update = (patch: Partial<AgentWizardForm>) => setForm((state) => ({ ...state, ...patch }));

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
    <AiPageLayout
      eyebrow="Create Agent"
      title="Launch a supervised AI teammate"
      description="Start from a proven workflow, connect channels, choose permissions, then test before going live."
      actions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/ai-agents")}
        >
          Back
        </Button>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <Button
                key={step.id}
                type="button"
                onClick={() => setStepIndex(index)}
                variant={index === stepIndex ? "dark" : "ghost"}
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                <span className="flex w-full items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                    index < stepIndex
                      ? "bg-emerald-500 text-white"
                      : index === stepIndex
                        ? "bg-white text-slate-950"
                        : "bg-slate-100 text-slate-500"
                  }`}>
                    {index < stepIndex ? <Check size={14} /> : index + 1}
                  </span>
                  <span className="text-sm font-semibold">{step.label}</span>
                </span>
              </Button>
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
                    <Button
                      key={template.id}
                      type="button"
                      variant="select-card"
                      selected={form.templateId === template.id}
                      fullWidth
                      contentAlign="start"
                      preserveChildLayout
                      radius="lg"
                      onClick={() => chooseTemplate(template.id)}
                    >
                      <span className="block w-full text-left">
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                            {template.icon}
                          </span>
                          <span>
                            <span className="block font-semibold text-slate-950">{template.title}</span>
                            <span className="block text-xs text-slate-500">{template.type}</span>
                          </span>
                        </span>
                        <span className="mt-4 block text-sm font-normal text-slate-500">{template.description}</span>
                      </span>
                    </Button>
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
                  <div className="md:col-span-2">
                    <TextareaInput
                      label="Description"
                      value={form.description}
                      onChange={(event) => update({ description: event.target.value })}
                      rows={4}
                    />
                  </div>
                  <Select
                    label="Language"
                    value={form.defaultLanguage}
                    onChange={(event) => update({ defaultLanguage: event.target.value })}
                    options={languageOptions.map((language) => ({ value: language, label: language }))}
                  />
                  <div className="hidden items-end gap-2 text-sm font-semibold text-slate-500 md:flex">
                    <Languages size={15} />
                    Keep language set to auto when channels serve multiple regions.
                  </div>
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
                      <Button
                        key={channel}
                        type="button"
                        variant="select-card"
                        selected={checked}
                        fullWidth
                        contentAlign="start"
                        preserveChildLayout
                        radius="lg"
                        onClick={() =>
                          update({
                            channels: checked
                              ? form.channels.filter((item) => item !== channel)
                              : [...form.channels, channel],
                          })
                        }
                      >
                        <span className="flex w-full items-center justify-between gap-3">
                          <span className="flex items-center gap-3 text-sm font-semibold capitalize text-slate-800">
                            <MessageCircle size={18} />
                            {channel}
                          </span>
                          {checked ? <Check size={18} className="text-emerald-600" /> : null}
                        </span>
                      </Button>
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
                  <ToggleSetting label="Can reply automatically" checked={form.canReply} onChange={(canReply) => update({ canReply })} />
                  <PermissionTool name="assignConversation" label="Can assign conversations" form={form} update={update} />
                  <PermissionTool name="createLead" label="Can create leads" form={form} update={update} />
                  <PermissionTool name="updateContactField" label="Can update CRM fields" form={form} update={update} />
                  <PermissionTool name="triggerWorkflow" label="Can trigger workflows" form={form} update={update} />
                  <PermissionTool name="escalateHuman" label="Can escalate to humans" form={form} update={update} />
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                  <LockKeyhole size={18} className="mt-7 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <Select
                      label="Needs approval for actions"
                      value={form.approvalMode}
                      onChange={(event) => update({ approvalMode: event.target.value })}
                      options={approvalModeOptions}
                    />
                  </div>
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
              <Button
                type="button"
                variant="secondary"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              >
                Back
              </Button>
              {currentStep === "publish" ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    loading={saving}
                    loadingMode="inline"
                    loadingLabel="Saving"
                    onClick={() => save(false)}
                  >
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    variant="dark"
                    disabled={saving}
                    loading={saving}
                    loadingMode="inline"
                    loadingLabel="Publishing"
                    onClick={() => save(true)}
                  >
                    Publish
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="dark"
                  disabled={!canNext}
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </AiPageLayout>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <BaseInput
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${
      checked ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"
    }`}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} aria-label={label} />
    </div>
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
  form: Pick<AgentWizardForm, "toolsAllowed">;
  update: (patch: Partial<AgentWizardForm>) => void;
}) {
  const checked = form.toolsAllowed.includes(name);
  return (
    <ToggleSetting
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