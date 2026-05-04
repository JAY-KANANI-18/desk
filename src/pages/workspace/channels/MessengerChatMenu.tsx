import { useEffect, useRef, useState, type ReactNode } from "react";
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
} from "@/components/ui/icons";
import { Button } from "../../../components/ui/button/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { CountBadge } from "../../../components/ui/CountBadge";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { ButtonSelectMenu } from "../../../components/ui/select/ButtonSelectMenu";
import type { CompactSelectMenuGroup } from "../../../components/ui/select/CompactSelectMenu";
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
const MENU_ITEM_HIGHLIGHT_MS = 2600;

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
  description: string;
  icon: ReactNode;
}> = [
  {
    value: "payload",
    label: "Trigger payload",
    description: "Send a postback payload to automation.",
    icon: <MessageSquare size={12} />,
  },
  {
    value: "quick_reply",
    label: "Send message",
    description: "Send a configured Messenger reply.",
    icon: <MessageCircle size={12} />,
  },
  {
    value: "url",
    label: "Open URL",
    description: "Open a web link from Messenger.",
    icon: <Globe size={12} />,
  },
];

const ITEM_TYPE_GROUPS: CompactSelectMenuGroup[] = [
  {
    options: ITEM_TYPE_OPTS.map((option) => ({
      value: option.value,
      label: option.label,
      description: option.description,
      leading: option.icon,
    })),
  },
];

function getItemTypeOption(actionType: MenuItemType) {
  return (
    ITEM_TYPE_OPTS.find((option) => option.value === actionType) ??
    ITEM_TYPE_OPTS[0]
  );
}

const tabOptions: Array<{ id: ActiveTab; label: string }> = [
  { id: "menu", label: "Persistent Menu" },
  { id: "get_started", label: "Get Started Button" },
];

const MenuItemRow = ({
  item,
  position,
  highlighted,
  cardRef,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
}: {
  item: MenuItem;
  position: number;
  highlighted: boolean;
  cardRef: (node: HTMLDivElement | null) => void;
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
  const selectedType = getItemTypeOption(item.actionType);

  return (
    <div
      ref={cardRef}
      className={`scroll-mt-24 rounded-lg border p-4 transition-colors duration-700 ${
        highlighted
          ? "border-[var(--color-primary-light)] bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary-light)]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Button {position}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {item.title.trim() || "Untitled menu button"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {selectedType.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          <ButtonSelectMenu
            value={item.actionType}
            groups={ITEM_TYPE_GROUPS}
            onChange={(value) =>
              onUpdate({ actionType: value as MenuItemType })
            }
            label={selectedType.label}
            leftIcon={selectedType.icon}
            variant="secondary"
            dropdownWidth="md"
            mobileSheet
            mobileSheetTitle="Button action"
            mobileSheetSubtitle="Choose what this Messenger button should do"
          />
          <div className="flex items-center gap-1">
            <IconButton
              icon={<ArrowUp size={13} />}
              aria-label="Move menu item up"
              variant="ghost"
              size="sm"
              disabled={disableMoveUp}
              onClick={onMoveUp}
            />
            <IconButton
              icon={<ArrowDown size={13} />}
              aria-label="Move menu item down"
              variant="ghost"
              size="sm"
              disabled={disableMoveDown}
              onClick={onMoveDown}
            />
            <IconButton
              icon={<Trash2 size={13} />}
              aria-label="Remove menu item"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
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
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const menuItemRefs = useRef(new Map<string, HTMLDivElement>());

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

  useEffect(() => {
    if (!highlightedItemId) return;

    const frameId = window.requestAnimationFrame(() => {
      menuItemRefs.current.get(highlightedItemId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    const timeoutId = window.setTimeout(() => {
      setHighlightedItemId((current) =>
        current === highlightedItemId ? null : current,
      );
    }, MENU_ITEM_HIGHLIGHT_MS);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [highlightedItemId, menuItems.length]);

  const addItem = (actionType: MenuItemType) => {
    if (menuItems.length >= 5) return;
    const itemId = uid();
    setMenuItems((current) => [
      ...current,
      {
        _id: itemId,
        actionType,
        title: "",
        payload: "",
        url: "",
        replyText: "",
      },
    ]);
    setHighlightedItemId(itemId);
    setDirty(true);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((current) =>
      current.map((item) => (item._id === id ? { ...item, ...updates } : item)),
    );
    setDirty(true);
  };

  const removeItem = (id: string) => {
    setHighlightedItemId((current) => (current === id ? null : current));
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Chat Menu</h2>
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
        <div className="flex items-center gap-2 border-l border-red-300 pl-3 text-xs text-red-600">
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
          <div className="flex items-start gap-2.5 border-l border-[var(--color-primary-light)] pl-3">
            <Info size={15} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
            <p className="text-sm text-gray-600">
              The persistent menu appears as a hamburger icon in Messenger. Add
              up to 5 buttons and decide whether typing is allowed.
            </p>
          </div>

          <div className="border-y border-gray-100 py-3">
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

          {menuItems.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Menu button cards
                  </p>
                  <CountBadge count={menuItems.length} tone="neutral" size="sm" />
                </div>
                <span className="text-xs text-gray-400">
                  Up to 5 buttons
                </span>
              </div>

              {menuItems.map((item, index) => (
                <MenuItemRow
                  key={item._id}
                  item={item}
                  position={index + 1}
                  highlighted={highlightedItemId === item._id}
                  cardRef={(node) => {
                    if (node) {
                      menuItemRefs.current.set(item._id, node);
                    } else {
                      menuItemRefs.current.delete(item._id);
                    }
                  }}
                  disableMoveDown={index === menuItems.length - 1}
                  disableMoveUp={index === 0}
                  onMoveDown={() => moveItem(item._id, 1)}
                  onMoveUp={() => moveItem(item._id, -1)}
                  onUpdate={(updates) => updateItem(item._id, updates)}
                  onRemove={() => removeItem(item._id)}
                />
              ))}
            </div>
          ) : null}

          {menuItems.length < 5 ? (
            <ButtonSelectMenu
              value=""
              groups={ITEM_TYPE_GROUPS}
              onChange={(value) => addItem(value as MenuItemType)}
              label={`Add button (${menuItems.length}/5)`}
              leftIcon={<Plus size={15} />}
              variant="dashed"
              size="sm"
              dropdownWidth="md"
              mobileSheet
              mobileSheetTitle="Add menu button"
              mobileSheetSubtitle="Choose what this Messenger button should do"
            />
          ) : null}

          {menuItems.length === 0 ? (
            <p className="border-y border-dashed border-gray-200 py-6 text-sm text-gray-400">
              No menu items yet. Add your first button above.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 border-l border-[var(--color-primary-light)] pl-3">
            <Info size={15} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
            <p className="text-sm text-gray-600">
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
        <div className="flex items-center gap-2 border-l border-amber-300 pl-3 text-xs text-amber-700">
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
