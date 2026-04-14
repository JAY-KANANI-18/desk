import type { ActivityStatusOption } from "./types";

export const ACTIVITY_STATUSES: ActivityStatusOption[] = [
  { key: "online", label: "Online", color: "bg-green-500" },
  { key: "offline", label: "Offline", color: "bg-gray-400" },
  { key: "away", label: "Away", color: "bg-yellow-400" },
  { key: "busy", label: "Busy", color: "bg-orange-500" },
  { key: "dnd", label: "Do not disturb", color: "bg-red-500" },
];
