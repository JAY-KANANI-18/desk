import type { Message, ReplyContext } from "./types";

function ensureReplySubject(subject?: string | null) {
  const clean = subject?.trim();
  if (!clean) return "Re:";
  return /^Re:/i.test(clean) ? clean : `Re: ${clean}`;
}

function getEmailMeta(msg: Message) {
  return msg.metadata?.email ?? {};
}

export function buildEmailReplyContext(msg: Message): ReplyContext {
  const email = getEmailMeta(msg);
  const messageId = email.messageId ?? msg.metadata?.messageId;
  const references = email.references ?? msg.metadata?.references;
  const to =
    msg.direction === "incoming"
      ? email.from ?? msg.metadata?.from ?? ""
      : email.to ?? msg.metadata?.to ?? "";

  return {
    type: "email",
    emailReply: {
      to,
      subject: ensureReplySubject(email.subject ?? msg.subject),
      threadId: email.threadId,
      messageId,
      inReplyTo: messageId,
      references: [references, messageId].filter(Boolean).join(" ").trim() || undefined,
      cc: email.cc ?? msg.metadata?.cc,
    },
  };
}
