import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  Copy,
  MoreHorizontal,
  Pause,
  Pencil,
  Plus,
  Rocket,
  Search,
  Trash2,
} from "lucide-react";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useSocket } from "../../../socket/socket-provider";
import { useAuthorization } from "../../../context/AuthorizationContext";
import type { AiAgentListItem, AiAgentStatus, AiAgentType } from "../types";
import {
  ChannelPills,
  EmptyState,
  PageHeader,
  PageShell,
  SkeletonRows,
  StatusBadge,
  agentTypeLabels,
} from "../components/AiAgentPrimitives";

const statuses: Array<"all" | AiAgentStatus> = ["all", "draft", "active", "paused"];
const types: Array<"all" | AiAgentType> = ["all", "sales", "support", "receptionist", "custom"];
const channels = ["all", "whatsapp", "instagram", "messenger", "email", "webchat"];

export function AiAgentsListPage() {
  const navigate = useNavigate();
  const { canWs } = useAuthorization();
  const { socket } = useSocket();
  const [agents, setAgents] = useState<AiAgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AiAgentStatus>("all");
  const [type, setType] = useState<"all" | AiAgentType>("all");
  const [channel, setChannel] = useState("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = canWs("ws:ai-agents:manage");

  const load = async () => {
    setLoading(true);
    try {
      const data = await aiAgentsApi.list();
      setAgents(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("ai_agent.updated", refresh);
    socket.on("ai_run.completed", refresh);
    socket.on("ai_action.waiting_approval", refresh);
    return () => {
      socket.off("ai_agent.updated", refresh);
      socket.off("ai_run.completed", refresh);
      socket.off("ai_action.waiting_approval", refresh);
    };
  }, [socket]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.description?.toLowerCase().includes(q);
      const matchesStatus = status === "all" || agent.status === status;
      const matchesType = type === "all" || agent.agentType === type;
      const matchesChannel =
        channel === "all" ||
        agent.activeChannels?.includes(channel) ||
        (!agent.activeChannels?.length && channel === "all");
      return matchesQuery && matchesStatus && matchesType && matchesChannel;
    });
  }, [agents, query, status, type, channel]);

  const doAction = async (agent: AiAgentListItem, action: () => Promise<any>, success: string) => {
    setBusyId(agent.id);
    setMenuId(null);
    try {
      await action();
      toast.success(success);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const duplicateAgent = (agent: AiAgentListItem) =>
    doAction(
      agent,
      () =>
        aiAgentsApi.create({
          name: `${agent.name} copy`,
          description: agent.description || "",
          agentType: agent.agentType,
          tone: agent.activeTone || "professional",
          defaultLanguage: agent.activeLanguage || "auto",
          channelAllowlist: agent.activeChannels || [],
        }),
      "Agent duplicated as a draft",
    );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Automation"
        title="AI Agents"
        description="Build, test, publish, and supervise AI teammates for customer conversations."
        actions={
          <>
            <Link
              to="/ai-agents/approvals"
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Approval queue
            </Link>
            <Link
              to="/ai-agents/usage"
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Usage
            </Link>
            {canManage ? (
              <Link
                to="/ai-agents/new"
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={16} />
                Create Agent
              </Link>
            ) : null}
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative max-w-md flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents"
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect value={status} onChange={(value) => setStatus(value as any)} options={statuses} label="Status" />
              <FilterSelect value={type} onChange={(value) => setType(value as any)} options={types} label="Type" />
              <FilterSelect value={channel} onChange={setChannel} options={channels} label="Channel" />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <SkeletonRows rows={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={agents.length ? "No agents match your filters" : "Create your first AI agent"}
              body={
                agents.length
                  ? "Adjust status, type, channel, or search to find the agent you need."
                  : "Start with a sales, support, receptionist, lead qualifier, or blank agent and test it before publishing."
              }
              action={
                canManage ? (
                  <Link
                    to="/ai-agents/new"
                    className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Create Agent
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="bg-white">
              <div className="hidden grid-cols-[minmax(260px,1fr)_120px_220px_150px_150px_56px] border-b border-slate-100 px-6 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 lg:grid">
                <span>Agent</span>
                <span>Status</span>
                <span>Channels</span>
                <span>Today</span>
                <span>Last updated</span>
                <span />
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((agent) => (
                  <div
                    key={agent.id}
                    className="grid grid-cols-1 gap-3 px-4 py-4 hover:bg-slate-50 lg:grid-cols-[minmax(260px,1fr)_120px_220px_150px_150px_56px] lg:items-center lg:px-6"
                  >
                    <button
                      onClick={() => navigate(`/ai-agents/${agent.id}`)}
                      className="min-w-0 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                          <Rocket size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{agent.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {agentTypeLabels[agent.agentType]} agent
                            {agent.description ? ` · ${agent.description}` : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                    <StatusBadge status={agent.status} />
                    <ChannelPills channels={agent.activeChannels || []} />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{agent.conversationsToday ?? 0}</p>
                      <p className="text-xs text-slate-500">{agent.successRate ?? 0}% success</p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(agent.updatedAt)}</p>
                    <div className="relative flex justify-end">
                      <button
                        onClick={() => setMenuId((id) => (id === agent.id ? null : agent.id))}
                        className="rounded-md p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                        disabled={busyId === agent.id}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                      {menuId === agent.id ? (
                        <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                          <MenuAction icon={<Pencil size={14} />} label="Edit" onClick={() => navigate(`/ai-agents/${agent.id}`)} />
                          <MenuAction icon={<BarChart3 size={14} />} label="View analytics" onClick={() => navigate(`/ai-agents/${agent.id}?tab=analytics`)} />
                          {canManage ? (
                            <>
                              <MenuAction icon={<Rocket size={14} />} label="Publish new version" onClick={() => navigate(`/ai-agents/${agent.id}?tab=versions`)} />
                              <MenuAction icon={<Copy size={14} />} label="Duplicate" onClick={() => duplicateAgent(agent)} />
                              <MenuAction icon={<Pause size={14} />} label="Pause" onClick={() => doAction(agent, () => aiAgentsApi.pause(agent.id), "Agent paused")} />
                              <MenuAction icon={<Trash2 size={14} />} label="Delete" danger onClick={() => doAction(agent, () => aiAgentsApi.archive(agent.id), "Agent archived")} />
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm font-medium capitalize text-slate-800 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function MenuAction({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function formatDate(value?: string) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
