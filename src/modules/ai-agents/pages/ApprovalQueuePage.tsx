import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, Edit3, Loader2, Search, ShieldCheck, X } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { BaseInput, CheckboxInput, TextareaInput } from "../../../components/ui/inputs";
import { CenterModal } from "../../../components/ui/Modal";
import { Tag } from "../../../components/ui/Tag";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useSocket } from "../../../socket/socket-provider";
import type { AiApproval } from "../types";
import { AiPageLayout, EmptyState } from "../components/AiAgentPrimitives";

export function ApprovalQueuePage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [items, setItems] = useState<AiApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AiApproval | null>(null);
  const [editJson, setEditJson] = useState("{}");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await aiAgentsApi.approvals();
      setItems(Array.isArray(data) ? data : []);
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
    socket.on("ai_action.waiting_approval", refresh);
    socket.on("ai_action.updated", refresh);
    return () => {
      socket.off("ai_action.waiting_approval", refresh);
      socket.off("ai_action.updated", refresh);
    };
  }, [socket]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.agentName, item.contactName, item.toolName, item.intent]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [items, query]);

  const approve = async (item: AiApproval, input?: Record<string, unknown>) => {
    setBusy(true);
    try {
      await aiAgentsApi.approveAction(item.id, input);
      toast.success("AI action approved");
      setSelected((state) => {
        const next = new Set(state);
        next.delete(item.id);
        return next;
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const reject = async (item: AiApproval) => {
    setBusy(true);
    try {
      await aiAgentsApi.rejectAction(item.id, "Rejected from approval queue");
      toast.success("AI action rejected");
      setSelected((state) => {
        const next = new Set(state);
        next.delete(item.id);
        return next;
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const bulkApprove = async () => {
    const selectedItems = items.filter((item) => selected.has(item.id));
    setBusy(true);
    try {
      await Promise.all(selectedItems.map((item) => aiAgentsApi.approveAction(item.id)));
      toast.success(`${selectedItems.length} actions approved`);
      setSelected(new Set());
      await load();
    } finally {
      setBusy(false);
    }
  };

  const approveEditedAction = () => {
    if (!editing) return;

    try {
      const parsed = JSON.parse(editJson) as Record<string, unknown>;
      const item = editing;
      setEditing(null);
      void approve(item, parsed);
    } catch {
      toast.error("Input must be valid JSON");
    }
  };

  return (
    <AiPageLayout
      eyebrow="Supervision"
      title="Approval Queue"
      description="Review high-risk AI replies and tool actions before they affect customers or CRM data."
      actions={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/ai-agents")}>
            AI Agents
          </Button>
          <Button
            type="button"
            variant="dark"
            size="sm"
            disabled={!selected.size || busy}
            loading={busy && selected.size > 0}
            loadingMode="inline"
            loadingLabel="Approving"
            onClick={bulkApprove}
          >
            Approve selected
          </Button>
        </>
      }
      toolbar={
        <div className="max-w-md">
          <BaseInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by agent, contact, tool, or intent"
            leftIcon={<Search size={15} />}
            size="sm"
          />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex h-80 items-center justify-center text-sm text-slate-500">
              <Loader2 size={16} className="mr-2 animate-spin" />
              Loading approvals...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No pending approvals"
              body="When AI needs permission to send a reply, create a lead, close a ticket, or quote sensitive information, it appears here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const checked = selected.has(item.id);
                return (
                  <div key={item.id} className="grid gap-4 px-4 py-4 hover:bg-slate-50 lg:grid-cols-[32px_1fr_170px_260px] lg:items-center lg:px-6">
                    <CheckboxInput
                      checked={checked}
                      aria-label={`Select approval for ${item.agentName}`}
                      onChange={() =>
                        setSelected((state) => {
                          const next = new Set(state);
                          checked ? next.delete(item.id) : next.add(item.id);
                          return next;
                        })
                      }
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag
                          label={approvalLabel(item.toolName)}
                          icon={<ShieldCheck size={12} />}
                          bgColor="info"
                          size="sm"
                        />
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{item.agentName} wants to run {item.toolName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.contactName}
                        {item.intent ? ` - ${item.intent}` : ""}
                        {item.confidence ? ` - ${Math.round(Number(item.confidence) * 100)}% confidence` : ""}
                      </p>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/inbox/${item.conversationId}`)}>
                      Open chat
                    </Button>
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        leftIcon={<Check size={14} />}
                        disabled={busy}
                        onClick={() => approve(item)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Edit3 size={14} />}
                        onClick={() => {
                          setEditing(item);
                          setEditJson(JSON.stringify(item.input || {}, null, 2));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger-ghost"
                        size="sm"
                        leftIcon={<X size={14} />}
                        disabled={busy}
                        onClick={() => reject(item)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CenterModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit then approve"
        subtitle={editing ? `${editing.toolName} for ${editing.contactName}` : undefined}
        size="lg"
        secondaryAction={
          <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        }
        primaryAction={
          <Button type="button" variant="dark" disabled={busy} onClick={approveEditedAction}>
            Approve edited action
          </Button>
        }
      >
        <TextareaInput
          label="Approval input JSON"
          value={editJson}
          onChange={(event) => setEditJson(event.target.value)}
          rows={12}
          className="font-mono text-xs"
        />
      </CenterModal>
    </AiPageLayout>
  );
}

function approvalLabel(toolName: string) {
  if (toolName === "sendTemplate") return "AI wants to send a message";
  if (toolName === "createLead") return "AI wants to create a lead";
  if (toolName === "closeConversation") return "AI wants to close a ticket";
  if (toolName === "updateContactField") return "AI wants to update CRM";
  return "AI action needs approval";
}