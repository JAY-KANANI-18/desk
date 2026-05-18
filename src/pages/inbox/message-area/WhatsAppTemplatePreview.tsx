import { type CSSProperties, useMemo } from "react";

import {
  ArrowLeft,
  Camera,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Smile,
  Video,
} from "@/components/ui/icons";

import { MessageBubble } from "./MessageBubble";
import type {
  Message,
  WaTemplateButtonType,
  WaTemplateComponent,
} from "./types";

export type WhatsAppTemplatePreviewComponentInput = {
  type?: string;
  format?: string;
  text?: string;
  example?: {
    header_handle?: string[];
  };
  buttons?: Array<{
    type?: string;
    text?: string;
  }>;
  cards?: Array<{
    components?: WhatsAppTemplatePreviewComponentInput[];
  }>;
};

export type WhatsAppTemplatePreviewButtonInput = {
  type?: string;
  text?: string;
};

function getSampleVariableValue(key: string) {
  const normalized = key.toLowerCase();

  if (key === "1" || normalized.includes("name")) return "jay";
  if (key === "2" || normalized.includes("company")) return "Axora";
  if (key === "3" || normalized.includes("date")) return "today";
  if (normalized.includes("code")) return "code";

  return key.replace(/_/g, " ");
}

export function getWhatsAppTemplateSampleValues(variableKeys: string[]) {
  return Object.fromEntries(
    variableKeys.map((key) => [key, getSampleVariableValue(key)]),
  );
}

function replaceTemplateVariables(
  text: string | undefined,
  values: Record<string, string>,
) {
  return text?.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => values[key] ?? `{{${key}}}`,
  );
}

function normalizeButtonType(type?: string): WaTemplateButtonType {
  const normalized = type?.toUpperCase();

  if (normalized === "URL" || normalized === "PHONE_NUMBER") {
    return normalized;
  }

  return "QUICK_REPLY";
}

function normalizeComponentType(
  type?: string,
): WaTemplateComponent["type"] | null {
  const normalized = type?.toUpperCase();

  if (
    normalized === "HEADER" ||
    normalized === "BODY" ||
    normalized === "FOOTER" ||
    normalized === "BUTTONS" ||
    normalized === "CAROUSEL"
  ) {
    return normalized;
  }

  return null;
}

function normalizeComponentFormat(
  format?: string,
): WaTemplateComponent["format"] | undefined {
  const normalized = format?.toUpperCase();

  if (
    normalized === "IMAGE" ||
    normalized === "VIDEO" ||
    normalized === "DOCUMENT" ||
    normalized === "TEXT"
  ) {
    return normalized;
  }

  return undefined;
}

export function normalizeWhatsAppTemplateComponents(
  components: WhatsAppTemplatePreviewComponentInput[] | undefined,
  values: Record<string, string> = {},
): WaTemplateComponent[] {
  return (components ?? []).flatMap((component) => {
    const type = normalizeComponentType(component.type);
    if (!type) return [];

    const normalized: WaTemplateComponent = { type };
    const format = normalizeComponentFormat(component.format);

    if (format) {
      normalized.format = format;
    }

    const text = replaceTemplateVariables(component.text, values);
    if (text !== undefined) {
      normalized.text = text;
    }

    if (component.example?.header_handle) {
      normalized.example = {
        header_handle: component.example.header_handle,
      };
    }

    if (component.buttons?.length) {
      normalized.buttons = component.buttons.map((button) => ({
        type: normalizeButtonType(button.type),
        text:
          replaceTemplateVariables(button.text || "Button", values) ?? "Button",
      }));
    }

    if (component.cards?.length) {
      normalized.cards = component.cards.map((card) => ({
        components: normalizeWhatsAppTemplateComponents(card.components, values),
      }));
    }

    return [normalized];
  });
}

export function buildWhatsAppTemplatePreviewComponents({
  header,
  body,
  footer,
  buttons,
}: {
  header?: string;
  body: string;
  footer?: string;
  buttons?: WhatsAppTemplatePreviewButtonInput[];
}): WaTemplateComponent[] {
  const components: WaTemplateComponent[] = [];

  if (header) {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: header,
    });
  }

  components.push({
    type: "BODY",
    text: body || "No body text configured.",
  });

  if (footer) {
    components.push({
      type: "FOOTER",
      text: footer,
    });
  }

  if (buttons?.length) {
    components.push({
      type: "BUTTONS",
      buttons: buttons.map((button) => ({
        type: normalizeButtonType(button.type),
        text: button.text || "Button",
      })),
    });
  }

  return components;
}

function buildTemplateMessage(
  components: WaTemplateComponent[],
  syncedAt?: string,
): Message {
  const body = components.find((component) => component.type === "BODY");

  return {
    id: 0,
    conversationId: "template-preview",
    channelId: "whatsapp-template-preview",
    type: "template",
    text: body?.text ?? "",
    initials: "",
    time: "",
    createdAt: syncedAt ?? new Date().toISOString(),
    channelType: "whatsapp",
    status: "read",
    direction: "incoming",
    metadata: {
      template: {
        components,
      },
    },
  };
}

const chatWindowBackdropStyle: CSSProperties = {
  backgroundColor: "#e9dfd3",
  backgroundImage:
    "linear-gradient(rgba(31, 41, 55, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(31, 41, 55, 0.045) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

export function WhatsAppTemplateMessageWindow({
  components,
  syncedAt,
  className = "",
  contentClassName = "px-6 py-4",
  previewScale = 1,
  variant = "plain",
  showMeta = false,
  displayTime = "",
  isOutgoing = false,
  templateMaxWidthClassName,
}: {
  components: WaTemplateComponent[];
  syncedAt?: string;
  className?: string;
  contentClassName?: string;
  previewScale?: number;
  variant?: "plain" | "chat";
  showMeta?: boolean;
  displayTime?: string;
  isOutgoing?: boolean;
  templateMaxWidthClassName?: string;
}) {
  const message = useMemo(
    () => buildTemplateMessage(components, syncedAt),
    [components, syncedAt],
  );
  const previewStyle: CSSProperties | undefined =
    previewScale === 1
      ? undefined
      : {
          transform: `scale(${previewScale})`,
          transformOrigin: "top left",
          width: `${100 / previewScale}%`,
        };
  const resolvedTemplateMaxWidthClassName =
    templateMaxWidthClassName ?? (variant === "chat" ? "w-full max-w-[480px]" : "max-w-[300px]");

  const previewBubble = (
    <div style={previewStyle}>
      <MessageBubble
        msg={message}
        isOutgoing={isOutgoing}
        bubbleColor="bg-white text-gray-900"
        isEmail={false}
        isWaTemplate
        isExpanded
        onToggleExpand={() => undefined}
        onOpenEmailModal={() => undefined}
        previewLength={1000}
        displayTime={displayTime}
        groupPosition="single"
        isAiMessage={false}
        failedMessageCopy={null}
        hideMeta={!showMeta}
        templateMaxWidthClassName={resolvedTemplateMaxWidthClassName}
      />
    </div>
  );

  if (variant === "chat") {
    return (
      <div className={`flex min-h-0 w-full items-start justify-center overflow-y-auto ${className}`}>
        <div className="relative h-[min(500px,calc(100vh-13rem))] min-h-[430px] w-full max-w-[390px] overflow-hidden">
          <div className="pointer-events-none absolute bottom-1 left-1/2 h-9 w-[82%] -translate-x-1/2 rounded-full bg-black/[0.10] blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-4 w-[72%] -translate-x-1/2 rounded-full bg-black/[0.08] blur-md" />
          <div
            className="absolute left-1/2 top-0 flex aspect-[9/16] -translate-x-1/2 overflow-hidden bg-[#202020] p-2 shadow-[0_14px_34px_rgba(0,0,0,0.16)] ring-1 ring-black/15 !rounded-[2.25rem]"
            style={{ height: "min(560px, calc((100vw - 3rem) * 16 / 9))" }}
          >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#e9dfd3] !rounded-[1.75rem]">
          <div className="relative h-[88px] shrink-0 overflow-hidden bg-[#0f8f7e] text-white">
            <div className="absolute inset-x-0 top-0 z-20 h-9">
              <span className="absolute left-7 top-[14px] text-[11px] font-semibold leading-none drop-shadow-sm">
                11:11
              </span>
              <div className="absolute left-1/2 top-[7px] flex h-6 w-[92px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-1.5 shadow-[0_1px_2px_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <span className="h-3 w-3 rounded-full bg-[#111] ring-1 ring-white/5 shadow-[inset_0_0_4px_rgba(80,120,255,0.3)]" />
              </div>
              <div className="absolute right-6 top-[11px] flex items-center gap-1.5">
                <span className="flex h-3.5 items-end gap-0.5" aria-hidden="true">
                  <span className="h-1.5 w-0.5 rounded-full bg-white" />
                  <span className="h-2 w-0.5 rounded-full bg-white" />
                  <span className="h-2.5 w-0.5 rounded-full bg-white" />
                  <span className="h-3.5 w-0.5 rounded-full bg-white" />
                </span>
                
                <span className="relative h-3 w-[22px] rounded-[3px] border border-white" aria-hidden="true">
                  <span className="absolute bottom-0.5 left-0.5 top-0.5 w-4 rounded-[2px] bg-white" />
                  <span className="absolute -right-1 top-1/2 h-1.5 w-0.5 -translate-y-1/2 rounded-r bg-white" />
                </span>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex h-[52px] items-center justify-between px-4">
              <div className="flex min-w-0 items-center gap-3">
                <ArrowLeft size={18} className="shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">WhatsApp</p>
                  <p className="text-[11px] font-semibold uppercase leading-tight text-white/85">online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Phone size={16} />
                <MoreVertical size={17} />
              </div>
            </div>
          </div>
          <div
            className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${contentClassName} [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar-track]:bg-transparent`}
            style={chatWindowBackdropStyle}
          >
            {previewBubble}
          </div>
          <div className="shrink-0 border-t border-black/5 bg-[#efe7dc]/95 px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-400 shadow-sm">
                <Smile size={17} className="shrink-0" />
                <span className="truncate text-xs">Type a message...</span>
                <Paperclip size={16} className="ml-auto shrink-0 text-slate-500" />
                <Camera size={16} className="shrink-0 text-slate-500" />
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f8f7e] text-white shadow-sm">
                <Mic size={18} />
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-0 overflow-hidden bg-[#dce1e7] ${className}`}>
      <div className={`h-full overflow-x-hidden overflow-y-auto ${contentClassName} [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 [&::-webkit-scrollbar-track]:bg-transparent`}>
        {previewBubble}
      </div>
    </div>
  );
}
