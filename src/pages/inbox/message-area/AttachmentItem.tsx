import { Download, FileImage, FileText, Video } from "lucide-react";
import type { MediaAttachment } from "./types";
import { formatFileSize } from "./helpers";
import { MiniAudioPlayer } from "./MiniAudioPlayer";
import { TruncatedText } from "../../../components/ui/TruncatedText";

function getAttachmentToneClasses(isOutgoing?: boolean) {
  return {
    icon: isOutgoing ? "text-white/60" : "text-indigo-500",
    secondaryIcon: isOutgoing ? "text-white/60" : "text-purple-500",
    title: isOutgoing ? "text-white/80" : "text-gray-600",
    fileTitle: isOutgoing ? "text-white" : "text-gray-800",
    meta: isOutgoing ? "text-white/60" : "text-gray-400",
    row: isOutgoing ? "text-white" : "text-gray-700",
  };
}

export function AttachmentItem({
  att,
  isOutgoing,
}: {
  att: MediaAttachment;
  isOutgoing?: boolean;
}) {
  const tone = getAttachmentToneClasses(isOutgoing);

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
          <FileImage size={11} className={tone.icon} />
          <TruncatedText
            as="p"
            text={att.name}
            className={`flex-1 text-[11px] font-medium ${tone.title}`}
          />
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
          <Video size={11} className={tone.secondaryIcon} />
          <TruncatedText
            as="p"
            text={att.name}
            className={`flex-1 text-[11px] font-medium ${tone.title}`}
          />
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
      className={`flex items-center gap-2.5 px-3 py-2.5 ${tone.row}`}
    >
      <FileText size={16} className={tone.icon} />
      <div className="flex-1 min-w-0">
        <TruncatedText
          as="p"
          text={att.name}
          className={`text-xs font-medium ${tone.fileTitle}`}
        />
        {att.size && (
          <p className={`text-[10px] ${tone.meta}`}>{formatFileSize(att.size)}</p>
        )}
      </div>
      <Download size={13} className={tone.meta} />
    </a>
  );
}
