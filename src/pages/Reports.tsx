import React, { useState } from 'react';
import {
  Calendar, Info, MoreVertical, ChevronDown, Plus,
  TrendingUp, TrendingDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | 'lifecycle' | 'calls' | 'conversations' | 'responses'
  | 'resolutions' | 'messages' | 'contacts' | 'assignments'
  | 'leaderboard' | 'users' | 'broadcasts';

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: SectionKey; label: string }[] = [
  { key: 'lifecycle',     label: 'Lifecycle' },
  { key: 'calls',         label: 'Calls' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'responses',     label: 'Responses' },
  { key: 'resolutions',   label: 'Resolutions' },
  { key: 'messages',      label: 'Messages' },
  { key: 'contacts',      label: 'Contacts' },
  { key: 'assignments',   label: 'Assignments' },
  { key: 'leaderboard',   label: 'Leaderboard' },
  { key: 'users',         label: 'Users' },
  { key: 'broadcasts',    label: 'Broadcasts' },
];

// ─── Chart: Simple Bar ────────────────────────────────────────────────────────

interface BarDatum { label: string; value: number; color?: string; }

const SimpleBarChart = ({ data, height = 180 }: { data: BarDatum[]; height?: number }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = 44;
  const gap = 20;
  const padL = 32;
  const totalW = padL + data.length * (barW + gap);

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(totalW, 260)}
        height={height + 44}
        viewBox={`0 0 ${Math.max(totalW, 260)} ${height + 44}`}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = height * (1 - f);
          return (
            <g key={f}>
              <line x1={padL} y1={y} x2={Math.max(totalW, 260)} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#d1d5db">
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max((d.value / maxVal) * height, d.value > 0 ? 2 : 0);
          const x = padL + i * (barW + gap);
          const y = height - barH;
          const color = d.color || '#93c5fd';
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx="3" />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="500">
                  {d.value}
                </text>
              )}
              <text x={x + barW / 2} y={height + 18} textAnchor="middle" fontSize="10" fill="#9ca3af">
                {d.label.length > 11 ? d.label.slice(0, 11) + '…' : d.label}
              </text>
            </g>
          );
        })}
        {/* X axis */}
        <line x1={padL} y1={height} x2={Math.max(totalW, 260)} y2={height} stroke="#e5e7eb" strokeWidth="1" />
      </svg>
    </div>
  );
};

// ─── Chart: Donut ─────────────────────────────────────────────────────────────

interface DonutSegment { value: number; color: string; label: string; }

const DonutChart = ({
  segments,
  total,
  centerLabel = 'Total',
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
}) => {
  const r = 60;
  const cx = 88;
  const cy = 88;
  const circ = 2 * Math.PI * r;
  const strokeW = 22;

  let cumulative = 0;
  const arcs = segments.map(seg => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dash = fraction * circ;
    const arc = { ...seg, dash, offset: cumulative, fraction };
    cumulative += dash;
    return arc;
  });

  const largest = arcs.length > 0
    ? arcs.reduce((a, b) => (a.fraction > b.fraction ? a : b))
    : null;

  return (
    <svg width="176" height="176" viewBox="0 0 176 176">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeW} />
      {/* Segments */}
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeW}
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={circ / 4 - arc.offset}
        />
      ))}
      {/* Center */}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="12" fill="#6b7280">{centerLabel}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111827">{total}</text>
      {/* Bottom percentage */}
      {largest && largest.fraction > 0 && (
        <text x={cx} y={cy + r + 14} textAnchor="middle" fontSize="11" fill="#6b7280">
          {(largest.fraction * 100).toFixed(1)}%
        </text>
      )}
    </svg>
  );
};

// ─── Shared: DateRangeBar ─────────────────────────────────────────────────────

const DateRangeBar = ({ dateRange = 'Feb 17, 2026 - Mar 02, 2026' }: { dateRange?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50">
      <Calendar size={13} className="text-gray-400" />
      {dateRange}
    </button>
    <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
      <Plus size={13} />
      Add filter
    </button>
    <button className="text-sm text-gray-400 hover:text-gray-600">Clear all</button>
  </div>
);

// ─── Shared: SectionHeader ────────────────────────────────────────────────────

const SectionHeader = ({
  title,
  description,
  learnMore,
}: {
  title: string;
  description: string;
  learnMore?: boolean;
}) => (
  <div className="mb-5">
    <div className="flex items-start justify-between">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="text-right text-xs text-gray-400 leading-5 flex-shrink-0 ml-4">
        <div>Last updated just now</div>
        <div>Time Zone - 0 UTC</div>
      </div>
    </div>
    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
      {description}
      {learnMore && (
        <a href="#" className="text-blue-500 hover:underline ml-1">Learn more</a>
      )}
    </p>
  </div>
);

// ─── Shared: ChartCard ────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  barData: BarDatum[];
  donutSegments: DonutSegment[];
  total: number;
  groupByOptions?: string[];
  defaultGroupBy?: string;
}

const ChartCard = ({
  title,
  barData,
  donutSegments,
  total,
  groupByOptions = ['User and AI Agent', 'Team'],
  defaultGroupBy = 'User and AI Agent',
}: ChartCardProps) => {
  const [groupBy, setGroupBy] = useState(defaultGroupBy);
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <Info size={13} className="text-gray-400 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs border border-gray-200 rounded px-2.5 py-1.5 hover:bg-gray-50 text-gray-600"
            >
              <span className="text-gray-400 mr-0.5">Group By</span>
              <span className="font-medium">{groupBy}</span>
              <ChevronDown size={11} />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[170px]">
                {groupByOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setGroupBy(opt); setOpen(false); }}
                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                      groupBy === opt ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-0.5">
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* Charts row */}
      <div className="flex items-end gap-4">
        <div className="flex-1 min-w-0">
          <SimpleBarChart data={barData} />
        </div>
        <div className="flex-shrink-0 pb-2">
          <DonutChart segments={donutSegments} total={total} />
        </div>
      </div>
    </div>
  );
};

// ─── Shared: StatCard ─────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  change,
  positive = true,
}: {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {change && (
      <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {change} vs last period
      </p>
    )}
  </div>
);

// ─── Section: Leaderboard ─────────────────────────────────────────────────────

const LeaderboardSection = () => (
  <div>
    <SectionHeader
      title="Leaderboard"
      description="This report provides a comprehensive view of the performance of individual users and respective teams. Only the top 10 users or teams are shown in graphs. Apply filters to evaluate each team and user performance."
      learnMore
    />
    <DateRangeBar />
    <ChartCard
      title="Conversations Assigned"
      barData={[
        { label: 'Nirmala Ka…', value: 2, color: '#93c5fd' },
        { label: 'Priya S…',    value: 1, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 2, color: '#93c5fd', label: 'Nirmala Ka…' },
        { value: 1, color: '#60a5fa', label: 'Priya S…' },
      ]}
      total={2}
    />
    <ChartCard
      title="Conversations Closed"
      barData={[
        { label: 'Nirmala Ka…', value: 2, color: '#93c5fd' },
        { label: 'Priya S…',    value: 1, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 2, color: '#93c5fd', label: 'Nirmala Ka…' },
        { value: 1, color: '#60a5fa', label: 'Priya S…' },
      ]}
      total={2}
    />
    <ChartCard
      title="Conversations Resolved"
      barData={[
        { label: 'Nirmala Ka…', value: 2, color: '#93c5fd' },
        { label: 'Priya S…',    value: 1, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 2, color: '#93c5fd', label: 'Nirmala Ka…' },
        { value: 1, color: '#60a5fa', label: 'Priya S…' },
      ]}
      total={2}
    />
    <ChartCard
      title="Avg First Response Time"
      barData={[
        { label: 'Nirmala Ka…', value: 3, color: '#6ee7b7' },
        { label: 'Priya S…',    value: 5, color: '#6ee7b7' },
      ]}
      donutSegments={[
        { value: 3, color: '#6ee7b7', label: 'Nirmala Ka…' },
        { value: 5, color: '#34d399', label: 'Priya S…' },
      ]}
      total={8}
    />
    <ChartCard
      title="Avg Resolution Time"
      barData={[
        { label: 'Nirmala Ka…', value: 4, color: '#fca5a5' },
        { label: 'Priya S…',    value: 6, color: '#fca5a5' },
      ]}
      donutSegments={[
        { value: 4, color: '#fca5a5', label: 'Nirmala Ka…' },
        { value: 6, color: '#f87171', label: 'Priya S…' },
      ]}
      total={10}
    />
  </div>
);

// ─── Section: Lifecycle ───────────────────────────────────────────────────────

const LifecycleSection = () => (
  <div>
    <SectionHeader
      title="Lifecycle"
      description="Track how conversations move through different lifecycle stages over time. Use filters to drill into specific teams or channels."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="New"      value="124" change="+8%"  positive />
      <StatCard label="Open"     value="87"  change="+3%"  positive />
      <StatCard label="Pending"  value="34"  change="+5%"  positive={false} />
      <StatCard label="Resolved" value="312" change="+12%" positive />
    </div>
    <ChartCard
      title="Conversations by Stage"
      barData={[
        { label: 'New',      value: 124, color: '#93c5fd' },
        { label: 'Open',     value: 87,  color: '#6ee7b7' },
        { label: 'Pending',  value: 34,  color: '#fcd34d' },
        { label: 'Resolved', value: 312, color: '#a5b4fc' },
        { label: 'Closed',   value: 198, color: '#d1d5db' },
      ]}
      donutSegments={[
        { value: 124, color: '#93c5fd', label: 'New' },
        { value: 87,  color: '#6ee7b7', label: 'Open' },
        { value: 34,  color: '#fcd34d', label: 'Pending' },
        { value: 312, color: '#a5b4fc', label: 'Resolved' },
        { value: 198, color: '#d1d5db', label: 'Closed' },
      ]}
      total={755}
      groupByOptions={['Stage', 'Team', 'Agent']}
      defaultGroupBy="Stage"
    />
  </div>
);

// ─── Section: Calls ───────────────────────────────────────────────────────────

const CallsSection = () => (
  <div>
    <SectionHeader
      title="Calls"
      description="Monitor call volume, duration, and outcomes across your team. Identify missed call patterns and agent availability."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Calls"  value="248"    change="+11%" positive />
      <StatCard label="Answered"     value="221"    change="+9%"  positive />
      <StatCard label="Missed"       value="27"     change="+3%"  positive={false} />
      <StatCard label="Avg Duration" value="4m 32s" change="-8%"  positive />
    </div>
    <ChartCard
      title="Calls by Agent"
      barData={[
        { label: 'Nirmala Ka…', value: 68, color: '#93c5fd' },
        { label: 'Priya S…',    value: 54, color: '#93c5fd' },
        { label: 'Rahul M…',    value: 47, color: '#93c5fd' },
        { label: 'Anita R…',    value: 42, color: '#93c5fd' },
        { label: 'Suresh P…',   value: 37, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 68, color: '#93c5fd', label: 'Nirmala' },
        { value: 54, color: '#60a5fa', label: 'Priya' },
        { value: 47, color: '#3b82f6', label: 'Rahul' },
        { value: 42, color: '#2563eb', label: 'Anita' },
        { value: 37, color: '#1d4ed8', label: 'Suresh' },
      ]}
      total={248}
      groupByOptions={['Agent', 'Team', 'Outcome']}
      defaultGroupBy="Agent"
    />
    <ChartCard
      title="Missed Calls by Agent"
      barData={[
        { label: 'Nirmala Ka…', value: 8, color: '#fca5a5' },
        { label: 'Priya S…',    value: 7, color: '#fca5a5' },
        { label: 'Rahul M…',    value: 6, color: '#fca5a5' },
        { label: 'Anita R…',    value: 4, color: '#fca5a5' },
        { label: 'Suresh P…',   value: 2, color: '#fca5a5' },
      ]}
      donutSegments={[
        { value: 8, color: '#fca5a5', label: 'Nirmala' },
        { value: 7, color: '#f87171', label: 'Priya' },
        { value: 6, color: '#ef4444', label: 'Rahul' },
        { value: 4, color: '#dc2626', label: 'Anita' },
        { value: 2, color: '#b91c1c', label: 'Suresh' },
      ]}
      total={27}
      groupByOptions={['Agent', 'Team']}
      defaultGroupBy="Agent"
    />
  </div>
);

// ─── Section: Conversations ───────────────────────────────────────────────────

const ConversationsSection = () => (
  <div>
    <SectionHeader
      title="Conversations"
      description="Analyze conversation volume, trends, and distribution across channels and teams."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total"            value="1,284" change="+18%" positive />
      <StatCard label="Open"             value="87"    change="+3%"  positive />
      <StatCard label="Resolved"         value="1,102" change="+21%" positive />
      <StatCard label="Avg Handle Time"  value="6m 14s" change="-4%" positive />
    </div>
    <ChartCard
      title="Conversations by Channel"
      barData={[
        { label: 'WhatsApp',  value: 524, color: '#6ee7b7' },
        { label: 'Instagram', value: 312, color: '#f9a8d4' },
        { label: 'Facebook',  value: 248, color: '#93c5fd' },
        { label: 'Email',     value: 156, color: '#a5b4fc' },
        { label: 'Gmail',     value: 44,  color: '#fcd34d' },
      ]}
      donutSegments={[
        { value: 524, color: '#6ee7b7', label: 'WhatsApp' },
        { value: 312, color: '#f9a8d4', label: 'Instagram' },
        { value: 248, color: '#93c5fd', label: 'Facebook' },
        { value: 156, color: '#a5b4fc', label: 'Email' },
        { value: 44,  color: '#fcd34d', label: 'Gmail' },
      ]}
      total={1284}
      groupByOptions={['Channel', 'Team', 'Agent']}
      defaultGroupBy="Channel"
    />
    <ChartCard
      title="Conversations by Team"
      barData={[
        { label: 'Support', value: 612, color: '#93c5fd' },
        { label: 'Sales',   value: 387, color: '#93c5fd' },
        { label: 'Billing', value: 185, color: '#93c5fd' },
        { label: 'Tech',    value: 100, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 612, color: '#93c5fd', label: 'Support' },
        { value: 387, color: '#60a5fa', label: 'Sales' },
        { value: 185, color: '#3b82f6', label: 'Billing' },
        { value: 100, color: '#2563eb', label: 'Tech' },
      ]}
      total={1284}
      groupByOptions={['Team', 'Channel', 'Agent']}
      defaultGroupBy="Team"
    />
  </div>
);

// ─── Section: Responses ───────────────────────────────────────────────────────

const ResponsesSection = () => (
  <div>
    <SectionHeader
      title="Responses"
      description="Measure how quickly your team responds to incoming conversations. Track first response time by agent and team."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Avg First Response" value="3m 12s" change="-15%" positive />
      <StatCard label="Median Response"    value="1m 48s" change="-8%"  positive />
      <StatCard label="Under 1 min"        value="42%"    change="+5%"  positive />
      <StatCard label="Over 5 min"         value="18%"    change="-3%"  positive />
    </div>
    <ChartCard
      title="First Response Time by Agent (mins)"
      barData={[
        { label: 'Nirmala Ka…', value: 2, color: '#6ee7b7' },
        { label: 'Priya S…',    value: 3, color: '#6ee7b7' },
        { label: 'Rahul M…',    value: 4, color: '#fcd34d' },
        { label: 'Anita R…',    value: 5, color: '#fca5a5' },
        { label: 'Suresh P…',   value: 7, color: '#fca5a5' },
      ]}
      donutSegments={[
        { value: 2, color: '#6ee7b7', label: 'Nirmala' },
        { value: 3, color: '#34d399', label: 'Priya' },
        { value: 4, color: '#fcd34d', label: 'Rahul' },
        { value: 5, color: '#fca5a5', label: 'Anita' },
        { value: 7, color: '#f87171', label: 'Suresh' },
      ]}
      total={21}
      groupByOptions={['Agent', 'Team']}
      defaultGroupBy="Agent"
    />
  </div>
);

// ─── Section: Resolutions ─────────────────────────────────────────────────────

const ResolutionsSection = () => (
  <div>
    <SectionHeader
      title="Resolutions"
      description="Track how efficiently your team resolves conversations and measure customer satisfaction scores."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Resolved"           value="1,102" change="+21%" positive />
      <StatCard label="Avg Resolution Time" value="4h 22m" change="-9%" positive />
      <StatCard label="CSAT Score"          value="4.6/5"  change="+0.2" positive />
      <StatCard label="Reopened"            value="34"     change="-12%" positive />
    </div>
    <ChartCard
      title="Resolution Time by Agent (hours)"
      barData={[
        { label: 'Nirmala Ka…', value: 3, color: '#a5b4fc' },
        { label: 'Priya S…',    value: 4, color: '#a5b4fc' },
        { label: 'Rahul M…',    value: 5, color: '#a5b4fc' },
        { label: 'Anita R…',    value: 6, color: '#a5b4fc' },
        { label: 'Suresh P…',   value: 8, color: '#a5b4fc' },
      ]}
      donutSegments={[
        { value: 3, color: '#a5b4fc', label: 'Nirmala' },
        { value: 4, color: '#818cf8', label: 'Priya' },
        { value: 5, color: '#6366f1', label: 'Rahul' },
        { value: 6, color: '#4f46e5', label: 'Anita' },
        { value: 8, color: '#4338ca', label: 'Suresh' },
      ]}
      total={26}
      groupByOptions={['Agent', 'Team']}
      defaultGroupBy="Agent"
    />
    <ChartCard
      title="CSAT Ratings by Agent"
      barData={[
        { label: 'Nirmala Ka…', value: 48, color: '#fcd34d' },
        { label: 'Priya S…',    value: 42, color: '#fcd34d' },
        { label: 'Rahul M…',    value: 38, color: '#fcd34d' },
        { label: 'Anita R…',    value: 35, color: '#fcd34d' },
        { label: 'Suresh P…',   value: 29, color: '#fcd34d' },
      ]}
      donutSegments={[
        { value: 48, color: '#fcd34d', label: 'Nirmala' },
        { value: 42, color: '#fbbf24', label: 'Priya' },
        { value: 38, color: '#f59e0b', label: 'Rahul' },
        { value: 35, color: '#d97706', label: 'Anita' },
        { value: 29, color: '#b45309', label: 'Suresh' },
      ]}
      total={192}
      groupByOptions={['Agent', 'Team']}
      defaultGroupBy="Agent"
    />
  </div>
);

// ─── Section: Messages ────────────────────────────────────────────────────────

const MessagesSection = () => (
  <div>
    <SectionHeader
      title="Messages"
      description="Analyze message volume, direction, and distribution across channels and agents."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Messages" value="12,543" change="+15%" positive />
      <StatCard label="Incoming"       value="7,821"  change="+18%" positive />
      <StatCard label="Outgoing"       value="4,722"  change="+11%" positive />
      <StatCard label="Avg per Conv."  value="9.8"    change="+2%"  positive />
    </div>
    <ChartCard
      title="Messages by Channel"
      barData={[
        { label: 'WhatsApp',  value: 5234, color: '#6ee7b7' },
        { label: 'Instagram', value: 3421, color: '#f9a8d4' },
        { label: 'Facebook',  value: 2156, color: '#93c5fd' },
        { label: 'Email',     value: 1432, color: '#a5b4fc' },
        { label: 'Gmail',     value: 300,  color: '#fcd34d' },
      ]}
      donutSegments={[
        { value: 5234, color: '#6ee7b7', label: 'WhatsApp' },
        { value: 3421, color: '#f9a8d4', label: 'Instagram' },
        { value: 2156, color: '#93c5fd', label: 'Facebook' },
        { value: 1432, color: '#a5b4fc', label: 'Email' },
        { value: 300,  color: '#fcd34d', label: 'Gmail' },
      ]}
      total={12543}
      groupByOptions={['Channel', 'Direction', 'Agent']}
      defaultGroupBy="Channel"
    />
    <ChartCard
      title="Messages by Agent"
      barData={[
        { label: 'Nirmala Ka…', value: 3421, color: '#93c5fd' },
        { label: 'Priya S…',    value: 2876, color: '#93c5fd' },
        { label: 'Rahul M…',    value: 2543, color: '#93c5fd' },
        { label: 'Anita R…',    value: 2187, color: '#93c5fd' },
        { label: 'Suresh P…',   value: 1516, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 3421, color: '#93c5fd', label: 'Nirmala' },
        { value: 2876, color: '#60a5fa', label: 'Priya' },
        { value: 2543, color: '#3b82f6', label: 'Rahul' },
        { value: 2187, color: '#2563eb', label: 'Anita' },
        { value: 1516, color: '#1d4ed8', label: 'Suresh' },
      ]}
      total={12543}
      groupByOptions={['Agent', 'Team', 'Channel']}
      defaultGroupBy="Agent"
    />
  </div>
);

// ─── Section: Contacts ────────────────────────────────────────────────────────

const ContactsSection = () => (
  <div>
    <SectionHeader
      title="Contacts"
      description="Track contact growth, sources, and engagement over time. Monitor new contacts and unsubscribes."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Contacts"  value="8,432" change="+22%" positive />
      <StatCard label="New This Period" value="643"   change="+18%" positive />
      <StatCard label="Active"          value="3,218" change="+9%"  positive />
      <StatCard label="Unsubscribed"    value="87"    change="+2%"  positive={false} />
    </div>
    <ChartCard
      title="New Contacts by Channel"
      barData={[
        { label: 'WhatsApp',  value: 287, color: '#6ee7b7' },
        { label: 'Instagram', value: 154, color: '#f9a8d4' },
        { label: 'Facebook',  value: 112, color: '#93c5fd' },
        { label: 'Email',     value: 68,  color: '#a5b4fc' },
        { label: 'Gmail',     value: 22,  color: '#fcd34d' },
      ]}
      donutSegments={[
        { value: 287, color: '#6ee7b7', label: 'WhatsApp' },
        { value: 154, color: '#f9a8d4', label: 'Instagram' },
        { value: 112, color: '#93c5fd', label: 'Facebook' },
        { value: 68,  color: '#a5b4fc', label: 'Email' },
        { value: 22,  color: '#fcd34d', label: 'Gmail' },
      ]}
      total={643}
      groupByOptions={['Channel', 'Source', 'Agent']}
      defaultGroupBy="Channel"
    />
  </div>
);

// ─── Section: Assignments ─────────────────────────────────────────────────────

const AssignmentsSection = () => (
  <div>
    <SectionHeader
      title="Assignments"
      description="Monitor how conversations are assigned across agents and teams. Track auto-assignment vs manual assignment rates."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Assigned"     value="1,247" change="+14%" positive />
      <StatCard label="Auto-assigned"      value="834"   change="+22%" positive />
      <StatCard label="Manually Assigned"  value="413"   change="+4%"  positive />
      <StatCard label="Unassigned"         value="37"    change="-8%"  positive />
    </div>
    <ChartCard
      title="Assignments by Agent"
      barData={[
        { label: 'Nirmala Ka…', value: 312, color: '#93c5fd' },
        { label: 'Priya S…',    value: 287, color: '#93c5fd' },
        { label: 'Rahul M…',    value: 254, color: '#93c5fd' },
        { label: 'Anita R…',    value: 231, color: '#93c5fd' },
        { label: 'Suresh P…',   value: 163, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 312, color: '#93c5fd', label: 'Nirmala' },
        { value: 287, color: '#60a5fa', label: 'Priya' },
        { value: 254, color: '#3b82f6', label: 'Rahul' },
        { value: 231, color: '#2563eb', label: 'Anita' },
        { value: 163, color: '#1d4ed8', label: 'Suresh' },
      ]}
      total={1247}
      groupByOptions={['Agent', 'Team', 'Channel']}
      defaultGroupBy="Agent"
    />
    <ChartCard
      title="Assignments by Team"
      barData={[
        { label: 'Support', value: 612, color: '#a5b4fc' },
        { label: 'Sales',   value: 387, color: '#a5b4fc' },
        { label: 'Billing', value: 185, color: '#a5b4fc' },
        { label: 'Tech',    value: 63,  color: '#a5b4fc' },
      ]}
      donutSegments={[
        { value: 612, color: '#a5b4fc', label: 'Support' },
        { value: 387, color: '#818cf8', label: 'Sales' },
        { value: 185, color: '#6366f1', label: 'Billing' },
        { value: 63,  color: '#4f46e5', label: 'Tech' },
      ]}
      total={1247}
      groupByOptions={['Team', 'Agent', 'Channel']}
      defaultGroupBy="Team"
    />
  </div>
);

// ─── Section: Users ───────────────────────────────────────────────────────────

const UsersSection = () => (
  <div>
    <SectionHeader
      title="Users"
      description="Track agent activity, availability, and performance metrics. Identify top performers and workload distribution."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Active Agents"      value="12"     change="+2"   positive />
      <StatCard label="Avg Online Time"    value="7h 14m" change="+18m" positive />
      <StatCard label="Conv. per Agent"    value="104"    change="+8%"  positive />
      <StatCard label="Avg Response Time"  value="3m 12s" change="-15%" positive />
    </div>
    <ChartCard
      title="Conversations Handled by Agent"
      barData={[
        { label: 'Nirmala Ka…', value: 312, color: '#93c5fd' },
        { label: 'Priya S…',    value: 287, color: '#93c5fd' },
        { label: 'Rahul M…',    value: 254, color: '#93c5fd' },
        { label: 'Anita R…',    value: 231, color: '#93c5fd' },
        { label: 'Suresh P…',   value: 163, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 312, color: '#93c5fd', label: 'Nirmala' },
        { value: 287, color: '#60a5fa', label: 'Priya' },
        { value: 254, color: '#3b82f6', label: 'Rahul' },
        { value: 231, color: '#2563eb', label: 'Anita' },
        { value: 163, color: '#1d4ed8', label: 'Suresh' },
      ]}
      total={1247}
      groupByOptions={['Agent', 'Team']}
      defaultGroupBy="Agent"
    />
    <ChartCard
      title="Online Time by Agent (hours)"
      barData={[
        { label: 'Nirmala Ka…', value: 8, color: '#6ee7b7' },
        { label: 'Priya S…',    value: 7, color: '#6ee7b7' },
        { label: 'Rahul M…',    value: 7, color: '#6ee7b7' },
        { label: 'Anita R…',    value: 6, color: '#6ee7b7' },
        { label: 'Suresh P…',   value: 5, color: '#6ee7b7' },
      ]}
      donutSegments={[
        { value: 8, color: '#6ee7b7', label: 'Nirmala' },
        { value: 7, color: '#34d399', label: 'Priya' },
        { value: 7, color: '#10b981', label: 'Rahul' },
        { value: 6, color: '#059669', label: 'Anita' },
        { value: 5, color: '#047857', label: 'Suresh' },
      ]}
      total={33}
      groupByOptions={['Agent', 'Team']}
      defaultGroupBy="Agent"
    />
  </div>
);

// ─── Section: Broadcasts ──────────────────────────────────────────────────────

const BroadcastsSection = () => (
  <div>
    <SectionHeader
      title="Broadcasts"
      description="Analyze the performance of your broadcast campaigns. Track delivery, read, and reply rates across channels."
      learnMore
    />
    <DateRangeBar />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Campaigns Sent"   value="24"     change="+6"    positive />
      <StatCard label="Total Recipients" value="18,432" change="+34%"  positive />
      <StatCard label="Delivery Rate"    value="96.2%"  change="+1.2%" positive />
      <StatCard label="Read Rate"        value="68.4%"  change="+4.1%" positive />
    </div>
    <ChartCard
      title="Broadcasts by Channel"
      barData={[
        { label: 'WhatsApp',  value: 14, color: '#6ee7b7' },
        { label: 'Email',     value: 6,  color: '#a5b4fc' },
        { label: 'Instagram', value: 4,  color: '#f9a8d4' },
      ]}
      donutSegments={[
        { value: 14, color: '#6ee7b7', label: 'WhatsApp' },
        { value: 6,  color: '#a5b4fc', label: 'Email' },
        { value: 4,  color: '#f9a8d4', label: 'Instagram' },
      ]}
      total={24}
      groupByOptions={['Channel', 'Status', 'Agent']}
      defaultGroupBy="Channel"
    />
    <ChartCard
      title="Recipients by Campaign"
      barData={[
        { label: 'Summer Sale', value: 4821, color: '#93c5fd' },
        { label: 'Onboarding',  value: 3654, color: '#93c5fd' },
        { label: 'Re-engage',   value: 3102, color: '#93c5fd' },
        { label: 'Newsletter',  value: 2847, color: '#93c5fd' },
        { label: 'Promo Apr',   value: 2341, color: '#93c5fd' },
      ]}
      donutSegments={[
        { value: 4821, color: '#93c5fd', label: 'Summer Sale' },
        { value: 3654, color: '#60a5fa', label: 'Onboarding' },
        { value: 3102, color: '#3b82f6', label: 'Re-engage' },
        { value: 2847, color: '#2563eb', label: 'Newsletter' },
        { value: 2341, color: '#1d4ed8', label: 'Promo Apr' },
      ]}
      total={16765}
      groupByOptions={['Campaign', 'Channel']}
      defaultGroupBy="Campaign"
    />
  </div>
);

// ─── Section Map ──────────────────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<SectionKey, React.FC> = {
  lifecycle:     LifecycleSection,
  calls:         CallsSection,
  conversations: ConversationsSection,
  responses:     ResponsesSection,
  resolutions:   ResolutionsSection,
  messages:      MessagesSection,
  contacts:      ContactsSection,
  assignments:   AssignmentsSection,
  leaderboard:   LeaderboardSection,
  users:         UsersSection,
  broadcasts:    BroadcastsSection,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Reports = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('leaderboard');
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* Left Sidebar */}
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
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-5xl mx-auto">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};
