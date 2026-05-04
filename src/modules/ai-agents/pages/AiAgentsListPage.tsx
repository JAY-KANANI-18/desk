import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput } from "../../../components/ui/inputs";
import { CompactSelectMenu, type CompactSelectMenuGroup } from "../../../components/ui/Select";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useSocket } from "../../../socket/socket-provider";
import { useAuthorization } from "../../../context/AuthorizationContext";
import { useDisclosure } from "../../../hooks/useDisclosure";
import type { AiAgentListItem, AiAgentStatus, AiAgentType } from "../types";
import {
  AiPageLayout,
  ChannelPills,
  EmptyState,
  SkeletonRows,
  StatusBadge,
  agentTypeLabels,
  channelLabels,
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
  const agentActionsMenu = useDisclosure();
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

  const closeAgentMenu = () => {
    setMenuId(null);
    agentActionsMenu.close();
  };

  const toggleAgentMenu = (agentId: string) => {
    if (agentActionsMenu.isOpen && menuId === agentId) {
      closeAgentMenu();
      return;
    }

    setMenuId(agentId);
    agentActionsMenu.open();
  };

  const doAction = async (agent: AiAgentListItem, action: () => Promise<unknown>, success: string) => {
    setBusyId(agent.id);
    closeAgentMenu();
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

  const actions = (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/ai-agents/approvals")}>
        Approval queue
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/ai-agents/usage")}>
        Usage
      </Button>
      {canManage ? (
        <Button
          type="button"
          variant="dark"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => navigate("/ai-agents/new")}
        >
          Create Agent
        </Button>
      ) : null}
    </>
  );

  const toolbar = (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="max-w-md flex-1">
        <BaseInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search agents"
          leftIcon={<Search size={15} />}
          size="sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          value={status}
          onChange={(value) => setStatus(value as "all" | AiAgentStatus)}
          options={statuses}
          label="Status"
        />
        <FilterSelect
          value={type}
          onChange={(value) => setType(value as "all" | AiAgentType)}
          options={types}
          label="Type"
        />
        <FilterSelect value={channel} onChange={setChannel} options={channels} label="Channel" />
      </div>
    </div>
  );

  return (
    <AiPageLayout
      eyebrow="Automation"
      title="AI Agents"
      description="Build, test, publish, and supervise AI teammates for customer conversations."
      actions={actions}
      toolbar={toolbar}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                  <Button
                    type="button"
                    variant="dark"
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={() => navigate("/ai-agents/new")}
                  >
                    Create Agent
                  </Button>
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
                    <Button
                      type="button"
                      variant="unstyled"
                      fullWidth
                      contentAlign="start"
                      preserveChildLayout
                      onClick={() => navigate(`/ai-agents/${agent.id}`)}
                    >
                      <div className="flex min-w-0 items-center gap-3 text-left">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                          <Rocket size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{agent.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {agentTypeLabels[agent.agentType]} agent
                            {agent.description ? ` - ${agent.description}` : ""}
                          </p>
                        </div>
                      </div>
                    </Button>
                    <StatusBadge status={agent.status} />
                    <ChannelPills channels={agent.activeChannels || []} />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{agent.conversationsToday ?? 0}</p>
                      <p className="text-xs text-slate-500">{agent.successRate ?? 0}% success</p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(agent.updatedAt)}</p>
                    <div className="relative flex justify-end">
                      <IconButton
                        aria-label={`Open actions for ${agent.name}`}
                        icon={<MoreHorizontal size={17} />}
                        variant="ghost"
                        size="sm"
                        disabled={busyId === agent.id}
                        onClick={() => toggleAgentMenu(agent.id)}
                      />
                      {agentActionsMenu.isOpen && menuId === agent.id ? (
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
    </AiPageLayout>
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
  const groups: CompactSelectMenuGroup[] = [
    {
      options: options.map((option) => ({
        value: option,
        label: formatOption(option),
      })),
    },
  ];

  return (
    <CompactSelectMenu
      value={value}
      groups={groups}
      onChange={onChange}
      triggerAppearance="pill"
      triggerContent={
        <span className="truncate">
          {label}: <span className="font-semibold">{formatOption(value)}</span>
        </span>
      }
    />
  );
}

function MenuAction({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={danger ? "danger-ghost" : "ghost"}
      size="sm"
      fullWidth
      contentAlign="start"
      leftIcon={icon}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function formatOption(value: string) {
  if (value === "all") return "All";
  if (value in agentTypeLabels) return agentTypeLabels[value as AiAgentType];
  return channelLabels[value] || value.replace(/_/g, " ");
}

function formatDate(value?: string) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
