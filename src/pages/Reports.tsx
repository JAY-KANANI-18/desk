// LEGACY - not mounted in current router, pending removal
import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Info,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { workspaceApi } from '../lib/workspaceApi';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SectionKey = 'lifecycle' | 'conversations' | 'messages' | 'contacts';

type BarDatum = { label: string; value: number; color?: string };
type DonutSegment = { value: number; color: string; label: string };

type DateFilter = {
  from: string;
  to: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: SectionKey; label: string }[] = [
  { key: 'lifecycle', label: 'Lifecycle' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'messages', label: 'Messages' },
  { key: 'contacts', label: 'Contacts' },
];

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
  '#6366F1',
  '#14B8A6',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getDefaultDateRange = (): DateFilter => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 7);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
};

const formatDateRangeLabel = (from: string, to: string) => {
  const f = new Date(from).toLocaleDateString();
  const t = new Date(to).toLocaleDateString();
  return `${f} - ${t}`;
};

const formatLabel = (label: string) => {
  if (!label) return '-';
  return label.length > 12 ? label.slice(0, 12) + '…' : label;
};

// ─────────────────────────────────────────────────────────────────────────────
// Recharts Components
// ─────────────────────────────────────────────────────────────────────────────

const ReBarChart = ({
  data,
  height = 280,
}: {
  data: BarDatum[];
  height?: number;
}) => {
  const chartData = data.map((d, index) => ({
    ...d,
    fill: d.color || COLORS[index % COLORS.length],
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tickFormatter={formatLabel}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ReDonutChart = ({
  segments,
  total,
  centerLabel = 'Total',
  height = 280,
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
  height?: number;
}) => {
  const chartData = segments.map((s, index) => ({
    ...s,
    color: s.color || COLORS[index % COLORS.length],
  }));

  return (
    <div className="w-full relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-gray-500">{centerLabel}</span>
        <span className="text-2xl font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────

const DateRangeBar = ({
  filters,
  onChange,
}: {
  filters: DateFilter;
  onChange: (v: DateFilter) => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 bg-white">
        <Calendar size={13} className="text-gray-400" />
        <input
          type="date"
          value={filters.from}
          onChange={e => onChange({ ...filters, from: e.target.value })}
          className="outline-none bg-transparent"
        />
        <span>-</span>
        <input
          type="date"
          value={filters.to}
          onChange={e => onChange({ ...filters, to: e.target.value })}
          className="outline-none bg-transparent"
        />
      </div>

      <div className="text-sm text-gray-500">
        {formatDateRangeLabel(filters.from, filters.to)}
      </div>
    </div>
  );
};

const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mb-5">
    <div className="flex items-start justify-between">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="text-right text-xs text-gray-400 leading-5 flex-shrink-0 ml-4">
        <div>Last updated just now</div>
      </div>
    </div>
    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
  </div>
);

const ChartCard = ({
  title,
  barData,
  donutSegments,
  total,
}: {
  title: string;
  barData: BarDatum[];
  donutSegments: DonutSegment[];
  total: number;
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <Info size={13} className="text-gray-400" />
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-0.5">
          <MoreVertical size={15} />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-center">
        <ReBarChart data={barData} />
        <ReDonutChart segments={donutSegments} total={total} />
      </div>
    </div>
  );
};

const SingleChartCard = ({
  title,
  data,
  type = 'bar',
  total,
}: {
  title: string;
  data: any[];
  type?: 'bar' | 'donut';
  total?: number;
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <Info size={13} className="text-gray-400" />
        </div>
      </div>

      {type === 'bar' ? (
        <ReBarChart data={data} />
      ) : (
        <ReDonutChart segments={data} total={total || 0} />
      )}
    </div>
  );
};

const StatCard = ({
  label,
  value,
  change,
  positive = true,
}: {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {change && (
      <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {change}
      </p>
    )}
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-20 text-gray-500">
    <Loader2 className="animate-spin mr-2" size={18} />
    Loading analytics...
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    {message}
  </div>
);

const FailedMessagesTable = ({ rows }: { rows: any[] }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mt-4 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-800">
        Failed Message Logs
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Channel</th>
              <th className="text-left px-4 py-3">Recipient</th>
              <th className="text-left px-4 py-3">Message</th>
              <th className="text-left px-4 py-3">Attempts</th>
              <th className="text-left px-4 py-3">Error</th>
              <th className="text-left px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No failed messages found
                </td>
              </tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{row.channel?.type || '-'}</td>
                  <td className="px-4 py-3">{row.to}</td>
                  <td className="px-4 py-3 max-w-[250px] truncate">{row.message?.text || '-'}</td>
                  <td className="px-4 py-3">{row.attempts}</td>
                  <td className="px-4 py-3 text-red-600 max-w-[300px] truncate">{row.lastError || '-'}</td>
                  <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Reports Component
// ─────────────────────────────────────────────────────────────────────────────

export const Reports = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('messages');
  const [filters, setFilters] = useState<DateFilter>(getDefaultDateRange());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [messagesData, setMessagesData] = useState<any>(null);
  const [failedMessages, setFailedMessages] = useState<any>(null);
  const [contactsData, setContactsData] = useState<any>(null);
  const [conversationsData, setConversationsData] = useState<any>(null);
  const [lifecycleData, setLifecycleData] = useState<any>(null);

  const params = useMemo(() => ({ ...filters }), [filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        if (activeSection === 'messages') {
          const [messages, failed] = await Promise.all([
            workspaceApi.getMessages(params),
            workspaceApi.getFailedMessages(params),
          ]);
          setMessagesData(messages);
          setFailedMessages(failed);
        }

        if (activeSection === 'contacts') {
          const contacts = await workspaceApi.getContacts(params);
          setContactsData(contacts);
        }

        if (activeSection === 'conversations') {
          const conversations = await workspaceApi.getConversations(params);
          setConversationsData(conversations);
        }

        if (activeSection === 'lifecycle') {
          const lifecycle = await workspaceApi.getLifecycle(params);
          setLifecycleData(lifecycle);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeSection, params]);

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="w-44 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Reports</h2>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === item.key
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto ">
        <div className="p-6 max-w-7xl mx-auto">
          <DateRangeBar filters={filters} onChange={setFilters} />

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <>
              {activeSection === 'messages' && messagesData && (
                <div>
                  <SectionHeader
                    title="Messages"
                    description="Analyze incoming, outgoing, delivery funnel, and failed outbound messages."
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Messages" value={messagesData.stats.totalMessages} />
                    <StatCard label="Incoming" value={messagesData.stats.incoming} />
                    <StatCard label="Outgoing" value={messagesData.stats.outgoing} />
                    <StatCard label="Avg / Conversation" value={messagesData.stats.avgPerConversation} />
                  </div>

                  <ChartCard
                    title="Incoming Messages by Channel"
                    barData={messagesData.incoming.bar}
                    donutSegments={messagesData.incoming.donut}
                    total={messagesData.incoming.total}
                  />

                  <ChartCard
                    title="Outgoing Messages by Channel"
                    barData={messagesData.outgoing.bar}
                    donutSegments={messagesData.outgoing.donut}
                    total={messagesData.outgoing.total}
                  />

                  <ChartCard
                    title="Outgoing Delivery Funnel"
                    barData={messagesData.funnel.bar}
                    donutSegments={messagesData.funnel.donut}
                    total={messagesData.funnel.total}
                  />

                  <FailedMessagesTable rows={failedMessages?.data || []} />
                </div>
              )}

              {activeSection === 'contacts' && contactsData && (
                <div>
                  <SectionHeader
                    title="Contacts"
                    description="Track contact growth, deletions, source channels, and connection trends."
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Contacts" value={contactsData.stats.totalContacts} />
                    <StatCard label="New This Period" value={contactsData.stats.newContacts} />
                    <StatCard label="Deleted This Period" value={contactsData.stats.deletedContacts} />
                    <StatCard label="Connected Channels" value={contactsData.stats.activeConnections} />
                  </div>

                  <ChartCard
                    title="New Contacts by Channel"
                    barData={contactsData.byChannel.bar}
                    donutSegments={contactsData.byChannel.donut}
                    total={contactsData.byChannel.total}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <SingleChartCard
                      title="Contacts Added by Day"
                      data={contactsData.addedByDay}
                    />

                    <SingleChartCard
                      title="Contacts Deleted by Day"
                      data={contactsData.deletedByDay || []}
                    />
                  </div>
                </div>
              )}

              {activeSection === 'conversations' && conversationsData && (
                <div>
                  <SectionHeader
                    title="Conversations"
                    description="Analyze open/closed trends, status breakdown, and response performance."
                  />

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <StatCard label="Total" value={conversationsData.stats.total} />
                    <StatCard label="Open" value={conversationsData.stats.open} />
                    <StatCard label="Resolved" value={conversationsData.stats.resolved} />
                    <StatCard label="Avg Handle Time (min)" value={conversationsData.stats.avgHandleTimeMinutes} />
                    <StatCard label="Avg First Response (min)" value={conversationsData.stats.averageFirstResponseMinutes} />
                  </div>

                  <ChartCard
                    title="Conversations by Status"
                    barData={conversationsData.byStatus.bar}
                    donutSegments={conversationsData.byStatus.donut}
                    total={conversationsData.byStatus.total}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <SingleChartCard
                      title="Opened by Day"
                      data={conversationsData.openedByDay}
                    />

                    <SingleChartCard
                      title="Closed / Resolved by Day"
                      data={conversationsData.closedByDay}
                    />
                  </div>
                </div>
              )}

              {activeSection === 'lifecycle' && lifecycleData && (
                <div>
                  <SectionHeader
                    title="Lifecycle"
                    description="See how contacts are distributed across lifecycle stages."
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Contacts" value={lifecycleData.total} />
                    <StatCard label="Stages" value={lifecycleData.stages.length} />
                    <StatCard
                      label="Top Stage"
                      value={lifecycleData.stages?.sort((a: any, b: any) => b.count - a.count)?.[0]?.name || '-'}
                    />
                    <StatCard
                      label="Top Stage Count"
                      value={lifecycleData.stages?.sort((a: any, b: any) => b.count - a.count)?.[0]?.count || 0}
                    />
                  </div>

                  <ChartCard
                    title="Contacts by Lifecycle Stage"
                    barData={lifecycleData.chart.bar}
                    donutSegments={lifecycleData.chart.donut}
                    total={lifecycleData.chart.total}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
