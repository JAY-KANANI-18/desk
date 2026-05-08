import { Tag, type TagSize } from "../../components/ui/Tag";
import { statusLabel } from "./utils";

function resolveStatusColor(status: string) {
  if (
    status === "completed" ||
    status === "sent" ||
    status === "delivered" ||
    status === "read"
  ) {
    return "success";
  }

  if (status === "partial_failure") {
    return "warning";
  }

  if (status === "failed" || status === "bounced" || status === "dead_letter") {
    return "error";
  }

  if (status === "running" || status === "sending") {
    return "tag-purple";
  }

  if (status === "scheduled") {
    return "tag-indigo";
  }

  if (status === "queued" || status === "pending") {
    return "info";
  }

  if (status === "unsubscribed") {
    return "warning";
  }

  return "gray";
}

type BroadcastStatusTagProps = {
  status: string;
  size?: TagSize;
};

export function BroadcastStatusTag({
  status,
  size = "sm",
}: BroadcastStatusTagProps) {
  return (
    <Tag
      label={statusLabel(status)}
      size={size}
      bgColor={resolveStatusColor(status)}
    />
  );
}
