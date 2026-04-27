import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Globe,
  Info,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/ui/button/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { ChannelApi, MessengerMenuState } from "../../../lib/channelApi";
import { useSocket } from "../../../socket/socket-provider";
import {
  ConnectedChannel,
  SaveButton,
  useSave,
} from "../../channels/ManageChannelPage";

type MenuItemType = "payload" | "url" | "quick_reply";
type ActiveTab = "menu" | "get_started";

interface MenuItem {
  _id: string;
  actionType: MenuItemType;
  title: string;
  payload: string;
  url: string;
  replyText: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const ITEM_TYPE_OPTS: Array<{
  value: MenuItemType;
  label: string;
  icon: ReactNode;
}> = [
  {
    value: "payload",
    label: "Trigger payload",
    icon: <MessageSquare size={12} />,
  },
  {
    value: "quick_reply",
    label: "Send message",
    icon: <MessageCircle size={12} />,
  },
  {
    value: "url",
    label: "Open URL",
    icon: <Globe size={12} />,
  },
];

const tabOptions: Array<{ id: ActiveTab; label: string }> = [
  { id: "menu", label: "Persistent Menu" },
  { id: "get_started", label: "Get Started Button" },
];

const MenuItemRow = ({
  item,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
}: {
  item: MenuItem;
  onUpdate: (updates: Partial<MenuItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableMoveUp: boolean;
  disableMoveDown: boolean;
}) => {
  const valueLabel =
    item.actionType === "payload"
      ? "Payload"
      : item.actionType === "url"
        ? "URL"
        : "Reply Message";

  const value =
    item.actionType === "payload"
      ? item.payload
      : item.actionType === "url"
        ? item.url
        : item.replyText;

  const placeholder =
    item.actionType === "payload"
      ? "CONTACT_SUPPORT"
      : item.actionType === "url"
        ? "https://yoursite.com/support"
        : "Hi there, how can we help?";

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ITEM_TYPE_OPTS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={
                item.actionType === option.value ? "primary" : "secondary"
              }
              leftIcon={option.icon}
              onClick={() => onUpdate({ actionType: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<ArrowUp size={13} />}
            aria-label="Move menu item up"
            variant="ghost"
            disabled={disableMoveUp}
            onClick={onMoveUp}
          />
          <IconButton
            icon={<ArrowDown size={13} />}
            aria-label="Move menu item down"
            variant="ghost"
            disabled={disableMoveDown}
            onClick={onMoveDown}
          />
          <IconButton
            icon={<Trash2 size={13} />}
            aria-label="Remove menu item"
            variant="ghost"
            onClick={onRemove}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BaseInput
          label="Button Title"
          value={item.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
          placeholder="e.g. Contact Support"
          maxLength={30}
          hint={`${item.title.length}/30 chars`}
        />
        <BaseInput
          label={valueLabel}
          value={value}
          onChange={(event) =>
            onUpdate(
              item.actionType === "payload"
                ? { payload: event.target.value }
                : item.actionType === "url"
                  ? { url: event.target.value }
                  : { replyText: event.target.value },
            )
          }
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export const MessengerChatMenuSection = ({
  channel,
}: {
  channel: ConnectedChannel;
}) => {
  const { socket } = useSocket();
  const { saving, saved, error: saveError, save } = useSave();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [getStarted, setGetStarted] = useState("GET_STARTED");
  const [composerInputDisabled, setComposerInputDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");

  const load = async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const state = (await ChannelApi.listMessengerMenu(
        String(channel.id),
      )) as MessengerMenuState;
      const primaryLocale = state?.persistentMenu?.[0];
      const actions = primaryLocale?.call_to_actions ?? [];

      setMenuItems(
        actions.map((action: any) => ({
          _id: action.actionId ?? uid(),
          actionType:
            action.actionType ??
            (action.type === "web_url" ? "url" : "payload"),
          title: action.title,
          payload: action.payload ?? "",
          url: action.url ?? "",
          replyText: action.replyText ?? "",
        })),
      );
      setComposerInputDisabled(Boolean(primaryLocale?.composer_input_disabled));
      setGetStarted(state?.getStarted?.payload ?? "GET_STARTED");
      setDirty(false);
    } catch (error: any) {
      setLoadErr(error?.message ?? "Failed to load menu");
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
        event?.feature === "messenger_menu"
      ) {
        setSyncMsg("Synced from Meta");
        void load();
      }
    };

    const onChannelConfig = (event: any) => {
      if (
        String(event?.channelId) === String(channel.id) &&
        event?.feature === "messenger_menu"
      ) {
        void load();
      }
    };

    socket.on("channel:sync", onChannelSync);
    socket.on("channel:config", onChannelConfig);
    return () => {
      socket.off("channel:sync", onChannelSync);
      socket.off("channel:config", onChannelConfig);
    };
  }, [channel.id, socket]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      await ChannelApi.syncMessengerMenu(String(channel.id));
      setSyncMsg("Synced from Meta");
      await load();
    } catch (error: any) {
      setLoadErr(error?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
      window.setTimeout(() => setSyncMsg(null), 3500);
    }
  };

  const addItem = () => {
    if (menuItems.length >= 5) return;
    setMenuItems((current) => [
      ...current,
      {
        _id: uid(),
        actionType: "payload",
        title: "",
        payload: "",
        url: "",
        replyText: "",
      },
    ]);
    setDirty(true);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((current) =>
      current.map((item) => (item._id === id ? { ...item, ...updates } : item)),
    );
    setDirty(true);
  };

  const removeItem = (id: string) => {
    setMenuItems((current) => current.filter((item) => item._id !== id));
    setDirty(true);
  };

  const moveItem = (id: string, direction: -1 | 1) => {
    setMenuItems((current) => {
      const index = current.findIndex((item) => item._id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
    setDirty(true);
  };

  const handleSave = () =>
    save(async () => {
      if (activeTab === "get_started") {
        const state = await ChannelApi.pushGetStarted(
          String(channel.id),
          getStarted,
        );
        setDirty(false);
        return state;
      }

      const menu = [
        {
          locale: "default",
          composer_input_disabled: composerInputDisabled,
          call_to_actions: menuItems.map((item) => ({
            type: item.actionType === "url" ? "web_url" : "postback",
            title: item.title,
            payload: item.actionType === "payload" ? item.payload : undefined,
            url: item.actionType === "url" ? item.url : undefined,
            actionType: item.actionType,
            replyText:
              item.actionType === "quick_reply" ? item.replyText : undefined,
            actionId: item._id,
          })),
        },
      ];
      const state = await ChannelApi.pushMessengerMenu(
        String(channel.id),
        menu,
      );
      setDirty(false);
      return state;
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Chat Menu</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Persistent menu and Get Started button for Messenger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncMsg ? (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--color-success)" }}
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

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabOptions.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant="tab"
            selected={activeTab === tab.id}
            radius="none"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
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
      ) : activeTab === "menu" ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-indigo-500" />
            <p className="text-xs text-indigo-800">
              The persistent menu appears as a hamburger icon in Messenger. Add
              up to 5 buttons and decide whether typing is allowed.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <ToggleSwitch
              checked={composerInputDisabled}
              onChange={(checked) => {
                setComposerInputDisabled(checked);
                setDirty(true);
              }}
              label="Disable composer input"
            />
            <p className="mt-2 text-xs text-gray-500">
              Hide the text composer and guide people into menu actions.
            </p>
          </div>

          {menuItems.map((item, index) => (
            <MenuItemRow
              key={item._id}
              item={item}
              disableMoveDown={index === menuItems.length - 1}
              disableMoveUp={index === 0}
              onMoveDown={() => moveItem(item._id, 1)}
              onMoveUp={() => moveItem(item._id, -1)}
              onUpdate={(updates) => updateItem(item._id, updates)}
              onRemove={() => removeItem(item._id)}
            />
          ))}

          {menuItems.length < 5 ? (
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Plus size={15} />}
              onClick={addItem}
              className="border-dashed"
            >
              Add button ({menuItems.length}/5)
            </Button>
          ) : null}

          {menuItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No menu items yet. Add your first button above.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-indigo-500" />
            <p className="text-xs text-indigo-800">
              The Get Started button appears the first time someone opens a
              conversation with your page. The payload is sent to your webhook.
            </p>
          </div>
          <BaseInput
            label="Get Started Payload"
            value={getStarted}
            onChange={(event) => {
              setGetStarted(event.target.value);
              setDirty(true);
            }}
            placeholder="GET_STARTED"
            hint='This string is sent as a postback when users tap "Get Started"'
          />
        </div>
      )}

      {dirty ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Info size={13} />
          Unsaved changes
        </div>
      ) : null}

      <SaveButton
        saving={saving}
        saved={saved}
        error={saveError}
        onClick={handleSave}
        label="Save & Push to Messenger"
        disabled={activeTab === "menu" && menuItems.length === 0}
      />
    </div>
  );
};
