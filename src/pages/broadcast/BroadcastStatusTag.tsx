import { Tag, type TagSize } from "../../components/ui/Tag";
import { statusLabel } from "./utils";

function resolveStatusColor(status: string) {
  if (
    status === "completed" ||
    status === "sent" ||
    status === "delivered"
  ) {
    return "success";
  }

  if (status === "partial_failure") {
    return "warning";
  }

  if (status === "failed") {
    return "error";
  }

  if (status === "running") {
    return "tag-purple";
  }

  if (status === "scheduled") {
    return "tag-indigo";
  }

  if (status === "queued" || status === "pending") {
    return "info";
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
