import {
  AlertTriangle,
  ArrowRight,
  GitMerge,
  Mail,
  Phone,
  User,
} from "@/components/ui/icons";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { CenterModal } from "../../components/ui/Modal";
import { getChannelMetadata } from "../../config/channelMetadata";

export type ChannelIdentityConflictContact = {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  avatarUrl?: string | null;
};

export type ChannelIdentityConflictDetails = {
  channelType?: string | null;
  channelLabel?: string | null;
  identifier?: string | null;
  identifierField?: string | null;
  message?: string | null;
  currentContact?: ChannelIdentityConflictContact | null;
  existingContact?: ChannelIdentityConflictContact | null;
  existingContactName?: string | null;
};

interface ChannelIdentityConflictModalProps {
  conflict: ChannelIdentityConflictDetails | null;
  onClose: () => void;
  onReviewMerge: () => void;
  mergePreviewLoading?: boolean;
  mergeError?: string | null;
  canMerge?: boolean;
}

function contactName(contact?: ChannelIdentityConflictContact | null, fallback = "Unnamed contact") {
  const fullName = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ").trim();
  return fullName || contact?.company || contact?.email || contact?.phone || fallback;
}

function fieldValue(contact: ChannelIdentityConflictContact | null | undefined, field: string) {
  if (field === "email") return contact?.email || "No email saved";
  if (field === "phone") return contact?.phone || "No phone saved";
  return contact?.phone || contact?.email || "Not saved";
}

function ContactCard({
  contact,
  label,
  field,
  highlighted,
}: {
  contact?: ChannelIdentityConflictContact | null;
  label: string;
  field: string;
  highlighted?: boolean;
}) {
  const name = contactName(contact);
  const FieldIcon = field === "email" ? Mail : Phone;

  return (
    <div
      className={`min-w-0 rounded-lg border bg-white p-4 ${
        highlighted ? "border-amber-300 shadow-sm" : "border-[var(--color-gray-200)]"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <Avatar
          src={contact?.avatarUrl ?? undefined}
          name={name}
          size="base"
          fallbackTone={highlighted ? "primary" : "neutral"}
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase text-[var(--color-gray-500)]">
            {label}
          </p>
          <p className="truncate text-[15px] font-semibold text-[var(--color-gray-950)]">
            {name}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex min-w-0 items-center gap-2 rounded-md bg-[var(--color-gray-50)] px-3 py-2">
          <FieldIcon size={14} className={highlighted ? "text-amber-600" : "text-[var(--color-gray-500)]"} />
          <span className="min-w-0 truncate font-medium text-[var(--color-gray-900)]">
            {fieldValue(contact, field)}
          </span>
        </div>
        {contact?.company ? (
          <div className="flex min-w-0 items-center gap-2 px-3 text-xs text-[var(--color-gray-500)]">
            <User size={12} />
            <span className="truncate">{contact.company}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ChannelIdentityConflictModal({
  conflict,
  onClose,
  onReviewMerge,
  mergePreviewLoading,
  mergeError,
  canMerge = true,
}: ChannelIdentityConflictModalProps) {
  const channelMeta = getChannelMetadata(conflict?.channelType);
  const field = conflict?.identifierField === "email" ? "email" : "phone";
  const fieldLabel = field === "email" ? "Email address" : "Phone number";
  const fieldArticle = field === "email" ? "This email address" : "This phone number";
  const channelLabel = channelMeta?.label ?? conflict?.channelLabel ?? "selected channel";
  const identifier = conflict?.identifier?.trim() || fieldValue(conflict?.existingContact, field);

  return (
    <CenterModal
      isOpen={Boolean(conflict)}
      onClose={onClose}
      title="Merge contacts to send"
      subtitle={`${fieldArticle} is already linked to another contact.`}
      headerIcon={<AlertTriangle size={18} className="text-amber-500" />}
      size="lg"
      width="min(720px, calc(100vw - 32px))"
      bodyPadding="none"
      closeOnOverlayClick={false}
      footerMeta={
        <p className="text-xs text-[var(--color-gray-500)]">
          Message sending is blocked for this channel to this contact until these contacts are merged.
        </p>
      }
      secondaryAction={
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          type="button"
          onClick={onReviewMerge}
          disabled={!canMerge}
          loading={mergePreviewLoading}
          leftIcon={<GitMerge size={14} />}
          loadingMode="inline"
        >
          Review and merge
        </Button>
      }
    >
      <div className="h-full min-h-0 overflow-y-auto bg-[var(--color-gray-50)] px-4 py-4 pb-6 sm:px-6 sm:py-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-amber-600">
              {channelMeta?.icon ? (
                <img src={channelMeta.icon} alt={channelLabel} className="h-4 w-4" />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {fieldLabel}: <span className="break-all">{identifier}</span>
              </p>
              <p className="mt-1 text-sm leading-5 text-amber-800">
                Merge these contacts here so sending, replies, and past history stay in one conversation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] sm:items-stretch">
          <ContactCard
            contact={conflict?.currentContact}
            label="Current conversation"
            field={field}
          />
          <div className="hidden items-center justify-center text-[var(--color-gray-400)] sm:flex">
            <ArrowRight size={18} />
          </div>
          <ContactCard
            contact={conflict?.existingContact ?? {
              firstName: conflict?.existingContactName ?? undefined,
              [field]: identifier,
            }}
            label={`Already owns this ${field === "email" ? "email" : "number"}`}
            field={field}
            highlighted
          />
        </div>

        <div className="mt-5 rounded-lg border border-[var(--color-gray-200)] bg-white px-4 py-3">
          <p className="text-sm font-semibold text-[var(--color-gray-950)]">
            What happens after merge
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--color-gray-600)]">
            The linked contact, channel, conversations, and history will move into the current contact. Then choose {channelLabel} and send again.
          </p>
        </div>

        {mergeError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mergeError}
          </div>
        ) : null}
      </div>
    </CenterModal>
  );
}
