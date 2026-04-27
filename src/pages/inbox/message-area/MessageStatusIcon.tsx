import { Check, CheckCheck, Clock } from "lucide-react";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { MessageStatus } from "./types";

export function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  const resolvedStatus = status ?? "pending";

  const config =
    resolvedStatus === "read"
      ? { Icon: CheckCheck, colorClass: "text-sky-500", label: "Read" }
      : resolvedStatus === "delivered"
        ? {
            Icon: CheckCheck,
            colorClass: "text-gray-400",
            label: "Delivered",
          }
        : resolvedStatus === "sent"
          ? { Icon: Check, colorClass: "text-gray-400", label: "Sent" }
          : { Icon: Clock, colorClass: "text-gray-400", label: "Pending" };

  return (
    <Tooltip content={config.label}>
      <span
        aria-label={config.label}
        className="inline-flex items-center"
      >
        <config.Icon
          size={resolvedStatus === "pending" ? 13 : 14}
          className={`${config.colorClass} flex-shrink-0`}
        />
      </span>
    </Tooltip>
  );
}
