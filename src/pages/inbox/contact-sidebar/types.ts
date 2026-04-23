export type SidebarConversation = {
  id: number | string;
  [key: string]: unknown;
};

export type SidebarContact = {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  lifecycleStage?: string | null;
  lifecycleId?: string | number | null;
  lifecycle?: string | { id?: string | number; name?: string; emoji?: string } | null;
  tags?: string[];
  tagIds?: string[];
  avatarUrl?: string | null;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  status?: string | null;
  contactChannels?: Array<{
    id?: string | number;
    channelId?: string | number;
    channelType?: string;
    identifier?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  }>;
  mergedIntoContactId?: string | null;
  mergedIntoContact?: Partial<SidebarContact> | null;
  marketingOptOut?: boolean;
  [key: string]: unknown;
};

export type WorkspaceUserLike = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  activityStatus?: string;
};

export type WorkspaceTag = {
  id: string;
  name: string;
  color?: string | null;
  emoji?: string | null;
  description?: string | null;
  bundle?: {
    color?: string | null;
    emoji?: string | null;
    description?: string | null;
  };
  _count?: { contacts: number };
};
