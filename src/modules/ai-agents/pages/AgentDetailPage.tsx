import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  SlidersHorizontal,
  TestTube2,
  Wrench,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import type { AiAgentDetail, AiAgentVersion, AiAnalyticsSummary, AiKnowledgeSource, AiRunDetail, AiSandboxRun, AiToolMeta } from "../types";
import {
  ChannelPills,
  MetricTile,
  PageHeader,
  PageShell,
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
      <PageShell>
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          <Loader2 size={16} className="mr-2 animate-spin" />
          Loading agent...
        </div>
      </PageShell>
    );
  }

  if (!detail || !draft) {
    return (
      <PageShell>
        <PageHeader title="Agent not found" actions={<Link to="/ai-agents" className="text-sm font-semibold text-slate-700">Back to AI Agents</Link>} />
      </PageShell>
    );
  }

  const publish = async () => {
    await aiAgentsApi.publish(agentId);
    toast.success("Agent published");
    load();
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={agentTypeLabels[detail.agent.agentType]}
        title={detail.agent.name}
        description={detail.agent.description || "Configure, test, and supervise this AI agent."}
        actions={
          <>
            <button
              onClick={() => navigate("/ai-agents")}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <StatusBadge status={detail.agent.status} />
            <button
              onClick={publish}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Play size={16} />
              Publish
            </button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="overflow-x-auto border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <nav className="flex gap-1 p-3 lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                    active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
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
    </PageShell>
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
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Save size={16} />
          Save
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Name" value={draft.name} onChange={(name) => setDraft((state) => ({ ...state, name }))} />
        <Field label="Tone" value={draft.tone} onChange={(tone) => setDraft((state) => ({ ...state, tone }))} />
        <Field label="Language" value={draft.defaultLanguage} onChange={(defaultLanguage) => setDraft((state) => ({ ...state, defaultLanguage }))} />
        <label>
          <span className="text-sm font-semibold text-slate-700">Office hours JSON</span>
          <textarea value={draft.businessHours} onChange={(event) => setDraft((state) => ({ ...state, businessHours: event.target.value }))} className="mt-1 min-h-28 w-full rounded-md border border-slate-200 p-3 font-mono text-xs outline-none focus:border-slate-400" />
        </label>
        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">System instructions</span>
          <textarea value={draft.systemPrompt} onChange={(event) => setDraft((state) => ({ ...state, systemPrompt: event.target.value }))} className="mt-1 min-h-56 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-slate-400" />
        </label>
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
          <label>
            <span className="text-sm font-semibold text-slate-700">Type</span>
            <select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm">
              <option value="website">Website crawler</option>
              <option value="file">PDF / DOCX / TXT</option>
              <option value="faq">FAQ import</option>
              <option value="product_catalog">Product catalog</option>
              <option value="manual">Manual entry</option>
            </select>
          </label>
          <Field label={sourceType === "website" ? "Website URL" : "Source URI or note"} value={uri} onChange={setUri} />
          {sourceType === "file" ? (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              PDF, DOCX, TXT, CSV
              <p className="mt-1 text-xs">File storage upload plugs into the existing media/files flow.</p>
            </div>
          ) : null}
          <button disabled={saving || !name.trim()} onClick={create} className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Add source
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Knowledge sources</h2>
            <p className="text-sm text-slate-500">Indexing progress, errors, sync state, and re-sync actions live here.</p>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knowledge" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none" />
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
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Re-sync</button>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Tools / Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Only enabled tools can be invoked by this agent.</p>
        </div>
        <button onClick={save} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Save</button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {tools.map((tool) => {
          const checked = allowed.includes(tool.name);
          return (
            <button key={tool.name} onClick={() => setAllowed((state) => checked ? state.filter((item) => item !== tool.name) : [...state, tool.name])} className={`rounded-lg border p-4 text-left ${checked ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{tool.name}</p>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${tool.risk === "high" ? "bg-rose-50 text-rose-700" : tool.risk === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{tool.risk}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{tool.description}</p>
            </button>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Guardrails</h2>
          <p className="mt-1 text-sm text-slate-500">Controls that keep the agent grounded and escalation-friendly.</p>
        </div>
        <button onClick={save} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Save</button>
      </div>
      <div className="mt-5 space-y-4">
        <Range label="Confidence threshold" value={config.confidenceThreshold} min={0.4} max={0.95} step={0.05} onChange={(confidenceThreshold) => setConfig((state) => ({ ...state, confidenceThreshold }))} />
        <Range label="Max auto replies before handoff" value={config.maxAutoReplies} min={1} max={12} step={1} onChange={(maxAutoReplies) => setConfig((state) => ({ ...state, maxAutoReplies }))} />
        {[
          ["noHallucinatedPricing", "No hallucinated pricing"],
          ["noUnsupportedRefunds", "Block unsupported refunds"],
          ["noLegalAdvice", "No legal advice"],
          ["noMedicalClaims", "No medical claims"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setConfig((state: any) => ({ ...state, [key]: !state[key] }))} className="flex w-full items-center justify-between rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-800">
            {label}
            <span className={`h-5 w-9 rounded-full p-0.5 ${config[key as keyof typeof config] ? "bg-emerald-500" : "bg-slate-200"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition ${config[key as keyof typeof config] ? "translate-x-4" : ""}`} />
            </span>
          </button>
        ))}
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
              <p className="text-sm text-slate-500">{version.tone} · {version.defaultLanguage}</p>
            </div>
            <StatusBadge status={version.status} />
            <p className="text-sm text-slate-500">{version.publishedAt ? new Date(version.publishedAt).toLocaleDateString() : "Not published"}</p>
            {version.status === "published" ? (
              <button onClick={() => rollback(version.id)} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                <RotateCcw size={14} />
                Rollback
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlaygroundTab({ agentId }: { agentId: string }) {
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
          <label>
            <span className="text-sm font-semibold text-slate-700">Customer message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3 text-sm outline-none" />
          </label>
          <button disabled={loading} onClick={run} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Simulate customer
          </button>
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
            <button onClick={run} disabled={loading} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Retry</button>
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Compare responses</button>
            <Link to={`/ai-agents/${agentId}?tab=versions`} className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
              Publish if good
              <ChevronRight size={14} />
            </Link>
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
              <span className="font-semibold text-slate-800">{item.provider} · {item.model}</span>
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
    <label>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:border-slate-400" />
    </label>
  );
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full" />
    </label>
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

function DebugBlock({ title, data }: { title: string; data: any }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
