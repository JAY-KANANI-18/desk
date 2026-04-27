import { useEffect, useState } from 'react';
import { AlertCircle, Check, Info, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { IconButton } from '../../../components/ui/button/IconButton';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { ChannelApi, IceBreakerItem } from '../../../lib/channelApi';
import { useSocket } from '../../../socket/socket-provider';
import { ConnectedChannel, SaveButton, useSave } from '../../channels/ManageChannelPage';

const MAX_ICEBREAKERS = 4;
const MAX_QUESTION_LEN = 80;
const MAX_PAYLOAD_LEN = 1000;

export const InstagramIceBreakersSection = ({
  channel,
}: {
  channel: ConnectedChannel;
}) => {
  const { socket } = useSocket();
  const { saving, saved, error: saveError, save } = useSave();

  const [items, setItems] = useState<IceBreakerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const nextItems = await ChannelApi.listIceBreakers(String(channel.id));
      setItems(nextItems ?? []);
      setDirty(false);
    } catch (err: any) {
      setLoadErr(err?.message ?? 'Failed to load ice-breakers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [channel.id]);

  useEffect(() => {
    if (!socket) return;

    const onChannelSync = (event: any) => {
      if (
        String(event?.channelId) === String(channel.id) &&
        event?.feature === 'instagram_icebreakers'
      ) {
        setSyncMsg(`Synced ${event?.synced ?? 0} ice-breakers`);
        void load();
      }
    };

    const onChannelConfig = (event: any) => {
      if (
        String(event?.channelId) === String(channel.id) &&
        event?.feature === 'instagram_icebreakers'
      ) {
        void load();
      }
    };

    socket.on('channel:sync', onChannelSync);
    socket.on('channel:config', onChannelConfig);
    return () => {
      socket.off('channel:sync', onChannelSync);
      socket.off('channel:config', onChannelConfig);
    };
  }, [channel.id, socket]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await ChannelApi.syncIceBreakers(String(channel.id));
      setSyncMsg(`Synced ${result?.synced ?? 0} ice-breakers`);
      await load();
      window.setTimeout(() => setSyncMsg(null), 3500);
    } catch (err: any) {
      setLoadErr(err?.message ?? 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const addItem = () => {
    if (items.length >= MAX_ICEBREAKERS) return;
    setItems((current) => [...current, { question: '', payload: '' }]);
    setDirty(true);
  };

  const updateItem = (
    index: number,
    field: keyof IceBreakerItem,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
    setDirty(true);
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setDirty(true);
  };

  const handleSave = () =>
    save(async () => {
      const invalid = items.some((item) => !item.question.trim());
      if (invalid) {
        return {
          success: false,
          error: 'All ice-breakers must have a question',
        };
      }
      const result = await ChannelApi.pushIceBreakers(String(channel.id), items);
      setDirty(false);
      return result;
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ice-Breakers</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Quick-reply buttons shown to new contacts when they open a
            conversation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncMsg ? (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-success)' }}
            >
              <Check size={12} />
              {syncMsg}
            </span>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={!syncing ? <RefreshCw size={13} /> : undefined}
            onClick={() => void handleSync()}
            loading={syncing}
            loadingMode="inline"
            loadingLabel="Syncing..."
          >
            Sync from Meta
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-indigo-500" />
        <p className="text-xs text-indigo-800">
          Ice-breakers are shown to contacts <strong>before</strong> they send
          their first message. You can add up to {MAX_ICEBREAKERS}. Changes are
          pushed live to Instagram when you save.
        </p>
      </div>

      {loadErr ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {loadErr}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Button
            variant="ghost"
            size="sm"
            loading
            loadingMode="inline"
            loadingLabel="Loading..."
          >
            Loading...
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ice-Breaker {index + 1}
                </span>
                <IconButton
                  icon={<Trash2 size={13} />}
                  aria-label={`Remove ice-breaker ${index + 1}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                />
              </div>
              <BaseInput
                label="Question"
                value={item.question}
                onChange={(event) =>
                  updateItem(index, 'question', event.target.value)
                }
                placeholder="What are your business hours?"
                maxLength={MAX_QUESTION_LEN}
                hint={`${item.question.length}/${MAX_QUESTION_LEN}`}
              />
              <BaseInput
                label="Payload"
                value={item.payload}
                onChange={(event) =>
                  updateItem(index, 'payload', event.target.value)
                }
                placeholder="business_hours_query"
                maxLength={MAX_PAYLOAD_LEN}
                hint="Optional - sent to your webhook"
              />
            </div>
          ))}

          {items.length < MAX_ICEBREAKERS ? (
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Plus size={15} />}
              onClick={addItem}
              className="border-dashed"
            >
              Add ice-breaker ({items.length}/{MAX_ICEBREAKERS})
            </Button>
          ) : null}

          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No ice-breakers configured. Add your first one above.
            </div>
          ) : null}
        </div>
      )}

      {dirty ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Info size={13} />
          Unsaved changes - click Save to push to Instagram
        </div>
      ) : null}

      <SaveButton
        saving={saving}
        saved={saved}
        error={saveError}
        onClick={handleSave}
        label="Save & Push to Instagram"
        disabled={!dirty && items.length === 0}
      />
    </div>
  );
};
