import React from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Mail,
  Play,
  Reply,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Tooltip } from "../../../components/ui/Tooltip";
import { TruncatedText } from "../../../components/ui/TruncatedText";
import type { Message, MessageGroupPosition } from "./types";
import { getWaTemplateButtonIcon, highlightText, formatWaBody } from "./helpers";
import { AttachmentItem } from "./AttachmentItem";
import { QuotedPreview } from "./QuotedPreview";
import { WaCarouselBubble } from "./WaCarouselBubble";
import { MessageStatusIcon } from "./MessageStatusIcon";

function getBubbleShapeClass(
  isOutgoing: boolean,
  groupPosition: MessageGroupPosition,
) {
  if (groupPosition === "single") {
    return isOutgoing
      ? "rounded-2xl rounded-br-md"
      : "rounded-2xl rounded-bl-md";
  }

  if (isOutgoing) {
    if (groupPosition === "first") return "rounded-2xl rounded-br-sm";
    if (groupPosition === "middle") {
      return "rounded-2xl rounded-tr-sm rounded-br-sm";
    }
    return "rounded-2xl rounded-tr-md rounded-br-sm";
  }

  if (groupPosition === "first") return "rounded-2xl rounded-bl-md";
  if (groupPosition === "middle") {
    return "rounded-2xl rounded-tl-md rounded-bl-md";
  }
  return "rounded-2xl rounded-tl-md rounded-bl-md";
}

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
  displayTime,
  groupPosition,
  isAiMessage,
  failedMessageCopy,
  animateIn,
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
  displayTime: string;
  groupPosition: MessageGroupPosition;
  isAiMessage: boolean;
  failedMessageCopy: string | null;
  animateIn?: boolean;
}) {
  const atts = msg.messageAttachments ?? msg.attachments ?? [];
  const images = atts.filter((a) => a.type === "image");
  const others = atts.filter((a) => a.type !== "image");
  const rawText = msg.text ?? "";
  const displayText = isExpanded ? rawText : rawText.slice(0, previewLength);
  const hasText = !!rawText.trim();
  const needsExpand = rawText.length > previewLength;
  const quoted = msg.metadata?.quotedMessage;
  const bubbleShapeClass = getBubbleShapeClass(isOutgoing, groupPosition);
  const bubbleEnterClass = animateIn
    ? `message-bubble-enter ${
        isOutgoing ? "message-bubble-enter--outgoing" : "message-bubble-enter--incoming"
      }`
    : "";
  const messageDirection = isOutgoing ? "outgoing" : "incoming";

  const defaultMetaTextClass = isOutgoing ? "text-white/75" : "text-gray-500";
  const defaultAiPillClass = isOutgoing
    ? "bg-white/15 text-white/85"
    : "bg-gray-200 text-gray-600";

  const renderText = (t: string) =>
    searchTerm ? highlightText(t, searchTerm) : t;

  const renderMeta = (
    className = "ml-2",
    textClassName = defaultMetaTextClass,
    statusIconClass: string | undefined = undefined,
    aiPillClass = defaultAiPillClass,
    statusVariant: "default" | "bubble" = isOutgoing ? "bubble" : "default",
  ) => (
    <span
      className={`${className} inline-flex items-center gap-1 whitespace-nowrap align-baseline text-[10px] leading-none ${textClassName}`}
    >
      {isAiMessage ? (
        <span
          className={`rounded-full px-1 py-0.5 text-[9px] font-semibold leading-none ${aiPillClass}`}
        >
          AI
        </span>
      ) : null}
      <span>{displayTime}</span>
      {isOutgoing && !failedMessageCopy ? (
        <MessageStatusIcon
          status={msg.status}
          className={statusIconClass}
          variant={statusVariant}
        />
      ) : null}
      {failedMessageCopy ? (
        <Tooltip content={failedMessageCopy} position="left">
          <span className="inline-flex cursor-help items-center">
            <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
          </span>
        </Tooltip>
      ) : null}
    </span>
  );



  const renderImageGrid = (imageAttachments: typeof images) => (
    <div
      className={`grid gap-0.5 ${imageAttachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
    >
      {imageAttachments.map((att, i) => (
        <a
          key={`${att.url}-${i}`}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden"
        >
          <img
            src={att.url}
            alt={att.name}
            className={`w-full object-cover ${imageAttachments.length === 1 ? "max-h-[200px]" : "max-h-[120px]"}`}
          />
        </a>
      ))}
    </div>
  );

  const expandBtn = (outgoing: boolean) =>
    needsExpand && (
      <div className={`mt-1 ${outgoing ? "text-[var(--color-primary-light)]" : "text-[var(--color-primary)]"}`}>
        <Button
          type="button"
          variant="inherit-ghost"
          size="xs"
          onClick={onToggleExpand}
          leftIcon={
            isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          }
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      </div>
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
      <div className={`relative max-w-[300px] overflow-visible ${bubbleEnterClass}`}>
        <div
          data-message-bubble="true"
          data-message-direction={messageDirection}
          className={`relative z-10 overflow-hidden bg-white shadow-sm ${bubbleShapeClass}`}
          style={{
            fontFamily: '-apple-system, "Segoe UI", sans-serif',
          }}
        >
        {header?.format === "IMAGE" && header.example?.header_handle?.[0] && (
          <img
            src={header.example.header_handle[0]}
            alt=""
            className="max-h-[170px] w-full object-cover"
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
              <TruncatedText
                as="p"
                text={header.text || "document.pdf"}
                maxLines={1}
                className="text-[11.5px] font-semibold text-[#303030]"
              />
              <p className="text-[10px] text-[#8a8a8a]">PDF - 1 page</p>
            </div>
          </div>
        )}
        {header?.format === "TEXT" && header.text && (
          <div className="px-3 pt-2.5 pb-0.5">
            <TruncatedText
              as="p"
              text={header.text}
              maxLines={2}
              className="text-[13px] font-bold text-[#303030] leading-snug"
            />
          </div>
        )}
        {!header?.format && header?.text && (
          <div className="px-3 pt-2.5 pb-0.5">
            <TruncatedText
              as="p"
              text={header.text}
              maxLines={2}
              className="text-[13px] font-bold text-[#303030] leading-snug"
            />
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
            <TruncatedText
              as="p"
              text={footer.text}
              maxLines={2}
              className="text-[10.5px] text-[#8a8a8a] leading-snug"
            />
          </div>
        )}

        <div className="flex justify-end px-3 pb-1.5 pt-0.5">
          {renderMeta(
            "ml-0",
            "text-[#8a8a8a]",
            msg.status !== "read" ? "text-[#8a8a8a]" : undefined,
            "bg-gray-100 text-gray-600",
            "default",
          )}
        </div>

        {buttons.length > 0 && (
          <div className="border-t border-[#e9edef]">
            {buttons.map((btn, i) => {
              const Icon = getWaTemplateButtonIcon(btn.type);

              return (
                <div
                  key={`${btn.type}-${btn.text}-${i}`}
                  className={`${i > 0 ? "border-t border-[#e9edef]" : ""} text-[var(--color-info)]`}
                >
                  <Button
                    type="button"
                    variant="inherit-ghost"
                    size="sm"
                    radius="none"
                    fullWidth
                    leftIcon={<Icon size={12} />}
                  >
                    <TruncatedText
                      as="span"
                      text={btn.text}
                      maxLines={1}
                      className="max-w-full"
                    />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    );
  }

  if (isEmail) {
    return (
      <div className={`relative max-w-full overflow-visible ${bubbleEnterClass}`}>
        <div
          data-message-bubble="true"
          data-message-direction={messageDirection}
          className={`relative z-10 overflow-hidden shadow-sm ${bubbleColor} ${bubbleShapeClass} max-w-full`}
        >
          {msg.metadata?.email?.subject && (
            <div
              className={`flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 border-b ${isOutgoing ? "border-white/10" : "border-gray-100"}`}
            >
              <Mail size={11} className="flex-shrink-0 opacity-50" />
              <TruncatedText
                as="span"
                text={msg.metadata.email.subject}
                maxLines={1}
                className={`max-w-[240px] text-xs font-semibold ${isOutgoing ? "text-white/90" : "text-gray-700"}`}
              />
            </div>
          )}
          {quoted && <QuotedPreview {...quoted} isOutgoing={isOutgoing} />}
          {hasText && (
            <div className="px-3 pt-2 pb-1">
              <p className="text-sm leading-snug whitespace-pre-wrap">
                {renderText(displayText)}
                {!isExpanded && needsExpand && "..."}
              </p>
              {expandBtn(isOutgoing)}
            </div>
          )}
          {atts.length > 0 && (
            <div className={hasText ? "border-t border-black/5 mt-1" : ""}>
              {images.length > 0 && renderImageGrid(images)}
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
          <div
            className={`flex items-center gap-1 px-2.5 pb-2 pt-1.5 ${isOutgoing ? "text-white/90" : "text-gray-600"}`}
          >
            <Button
              onClick={onOpenEmailModal}
              type="button"
              variant="inherit-ghost"
              size="xs"
              radius="full"
              iconOnly
              leftIcon={<Eye size={11} />}
              aria-label="View email"
            />
            <Button
              type="button"
              variant="inherit-ghost"
              size="xs"
              radius="full"
              iconOnly
              leftIcon={<Reply size={11} />}
              aria-label="Reply to email"
            />
            <span className="ml-auto">
              {renderMeta(
                "ml-0",
                isOutgoing ? "text-white/75" : "text-gray-500",
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative max-w-full overflow-visible ${bubbleEnterClass}`}>
      <div
        data-message-bubble="true"
        data-message-direction={messageDirection}
        className={`relative z-10 overflow-hidden shadow-sm ${bubbleColor} ${bubbleShapeClass} max-w-full`}
      >
        {quoted && <QuotedPreview {...quoted} isOutgoing={isOutgoing} />}
        {images.length > 0 && renderImageGrid(images)}
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
            className={`px-3 py-2 ${atts.length > 0 || quoted ? "border-t border-black/5" : ""}`}
          >
            <p className="text-sm leading-snug whitespace-pre-wrap">
              {renderText(displayText)}
              {!isExpanded && needsExpand && "..."}
              {renderMeta()}
            </p>
            {expandBtn(isOutgoing)}
          </div>
        )}
        {!hasText && (
          <div className="flex justify-end px-2.5 pb-1.5 pt-1">
            {renderMeta("ml-0")}
          </div>
        )}
      </div>
    </div>
  );
}
