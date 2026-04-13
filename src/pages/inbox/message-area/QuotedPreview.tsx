import React from "react";
import type { MediaAttachment } from "./types";

export function QuotedPreview({
  text,
  author,
  attachmentType,
  attachmentUrl,
  isOutgoing,
}: {
  text?: string;
  author?: string;
  attachmentType?: MediaAttachment["type"];
  attachmentUrl?: string;
  isOutgoing: boolean;
}) {
  if (!author && !text && !attachmentType) return null;
  const bar = isOutgoing ? "bg-white/40" : "bg-indigo-400";
  const bg = isOutgoing ? "bg-white/10" : "bg-gray-200/60";
  const clr = isOutgoing ? "text-white/75" : "text-gray-600";
  const actor = isOutgoing ? "text-white/90" : "text-indigo-600";
  return (
    <div className={`flex gap-1.5 rounded-lg overflow-hidden ${bg} mx-2 mt-2`}>
      <div className={`w-0.5 flex-shrink-0 ${bar}`} />
      <div className="py-1.5 pr-2 flex-1 min-w-0">
        {author && (
          <p className={`text-[10px] font-semibold mb-0.5 ${actor}`}>
            {author}
          </p>
        )}
        {attachmentType === "image" && attachmentUrl && (
          <img
            src={attachmentUrl}
            alt=""
            className="w-10 h-10 object-cover rounded mb-0.5"
          />
        )}
        {attachmentType && attachmentType !== "image" && (
          <p className={`text-[11px] italic ${clr}`}>
            {attachmentType === "audio"
              ? "Voice message"
              : attachmentType === "video"
                ? "Video"
                : "File"}
          </p>
        )}
        {text && <p className={`text-[11px] ${clr} line-clamp-2`}>{text}</p>}
      </div>
    </div>
  );
}
