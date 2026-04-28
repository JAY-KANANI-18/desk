type WebsiteChatAppearanceConfig = {
  agentName?: string | null;
  operatorName?: string | null;
  primaryColor?: string | null;
  welcomeMessage?: string | null;
};

type WebsiteChatConfig = WebsiteChatAppearanceConfig & {
  appearance?: WebsiteChatAppearanceConfig | null;
  widgetToken?: string | null;
};

export type WebsiteChatEmbedChannel = {
  identifier?: string | null;
  config?: WebsiteChatConfig | null;
};

type WebsiteChatEmbedOverrides = {
  agentName?: string;
  primaryColor?: string;
  welcomeMessage?: string;
};

const DEFAULT_PRIMARY_COLOR = "#6366f1";
const DEFAULT_AGENT_NAME = "Support";
const DEFAULT_WELCOME_MESSAGE = "Hi! How can we help?";

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const stripTrailingSlash = (value: string) => value.replace(/\/$/, "");

const getWebchatServerUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const serverUrl = socketUrl || apiUrl?.replace(/\/api\/?$/, "") || "http://localhost:3000";

  return stripTrailingSlash(serverUrl.replace(/\/api\/?$/, ""));
};

const getWidgetScriptUrl = () => {
  if (typeof window === "undefined") {
    return "/widget.js";
  }

  return `${stripTrailingSlash(window.location.origin)}/widget.js`;
};

export const getWebsiteChatAppearance = (
  channel: WebsiteChatEmbedChannel,
): WebsiteChatAppearanceConfig => {
  const config = channel.config ?? {};

  return config.appearance ?? config;
};

export const buildWebsiteChatEmbedCode = (
  channel: WebsiteChatEmbedChannel,
  overrides: WebsiteChatEmbedOverrides = {},
) => {
  const config = channel.config ?? {};
  const appearance = getWebsiteChatAppearance(channel);
  const token = channel.identifier || config.widgetToken || "";
  const primaryColor =
    overrides.primaryColor || appearance.primaryColor || DEFAULT_PRIMARY_COLOR;
  const agentName =
    overrides.agentName ||
    appearance.agentName ||
    appearance.operatorName ||
    DEFAULT_AGENT_NAME;
  const welcomeMessage =
    overrides.welcomeMessage ||
    appearance.welcomeMessage ||
    DEFAULT_WELCOME_MESSAGE;

  return `<script
  src="${escapeHtmlAttribute(getWidgetScriptUrl())}"
  data-token="${escapeHtmlAttribute(token)}"
  data-url="${escapeHtmlAttribute(getWebchatServerUrl())}"
  data-color="${escapeHtmlAttribute(primaryColor)}"
  data-title="${escapeHtmlAttribute(agentName)}"
  data-welcome="${escapeHtmlAttribute(welcomeMessage)}"
  async
></script>`;
};
