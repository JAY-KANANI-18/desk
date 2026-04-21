import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  return (
    <div className="p-4 sm:p-6">
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
