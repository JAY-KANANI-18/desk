import React from "react";
import {
  ChevronDown,
  ChevronUp,
  CornerUpLeft,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  Phone,
  Play,
  Reply,
} from "lucide-react";
import type { Message } from "./types";
import { highlightText, formatWaBody } from "./helpers";
import { AttachmentItem } from "./AttachmentItem";
import { QuotedPreview } from "./QuotedPreview";
import { WaCarouselBubble } from "./WaCarouselBubble";

export function MessageBubble({
  msg,
  isOutgoing,
  bubbleColor,
  isEmail,
  isWaTemplate,
  isExpanded,
  onToggleExpand,
  onOpenEmailModal,
  previewLength,
  searchTerm,
}: {
  msg: Message;
  isOutgoing: boolean;
  bubbleColor: string;
  isEmail: boolean;
  isWaTemplate: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenEmailModal: () => void;
  previewLength: number;
  searchTerm?: string;
}) {
  const atts = msg.messageAttachments ?? msg.attachments ?? [];
  const images = atts.filter((a) => a.type === "image");
  const others = atts.filter((a) => a.type !== "image");
  const rawText = msg.text ?? "";
  const displayText = isExpanded ? rawText : rawText.slice(0, previewLength);
  const hasText = !!rawText.trim();
  const needsExpand = rawText.length > previewLength;
  const quoted = msg.metadata?.quotedMessage;

  const renderText = (t: string) =>
    searchTerm ? highlightText(t, searchTerm) : t;

  const expandBtn = (outgoing: boolean) =>
    needsExpand && (
      <button
        onClick={onToggleExpand}
        className={`mt-1.5 flex items-center gap-1 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity
        ${outgoing ? "text-indigo-200" : "text-indigo-500"}`}
      >
        {isExpanded ? (
          <>
            <ChevronUp size={12} /> Show less
          </>
        ) : (
          <>
            <ChevronDown size={12} /> Show more
          </>
        )}
      </button>
    );

  if (isWaTemplate) {
    const components = msg.metadata?.template?.components ?? [];

    const header = components.find((c) => c.type === "HEADER");
    const body = components.find((c) => c.type === "BODY");
    const footer = components.find((c) => c.type === "FOOTER");
    const buttons = components
      .filter((c) => c.type === "BUTTONS")
      .flatMap((c) => c.buttons ?? []);
    const carousel = components.find((c) => c.type === "CAROUSEL");

    if (carousel?.cards?.length) {
      return (
        <WaCarouselBubble
          body={body?.text}
          cards={carousel.cards}
          createdAt={msg.createdAt as any}
        />
      );
    }

    return (
      <div
        className="overflow-hidden shadow-sm"
        style={{
          background: "#fff",
          borderRadius: 14,
          borderBottomLeftRadius: 4,
          maxWidth: 300,
          fontFamily: '-apple-system, "Segoe UI", sans-serif',
        }}
      >
        {header?.format === "IMAGE" && header.example?.header_handle?.[0] && (
          <img
            src={header.example.header_handle[0]}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: 170 }}
          />
        )}
        {header?.format === "VIDEO" && (
          <div className="relative w-full h-32 bg-gray-900 flex items-center justify-center">
            <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <Play size={16} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
        {header?.format === "DOCUMENT" && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f0f4f8] border-b border-[#e9edef]">
            <div className="w-9 h-11 bg-white rounded border border-gray-200 flex flex-col items-center justify-center gap-0.5 shadow-sm flex-shrink-0">
              <FileText size={16} className="text-[#e53935]" />
              <span className="text-[8px] font-bold text-[#e53935]">PDF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold text-[#303030] truncate">
                {header.text || "document.pdf"}
              </p>
              <p className="text-[10px] text-[#8a8a8a]">PDF - 1 page</p>
            </div>
          </div>
        )}
        {header?.format === "TEXT" && header.text && (
          <div className="px-3 pt-2.5 pb-0.5">
            <p className="text-[13px] font-bold text-[#303030] leading-snug">
              {header.text}
            </p>
          </div>
        )}
        {!header?.format && header?.text && (
          <div className="px-3 pt-2.5 pb-0.5">
            <p className="text-[13px] font-bold text-[#303030] leading-snug">
              {header.text}
            </p>
          </div>
        )}

        {body?.text && (
          <div className={`px-3 pb-1 ${header ? "pt-1" : "pt-2.5"}`}>
            <p
              className="text-[12.5px] text-[#303030] leading-snug whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatWaBody(body.text) }}
            />
          </div>
        )}

        {footer?.text && (
          <div className="px-3 pb-1.5">
            <p className="text-[10.5px] text-[#8a8a8a] leading-snug">
              {footer.text}
            </p>
          </div>
        )}

        {buttons.length > 0 && (
          <div className="border-t border-[#e9edef]">
            {buttons.map((btn, i) => (
              <div
                key={i}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-[#00a5f4] text-[12.5px] font-medium cursor-pointer hover:bg-[#f5f5f5] active:bg-[#ebebeb] transition-colors ${i > 0 ? "border-t border-[#e9edef]" : ""}`}
              >
                {btn.type === "URL" && <ExternalLink size={12} />}
                {btn.type === "PHONE_NUMBER" && <Phone size={12} />}
                {btn.type === "QUICK_REPLY" && <CornerUpLeft size={12} />}
                <span>{btn.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isEmail) {
    return (
      <div
        className={`rounded-2xl overflow-hidden shadow-sm ${bubbleColor} max-w-sm`}
      >
        {msg.metadata?.email?.subject && (
          <div
            className={`flex items-center gap-1.5 px-4 pt-3 pb-2 border-b ${isOutgoing ? "border-white/10" : "border-gray-100"}`}
          >
            <Mail size={11} className="flex-shrink-0 opacity-50" />
            <span
              className={`text-xs font-semibold truncate max-w-[240px] ${isOutgoing ? "text-white/90" : "text-gray-700"}`}
            >
              {msg.metadata.email.subject}
            </span>
          </div>
        )}
        {quoted && <QuotedPreview {...quoted} isOutgoing={isOutgoing} />}
        {hasText && (
          <div className="px-4 pt-2.5 pb-1">
            <p className="text-sm whitespace-pre-wrap">
              {renderText(displayText)}
              {!isExpanded && needsExpand && "..."}
            </p>
            {expandBtn(isOutgoing)}
          </div>
        )}
        {atts.length > 0 && (
          <div className={hasText ? "border-t border-black/5 mt-1" : ""}>
            {images.length > 0 && (
              <div
                className={`grid gap-0.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {images.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full object-cover"
                      style={{ maxHeight: images.length === 1 ? 200 : 120 }}
                    />
                  </a>
                ))}
              </div>
            )}
            {others.map((att, i) => (
              <div
                key={i}
                className={
                  i > 0 || images.length > 0 ? "border-t border-black/5" : ""
                }
              >
                <AttachmentItem att={att} isOutgoing={isOutgoing} />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <button
            onClick={onOpenEmailModal}
            className={`flex items-center gap-1 text-xs opacity-70 hover:opacity-100 font-medium transition-opacity
              ${isOutgoing ? "text-white" : "text-gray-600"}`}
          >
            <Eye size={11} />
          </button>
          <button
            className={`flex items-center gap-1 text-xs opacity-70 hover:opacity-100 font-medium transition-opacity
              ${isOutgoing ? "text-white" : "text-gray-600"}`}
          >
            <Reply size={11} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm ${bubbleColor} max-w-sm`}
    >
      {quoted && <QuotedPreview {...quoted} isOutgoing={isOutgoing} />}
      {images.length > 0 && (
        <div
          className={`grid gap-0.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {images.map((att, i) => (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden"
            >
              <img
                src={att.url}
                alt={att.name}
                className="w-full object-cover"
                style={{ maxHeight: images.length === 1 ? 200 : 120 }}
              />
            </a>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className={images.length > 0 ? "border-t border-black/5" : ""}>
          {others.map((att, i) => (
            <div key={i} className={i > 0 ? "border-t border-black/5" : ""}>
              <AttachmentItem att={att} isOutgoing={isOutgoing} />
            </div>
          ))}
        </div>
      )}
      {hasText && (
        <div
          className={`px-4 py-3 ${atts.length > 0 || quoted ? "border-t border-black/5" : ""}`}
        >
          <p className="text-sm whitespace-pre-wrap">
            {renderText(displayText)}
            {!isExpanded && needsExpand && "..."}
          </p>
          {expandBtn(isOutgoing)}
        </div>
      )}
    </div>
  );
}
