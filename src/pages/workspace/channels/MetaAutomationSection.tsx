import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ImageIcon,
  Info,
  Instagram as InstagramIcon,
  Loader,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from '@/components/ui/icons';
import { Button } from '../../../components/ui/button/Button';
import { IconButton } from '../../../components/ui/button/IconButton';
import { CountBadge } from '../../../components/ui/CountBadge';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { MobileSheet } from '../../../components/ui/modal';
import { ButtonSelectMenu } from '../../../components/ui/select/ButtonSelectMenu';
import {
  CompactSelectMenu,
  type CompactSelectMenuGroup,
} from '../../../components/ui/select/CompactSelectMenu';
import { Tag } from '../../../components/ui/tag/Tag';
import { TruncatedText } from '../../../components/ui/truncated-text';
import { ToggleSwitch } from '../../../components/ui/toggle/ToggleSwitch';
import { ChannelApi } from '../../../lib/channelApi';
import type {
  AutomationTarget,
  EngagementActivityEvent,
  EngagementActivityPost,
  EngagementActivitySummary,
  PrivateReplyPostMessage,
  PrivateRepliesConfig,
  StoryRepliesConfig,
} from '../../../lib/channelApi';
import { useSocket } from '../../../socket/socket-provider';
import {
  ConnectedChannel,
  SaveButton,
  useSave,
} from '../../channels/ManageChannelPage';

type AutomationMode = 'private_replies' | 'story_replies';
type AutomationPanel = 'settings' | 'engagement_activity';
type PrivateReplyScope = PrivateRepliesConfig['scope'];

const SELECTED_POST_HIGHLIGHT_MS = 2600;

const emptyPrivateReplies: PrivateRepliesConfig = {
  enabled: false,
  scope: 'all',
  selectedPostIds: [],
  message: '',
  postMessages: [],
};

const emptyStoryReplies: StoryRepliesConfig = {
  enabled: false,
  message: '',
};

const privateReplyScopeGroups: CompactSelectMenuGroup[] = [
  {
    options: [
      {
        value: 'all',
        label: 'All posts and reels',
        description: 'Send the same DM for every new comment.',
      },
      {
        value: 'selected',
        label: 'Only selected posts',
        description: 'Choose posts and write a custom DM for each one.',
      },
    ],
  },
];

function toNonNegativeCount(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.floor(numeric);
}

function normalizePrivateRepliesConfig(
  config?: Partial<PrivateRepliesConfig> | null,
): PrivateRepliesConfig {
  const selectedPostIds = Array.isArray(config?.selectedPostIds)
    ? config.selectedPostIds.filter(Boolean)
    : [];
  const seen = new Set<string>();
  const postMessages = (
    Array.isArray(config?.postMessages) && config.postMessages.length > 0
      ? config.postMessages
      : selectedPostIds.map((postId) => ({
          postId,
          message: config?.message ?? '',
          target: null,
          updatedAt: config?.updatedAt ?? null,
          commentsReceived: 0,
          automatedRepliesSent: 0,
        }))
  ).reduce<PrivateReplyPostMessage[]>((items, item) => {
    const postId = String(item.postId ?? '').trim();
    if (!postId || seen.has(postId)) return items;
    seen.add(postId);
    items.push({
      postId,
      message: String(item.message ?? ''),
      target: item.target ?? null,
      updatedAt: item.updatedAt ?? null,
      commentsReceived: toNonNegativeCount(item.commentsReceived),
      automatedRepliesSent: toNonNegativeCount(item.automatedRepliesSent),
    });
    return items;
  }, []);

  return {
    enabled: Boolean(config?.enabled),
    scope: config?.scope === 'selected' ? 'selected' : 'all',
    selectedPostIds: postMessages.map((item) => item.postId),
    message: String(config?.message ?? ''),
    postMessages,
    updatedAt: config?.updatedAt ?? null,
  };
}

function formatTargetMeta(target: AutomationTarget) {
  const parts = [target.type.replace(/_/g, ' ')];
  if (target.createdAt) {
    const date = new Date(target.createdAt);
    if (!Number.isNaN(date.getTime())) {
      parts.push(date.toLocaleDateString());
    }
  }
  return parts.join(' - ');
}

function targetSearchText(target: AutomationTarget) {
  return [
    target.title,
    target.subtitle,
    target.type,
    target.createdAt,
    target.permalink,
  ]
    .filter(Boolean)
    .join(' ');
}

function PostThumbnail({
  target,
  fallback,
}: {
  target?: AutomationTarget | null;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (target?.thumbnailUrl && !failed) {
    return (
      <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
        <img
          src={target.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400">
      {fallback}
    </span>
  );
}

function PostSummary({
  target,
  fallback,
}: {
  target: AutomationTarget;
  fallback: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PostThumbnail target={target} fallback={fallback} />
      <div className="min-w-0">
        <TruncatedText
          as="p"
          text={target.title || 'Untitled post'}
          maxLines={1}
          className="text-sm font-medium text-gray-900"
        />
        <p className="mt-0.5 text-xs capitalize text-gray-500">
          {formatTargetMeta(target)}
        </p>
        {target.subtitle ? (
          <TruncatedText
            as="p"
            text={target.subtitle}
            maxLines={2}
            className="mt-1 text-xs leading-5 text-gray-500"
          />
        ) : null}
      </div>
    </div>
  );
}

const emptyEngagementSummary: EngagementActivitySummary = {
  commentsReceived: 0,
  automatedRepliesSent: 0,
  activePostAutomations: 0,
  engagementEventsToday: 0,
};

function formatActivityTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPostDate(timestamp?: string | null) {
  if (!timestamp) {
    return 'Post date unavailable';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Post date unavailable';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatActivityCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function getActivityLifecycleKey(event: EngagementActivityEvent) {
  return (
    event.lifecycleId ??
    event.commentId ??
    [
      event.channelId,
      event.postId,
      event.commenterName,
      event.commentText,
    ]
      .filter(Boolean)
      .join(':')
  );
}

function mergeActivityEvent(
  current: EngagementActivityEvent,
  incoming: EngagementActivityEvent,
): EngagementActivityEvent {
  const isReply =
    incoming.type === 'private_reply_sent' || incoming.replyStatus === 'sent';

  return {
    ...current,
    ...incoming,
    id: current.id || incoming.id,
    type: 'comment_received',
    timestamp: incoming.timestamp > current.timestamp
      ? incoming.timestamp
      : current.timestamp,
    commentReceivedAt:
      current.commentReceivedAt ??
      incoming.commentReceivedAt ??
      (current.type === 'comment_received' ? current.timestamp : null) ??
      (incoming.type === 'comment_received' ? incoming.timestamp : null),
    replyStatus: isReply
      ? 'sent'
      : incoming.replyStatus ?? current.replyStatus ?? null,
    replySentAt: isReply
      ? incoming.replySentAt ?? incoming.timestamp
      : incoming.replySentAt ?? current.replySentAt ?? null,
    commentText: current.commentText ?? incoming.commentText ?? null,
    commenterName: current.commenterName ?? incoming.commenterName ?? null,
    postSnippet: current.postSnippet ?? incoming.postSnippet ?? null,
    postThumbnailUrl: current.postThumbnailUrl ?? incoming.postThumbnailUrl ?? null,
    postPermalink: current.postPermalink ?? incoming.postPermalink ?? null,
  };
}

function coalesceActivityEvents(events: EngagementActivityEvent[]) {
  const byKey = new Map<string, EngagementActivityEvent>();
  const ungrouped: EngagementActivityEvent[] = [];

  for (const event of events) {
    if (event.type === 'conversation_created') {
      ungrouped.push(event);
      continue;
    }

    const key = getActivityLifecycleKey(event);
    if (!key) {
      ungrouped.push(event);
      continue;
    }

    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeActivityEvent(existing, event) : event);
  }

  return [...byKey.values(), ...ungrouped].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
}

function markActivityReplySent(
  events: EngagementActivityEvent[],
  commentId?: string | null,
) {
  if (!commentId) {
    return events;
  }

  const sentAt = new Date().toISOString();
  let updated = false;
  const next = events.map((event) => {
    if (String(event.commentId ?? '') !== String(commentId)) {
      return event;
    }

    updated = true;
    return {
      ...event,
      replyStatus: 'sent',
      replySentAt: event.replySentAt ?? sentAt,
      timestamp: event.timestamp > sentAt ? event.timestamp : sentAt,
    };
  });

  return updated ? coalesceActivityEvents(next) : events;
}

function getPostLinkLabel(_channelType: string) {
  return 'View post';
}

function getPageDisplayName(pageName?: string | null, channelType = 'instagram') {
  const name = String(pageName ?? '').trim();
  if (!name) {
    return channelType === 'instagram'
      ? 'Connected Instagram account'
      : 'Connected Facebook Page';
  }

  if (channelType === 'instagram' && !name.startsWith('@')) {
    return `@${name}`;
  }

  return name;
}

function postIdsMatch(left?: string | null, right?: string | null) {
  if (!left || !right) return false;
  if (left === right) return true;

  const leftSuffix = left.split('_').pop();
  const rightSuffix = right.split('_').pop();
  return Boolean(leftSuffix && rightSuffix && leftSuffix === rightSuffix);
}

function buildSummaryFromPrivateRepliesConfig(
  config: PrivateRepliesConfig,
  targets: AutomationTarget[],
  current: EngagementActivitySummary,
): EngagementActivitySummary {
  const activePostAutomations = config.enabled
    ? config.scope === 'selected'
      ? config.postMessages.filter((item) => item.message.trim()).length
      : Math.max(targets.length, 1)
    : 0;

  return {
    ...current,
    commentsReceived: config.postMessages.reduce(
      (total, item) => total + toNonNegativeCount(item.commentsReceived),
      0,
    ),
    automatedRepliesSent: config.postMessages.reduce(
      (total, item) => total + toNonNegativeCount(item.automatedRepliesSent),
      0,
    ),
    activePostAutomations,
  };
}

function getChannelPagePicture(channel: ConnectedChannel) {
  return (
    channel.config?.pagePicture ??
    channel.config?.profilePicture ??
    channel.config?.pictureUrl ??
    null
  );
}

function buildActivityPostFromTarget({
  channel,
  postId,
  target,
  commentsReceived,
  automatedRepliesSent,
}: {
  channel: ConnectedChannel;
  postId: string | null;
  target?: AutomationTarget | null;
  commentsReceived: number;
  automatedRepliesSent: number;
}): EngagementActivityPost {
  return {
    id: target?.id ?? postId,
    pageName: channel.config?.pageName ?? channel.config?.userName ?? channel.name,
    pagePictureUrl: getChannelPagePicture(channel),
    postThumbnailUrl: target?.thumbnailUrl ?? null,
    postSnippet: target?.subtitle ?? target?.title ?? null,
    createdAt: target?.createdAt ?? null,
    permalink: target?.permalink ?? null,
    commentsReceived,
    automatedRepliesSent,
    identity:
      channel.type === 'instagram'
        ? 'Connected Instagram Post'
        : 'Connected Facebook Post',
  };
}

function buildActivityPostsFromPrivateRepliesConfig(
  config: PrivateRepliesConfig,
  channel: ConnectedChannel,
  targets: AutomationTarget[],
) {
  if (config.scope === 'selected') {
    return config.postMessages
      .filter((item) => item.message.trim())
      .map((item) => {
        const target =
          targets.find((candidate) => postIdsMatch(candidate.id, item.postId)) ??
          item.target ??
          null;

        return buildActivityPostFromTarget({
          channel,
          postId: item.postId,
          target,
          commentsReceived: toNonNegativeCount(item.commentsReceived),
          automatedRepliesSent: toNonNegativeCount(item.automatedRepliesSent),
        });
      });
  }

  if (!config.enabled || !config.message.trim()) {
    return [];
  }

  return targets.map((target) =>
    buildActivityPostFromTarget({
      channel,
      postId: target.id,
      target,
      commentsReceived: 0,
      automatedRepliesSent: 0,
    }),
  );
}

function PostExternalLink({
  href,
  channelType,
}: {
  href?: string | null;
  channelType: string;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:underline"
    >
      {getPostLinkLabel(channelType)}
      <ExternalLink size={12} />
    </a>
  );
}

function PageAvatar({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-50">
        <img
          src={src}
          alt={`${name} profile`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return null;
}

function ActiveReplyPostItem({
  post,
  channelType,
  events,
}: {
  post: EngagementActivityPost;
  channelType: string;
  events: EngagementActivityEvent[];
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const displayName = getPageDisplayName(post.pageName, channelType);
  const postActivityHeader = (
    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PageAvatar src={post.pagePictureUrl} name={post.pageName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock size={12} />
              {formatPostDate(post.createdAt)}
            </p>
          </div>
        </div>
        <PostExternalLink href={post.permalink} channelType={channelType} />
      </div>
      {post.postSnippet ? (
        <div className="mt-3 text-sm leading-5 text-gray-900 dark:text-gray-100">
          <TruncatedText
            as="p"
            text={post.postSnippet}
            maxLines={3}
            className="text-sm leading-5 text-gray-900 dark:text-gray-100"
          />
        </div>
      ) : null}
    </div>
  );
  const postActivityList = (
    <>
      {events.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
          No recent comments on this post yet.
        </div>
      ) : (
        <ol className="bg-white dark:bg-gray-900">
          {events.map((event) => (
            <ActivityFeedItem
              key={event.id}
              event={event}
              postPermalink={post.permalink}
              showPostShortcut={false}
            />
          ))}
        </ol>
      )}
    </>
  );

  return (
    <li className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="grid lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
        <div className="p-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto aspect-[4/5] max-h-[28rem] w-full bg-gray-100 dark:bg-gray-800">
              {post.postThumbnailUrl && !thumbnailFailed ? (
                <img
                  src={post.postThumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setThumbnailFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <ImageIcon size={22} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
            <span className="inline-flex items-center gap-2">
              <MessageCircle size={16} className="text-gray-500" />
              <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatActivityCount(post.commentsReceived)}
              </span>
              comments
            </span>
            <span className="inline-flex items-center gap-2">
              <Send size={16} className="text-gray-500" />
              <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatActivityCount(post.automatedRepliesSent)}
              </span>
              DMs sent
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-full justify-center lg:hidden"
            leftIcon={<MessageCircle size={14} />}
            onClick={() => setActivitySheetOpen(true)}
          >
            View activity
          </Button>
        </div>

        <div className="hidden max-h-[32rem] min-h-0 flex-col overflow-hidden border-t border-gray-100 bg-white lg:flex lg:border-l lg:border-t-0 dark:border-gray-800 dark:bg-gray-900">
          {postActivityHeader}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {postActivityList}
          </div>
        </div>
      </div>
      <MobileSheet
        isOpen={activitySheetOpen}
        onClose={() => setActivitySheetOpen(false)}
        title="Post activity"
        fullScreen
      >
        <div className="bg-white dark:bg-gray-900">
          {postActivityHeader}
          {postActivityList}
        </div>
      </MobileSheet>
    </li>
  );
}

function ActiveReplyPostsCard({
  posts,
  channelType,
  activeCount,
  events,
}: {
  posts: EngagementActivityPost[];
  channelType: string;
  activeCount: number;
  events: EngagementActivityEvent[];
}) {
  const hasActiveReplies = activeCount > 0;
  const groupedPosts = posts.map((post) => ({
    post,
    events: events.filter((event) => postIdsMatch(post.id, event.postId)),
  }));
  const unmatchedEvents = events.filter(
    (event) => !posts.some((post) => postIdsMatch(post.id, event.postId)),
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Post Activity
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Comments and auto DMs are grouped under each post.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${
            hasActiveReplies
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasActiveReplies ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          {hasActiveReplies
            ? `${formatActivityCount(activeCount)} active`
            : 'Auto replies paused'}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white px-4 text-center dark:border-gray-700 dark:bg-gray-900">
          <ImageIcon size={22} className="text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            No active reply posts
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select posts in setup to track comments and DMs here.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {groupedPosts.map(({ post, events }) => (
            <ActiveReplyPostItem
              key={post.id ?? post.permalink ?? post.identity}
              post={post}
              channelType={channelType}
              events={events}
            />
          ))}
          {unmatchedEvents.length > 0 ? (
            <li className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Other recent activity
                </p>
              </div>
              <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                {unmatchedEvents.map((event) => (
                  <ActivityFeedItem key={event.id} event={event} />
                ))}
              </ol>
            </li>
          ) : null}
        </ol>
      )}
    </section>
  );
}

function EngagementSummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-gray-900 transition-all duration-300 dark:text-gray-100">
            {formatActivityCount(value)}
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
          {icon}
        </span>
      </div>
    </div>
  );
}

function ActivityPostShortcut({
  event,
  channelType,
  fallbackPermalink,
}: {
  event: EngagementActivityEvent;
  channelType: string;
  fallbackPermalink?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const postHref = event.postPermalink ?? fallbackPermalink ?? null;

  if (!postHref && !event.postThumbnailUrl) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2 self-start rounded-md border border-gray-200 bg-gray-50/80 p-1.5 dark:border-gray-700 dark:bg-gray-800/80">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white bg-white text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {event.postThumbnailUrl && !failed ? (
          <img
            src={event.postThumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <ImageIcon size={16} />
        )}
      </span>
      <PostExternalLink href={postHref} channelType={channelType} />
    </div>
  );
}

function ActivityFeedItem({
  event,
  postPermalink,
  showPostShortcut = true,
}: {
  event: EngagementActivityEvent;
  postPermalink?: string | null;
  showPostShortcut?: boolean;
}) {
  const name = event.commenterName ?? 'Someone';
  const commentText = event.commentText?.trim();
  const isSent =
    event.replyStatus === 'sent' || event.type === 'private_reply_sent';
  const body =
    commentText ??
    (event.type === 'conversation_created'
      ? 'Conversation opened in Inbox'
      : 'Comment received');

  return (
    <li className="bg-white px-4 py-3 dark:bg-gray-900">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 text-gray-900 dark:text-gray-100">
            <span className="font-semibold">{name}</span> {body}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="tabular-nums">
              {formatActivityTime(event.timestamp)}
            </span>
            {!isSent ? <span>Comment</span> : null}
          </div>
          {isSent ? (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-100 dark:bg-green-950/30 dark:text-green-300 dark:ring-green-800">
              <Send size={12} />
              Auto DM delivered
              {event.replySentAt ? (
                <span className="tabular-nums text-gray-400">
                  {formatActivityTime(event.replySentAt)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {showPostShortcut ? (
          <ActivityPostShortcut
            event={event}
            channelType={event.channelType}
            fallbackPermalink={postPermalink}
          />
        ) : null}
      </div>
    </li>
  );
}
function EngagementActivityPanel({
  summary,
  events,
  posts,
  loading,
  loaded,
  error,
  onRefresh,
  refreshing,
  channelType,
}: {
  summary: EngagementActivitySummary;
  events: EngagementActivityEvent[];
  posts: EngagementActivityPost[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  channelType: string;
}) {
  const cards = [
    {
      label: 'New Comments',
      value: summary.commentsReceived,
      icon: <MessageCircle size={17} />,
    },
    {
      label: 'Auto Replies Sent',
      value: summary.automatedRepliesSent,
      icon: <Send size={17} />,
    },
  ];
  const showInitialLoader = !loaded && !error;
  const visibleEvents = events.filter(
    (event) => event.type !== 'automation_triggered',
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span className="flex h-2 w-2 rounded-full bg-green-500" />
          Live Activity
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {visibleEvents.length} recent
          </span>
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="secondary"
            size="sm"
            leftIcon={!refreshing ? <RefreshCw size={13} /> : undefined}
            loading={refreshing}
            loadingMode="inline"
            loadingLabel="Refreshing..."
          >
            Refresh
          </Button>
        </div>
      </div>

      {showInitialLoader ? (
        <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Loader size={18} className="animate-spin" />
            <span className="text-sm">
              {loading ? 'Loading recent engagement...' : 'Preparing activity...'}
            </span>
          </div>
        </div>
      ) : (
        <>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <EngagementSummaryCard key={card.label} {...card} />
        ))}
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      ) : null}

      <ActiveReplyPostsCard
        posts={posts}
        channelType={channelType}
        activeCount={summary.activePostAutomations}
        events={visibleEvents}
      />
        </>
      )}
    </div>
  );
}

export const MetaAutomationSection = ({
  channel,
  mode,
}: {
  channel: ConnectedChannel;
  mode: AutomationMode;
}) => {
  const { socket } = useSocket();
  const { saving, saved, error: saveError, save } = useSave();

  const [loading, setLoading] = useState(true);
  const [reloadingTargets, setReloadingTargets] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recentEvent, setRecentEvent] = useState<string | null>(null);
  const [targets, setTargets] = useState<AutomationTarget[]>([]);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(
    null,
  );
  const postCardRefs = useRef(new Map<string, HTMLDivElement>());
  const [privateReplies, setPrivateReplies] =
    useState<PrivateRepliesConfig>(emptyPrivateReplies);
  const [storyReplies, setStoryReplies] =
    useState<StoryRepliesConfig>(emptyStoryReplies);
  const [activePanel, setActivePanel] = useState<AutomationPanel>('settings');
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] =
    useState<EngagementActivitySummary>(emptyEngagementSummary);
  const [activityEvents, setActivityEvents] = useState<EngagementActivityEvent[]>(
    [],
  );
  const [activityPosts, setActivityPosts] = useState<EngagementActivityPost[]>(
    [],
  );

  const isPrivateReplies = mode === 'private_replies';
  const title = isPrivateReplies ? 'Private Replies' : 'Story Replies';
  const description = isPrivateReplies
    ? 'Automatically send Instagram or Facebook replies when someone comments on your posts.'
    : 'Send a lightweight auto-reply when someone answers your Instagram story.';

  const loadConfig = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      if (isPrivateReplies) {
        const [config, nextTargets] = await Promise.all([
          ChannelApi.getPrivateRepliesConfig(String(channel.id)),
          ChannelApi.listMetaAutomationTargets(String(channel.id)).catch(() => []),
        ]);
        setPrivateReplies(normalizePrivateRepliesConfig(config));
        setTargets(nextTargets ?? []);
      } else {
        const config = await ChannelApi.getStoryRepliesConfig(String(channel.id));
        setStoryReplies(config ?? emptyStoryReplies);
      }
    } catch (error: any) {
      setLoadError(error?.message ?? 'Failed to load automation settings');
    } finally {
      setLoading(false);
    }
  };

  const reloadTargets = async () => {
    if (!isPrivateReplies) return;

    setReloadingTargets(true);
    try {
      const nextTargets = await ChannelApi.listMetaAutomationTargets(
        String(channel.id),
      );
      setTargets(nextTargets ?? []);
    } catch (error: any) {
      setLoadError(error?.message ?? 'Failed to refresh posts');
    } finally {
      setReloadingTargets(false);
    }
  };

  const loadEngagementActivity = async () => {
    if (!isPrivateReplies) return;

    setActivityLoading(true);
    setActivityError(null);
    try {
      const state = await ChannelApi.getMetaEngagementActivity(
        String(channel.id),
      );
      const nextEvents = state.events ?? [];
      setActivitySummary(state.summary ?? emptyEngagementSummary);
      setActivityPosts(
        state.posts ?? (state.selectedPost ? [state.selectedPost] : []),
      );
      setActivityEvents(coalesceActivityEvents([...nextEvents].reverse()));
      setActivityLoaded(true);
    } catch {
      setActivityError('Could not load recent engagement. Try refreshing.');
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, [channel.id, mode]);

  useEffect(() => {
    setActivePanel('settings');
    setActivityError(null);
    setActivityLoaded(false);
    setActivitySummary(emptyEngagementSummary);
    setActivityEvents([]);
    setActivityPosts([]);
  }, [channel.id, mode]);

  useEffect(() => {
    if (!isPrivateReplies || activePanel !== 'engagement_activity') {
      return;
    }

    void loadEngagementActivity();
  }, [activePanel, channel.id, isPrivateReplies]);

  useEffect(() => {
    if (!socket) return;

    const onChannelConfig = (event: any) => {
      if (String(event?.channelId) !== String(channel.id)) return;
      if (!['meta_automation', 'messenger_menu'].includes(event?.feature)) {
        return;
      }

      if (event?.feature === 'meta_automation') {
        if (event?.config?.privateReplies) {
          const nextPrivateReplies = normalizePrivateRepliesConfig(
            event.config.privateReplies,
          );
          setPrivateReplies(nextPrivateReplies);
          setActivitySummary((current) =>
            buildSummaryFromPrivateRepliesConfig(
              nextPrivateReplies,
              targets,
              current,
            ),
          );
          setActivityPosts(
            buildActivityPostsFromPrivateRepliesConfig(
              nextPrivateReplies,
              channel,
              targets,
            ),
          );
        }
        if (event?.config?.storyReplies) {
          setStoryReplies(event.config.storyReplies);
        }
        return;
      }

      void loadConfig();
    };

    const onAutomationTriggered = (event: any) => {
      if (String(event?.channelId) !== String(channel.id)) return;
      if (
        (isPrivateReplies && event?.triggerType !== 'comment') ||
        (!isPrivateReplies && event?.triggerType !== 'story_reply')
      ) {
        return;
      }

      setRecentEvent(
        isPrivateReplies
          ? 'Latest DM sent successfully'
          : 'Latest story reply automation ran successfully',
      );

      if (isPrivateReplies) {
        setActivityEvents((current) =>
          markActivityReplySent(current, event?.externalId),
        );
      }
    };

    const onAutomationError = (event: any) => {
      if (String(event?.channelId) !== String(channel.id)) return;
      if (
        (isPrivateReplies && event?.triggerType !== 'comment') ||
        (!isPrivateReplies && event?.triggerType !== 'story_reply')
      ) {
        return;
      }

      setLoadError(event?.error ?? 'Automation failed');
    };

    const onMetaEngagementActivity = (
      event: Partial<EngagementActivityEvent>,
    ) => {
      if (!isPrivateReplies) return;
      if (String(event?.channelId) !== String(channel.id)) return;
      if (!event?.id || !event.type || !event.timestamp) return;

      const activityEvent = event as EngagementActivityEvent;
      setActivityLoaded(true);
      setActivityEvents((current) =>
        coalesceActivityEvents([activityEvent, ...current]).slice(0, 100),
      );
      setActivityPosts((current) => {
        if (
          !activityEvent.postId ||
          current.some((post) => String(post.id) === String(activityEvent.postId))
        ) {
          return current;
        }

        return [
          ...current,
          {
            id: activityEvent.postId,
            pageName: activityEvent.pageName ?? 'Connected Page',
            pagePictureUrl: activityEvent.pagePictureUrl ?? null,
            postThumbnailUrl: activityEvent.postThumbnailUrl ?? null,
            postSnippet: activityEvent.postSnippet ?? null,
            createdAt: activityEvent.postCreatedAt ?? null,
            permalink: activityEvent.postPermalink ?? null,
            commentsReceived: 0,
            automatedRepliesSent: 0,
            identity:
              activityEvent.channelType === 'instagram'
                ? 'Connected Instagram Post'
                : 'Connected Facebook Post',
          },
        ];
      });
    };

    socket.on('channel:config', onChannelConfig);
    socket.on('automation:triggered', onAutomationTriggered);
    socket.on('automation:error', onAutomationError);
    socket.on('meta:engagement:activity', onMetaEngagementActivity);

    return () => {
      socket.off('channel:config', onChannelConfig);
      socket.off('automation:triggered', onAutomationTriggered);
      socket.off('automation:error', onAutomationError);
      socket.off('meta:engagement:activity', onMetaEngagementActivity);
    };
  }, [channel, isPrivateReplies, socket, targets]);

  const activeConfig = isPrivateReplies ? privateReplies : storyReplies;
  const messageValue = activeConfig.message ?? '';
  const postThumbnailFallback =
    channel.type === 'instagram' ? (
      <InstagramIcon size={16} />
    ) : (
      <MessageCircle size={16} />
    );
  const configuredPostIds = useMemo(
    () => new Set(privateReplies.postMessages.map((item) => item.postId)),
    [privateReplies.postMessages],
  );
  const targetById = useMemo(
    () => new Map(targets.map((target) => [String(target.id), target])),
    [targets],
  );
  const postSelectGroups = useMemo<CompactSelectMenuGroup[]>(
    () => [
      {
        label: 'Available posts',
        options: targets
          .filter((target) => !configuredPostIds.has(String(target.id)))
          .map((target) => ({
            value: String(target.id),
            label: target.title || 'Untitled post',
            description: formatTargetMeta(target),
            leading: (
              <PostThumbnail
                target={target}
                fallback={postThumbnailFallback}
              />
            ),
            searchText: targetSearchText(target),
          })),
      },
    ],
    [configuredPostIds, postThumbnailFallback, targets],
  );

  const getTargetForPostMessage = (rule: PrivateReplyPostMessage) =>
    targetById.get(rule.postId) ??
    rule.target ?? {
      id: rule.postId,
      title: 'Post unavailable',
      subtitle: null,
      type: 'post',
      permalink: null,
      thumbnailUrl: null,
      createdAt: null,
    };

  useEffect(() => {
    if (!highlightedPostId) return;

    const frameId = window.requestAnimationFrame(() => {
      postCardRefs.current.get(highlightedPostId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    const timeoutId = window.setTimeout(() => {
      setHighlightedPostId((current) =>
        current === highlightedPostId ? null : current,
      );
    }, SELECTED_POST_HIGHLIGHT_MS);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [highlightedPostId, privateReplies.postMessages.length]);

  const addPostMessage = (postId: string) => {
    const target = targetById.get(postId);
    if (!target) return;
    setHighlightedPostId(postId);
    setPrivateReplies((current) => {
      if (current.postMessages.some((item) => item.postId === postId)) {
        return current;
      }
      const postMessages = [
        ...current.postMessages,
        {
          postId,
          message: '',
          target,
          updatedAt: null,
          commentsReceived: 0,
          automatedRepliesSent: 0,
        },
      ];
      return {
        ...current,
        scope: 'selected',
        selectedPostIds: postMessages.map((item) => item.postId),
        postMessages,
      };
    });
  };

  const updatePostMessage = (postId: string, message: string) => {
    setPrivateReplies((current) => ({
      ...current,
      postMessages: current.postMessages.map((item) =>
        item.postId === postId ? { ...item, message } : item,
      ),
    }));
  };

  const removePostMessage = (postId: string) => {
    setHighlightedPostId((current) => (current === postId ? null : current));
    setPrivateReplies((current) => {
      const postMessages = current.postMessages.filter(
        (item) => item.postId !== postId,
      );
      return {
        ...current,
        selectedPostIds: postMessages.map((item) => item.postId),
        postMessages,
      };
    });
  };

  const privateRepliesSaveDisabled =
    isPrivateReplies &&
    privateReplies.enabled &&
    ((privateReplies.scope === 'all' && !privateReplies.message.trim()) ||
      (privateReplies.scope === 'selected' &&
        (privateReplies.postMessages.length === 0 ||
          privateReplies.postMessages.some((item) => !item.message.trim()))));

  const storyRepliesSaveDisabled =
    !isPrivateReplies && storyReplies.enabled && !storyReplies.message.trim();

  const handleSave = () =>
    save(async () => {
      if (isPrivateReplies) {
        return ChannelApi.savePrivateRepliesConfig(
          String(channel.id),
          privateReplies,
        );
      }

      return ChannelApi.saveStoryRepliesConfig(String(channel.id), storyReplies);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
        <Loader size={18} className="animate-spin" />
        <span className="text-sm">Loading automation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
        {isPrivateReplies ? (
          <Button
            onClick={() => void reloadTargets()}
            disabled={reloadingTargets}
            variant="secondary"
            size="sm"
            leftIcon={!reloadingTargets ? <RefreshCw size={13} /> : undefined}
            loading={reloadingTargets}
            loadingMode="inline"
            loadingLabel="Refreshing..."
          >
            Refresh posts
          </Button>
        ) : null}
      </div>

      {isPrivateReplies ? (
        <div className="flex w-full flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
          {[
            {
              id: 'settings' as const,
              label: 'DM Automation',
              icon: <MessageCircle size={14} />,
            },
            {
              id: 'engagement_activity' as const,
              label: 'Live Activity',
              icon: <Activity size={14} />,
            },
          ].map((item) => {
            const active = activePanel === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActivePanel(item.id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none ${
                  active
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-500 hover:bg-white/70 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {isPrivateReplies && activePanel === 'engagement_activity' ? (
        <EngagementActivityPanel
          summary={activitySummary}
          events={activityEvents}
          posts={activityPosts}
          loading={activityLoading}
          loaded={activityLoaded}
          error={activityError}
          onRefresh={() => void loadEngagementActivity()}
          refreshing={activityLoading}
          channelType={channel.type}
        />
      ) : (
        <>
      <div className="border-y border-gray-100 py-3">
        <ToggleSwitch
          checked={Boolean(activeConfig.enabled)}
          onChange={(checked) => {
            if (isPrivateReplies) {
              setPrivateReplies((current) => ({ ...current, enabled: checked }));
            } else {
              setStoryReplies((current) => ({ ...current, enabled: checked }));
            }
          }}
          label={
            isPrivateReplies
              ? 'Turn on automatic private replies'
              : 'Enable story reply automation'
          }
        />
        <p className="mt-2 text-xs text-gray-500">
          {isPrivateReplies
            ? 'When someone comments, AxoDesk sends your saved DM for you.'
            : 'Runs after the inbound story reply creates the conversation thread.'}
        </p>
      </div>

      {isPrivateReplies ? (
        <div className="space-y-4">
          <div className="max-w-md space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Which comments should get a DM?
            </label>
            <CompactSelectMenu
              value={privateReplies.scope}
              groups={privateReplyScopeGroups}
              onChange={(value) =>
                setPrivateReplies((current) => ({
                  ...current,
                  scope: value as PrivateReplyScope,
                }))
              }
              triggerAppearance="field"
              dropdownWidth="md"
              placeholder="Choose reply mode"
              fullWidth
            />
          </div>

          {privateReplies.scope === 'all' ? (
            <TextareaInput
              label="Default private reply"
              value={privateReplies.message}
              onChange={(event) =>
                setPrivateReplies((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              rows={5}
              autoResize
              hint="Personalize with {{commenter_name}} or {{comment_text}}."
              placeholder="Hi {{commenter_name}}, thanks for commenting. We just sent you a DM."
            />
          ) : (
            <div className="space-y-4">
              <ButtonSelectMenu
                value=""
                groups={postSelectGroups}
                onChange={addPostMessage}
                label="Add post"
                leftIcon={<Plus size={14} />}
                variant="secondary"
                dropdownWidth="lg"
                searchable
                searchPlaceholder="Search posts..."
                emptyMessage={
                  targets.length === 0
                    ? 'No posts found yet.'
                    : 'Every listed post already has an auto reply.'
                }
                placeholder="Add post"
                disabled={postSelectGroups[0]?.options.length === 0}
                mobileSheet
                mobileSheetTitle="Select post"
                mobileSheetSubtitle="Choose the post that should get an auto reply"
              />

              {privateReplies.postMessages.length === 0 ? (
                <div className="border-y border-dashed border-gray-200 py-6 text-sm text-gray-400">
                  Choose a post to write the DM people receive after commenting.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Posts with custom replies
                      </p>
                      <CountBadge
                        count={privateReplies.postMessages.length}
                        tone="neutral"
                        size="sm"
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      Each post can have its own DM
                    </span>
                  </div>
                  {privateReplies.postMessages.map((rule) => {
                    const target = getTargetForPostMessage(rule);

                    return (
                      <div
                        key={rule.postId}
                        ref={(node) => {
                          if (node) {
                            postCardRefs.current.set(rule.postId, node);
                          } else {
                            postCardRefs.current.delete(rule.postId);
                          }
                        }}
                        className={`scroll-mt-24 rounded-lg border p-4 transition-colors duration-700 ${
                          highlightedPostId === rule.postId
                            ? 'border-[var(--color-primary-light)] bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary-light)]'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                          <PostSummary
                            target={target}
                            fallback={postThumbnailFallback}
                          />
                          <div className="flex shrink-0 items-center gap-2">
                            <PostExternalLink
                              href={target.permalink}
                              channelType={channel.type}
                            />
                            <Tag label="Auto reply on" size="sm" bgColor="success" />
                            <IconButton
                              icon={<Trash2 size={14} />}
                              aria-label="Remove post message"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePostMessage(rule.postId)}
                            />
                          </div>
                        </div>
                        <div className="pt-3">
                          <TextareaInput
                            label="Private reply for this post"
                            value={rule.message}
                            onChange={(event) =>
                              updatePostMessage(rule.postId, event.target.value)
                            }
                            rows={3}
                            autoResize
                            hint="Personalize with {{commenter_name}} or {{comment_text}}."
                            placeholder="Write the DM people receive after commenting on this post."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border-l border-[var(--color-primary-light)] pl-3">
          <div className="flex items-start gap-2.5">
            <MessageCircle size={15} className="mt-0.5 text-[var(--color-primary)]" />
            <p className="text-sm text-gray-600">
              Story replies already arrive as real messages, so the automation
              uses the existing conversation flow and adds the reply immediately
              after the inbound event.
            </p>
          </div>
        </div>
      )}

      {!isPrivateReplies ? (
        <div>
          <TextareaInput
            label="Message"
            value={messageValue}
            onChange={(event) =>
              setStoryReplies((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
            rows={5}
            autoResize
            hint="Variables: {{contact_name}} {{reply_text}} {{story_id}}"
            placeholder="Thanks {{contact_name}}. We saw your story reply and will follow up shortly."
          />
        </div>
      ) : null}

      {recentEvent ? (
        <div className="border-l border-green-300 pl-3 text-xs font-medium text-green-700">
          {recentEvent}
        </div>
      ) : null}

      {loadError ? (
        <div className="flex items-center gap-2 border-l border-red-300 pl-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {loadError}
        </div>
      ) : (
        <div className="flex items-center gap-2 border-l border-amber-300 pl-3 text-xs text-amber-700">
          <Info size={14} />
          {isPrivateReplies
            ? 'When someone replies to your DM, the conversation appears in Inbox.'
            : 'Story context is attached from the inbound reply payload and stays in the same conversation thread.'}
        </div>
      )}

      <SaveButton
        disabled={privateRepliesSaveDisabled || storyRepliesSaveDisabled}
        error={saveError}
        label={isPrivateReplies ? 'Save Private Replies' : 'Save Story Replies'}
        onClick={handleSave}
        saved={saved}
        saving={saving}
      />
        </>
      )}
    </div>
  );
};
