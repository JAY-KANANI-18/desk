import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { BroadcastRunRow } from "../../lib/broadcastApi";
import { CALENDAR_WEEK_DAYS } from "./constants";
import {
  calendarStatusLabel,
  formatDate,
  formatDateKey,
  formatTime,
  formatWeekday,
} from "./utils";

function getEventTone(status: string) {
  if (status === "completed" || status === "sent") {
    return {
      card: "border-emerald-100 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
      dot: "bg-emerald-500",
      meta: "text-emerald-700",
    };
  }
  if (status === "partial_failure" || status === "failed") {
    return {
      card: "border-red-100 bg-red-50 text-red-950 hover:bg-red-100",
      dot: "bg-red-500",
      meta: "text-red-700",
    };
  }
  if (status === "scheduled" || status === "running") {
    return {
      card: "border-indigo-100 bg-indigo-50 text-indigo-950 hover:bg-indigo-100",
      dot: "bg-[var(--color-primary)]",
      meta: "text-indigo-700",
    };
  }

  return {
    card: "border-slate-100 bg-slate-50 text-slate-950 hover:bg-slate-100",
    dot: "bg-slate-400",
    meta: "text-slate-600",
  };
}

function peopleLabel(count: number) {
  return `${count} ${count === 1 ? "person" : "people"}`;
}

function getMobileEventClass(status: string) {
  if (status === "completed" || status === "sent") {
    return "border-l-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100";
  }
  if (status === "partial_failure" || status === "failed") {
    return "border-l-red-500 bg-red-50 text-red-900 hover:bg-red-100";
  }
  if (status === "scheduled" || status === "running") {
    return "border-l-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]";
  }
  return "border-l-gray-400 bg-gray-50 text-gray-800 hover:bg-gray-100";
}

function BroadcastCalendarEventButton({
  event,
  onOpenDetail,
  compact = false,
}: {
  event: BroadcastRunRow;
  onOpenDetail: (run: BroadcastRunRow) => void;
  compact?: boolean;
}) {
  const tone = getEventTone(event.status);

  return (
    <Button
      type="button"
      variant="unstyled"
      fullWidth
      contentAlign="start"
      preserveChildLayout
      onClick={() => onOpenDetail(event)}
      className={`group block min-w-0 overflow-hidden rounded-xl border px-2 py-1.5 text-left transition-colors ${tone.card} ${
        compact ? "min-h-[3rem]" : "min-h-[3.5rem]"
      }`}
    >
      <div className="w-full min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
          <p className="min-w-0 truncate text-xs font-semibold leading-5">
            {event.name}
          </p>
        </div>
        <div
          className={`mt-0.5 flex min-w-0 items-center justify-between gap-2 text-[11px] leading-4 ${tone.meta}`}
        >
          <span className="min-w-0 truncate">
            {formatTime(event.scheduledAt)} | {calendarStatusLabel(event.status)}
          </span>
          <span className="shrink-0 font-medium">
            {peopleLabel(event.totalAudience)}
          </span>
        </div>
      </div>
    </Button>
  );
}

function BroadcastCalendarMobileEventButton({
  event,
  onOpenDetail,
}: {
  event: BroadcastRunRow;
  onOpenDetail: (run: BroadcastRunRow) => void;
}) {
  return (
    <Button
      type="button"
      variant="unstyled"
      fullWidth
      contentAlign="start"
      size="md"
      radius="lg"
      onClick={() => onOpenDetail(event)}
      className={`items-start whitespace-normal border border-l-2 text-left ${getMobileEventClass(
        event.status,
      )} rounded-2xl`}
    >
      <div className="w-full min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{event.name}</p>
            <p className="mt-1 text-xs opacity-80">
              {formatTime(event.scheduledAt)} | {calendarStatusLabel(event.status)}
            </p>
          </div>
          <span className="shrink-0 text-xs opacity-70">
            {peopleLabel(event.totalAudience)}
          </span>
        </div>
      </div>
    </Button>
  );
}

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
              <p className="text-xs text-gray-500">Broadcasts planned by send date</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="soft"  onClick={onToday}>
                Today
              </Button>
              <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                <Button
                  type="button"
                  variant="ghost"
                 
                  iconOnly
                  leftIcon={<ChevronLeft size={16} />}
                  aria-label="Previous month"
                  onClick={onPreviousMonth}
                />
                <Button
                  type="button"
                  variant="ghost"
                
                  iconOnly
                  leftIcon={<ChevronRight size={16} />}
                  aria-label="Next month"
                  onClick={onNextMonth}
                />
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
                  <Button
                    key={key}
                    type="button"
                    fullWidth
                    variant={
                      isSelected
                        ? "primary"
                        : isCurrentMonth
                          ? "secondary"
                          : "ghost"
                    }
                    aria-label={`${formatDate(day)}${
                      events.length ? `, ${events.length} broadcasts` : ""
                    }`}
                    className="h-14 min-h-14 overflow-hidden"
                    onClick={() => setSelectedDateKey(key)}
                  >
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isToday
                              ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                              : isCurrentMonth
                                ? "text-slate-800"
                                : "text-slate-300"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {events.length > 0 ? (
                        <span
                          className={`mt-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                          }`}
                        >
                          {events.length > 9 ? "9+" : events.length}
                        </span>
                      ) : null}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {formatWeekday(selectedDay?.day)}
                </p>
                <h4 className="text-sm font-semibold text-slate-900">
                  {formatDate(selectedDay?.day)}
                </h4>
              </div>
              {selectedDay?.isToday ? (
                <Tag label="Today" size="sm" bgColor="tag-indigo" />
              ) : null}
            </div>

            {selectedDay && selectedDay.events.length > 0 ? (
              <div className="grid gap-2">
                {selectedDay.events.map((event) => (
                  <BroadcastCalendarMobileEventButton
                    key={event.id}
                    event={event}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                No broadcasts planned for this day.
              </div>
            )}
          </section>
        </div>

        {(hasMoreRuns || runsLoadingMore) && (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="soft"
              onClick={() => onLoadMore(nextCursor)}
              disabled={!nextCursor}
              loading={runsLoadingMore}
              loadingMode="inline"
              loadingLabel="Loading more broadcasts"
            >
              Show more broadcasts
            </Button>
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
            <p className="text-xs text-gray-500">Broadcasts planned by send date</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary"  onClick={onToday}>
              Today
            </Button>
            <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
              <Button
                type="button"
                variant="ghost"
                iconOnly
                leftIcon={<ChevronLeft size={16} />}
                aria-label="Previous month"
                onClick={onPreviousMonth}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                leftIcon={<ChevronRight size={16} />}
                aria-label="Next month"
                onClick={onNextMonth}
              />
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
                        ? "bg-[var(--color-primary)] text-white"
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
                    <BroadcastCalendarEventButton
                      key={event.id}
                      event={event}
                      onOpenDetail={onOpenDetail}
                      compact
                    />
                  ))}
                  {overflow > 0 && dayEvents[3] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      fullWidth
                      contentAlign="start"
                      onClick={() => onOpenDetail(dayEvents[3])}
                    >
                      +{overflow} more
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(hasMoreRuns || runsLoadingMore) && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onLoadMore(nextCursor)}
            disabled={!nextCursor}
            loading={runsLoadingMore}
            loadingMode="inline"
            loadingLabel="Loading more broadcasts"
          >
            Show more broadcasts
          </Button>
        </div>
      )}
    </div>
  );
}
