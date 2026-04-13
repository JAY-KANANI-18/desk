import React from "react";
import { Download, FileText } from "lucide-react";
import type { MediaAttachment } from "./types";
import { formatFileSize } from "./helpers";
import { MiniAudioPlayer } from "./MiniAudioPlayer";

export function AttachmentItem({
  att,
  isOutgoing,
}: {
  att: MediaAttachment;
  isOutgoing?: boolean;
}) {
  if (att.type === "image") {
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full overflow-hidden"
      >
        <img
          src={att.url}
          alt={att.name}
          className="w-full max-h-[220px] object-cover"
        />
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/5">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isOutgoing ? "text-white/60" : "text-indigo-500"}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p
            className={`text-[11px] font-medium truncate flex-1 ${isOutgoing ? "text-white/80" : "text-gray-600"}`}
          >
            {att.name}
          </p>
        </div>
      </a>
    );
  }
  if (att.type === "video") {
    return (
      <div className="w-full overflow-hidden">
        <video
          controls
          src={att.url}
          className="w-full max-h-[200px] bg-black block"
        />
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-black/5">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isOutgoing ? "text-white/60" : "text-purple-500"}
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
          <p
            className={`text-[11px] font-medium truncate flex-1 ${isOutgoing ? "text-white/80" : "text-gray-600"}`}
          >
            {att.name}
          </p>
        </div>
      </div>
    );
  }
  if (att.type === "audio")
    return <MiniAudioPlayer url={att.url} isVoice dark={isOutgoing} />;
  return (
    <a
      href={att.url}
      download={att.name}
      className={`flex items-center gap-2.5 px-3 py-2.5 ${isOutgoing ? "text-white" : "text-gray-700"}`}
    >
      <FileText
        size={16}
        className={isOutgoing ? "text-white/80" : "text-indigo-500"}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium truncate ${isOutgoing ? "text-white" : "text-gray-800"}`}
        >
          {att.name}
        </p>
        {att.size && (
          <p
            className={`text-[10px] ${isOutgoing ? "text-white/60" : "text-gray-400"}`}
          >
            {formatFileSize(att.size)}
          </p>
        )}
      </div>
      <Download
        size={13}
        className={isOutgoing ? "text-white/70" : "text-gray-400"}
      />
    </a>
  );
}
