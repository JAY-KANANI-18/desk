export type EmailSecurityMode = 'SSL/TLS' | 'STARTTLS' | 'None';

export interface NormalizedEmailChannelConfig {
  channelName: string;
  emailAddress: string;
  displayName: string;
  username: string;
  password: string;
  smtpServer: string;
  smtpPort: number;
  encryption: EmailSecurityMode;
  forwardingEmail: string;
  forwardingConfirmed: boolean;
  signatureHtml: string;
  signatureEnabled: boolean;
}

export interface EmailChannelFormValues {
  channelName: string;
  emailAddress: string;
  displayName: string;
  username: string;
  password: string;
  smtpServer: string;
  smtpPort: string;
  encryption: EmailSecurityMode;
  forwardingEmail: string;
  forwardingConfirmed: boolean;
  signatureHtml: string;
  signatureEnabled: boolean;
}

const DEFAULT_SIGNATURE = '<p>Regards,<br />{{agent_name}}</p>';

export function normalizeEmailChannelConfig(channel: any): NormalizedEmailChannelConfig {
  const cfg = channel?.config ?? {};
  const credentials = channel?.credentials ?? {};

  const emailAddress = String(
    cfg.emailaddress ??
      cfg.fromEmail ??
      cfg.smtpUser ??
      cfg.userId ??
      credentials.smtpUser ??
      channel?.identifier ??
      '',
  );

  const displayName = String(cfg.displayname ?? cfg.fromName ?? channel?.name ?? '');
  const smtpServer = String(cfg.smtpserver ?? cfg.smtpHost ?? '');
  const smtpPort = Number(cfg.smtpport ?? cfg.smtpPort ?? 587);
  const encryption = normalizeEmailEncryption(cfg.encryption ?? cfg.smtpSecure);
  const forwardingEmail = String(
    cfg.forwardingEmail ??
      deriveWorkspaceForwardingEmail(channel?.workspaceId) ??
      channel?.identifier ??
      '',
  );
  const forwardingConfirmed = Boolean(cfg.forwardingConfirmed ?? cfg.forwardingEnabled ?? false);
  const signatureHtml = String(cfg.signatureHtml ?? cfg.signature ?? DEFAULT_SIGNATURE);
  const signatureEnabled = cfg.signatureEnabled !== false;

  return {
    channelName: String(channel?.name ?? displayName ?? emailAddress ?? 'Email'),
    emailAddress,
    displayName,
    username: String(cfg.userId ?? cfg.smtpUser ?? emailAddress),
    password: String(cfg.password ?? cfg.smtpPass ?? credentials.smtpPass ?? ''),
    smtpServer,
    smtpPort: Number.isFinite(smtpPort) && smtpPort > 0 ? smtpPort : 587,
    encryption,
    forwardingEmail,
    forwardingConfirmed,
    signatureHtml,
    signatureEnabled,
  };
}

export function buildEmailChannelFormValues(channel: any): EmailChannelFormValues {
  const normalized = normalizeEmailChannelConfig(channel);
  return {
    ...normalized,
    smtpPort: String(normalized.smtpPort || 587),
  };
}

export function buildEmailChannelPayload(values: EmailChannelFormValues) {
  const smtpPort = Number(values.smtpPort || 587);
  const username = values.username.trim() || values.emailAddress.trim();

  return {
    name: values.channelName.trim() || values.displayName.trim() || values.emailAddress.trim() || 'Email',
    displayname: values.displayName.trim(),
    emailaddress: values.emailAddress.trim(),
    userId: username,
    password: values.password,
    smtpserver: values.smtpServer.trim(),
    smtpport: Number.isFinite(smtpPort) ? smtpPort : 587,
    encryption: values.encryption,
    smtpHost: values.smtpServer.trim(),
    smtpPort: Number.isFinite(smtpPort) ? smtpPort : 587,
    smtpUser: username,
    smtpPass: values.password,
    fromEmail: values.emailAddress.trim(),
    fromName: values.displayName.trim(),
    forwardingConfirmed: values.forwardingConfirmed,
    signatureHtml: values.signatureHtml,
    signatureEnabled: values.signatureEnabled,
  };
}

export function deriveWorkspaceForwardingEmail(workspaceId?: string | number | null) {
  const normalized = String(workspaceId ?? '').trim();
  if (!normalized) return '';
  return `support-${normalized}@inbound.yourapp.com`;
}

export function normalizeEmailEncryption(value: unknown): EmailSecurityMode {
  const mode = String(value ?? '').toLowerCase();
  if (mode === 'ssl' || mode === 'ssl/tls') return 'SSL/TLS';
  if (mode === 'tls' || mode === 'starttls') return 'STARTTLS';
  return 'None';
}
