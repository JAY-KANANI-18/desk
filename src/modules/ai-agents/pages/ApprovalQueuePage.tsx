import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, Edit3, Loader2, Search, ShieldCheck, X } from "lucide-react";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import { useSocket } from "../../../socket/socket-provider";
import type { AiApproval } from "../types";
import { EmptyState, PageHeader, PageShell } from "../components/AiAgentPrimitives";

export function ApprovalQueuePage() {
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

  const approve = async (item: AiApproval, input?: Record<string, any>) => {
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

  return (
    <PageShell>
      <PageHeader
        eyebrow="Supervision"
        title="Approval Queue"
        description="Review high-risk AI replies and tool actions before they affect customers or CRM data."
        actions={
          <>
            <Link to="/ai-agents" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              AI Agents
            </Link>
            <button
              disabled={!selected.size || busy}
              onClick={bulkApprove}
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Approve selected
            </button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by agent, contact, tool, or intent"
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

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
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelected((state) => {
                          const next = new Set(state);
                          checked ? next.delete(item.id) : next.add(item.id);
                          return next;
                        })
                      }
                      className="h-4 w-4"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                          <ShieldCheck size={12} />
                          {approvalLabel(item.toolName)}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{item.agentName} wants to run {item.toolName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.contactName}
                        {item.intent ? ` · ${item.intent}` : ""}
                        {item.confidence ? ` · ${Math.round(Number(item.confidence) * 100)}% confidence` : ""}
                      </p>
                    </div>
                    <Link to={`/inbox/${item.conversationId}`} className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                      Open chat
                    </Link>
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <button onClick={() => approve(item)} disabled={busy} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setEditing(item);
                          setEditJson(JSON.stringify(item.input || {}, null, 2));
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button onClick={() => reject(item)} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50">
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-950">Edit then approve</h2>
              <p className="text-sm text-slate-500">{editing.toolName} for {editing.contactName}</p>
            </div>
            <div className="p-4">
              <textarea value={editJson} onChange={(event) => setEditJson(event.target.value)} className="min-h-72 w-full rounded-md border border-slate-200 p-3 font-mono text-xs outline-none" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
              <button onClick={() => setEditing(null)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button
                onClick={() => {
                  try {
                    approve(editing, JSON.parse(editJson));
                    setEditing(null);
                  } catch {
                    toast.error("Input must be valid JSON");
                  }
                }}
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
              >
                Approve edited action
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function approvalLabel(toolName: string) {
  if (toolName === "sendTemplate") return "AI wants to send a message";
  if (toolName === "createLead") return "AI wants to create a lead";
  if (toolName === "closeConversation") return "AI wants to close a ticket";
  if (toolName === "updateContactField") return "AI wants to update CRM";
  return "AI action needs approval";
}
