import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Info,
  Loader2,
  MoreVertical,
  TrendingDown,
  TrendingUp,
} from "@/components/ui/icons";
import { useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../../components/ui/Card";
import { IconButton } from "../../components/ui/button/IconButton";
import { BaseInput } from "../../components/ui/inputs/BaseInput";

export type DateFilter = {
  from: string;
  to: string;
};

type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

type DonutSegment = {
  value: number;
  color: string;
  label: string;
};

const COLORS = [
  "#2563EB",
  "#0F766E",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#65A30D",
  "#DB2777",
  "#4F46E5",
  "#9333EA",
];

export const getDefaultDateRange = (): DateFilter => {
  const endDate = new Date();
  const startDate = new Date();

  startDate.setDate(endDate.getDate() - 7);

  return {
    from: startDate.toISOString().slice(0, 10),
    to: endDate.toISOString().slice(0, 10),
  };
};

const isDateValue = (value: string | null) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export const useReportFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaults = useMemo(() => getDefaultDateRange(), []);

  const filters = useMemo<DateFilter>(
    () => ({
      from: isDateValue(searchParams.get("from"))
        ? (searchParams.get("from") as string)
        : defaults.from,
      to: isDateValue(searchParams.get("to"))
        ? (searchParams.get("to") as string)
        : defaults.to,
    }),
    [defaults.from, defaults.to, searchParams],
  );

  const setFilters = (nextFilters: DateFilter) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set("from", nextFilters.from);
    nextSearchParams.set("to", nextFilters.to);

    setSearchParams(nextSearchParams, { replace: true });
  };

  return {
    filters,
    setFilters,
  };
};

const formatDateRangeLabel = (from: string, to: string) => {
  const fromDate = new Date(from).toLocaleDateString();
  const toDate = new Date(to).toLocaleDateString();

  return `${fromDate} - ${toDate}`;
};

const formatChartLabel = (label: string) => {
  if (!label) {
    return "-";
  }

  return label.length > 12 ? `${label.slice(0, 12)}...` : label;
};

export const ReportsDateRangeBar = () => {
  const { filters, setFilters } = useReportFilters();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
      <div className="md:text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Date range
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {formatDateRangeLabel(filters.from, filters.to)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:min-w-[360px]">
        <ReportDateInput
          label="From"
          value={filters.from}
          onChange={(value) => setFilters({ ...filters, from: value })}
        />

        <ReportDateInput
          label="To"
          value={filters.to}
          onChange={(value) => setFilters({ ...filters, to: value })}
        />
      </div>
    </div>
  );
};

const ReportDateInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  };

  return (
    <BaseInput
      ref={inputRef}
      label={label}
      labelVariant="sidebar"
      type="date"
      size="sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      hideNativePickerIndicator
      rightIcon={
        <IconButton
          type="button"
          onClick={openPicker}
          icon={<Calendar size={16} />}
          aria-label={`Choose ${label.toLowerCase()} date`}
          size="xs"
          variant="ghost"
          tabIndex={-1}
        />
      }
    />
  );
};

export const ReportsSectionIntro = ({
  title,
}: {
  title: string;
  description?: string;
}) => (
  <div className="px-1">
    <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
  </div>
);

const ReportBarChart = ({
  data,
  height = 280,
}: {
  data: BarDatum[];
  height?: number;
}) => {
  const chartData = data.map((datum, index) => ({
    ...datum,
    fill: datum.color ?? COLORS[index % COLORS.length],
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 12, bottom: 6, left: 0 }}
        >
          <CartesianGrid
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickFormatter={formatChartLabel}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid #E2E8F0",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Bar dataKey="value" radius={[12, 12, 0, 0]}>
            {chartData.map((datum, index) => (
              <Cell fill={datum.fill} key={`${datum.label}-${index}`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ReportDonutChart = ({
  segments,
  total,
  centerLabel = "Total",
  height = 280,
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
  height?: number;
}) => {
  const chartData = segments.map((segment, index) => ({
    ...segment,
    color: segment.color ?? COLORS[index % COLORS.length],
  }));

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid #E2E8F0",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
            height={36}
            verticalAlign="bottom"
          />
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={70}
            nameKey="label"
            outerRadius={100}
            paddingAngle={2}
          >
            {chartData.map((segment, index) => (
              <Cell fill={segment.color} key={`${segment.label}-${index}`} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-slate-500">{centerLabel}</span>
        <span className="text-2xl font-bold text-slate-900">{total}</span>
      </div>
    </div>
  );
};

export const ReportChartCard = ({
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
    <Card className="rounded-[28px] border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <Info size={14} className="text-slate-400" />
        </div>
        <IconButton
          type="button"
          icon={<MoreVertical size={16} />}
          aria-label={`More options for ${title}`}
          size="xs"
          variant="ghost"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-center">
        <ReportBarChart data={barData} />
        <ReportDonutChart segments={donutSegments} total={total} />
      </div>
    </Card>
  );
};

export const ReportSingleChartCard = ({
  title,
  data,
  total,
  type = "bar",
}: {
  title: string;
  data: any[];
  total?: number;
  type?: "bar" | "donut";
}) => {
  return (
    <Card className="rounded-[28px] border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <Info size={14} className="text-slate-400" />
        </div>
      </div>

      {type === "bar" ? (
        <ReportBarChart data={data} />
      ) : (
        <ReportDonutChart segments={data} total={total ?? 0} />
      )}
    </Card>
  );
};

export const ReportStatCard = ({
  label,
  value,
  change,
  positive = true,
}: {
  label: string;
  value: number | string;
  change?: string;
  positive?: boolean;
}) => (
  <Card className="rounded-[24px] border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    {change && (
      <p
        className={`mt-2 flex items-center gap-1 text-xs ${
          positive ? "text-emerald-600" : "text-rose-500"
        }`}
      >
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </p>
    )}
  </Card>
);

export const ReportsLoadingState = () => (
  <Card className="rounded-[28px] border-slate-200 bg-white p-8 shadow-sm">
    <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
      <Loader2 className="animate-spin" size={18} />
      Loading analytics...
    </div>
  </Card>
);

export const ReportsErrorState = ({ message }: { message: string }) => (
  <Card className="rounded-[28px] border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
    {message}
  </Card>
);

export const FailedMessagesTable = ({ rows }: { rows: any[] }) => {
  return (
    <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h4 className="text-sm font-semibold text-slate-800">
          Failed message logs
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Friendly empty state and one consistent table surface for retries.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Channel</th>
              <th className="px-5 py-3 text-left font-medium">Recipient</th>
              <th className="px-5 py-3 text-left font-medium">Message</th>
              <th className="px-5 py-3 text-left font-medium">Attempts</th>
              <th className="px-5 py-3 text-left font-medium">Error</th>
              <th className="px-5 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-10 text-center text-sm text-slate-400"
                  colSpan={6}
                >
                  No failed messages found for this range.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="border-t border-slate-100" key={row.id}>
                  <td className="px-5 py-4 text-slate-700">
                    {row.channel?.type || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.to}</td>
                  <td className="max-w-[260px] truncate px-5 py-4 text-slate-700">
                    {row.message?.text || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.attempts}</td>
                  <td className="max-w-[320px] truncate px-5 py-4 text-rose-600">
                    {row.lastError || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const useReportLoader = <T,>(
  loader: (filters: DateFilter) => Promise<T>,
) => {
  const { filters } = useReportFilters();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const nextData = await loader(filters);

        if (isMounted) {
          setData(nextData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load analytics");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [filters.from, filters.to, loader]);

  return {
    data,
    error,
    filters,
    loading,
  };
};
