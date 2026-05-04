import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AlertCircle,
  Info,
  Instagram as InstagramIcon,
  Loader,
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { IconButton } from '../../../components/ui/button/IconButton';
import { CountBadge } from '../../../components/ui/CountBadge';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
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
        description: 'Use one message for every comment.',
      },
      {
        value: 'selected',
        label: 'Only selected content',
        description: 'Set one message per selected post.',
      },
    ],
  },
];

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

  const isPrivateReplies = mode === 'private_replies';
  const title = isPrivateReplies ? 'Private Replies' : 'Story Replies';
  const description = isPrivateReplies
    ? 'Reply automatically when someone comments on your content.'
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

  useEffect(() => {
    void loadConfig();
  }, [channel.id, mode]);

  useEffect(() => {
    if (!socket) return;

    const onChannelConfig = (event: any) => {
      if (String(event?.channelId) !== String(channel.id)) return;
      if (!['meta_automation', 'messenger_menu'].includes(event?.feature)) {
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
          ? 'Latest private reply sent successfully'
          : 'Latest story reply automation ran successfully',
      );
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

    socket.on('channel:config', onChannelConfig);
    socket.on('automation:triggered', onAutomationTriggered);
    socket.on('automation:error', onAutomationError);

    return () => {
      socket.off('channel:config', onChannelConfig);
      socket.off('automation:triggered', onAutomationTriggered);
      socket.off('automation:error', onAutomationError);
    };
  }, [channel.id, isPrivateReplies, socket]);

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
              ? 'Enable automatic private replies'
              : 'Enable story reply automation'
          }
        />
        <p className="mt-2 text-xs text-gray-500">
          {isPrivateReplies
            ? 'Runs when a supported comment webhook matches your rule.'
            : 'Runs after the inbound story reply creates the conversation thread.'}
        </p>
      </div>

      {isPrivateReplies ? (
        <div className="space-y-4">
          <div className="max-w-md space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reply mode
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
              label="Message for all posts and reels"
              value={privateReplies.message}
              onChange={(event) =>
                setPrivateReplies((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              rows={5}
              autoResize
              hint="Variables: {{commenter_name}} {{comment_text}} {{post_id}}"
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
                    ? 'No posts found for this channel yet.'
                    : 'Every listed post already has a message.'
                }
                placeholder="Add post"
                disabled={postSelectGroups[0]?.options.length === 0}
                mobileSheet
                mobileSheetTitle="Select post"
                mobileSheetSubtitle="Choose one post for this message"
              />

              {privateReplies.postMessages.length === 0 ? (
                <div className="border-y border-dashed border-gray-200 py-6 text-sm text-gray-400">
                  No specific post messages yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Post message cards
                      </p>
                      <CountBadge
                        count={privateReplies.postMessages.length}
                        tone="neutral"
                        size="sm"
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      One private reply per post
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
                            <Tag label="Selected" size="sm" bgColor="primary" />
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
                            label="Message for this post"
                            value={rule.message}
                            onChange={(event) =>
                              updatePostMessage(rule.postId, event.target.value)
                            }
                            rows={3}
                            autoResize
                            hint="Variables: {{commenter_name}} {{comment_text}} {{post_id}}"
                            placeholder="Write the private reply for comments on this post."
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
            ? 'Contacts appear in Inbox only after the person replies to the private message.'
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
    </div>
  );
};
