import DOMPurify from "dompurify";
import { CenterModal } from "../../../components/ui/Modal";
import type { Message } from "./types";

const LINKABLE_URL = /\bhttps?:\/\/[^\s<>"']+/gi;
const TEXT_NODE_SKIP_PARENTS = new Set(["A", "SCRIPT", "STYLE", "TEXTAREA"]);

interface MessageAreaEmailModalProps {
  message: Message | null;
  onClose: () => void;
}

function stripTrailingUrlPunctuation(url: string) {
  const trailing = url.match(/[),.;!?]+$/)?.[0] ?? "";
  return {
    href: trailing ? url.slice(0, -trailing.length) : url,
    trailing,
  };
}

function linkifyTextNodes(root: HTMLElement) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || TEXT_NODE_SKIP_PARENTS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      LINKABLE_URL.lastIndex = 0;
      return LINKABLE_URL.test(node.nodeValue ?? "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    const text = node.nodeValue ?? "";
    const fragment = doc.createDocumentFragment();
    let cursor = 0;

    text.replace(LINKABLE_URL, (match, offset: number) => {
      if (offset > cursor) {
        fragment.appendChild(doc.createTextNode(text.slice(cursor, offset)));
      }

      const { href, trailing } = stripTrailingUrlPunctuation(match);
      const link = doc.createElement("a");
      link.href = href;
      link.textContent = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      fragment.appendChild(link);
      if (trailing) fragment.appendChild(doc.createTextNode(trailing));
      cursor = offset + match.length;
      return match;
    });

    if (cursor < text.length) {
      fragment.appendChild(doc.createTextNode(text.slice(cursor)));
    }

    node.replaceWith(fragment);
  });
}

function prepareEmailHtml(html: string) {
  const sanitized = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel"],
  });
  const doc = new DOMParser().parseFromString(
    `<div data-email-root="true">${sanitized}</div>`,
    "text/html",
  );
  const root = doc.querySelector<HTMLElement>("[data-email-root]");
  if (!root) return sanitized;

  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
  linkifyTextNodes(root);

  return root.innerHTML;
}

export function MessageAreaEmailModal({
  message,
  onClose,
}: MessageAreaEmailModalProps) {
  if (!message) return null;

  const email = {
    subject: message.metadata?.email?.subject ?? message.subject,
    htmlBody: message.metadata?.email?.htmlBody ?? message.metadata?.htmlBody,
    from: message.metadata?.email?.from ?? message.metadata?.from,
    to: message.metadata?.email?.to ?? message.metadata?.to,
    cc: message.metadata?.email?.cc ?? message.metadata?.cc,
  };
  const htmlBody = email.htmlBody ? prepareEmailHtml(email.htmlBody) : "";
  const metaRows = [
    { label: "From", value: email?.from },
    { label: "To", value: email?.to },
    { label: "CC", value: email?.cc },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <CenterModal
      isOpen={Boolean(message)}
      onClose={onClose}
      title={email?.subject ?? "Email"}
      subtitle={email?.from ? `From: ${email.from}` : undefined}
      size="lg"
      width={750}
      bodyPadding="none"
    >
      <div className="flex h-full max-h-full flex-col">
        {metaRows.length > 0 ? (
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <div className="space-y-2">
              {metaRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-2"
                >
                  <span className="w-10 shrink-0 text-xs font-medium text-gray-500">
                    {row.label}:
                  </span>
                  <span className="min-w-0 break-words text-sm text-gray-700">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {htmlBody ? (
            <div
              className="email-message-body min-w-0"
              dangerouslySetInnerHTML={{
                __html: htmlBody,
              }}
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {message.text ?? ""}
            </p>
          )}
        </div>
      </div>
    </CenterModal>
  );
}
