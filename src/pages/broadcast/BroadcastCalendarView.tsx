import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { BroadcastRunRow } from "../../lib/broadcastApi";
import { CALENDAR_WEEK_DAYS } from "./constants";
import {
  calendarEventClass,
  calendarStatusLabel,
  formatDateKey,
  formatTime,
} from "./utils";

type BroadcastCalendarViewProps = {
  monthLabel: string;
  calendarMonth: Date;
  calendarDays: Date[];
  calendarEventsByDate: Record<string, BroadcastRunRow[]>;
  todayKey: string;
  onToday: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenDetail: (run: BroadcastRunRow) => void;
  hasMoreRuns: boolean;
  runsLoadingMore: boolean;
  nextCursor?: string;
  onLoadMore: (cursor?: string) => void;
};

export function BroadcastCalendarView({
  monthLabel,
  calendarMonth,
  calendarDays,
  calendarEventsByDate,
  todayKey,
  onToday,
  onPreviousMonth,
  onNextMonth,
  onOpenDetail,
  hasMoreRuns,
  runsLoadingMore,
  nextCursor,
  onLoadMore,
}: BroadcastCalendarViewProps) {
  const isMobile = useIsMobile();
  const mobileCalendarDays = useMemo(
    () =>
      calendarDays.map((day) => ({
      day,
      key: formatDateKey(day),
      events: calendarEventsByDate[formatDateKey(day)] ?? [],
      isCurrentMonth: day.getMonth() === calendarMonth.getMonth(),
      isToday: formatDateKey(day) === todayKey,
    })),
    [calendarDays, calendarEventsByDate, calendarMonth, todayKey],
  );
  const defaultSelectedDateKey = useMemo(() => {
    const currentMonthDays = mobileCalendarDays.filter((group) => group.isCurrentMonth);
    return (
      currentMonthDays.find((group) => group.isToday)?.key ??
      currentMonthDays.find((group) => group.events.length > 0)?.key ??
      currentMonthDays[0]?.key ??
      todayKey
    );
  }, [mobileCalendarDays, todayKey]);
  const [selectedDateKey, setSelectedDateKey] = useState(defaultSelectedDateKey);

  useEffect(() => {
    setSelectedDateKey(defaultSelectedDateKey);
  }, [defaultSelectedDateKey]);

  const selectedDay =
    mobileCalendarDays.find((group) => group.key === selectedDateKey) ??
    mobileCalendarDays.find((group) => group.key === defaultSelectedDateKey);

  if (isMobile) {
    return (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain px-3 py-3 pb-24 sm:px-4">
        <div className="rounded-[24px] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
              <p className="text-xs text-gray-500">Scheduled broadcasts by send date</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToday}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
              >
                Today
              </button>
              <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={onPreviousMonth}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={onNextMonth}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] bg-slate-50 p-2">
            <div className="grid grid-cols-7 px-1 pb-2">
              {CALENDAR_WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                >
                  {day.slice(0, 1)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {mobileCalendarDays.map(({ day, key, events, isCurrentMonth, isToday }) => {
                const isSelected = selectedDay?.key === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={`flex min-h-[54px] flex-col items-center justify-start rounded-2xl px-1.5 py-2 text-center transition ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : isCurrentMonth
                          ? "bg-white text-slate-800 hover:bg-slate-100"
                          : "bg-transparent text-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday && !isSelected ? "bg-indigo-50 text-indigo-600" : ""
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {events.length > 0 ? (
                      <span
                        className={`mt-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {events.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {selectedDay?.day.toLocaleDateString([], { weekday: "long" })}
                </p>
                <h4 className="text-sm font-semibold text-slate-900">
                  {selectedDay?.day.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h4>
              </div>
              {selectedDay?.isToday ? (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600">
                  Today
                </span>
              ) : null}
            </div>

            {selectedDay && selectedDay.events.length > 0 ? (
              <div className="space-y-2">
                {selectedDay.events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onOpenDetail(event)}
                    className={`w-full rounded-2xl border-l-2 px-3 py-3 text-left text-sm transition ${calendarEventClass(
                      event.status,
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{event.name}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {formatTime(event.scheduledAt)} | {calendarStatusLabel(event.status)}
                        </p>
                      </div>
                      <span className="text-xs opacity-70">{event.totalAudience}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                No scheduled broadcasts for this day.
              </div>
            )}
          </section>
        </div>

        {(hasMoreRuns || runsLoadingMore) && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => onLoadMore(nextCursor)}
              disabled={runsLoadingMore || !nextCursor}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runsLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
              Load more broadcasts
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
            <p className="text-xs text-gray-500">Scheduled broadcasts by send date</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToday}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Today
            </button>
            <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={onPreviousMonth}
                className="border-r border-gray-300 p-2 transition hover:bg-gray-50"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                className="p-2 transition hover:bg-gray-50"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {CALENDAR_WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const key = formatDateKey(day);
            const dayEvents = calendarEventsByDate[key] ?? [];
            const visibleEvents = dayEvents.slice(0, 3);
            const overflow = dayEvents.length - visibleEvents.length;
            const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={`min-h-[132px] border-b border-r border-gray-200 p-2 ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50/70"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs ${
                      isToday
                        ? "bg-indigo-600 text-white"
                        : isCurrentMonth
                          ? "text-gray-700"
                          : "text-gray-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div className="space-y-1">
                  {visibleEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onOpenDetail(event)}
                      className={`w-full rounded-md border-l-2 px-2 py-1 text-left text-xs transition ${calendarEventClass(
                        event.status,
                      )}`}
                    >
                      <span className="block truncate font-medium">{event.name}</span>
                      <span className="block text-[11px] opacity-75">
                        {formatTime(event.scheduledAt)} | {calendarStatusLabel(event.status)}
                      </span>
                    </button>
                  ))}
                  {overflow > 0 && dayEvents[3] && (
                    <button
                      type="button"
                      onClick={() => onOpenDetail(dayEvents[3])}
                      className="w-full rounded-md px-2 py-1 text-left text-xs text-gray-500 transition hover:bg-gray-100"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(hasMoreRuns || runsLoadingMore) && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => onLoadMore(nextCursor)}
            disabled={runsLoadingMore || !nextCursor}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runsLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
            Load more broadcasts
          </button>
        </div>
      )}
    </div>
  );
}
