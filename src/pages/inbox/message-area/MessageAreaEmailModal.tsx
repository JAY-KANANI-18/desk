import DOMPurify from "dompurify";
import { CenterModal } from "../../../components/ui/Modal";
import type { Message } from "./types";

interface MessageAreaEmailModalProps {
  message: Message | null;
  onClose: () => void;
}

export function MessageAreaEmailModal({
  message,
  onClose,
}: MessageAreaEmailModalProps) {
  if (!message) return null;

  const email = message.metadata?.email;
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
          {email?.htmlBody ? (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(email.htmlBody),
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
