import React from "react";
import DOMPurify from "dompurify";
import { X } from "lucide-react";
import type { Message } from "./types";

export function MessageAreaEmailModal({
  message,
  onClose,
}: {
  message: Message | null;
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-[750px] max-h-[80vh] rounded-xl shadow-xl flex flex-col">
        <div className="border-b px-5 py-3.5 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">
              {message.metadata?.email?.subject ?? "Email"}
            </p>
            {message.metadata?.email?.from && (
              <p className="text-xs text-gray-500 mt-0.5">
                From: {message.metadata.email.from}
              </p>
            )}
            {message.metadata?.email?.to && (
              <p className="text-xs text-gray-500">
                To: {message.metadata.email.to}
                {message.metadata.email.cc &&
                  `, CC: ${message.metadata.email.cc}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {message.metadata?.email?.htmlBody ? (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(message.metadata.email.htmlBody),
              }}
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
