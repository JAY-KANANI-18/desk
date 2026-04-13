import React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import type { MessageStatus } from "./types";

export function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  if (status === "read") {
    return <CheckCheck size={14} className="text-sky-500 flex-shrink-0" />;
  }

  if (status === "delivered") {
    return <CheckCheck size={14} className="text-gray-400 flex-shrink-0" />;
  }

  if (status === "sent") {
    return <Check size={14} className="text-gray-400 flex-shrink-0" />;
  }

  return <Clock size={13} className="text-gray-400 flex-shrink-0" />;
}
