import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Cpu, Loader2, MessageSquareText, ReceiptText, WalletCards } from "lucide-react";
import { aiAgentsApi } from "../../../lib/aiAgentsApi";
import type { AiAnalyticsSummary } from "../types";
import { MetricTile, PageHeader, PageShell } from "../components/AiAgentPrimitives";

export function AiUsagePage() {
  const [data, setData] = useState<AiAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  const load = async () => {
    setLoading(true);
    try {
      const from = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setData(await aiAgentsApi.analytics({ from }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [range]);

  const totalTokens = useMemo(
    () => (data?.usage || []).reduce((sum, item) => sum + Number(item.total_tokens || 0), 0),
    [data],
  );
  const estimatedCost = useMemo(
    () => (data?.usage || []).reduce((sum, item) => sum + Number(item.cost_micros || 0), 0) / 1_000_000,
    [data],
  );
  const quota = 250_000;
  const overage = Math.max(0, totalTokens - quota);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Billing"
        title="AI Usage"
        description="Track AI replies, tokens, provider cost, quota, and overage before invoices surprise anyone."
        actions={
          <>
            <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <Link to="/billing" className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Billing settings</Link>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex h-80 items-center justify-center text-sm text-slate-500">
            <Loader2 size={16} className="mr-2 animate-spin" />
            Loading AI usage...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="AI replies used" value={data?.summary?.completed || 0} detail="Completed runs" icon={<MessageSquareText size={18} />} />
              <MetricTile label="Tokens used" value={totalTokens.toLocaleString()} detail={`${Math.min(100, Math.round((totalTokens / quota) * 100))}% of included quota`} icon={<Cpu size={18} />} />
              <MetricTile label="Estimated cost" value={`$${estimatedCost.toFixed(2)}`} detail="Provider-level estimate" icon={<WalletCards size={18} />} />
              <MetricTile label="Overage" value={overage.toLocaleString()} detail="Tokens above included quota" icon={<ReceiptText size={18} />} />
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">Cost by provider/model</h2>
                  <p className="mt-1 text-sm text-slate-500">Use this to tune model routing and agent budgets.</p>
                </div>
              </div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.usage || []).map((item) => ({ name: `${item.provider}/${item.model}`, tokens: Number(item.total_tokens || 0) }))}>
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tokens" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="grid grid-cols-[1fr_160px_140px] border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                <span>Provider / model</span>
                <span>Tokens</span>
                <span>Cost</span>
              </div>
              {(data?.usage || []).map((item) => (
                <div key={`${item.provider}-${item.model}`} className="grid grid-cols-[1fr_160px_140px] px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">{item.provider} · {item.model}</span>
                  <span className="text-slate-500">{Number(item.total_tokens || 0).toLocaleString()}</span>
                  <span className="text-slate-500">${(Number(item.cost_micros || 0) / 1_000_000).toFixed(2)}</span>
                </div>
              ))}
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
