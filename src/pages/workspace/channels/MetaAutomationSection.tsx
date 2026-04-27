import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Info,
  Loader,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { CheckboxInput } from '../../../components/ui/inputs/CheckboxInput';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { Tag } from '../../../components/ui/tag/Tag';
import { ToggleSwitch } from '../../../components/ui/toggle/ToggleSwitch';
import {
  AutomationTarget,
  ChannelApi,
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

const emptyPrivateReplies: PrivateRepliesConfig = {
  enabled: false,
  scope: 'all',
  selectedPostIds: [],
  message: '',
};

const emptyStoryReplies: StoryRepliesConfig = {
  enabled: false,
  message: '',
};

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
        setPrivateReplies(config ?? emptyPrivateReplies);
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
  const activeTargets = useMemo(
    () =>
      targets.filter((target) =>
        privateReplies.selectedPostIds.includes(String(target.id)),
      ),
    [privateReplies.selectedPostIds, targets],
  );

  const toggleTarget = (targetId: string) => {
    setPrivateReplies((current) => {
      const selected = current.selectedPostIds.includes(targetId)
        ? current.selectedPostIds.filter((id) => id !== targetId)
        : [...current.selectedPostIds, targetId];

      return {
        ...current,
        selectedPostIds: selected,
      };
    });
  };

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
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
        {isPrivateReplies ? (
          <Button
            onClick={() => void reloadTargets()}
            disabled={reloadingTargets}
            variant="secondary"
            leftIcon={!reloadingTargets ? <RefreshCw size={13} /> : undefined}
            loading={reloadingTargets}
            loadingMode="inline"
            loadingLabel="Refreshing..."
          >
            Refresh posts
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
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
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Button
                type="button"
                variant={privateReplies.scope === 'all' ? 'primary' : 'secondary'}
                className="justify-start"
                onClick={() =>
                  setPrivateReplies((current) => ({
                    ...current,
                    scope: 'all',
                  }))
                }
              >
                All posts and reels
              </Button>
              <Button
                type="button"
                variant={
                  privateReplies.scope === 'selected' ? 'primary' : 'secondary'
                }
                className="justify-start"
                onClick={() =>
                  setPrivateReplies((current) => ({
                    ...current,
                    scope: 'selected',
                  }))
                }
              >
                Only selected content
              </Button>
            </div>
          </div>

          {privateReplies.scope === 'selected' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Selected content
                </p>
                <span className="text-xs text-gray-400">
                  {privateReplies.selectedPostIds.length} selected
                </span>
              </div>

              {targets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                  No posts found for this channel yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {targets.map((target) => {
                    const selected = privateReplies.selectedPostIds.includes(
                      String(target.id),
                    );

                    return (
                      <div
                        key={target.id}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                          selected
                            ? 'border-indigo-200 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <CheckboxInput
                          checked={selected}
                          onChange={() => toggleTarget(String(target.id))}
                          className="w-full"
                          label={target.title}
                          description={
                            <>
                              <span>
                                {target.type}
                                {target.createdAt
                                  ? ` - ${new Date(target.createdAt).toLocaleDateString()}`
                                  : ''}
                              </span>
                              {target.subtitle ? (
                                <span className="mt-1 block line-clamp-2">
                                  {target.subtitle}
                                </span>
                              ) : null}
                            </>
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <MessageCircle size={15} className="mt-0.5 text-indigo-500" />
            <p className="text-xs text-indigo-900">
              Story replies already arrive as real messages, so the automation
              uses the existing conversation flow and adds the reply immediately
              after the inbound event.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <TextareaInput
          label="Message"
          value={messageValue}
          onChange={(event) => {
            const value = event.target.value;
            if (isPrivateReplies) {
              setPrivateReplies((current) => ({ ...current, message: value }));
            } else {
              setStoryReplies((current) => ({ ...current, message: value }));
            }
          }}
          rows={5}
          autoResize
          hint={
            isPrivateReplies
              ? 'Variables: {{commenter_name}} {{comment_text}} {{post_id}}'
              : 'Variables: {{contact_name}} {{reply_text}} {{story_id}}'
          }
          placeholder={
            isPrivateReplies
              ? 'Hi {{commenter_name}}, thanks for commenting. We just sent you a DM.'
              : 'Thanks {{contact_name}}. We saw your story reply and will follow up shortly.'
          }
        />
      </div>

      {activeTargets.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Active targets
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeTargets.map((target) => (
              <Tag
                key={target.id}
                label={target.title}
                size="sm"
                bgColor="gray"
                icon={<Check size={11} />}
              />
            ))}
          </div>
        </div>
      ) : null}

      {recentEvent ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
          {recentEvent}
        </div>
      ) : null}

      {loadError ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {loadError}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <Info size={14} />
          {isPrivateReplies
            ? 'Contacts appear in Inbox only after the person replies to the private message.'
            : 'Story context is attached from the inbound reply payload and stays in the same conversation thread.'}
        </div>
      )}

      <SaveButton
        disabled={
          isPrivateReplies &&
          privateReplies.enabled &&
          privateReplies.scope === 'selected' &&
          privateReplies.selectedPostIds.length === 0
        }
        error={saveError}
        label={isPrivateReplies ? 'Save Private Replies' : 'Save Story Replies'}
        onClick={handleSave}
        saved={saved}
        saving={saving}
      />
    </div>
  );
};
