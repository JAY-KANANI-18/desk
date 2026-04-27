import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Check,
  ChevronRight,
  FileText,
  Gauge,
  History,
  Loader2,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  TestTube2,
  Wrench,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../../../components/ui/Button";
import { BaseInput, RangeInput, TextareaInput } from "../../../components/ui/inputs";
import { Select } from "../../../components/ui/Select";
import { Tag } from "../../../components/ui/Tag";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import type { AiAgentDetail, AiAgentVersion, AiAnalyticsSummary, AiKnowledgeSource, AiRunDetail, AiSandboxRun, AiToolMeta } from "../types";
import {
  AiPageLayout,
  ChannelPills,
  MetricTile,
  StatusBadge,
  agentTypeLabels,
} from "../components/AiAgentPrimitives";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "behavior", label: "Prompt & Behavior", icon: Brain },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "guardrails", label: "Guardrails", icon: ShieldCheck },
  { id: "versions", label: "Versions", icon: History },
  { id: "playground", label: "Test Playground", icon: TestTube2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

const sourceTypeOptions = [
  { value: "website", label: "Website crawler" },
  { value: "file", label: "PDF / DOCX / TXT" },
  { value: "faq", label: "FAQ import" },
  { value: "product_catalog", label: "Product catalog" },
  { value: "manual", label: "Manual entry" },
];

type TabId = (typeof tabs)[number]["id"];

export function AgentDetailPage() {
  const { agentId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "overview";
  const [detail, setDetail] = useState<AiAgentDetail | null>(null);
  const [tools, setTools] = useState<AiToolMeta[]>([]);
  const [sources, setSources] = useState<AiKnowledgeSource[]>([]);
  const [analytics, setAnalytics] = useState<AiAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [nextDetail, nextTools, nextSources, nextAnalytics] = await Promise.all([
        aiAgentsApi.get(agentId),
        aiAgentsApi.tools(),
        aiAgentsApi.knowledgeSources(),
        aiAgentsApi.analytics(),
      ]);
      setDetail(nextDetail);
      setTools(nextTools);
      setSources(nextSources);
      setAnalytics(nextAnalytics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [agentId]);

  const draft = useMemo(() => detail?.versions.find((version) => version.status === "draft") || detail?.versions[0], [detail]);
  const activeVersion = useMemo(
    () => detail?.versions.find((version) => version.id === detail.agent.activeVersionId) || detail?.versions.find((version) => version.status === "published"),
    [detail],
  );

  const setTab = (tab: TabId) => setSearchParams(tab === "overview" ? {} : { tab });

  if (loading) {
    return (
      <AiPageLayout title="AI Agent" eyebrow="Automation" description="Loading the latest agent configuration.">
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          <Loader2 size={16} className="mr-2 animate-spin" />
          Loading agent...
        </div>
      </AiPageLayout>
    );
  }

  if (!detail || !draft) {
    return (
      <AiPageLayout
        title="Agent not found"
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/ai-agents")}>
            Back to AI Agents
          </Button>
        }
      >
        <div className="p-6 text-sm text-slate-500">This agent may have been archived or you may not have access.</div>
      </AiPageLayout>
    );
  }

  const publish = async () => {
    await aiAgentsApi.publish(agentId);
    toast.success("Agent published");
    load();
  };

  return (
    <AiPageLayout
      eyebrow={agentTypeLabels[detail.agent.agentType]}
      title={detail.agent.name}
      description={detail.agent.description || "Configure, test, and supervise this AI agent."}
      actions={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate("/ai-agents")}
          >
            Back
          </Button>
          <StatusBadge status={detail.agent.status} />
          <Button
            type="button"
            variant="dark"
            size="sm"
            leftIcon={<Play size={16} />}
            onClick={publish}
          >
            Publish
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="overflow-x-auto border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <nav className="flex gap-1 p-3 lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={active ? "dark" : "ghost"}
                  size="sm"
                  fullWidth
                  contentAlign="start"
                  leftIcon={<Icon size={17} />}
                  onClick={() => setTab(tab.id)}
                >
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-0 overflow-auto p-4 sm:p-6">
          {activeTab === "overview" ? <OverviewTab detail={detail} activeVersion={activeVersion} analytics={analytics} /> : null}
          {activeTab === "behavior" ? <BehaviorTab agentId={agentId} version={draft} onSaved={load} /> : null}
          {activeTab === "knowledge" ? <KnowledgeTab sources={sources} onChanged={load} /> : null}
          {activeTab === "tools" ? <ToolsTab agentId={agentId} version={draft} tools={tools} onSaved={load} /> : null}
          {activeTab === "guardrails" ? <GuardrailsTab agentId={agentId} version={draft} onSaved={load} /> : null}
          {activeTab === "versions" ? <VersionsTab agentId={agentId} detail={detail} onChanged={load} /> : null}
          {activeTab === "playground" ? <PlaygroundTab agentId={agentId} /> : null}
          {activeTab === "analytics" ? <AnalyticsTab analytics={analytics} /> : null}
        </main>
      </div>
    </AiPageLayout>
  );
}

function OverviewTab({
  detail,
  activeVersion,
  analytics,
}: {
  detail: AiAgentDetail;
  activeVersion?: AiAgentVersion;
  analytics: AiAnalyticsSummary | null;
}) {
  const summary = analytics?.summary;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Live status" value={detail.agent.status} detail={`Version ${activeVersion?.version || "draft"}`} icon={<Gauge size={18} />} />
        <MetricTile label="Handled" value={summary?.runs ?? 0} detail="Selected period" icon={<Bot size={18} />} />
        <MetricTile label="Resolution" value={`${summary?.runs ? Math.round(((summary.completed || 0) / summary.runs) * 100) : 0}%`} detail="Completed without failure" icon={<Check size={18} />} />
        <MetricTile label="Avg response" value={summary?.avg_latency_ms ? `${(summary.avg_latency_ms / 1000).toFixed(1)}s` : "0s"} detail="Runtime latency" icon={<Activity size={18} />} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Assigned channels</h2>
            <p className="mt-1 text-sm text-slate-500">The agent replies only where its published version allows it.</p>
          </div>
          <StatusBadge status={detail.agent.status} />
        </div>
        <div className="mt-4">
          <ChannelPills channels={activeVersion?.channelAllowlist || detail.agent.activeChannels || []} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Recent activity</h2>
        <div className="mt-4 space-y-3">
          {[
            "Draft version ready for testing",
            "Knowledge retrieval enabled",
            "Tool registry connected",
            "Human handoff rules active",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BehaviorTab({ agentId, version, onSaved }: { agentId: string; version: AiAgentVersion; onSaved: () => void }) {
  const [draft, setDraft] = useState({
    name: version.name,
    tone: version.tone,
    defaultLanguage: version.defaultLanguage,
    systemPrompt: version.systemPrompt,
    businessHours: JSON.stringify(version.businessHours || {}, null, 2),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await aiAgentsApi.updateDraft(agentId, {
        name: draft.name,
        tone: draft.tone,
        defaultLanguage: draft.defaultLanguage,
        systemPrompt: draft.systemPrompt,
        businessHours: safeJson(draft.businessHours),
      });
      toast.success("Behavior saved");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Prompt & Behavior</h2>
          <p className="mt-1 text-sm text-slate-500">Set the agent identity, tone, escalation posture, and office hours.</p>
        </div>
        <Button
          type="button"
          variant="dark"
          leftIcon={<Save size={16} />}
          loading={saving}
          loadingMode="inline"
          loadingLabel="Saving"
          onClick={save}
        >
          Save
        </Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Name" value={draft.name} onChange={(name) => setDraft((state) => ({ ...state, name }))} />
        <Field label="Tone" value={draft.tone} onChange={(tone) => setDraft((state) => ({ ...state, tone }))} />
        <Field label="Language" value={draft.defaultLanguage} onChange={(defaultLanguage) => setDraft((state) => ({ ...state, defaultLanguage }))} />
        <TextareaInput
          label="Office hours JSON"
          value={draft.businessHours}
          onChange={(event) => setDraft((state) => ({ ...state, businessHours: event.target.value }))}
          rows={5}
          className="font-mono text-xs"
        />
        <div className="md:col-span-2">
          <TextareaInput
            label="System instructions"
            value={draft.systemPrompt}
            onChange={(event) => setDraft((state) => ({ ...state, systemPrompt: event.target.value }))}
            rows={9}
          />
        </div>
      </div>
    </div>
  );
}

function KnowledgeTab({ sources, onChanged }: { sources: AiKnowledgeSource[]; onChanged: () => void }) {
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState("website");
  const [name, setName] = useState("");
  const [uri, setUri] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = sources.filter((source) => source.name.toLowerCase().includes(query.toLowerCase()));

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await aiAgentsApi.createKnowledgeSource({ name, sourceType, uri });
      toast.success("Knowledge source queued for indexing");
      setName("");
      setUri("");
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Add knowledge</h2>
        <p className="mt-1 text-sm text-slate-500">Upload files, crawl websites, or import FAQs and catalogs.</p>
        <div className="mt-5 space-y-3">
          <Field label="Source name" value={name} onChange={setName} />
          <Select
            label="Type"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
            options={sourceTypeOptions}
          />
          <Field label={sourceType === "website" ? "Website URL" : "Source URI or note"} value={uri} onChange={setUri} />
          {sourceType === "file" ? (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              PDF, DOCX, TXT, CSV
              <p className="mt-1 text-xs">File storage upload plugs into the existing media/files flow.</p>
            </div>
          ) : null}
          <Button
            type="button"
            variant="dark"
            fullWidth
            disabled={saving || !name.trim()}
            loading={saving}
            loadingMode="inline"
            loadingLabel="Adding source"
            onClick={create}
          >
            Add source
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Knowledge sources</h2>
            <p className="text-sm text-slate-500">Indexing progress, errors, sync state, and re-sync actions live here.</p>
          </div>
          <BaseInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knowledge" size="sm" />
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.length ? filtered.map((source) => (
            <div key={source.id} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_150px_120px] md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-500"><FileText size={17} /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{source.name}</p>
                  <p className="text-xs text-slate-500">{source.uri || source.sourceType}</p>
                </div>
              </div>
              <StatusBadge status={source.status} />
              <p className="text-sm text-slate-500">{source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleDateString() : "Not synced"}</p>
              <Button type="button" variant="secondary" size="sm">Re-sync</Button>
            </div>
          )) : (
            <p className="p-8 text-center text-sm text-slate-500">No knowledge sources yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ToolsTab({ agentId, version, tools, onSaved }: { agentId: string; version: AiAgentVersion; tools: AiToolMeta[]; onSaved: () => void }) {
  const [allowed, setAllowed] = useState(version.toolsAllowed || []);
  const save = async () => {
    await aiAgentsApi.updateDraft(agentId, { toolsAllowed: allowed });
    toast.success("Tools updated");
    onSaved();
  };
  return (
    <section className="max-w-4xl rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Tools / Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Only enabled tools can be invoked by this agent.</p>
        </div>
        <Button type="button" variant="dark" onClick={save}>Save</Button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {tools.map((tool) => {
          const checked = allowed.includes(tool.name);
          return (
            <Button
              key={tool.name}
              type="button"
              variant="select-card"
              selected={checked}
              radius="lg"
              fullWidth
              contentAlign="start"
              preserveChildLayout
              onClick={() => setAllowed((state) => checked ? state.filter((item) => item !== tool.name) : [...state, tool.name])}
            >
              <span className="block w-full text-left">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-950">{tool.name}</span>
                  <Tag label={tool.risk} bgColor={riskColor(tool.risk)} size="sm" />
                </span>
                <span className="mt-2 block text-sm font-normal text-slate-500">{tool.description}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}

function GuardrailsTab({ agentId, version, onSaved }: { agentId: string; version: AiAgentVersion; onSaved: () => void }) {
  const [config, setConfig] = useState({
    confidenceThreshold: Number(version.runtimeConfig?.confidenceThreshold ?? 0.65),
    maxAutoReplies: Number(version.runtimeConfig?.maxAutoReplies ?? 5),
    noHallucinatedPricing: version.guardrails?.noHallucinatedPricing ?? true,
    noUnsupportedRefunds: version.guardrails?.noUnsupportedRefunds ?? true,
    noLegalAdvice: version.guardrails?.noLegalAdvice ?? true,
    noMedicalClaims: version.guardrails?.noMedicalClaims ?? true,
  });

  const save = async () => {
    await aiAgentsApi.updateDraft(agentId, {
      runtimeConfig: {
        ...version.runtimeConfig,
        confidenceThreshold: config.confidenceThreshold,
        maxAutoReplies: config.maxAutoReplies,
      },
      guardrails: {
        ...version.guardrails,
        noHallucinatedPricing: config.noHallucinatedPricing,
        noUnsupportedRefunds: config.noUnsupportedRefunds,
        noLegalAdvice: config.noLegalAdvice,
        noMedicalClaims: config.noMedicalClaims,
      },
    });
    toast.success("Guardrails saved");
    onSaved();
  };

  return (
    <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Guardrails</h2>
          <p className="mt-1 text-sm text-slate-500">Controls that keep the agent grounded and escalation-friendly.</p>
        </div>
        <Button type="button" variant="dark" onClick={save}>Save</Button>
      </div>
      <div className="mt-5 space-y-4">
        <Range label="Confidence threshold" value={config.confidenceThreshold} min={0.4} max={0.95} step={0.05} onChange={(confidenceThreshold) => setConfig((state) => ({ ...state, confidenceThreshold }))} />
        <Range label="Max auto replies before handoff" value={config.maxAutoReplies} min={1} max={12} step={1} onChange={(maxAutoReplies) => setConfig((state) => ({ ...state, maxAutoReplies }))} />
        {[
          ["noHallucinatedPricing", "No hallucinated pricing"],
          ["noUnsupportedRefunds", "Block unsupported refunds"],
          ["noLegalAdvice", "No legal advice"],
          ["noMedicalClaims", "No medical claims"],
        ].map(([key, label]) => {
          const checked = Boolean(config[key as keyof typeof config]);
          return (
            <div key={key} className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-800">
              {label}
              <ToggleSwitch
                checked={checked}
                aria-label={label}
                onChange={() => setConfig((state) => ({ ...state, [key]: !checked }))}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VersionsTab({ agentId, detail, onChanged }: { agentId: string; detail: AiAgentDetail; onChanged: () => void }) {
  const rollback = async (versionId: string) => {
    await aiAgentsApi.rollback(agentId, versionId);
    toast.success("Rolled back to selected version");
    onChanged();
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-950">Versions</h2>
        <p className="text-sm text-slate-500">Draft, published, and rollback history.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {detail.versions.map((version) => (
          <div key={version.id} className="grid gap-3 p-4 md:grid-cols-[1fr_130px_160px_120px] md:items-center">
            <div>
              <p className="font-semibold text-slate-950">Version {version.version}</p>
              <p className="text-sm text-slate-500">{version.tone} - {version.defaultLanguage}</p>
            </div>
            <StatusBadge status={version.status} />
            <p className="text-sm text-slate-500">{version.publishedAt ? new Date(version.publishedAt).toLocaleDateString() : "Not published"}</p>
            {version.status === "published" ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => rollback(version.id)}
              >
                Rollback
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlaygroundTab({ agentId }: { agentId: string }) {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState("");
  const [message, setMessage] = useState("Hi, I need help choosing the right plan.");
  const [result, setResult] = useState<AiSandboxRun | null>(null);
  const [runDetail, setRunDetail] = useState<AiRunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!conversationId.trim()) {
      toast.error("Paste a conversation ID to simulate against");
      return;
    }
    setLoading(true);
    try {
      const nextResult = await aiAgentsApi.sandboxRun(agentId, { conversationId: conversationId.trim(), message });
      setResult(nextResult);
      if (nextResult.runId) {
        const detail = await aiAgentsApi.run(nextResult.runId);
        setRunDetail(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[620px] gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(420px,1.1fr)]">
      <section className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-950">Fake customer chat</h2>
          <p className="text-sm text-slate-500">Sandbox runs never send real messages.</p>
        </div>
        <div className="flex-1 space-y-4 overflow-auto bg-slate-50 p-4">
          <div className="max-w-[80%] rounded-lg rounded-bl-sm bg-white p-3 text-sm text-slate-800 shadow-sm">{message}</div>
          {result?.reply ? <div className="ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-slate-950 p-3 text-sm text-white">{result.reply}</div> : null}
          {result?.handoffReason ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Handoff: {result.handoffReason}</div> : null}
        </div>
        <div className="space-y-3 border-t border-slate-100 p-4">
          <Field label="Conversation fixture ID" value={conversationId} onChange={setConversationId} />
          <TextareaInput
            label="Customer message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
          />
          <Button
            type="button"
            variant="dark"
            fullWidth
            disabled={loading}
            loading={loading}
            loadingMode="inline"
            loadingLabel="Simulating"
            leftIcon={!loading ? <Play size={16} /> : undefined}
            onClick={run}
          >
            Simulate customer
          </Button>
        </div>
      </section>

      <section className="min-h-0 overflow-auto rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-950">Debug panel</h2>
          <p className="text-sm text-slate-500">Intent, confidence, tools, memory, prompt tokens, and final status.</p>
        </div>
        <div className="space-y-4 p-4">
          <DebugRow label="Detected intent" value={result?.decision?.intent || "Run a simulation"} />
          <DebugRow label="Confidence score" value={result?.decision ? `${Math.round(result.decision.confidence * 100)}%` : "Waiting"} />
          <DebugRow label="Response strategy" value={result?.decision?.responseStrategy || "Waiting"} />
          <DebugBlock title="Tools planned" data={result?.decision?.tools || []} />
          <DebugBlock title="Actions executed" data={result?.actions || []} />
          <DebugBlock title="Memory updates" data={result?.decision?.memoryUpdates || []} />
          <DebugBlock title="Run messages and tokens" data={runDetail?.messages || []} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={run}>Retry</Button>
            <Button type="button" variant="secondary" size="sm">Compare responses</Button>
            <Button
              type="button"
              variant="dark"
              size="sm"
              rightIcon={<ChevronRight size={14} />}
              onClick={() => navigate(`/ai-agents/${agentId}?tab=versions`)}
            >
              Publish if good
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsTab({ analytics }: { analytics: AiAnalyticsSummary | null }) {
  const summary = analytics?.summary;
  const chart = [
    { name: "Handled", value: summary?.runs || 0 },
    { name: "Resolved", value: summary?.completed || 0 },
    { name: "Handoff", value: summary?.escalated || 0 },
    { name: "Failed", value: summary?.failed || 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Conversations handled" value={summary?.runs || 0} />
        <MetricTile label="Auto resolution" value={`${summary?.runs ? Math.round(((summary.completed || 0) / summary.runs) * 100) : 0}%`} />
        <MetricTile label="Handoff rate" value={`${summary?.runs ? Math.round(((summary.escalated || 0) / summary.runs) * 100) : 0}%`} />
        <MetricTile label="Avg response time" value={summary?.avg_latency_ms ? `${(summary.avg_latency_ms / 1000).toFixed(1)}s` : "0s"} />
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Resolution trend</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Cost by provider/model</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {(analytics?.usage || []).map((item) => (
            <div key={`${item.provider}-${item.model}`} className="flex items-center justify-between py-3 text-sm">
              <span className="font-semibold text-slate-800">{item.provider} - {item.model}</span>
              <span className="text-slate-500">{Number(item.total_tokens || 0).toLocaleString()} tokens</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <BaseInput value={value} label={label} onChange={(event) => onChange(event.target.value)} />
  );
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="mb-3 text-sm font-semibold text-slate-700">
        <span>{label}</span>
      </div>
      <RangeInput min={min} max={max} step={step} value={value} valueLabel={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DebugBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function riskColor(risk: AiToolMeta["risk"]) {
  if (risk === "high") return "error";
  if (risk === "medium") return "warning";
  return "success";
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
