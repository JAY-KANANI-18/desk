import { File, ImageIcon, Mic, Video } from "lucide-react";
import { TruncatedText } from "../../../components/ui/TruncatedText";
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

  const attachmentPreview =
    attachmentType === "audio"
      ? { label: "Voice message", Icon: Mic }
      : attachmentType === "video"
        ? { label: "Video", Icon: Video }
        : attachmentType === "image"
          ? { label: "Image", Icon: ImageIcon }
          : attachmentType
            ? { label: "File", Icon: File }
            : null;
  const bar = isOutgoing ? "bg-white/40" : "bg-[var(--color-primary)]";
  const bg = isOutgoing ? "bg-white/10" : "bg-gray-200/60";
  const clr = isOutgoing ? "text-white/75" : "text-gray-600";
  const actor = isOutgoing ? "text-white/90" : "text-[var(--color-primary)]";
  const attachmentChip = isOutgoing
    ? "bg-white/10 text-white/80"
    : "bg-white/80 text-gray-600";

  return (
    <div className={`flex gap-1.5 rounded-lg overflow-hidden ${bg} mx-2 mt-2`}>
      <div className={`w-0.5 flex-shrink-0 ${bar}`} />
      <div className="py-1.5 pr-2 flex-1 min-w-0">
        {author && (
          <TruncatedText
            as="p"
            text={author}
            maxLines={1}
            className={`mb-0.5 text-[10px] font-semibold ${actor}`}
          />
        )}
        {attachmentType === "image" && attachmentUrl && (
          <img
            src={attachmentUrl}
            alt=""
            className="w-10 h-10 object-cover rounded mb-0.5"
          />
        )}
        {attachmentPreview &&
          (attachmentType !== "image" || !attachmentUrl) && (
            <div
              className={`mb-1 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 ${attachmentChip}`}
            >
              <attachmentPreview.Icon size={11} className="flex-shrink-0" />
              <TruncatedText
                as="span"
                text={attachmentPreview.label}
                maxLines={1}
                className="text-[11px] font-medium"
              />
            </div>
          )}
        {text && (
          <TruncatedText
            as="p"
            text={text}
            maxLines={2}
            className={`text-[11px] leading-snug ${clr}`}
          />
        )}
      </div>
    </div>
  );
}
