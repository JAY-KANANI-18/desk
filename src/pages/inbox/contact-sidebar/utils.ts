import type { LifecycleStage } from '../../workspace/types';
import type { SidebarContact, WorkspaceUserLike } from './types';

export const CHANNEL_META: Record<string, { icon: string; label: string }> = {
  whatsapp: { icon: 'https://cdn.simpleicons.org/whatsapp', label: 'WhatsApp' },
  email: { icon: 'https://cdn.simpleicons.org/maildotru', label: 'Email' },
  webchat: { icon: 'https://cdn.simpleicons.org/googlechat', label: 'Web Chat' },
  instagram: { icon: 'https://cdn.simpleicons.org/instagram', label: 'Instagram' },
  twitter: { icon: 'https://cdn.simpleicons.org/x', label: 'X' },
  messenger: { icon: 'https://cdn.simpleicons.org/messenger', label: 'Messenger' },
  facebook: { icon: 'https://cdn.simpleicons.org/meta', label: 'Facebook' },
  gmail: { icon: 'https://cdn.simpleicons.org/gmail', label: 'Gmail' },
};

export function contactName(contact?: Partial<SidebarContact> | null) {
  return [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || 'Unnamed';
}

export function conflictFromReasons(reasons: string[]) {
  if (reasons.includes('exact_email')) return 'email';
  if (reasons.includes('exact_phone')) return 'phone';
  return 'email';
}

export function workspaceUserLabel(user?: WorkspaceUserLike | null) {
  if (!user) return 'Unassigned';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || 'Assigned';
}

export function resolveAssigneeLabel(contact?: SidebarContact | null, workspaceUsers?: WorkspaceUserLike[] | null) {
  if ((contact as any)?.assignee?.firstName || (contact as any)?.assignee?.lastName) {
    return contactName((contact as any).assignee);
  }

  const workspaceAssignee =
    contact?.assigneeId && workspaceUsers?.length
      ? workspaceUsers.find((user) => String(user.id) === String(contact.assigneeId))
      : null;

  return workspaceAssignee ? workspaceUserLabel(workspaceAssignee) : contact?.assigneeId ? 'Assigned' : 'Unassigned';
}

export function resolveLifecycleLabel(contact?: SidebarContact | null, stages: LifecycleStage[] = []) {
  const matchedStage = contact?.lifecycleId != null
    ? stages.find((stage) => String(stage.id) === String(contact.lifecycleId))
    : null;

  if (matchedStage) {
    return [matchedStage.emoji, matchedStage.name].filter(Boolean).join(' ');
  }

  if (typeof contact?.lifecycle === 'object' && contact.lifecycle?.name) {
    return [contact.lifecycle.emoji, contact.lifecycle.name].filter(Boolean).join(' ');
  }

  if (typeof contact?.lifecycle === 'string' && contact.lifecycle.trim()) {
    return contact.lifecycle;
  }

  return contact?.lifecycleStage || (contact?.lifecycleId ? 'Selected lifecycle' : 'No lifecycle');
}
