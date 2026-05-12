import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Phone,
  CheckCircle2,
  LockOpen,
  MoreVertical,
} from "@/components/ui/icons";
import type { Conversation } from "./types";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useInbox } from "../../context/InboxContext";
import { FeatureGate, useFeatureFlags } from "../../context/FeatureFlagContext";
import { inboxApi } from "../../lib/inboxApi";
import { useCall } from "../../context/CallContext";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import {
  AssigneeSelectMenu,
  LifecycleSelectMenu,
} from "../../components/ui/select";
import { Tooltip } from "../../components/ui/Tooltip";
import { IconButton } from "../../components/ui/button/IconButton";
import { ActionMenu, type ActionMenuEntry } from "../../components/ui/menu";
import { AiConversationBadges } from "../../modules/ai-agents/components/AiConversationBadges";
import { BackButton } from "../../components/channels/BackButton";

interface ChatHeaderProps {
  selectedConversation: Conversation;
  snoozedUntil: string | null;
  onSnooze: (value: string) => void;
  onUnsnooze: () => void;
  chatStatus: "open" | "closed";
  msgSearchOpen: boolean;
  onToggleMsgSearch: () => void;
  onBack?: () => void;
  onOpenContactDetails?: () => void;
}

export type ConvStatus = "open" | "closed";
export type ConvPriority = "low" | "normal" | "high" | "urgent";
export type Direction = "incoming" | "outgoing";

export function ChatHeader({
  selectedConversation,
  msgSearchOpen,
  onToggleMsgSearch,
  onBack,
  onOpenContactDetails,
}: ChatHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState<"open" | "closed" | null>(null);

  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const { workspaceUsers } = useWorkspace();
  const {
    assignUser,
    closeConversation,
    openConversation,
    lifecycles,
    fetchLifecycles,
    sendMessage,
    selectedChannel,
  } = useInbox();
  const { flags } = useFeatureFlags();
  const showLifecycleToolbar = flags.lifecycle;
  const { startOutgoingCall } = useCall();

  useEffect(() => {
    fetchLifecycles();
  }, [fetchLifecycles]);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    setChatStatus(
      (selectedConversation?.contact?.status as
        | "open"
        | "closed"
        | undefined) ?? null,
    );
  }, [selectedConversation, selectedConversation?.contact?.status]);

  const assignee = useMemo(
    () =>
      workspaceUsers?.find(
        (user) => user.id === selectedConversation?.contact?.assigneeId,
      ) || null,
    [workspaceUsers, selectedConversation?.contact?.assigneeId],
  );

  const contactName =
    [
      selectedConversation?.contact?.firstName,
      selectedConversation?.contact?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Contact";
  const mobileContactName =
    contactName.length > 20 ? `${contactName.slice(0, 7)}...` : contactName;
  const fallbackLifecycleName =
    selectedConversation?.contact?.lifecycleStage?.trim() || "";
  const mobileStatusLabel =
    chatStatus === "closed" ? "Open conversation" : "Close conversation";
  const desktopSearchButtonVariant = msgSearchOpen ? "soft-primary" : "ghost";
  const mobileMenuButtonVariant = mobileMenuOpen ? "soft" : "secondary";

  const handleStatusAction = async (status: ConvStatus) => {
    setChatStatus(null);
    setMobileMenuOpen(false);

    if (status === "closed") {
      await closeConversation();
      return;
    }

    if (status === "open") {
      await openConversation();
    }
  };

  const handleAssign = async (userId: string | null) => {
    await assignUser(userId);
  };

  const handleLifecycleChange = async (stageId: string | number | null) => {
    await inboxApi.updateContactLifecycle(
      String(selectedConversation.contact.id),
      stageId === null ? "" : String(stageId),
    );
  };

  const handleStartCall = async () => {
    if (!selectedChannel || selectedChannel.type !== "exotel_call") {
      return;
    }

    const phone = selectedConversation?.contact?.phone;
    if (!phone) {
      return;
    }

    startOutgoingCall({
      name:
        `${selectedConversation?.contact?.firstName ?? ""} ${selectedConversation?.contact?.lastName ?? ""}`.trim() ||
        "Contact",
      phone,
      isKnown: true,
    });

    await sendMessage({
      text: "",
      metadata: {
        mode: "voice_call",
        to: phone,
      },
    });
  };
  const mobileActionItems: ActionMenuEntry[] = [
    {
      id: "search-messages",
      label: "Search messages",
      icon: <Search size={16} />,
      onSelect: onToggleMsgSearch,
    },
    ...(selectedChannel?.type === "exotel_call"
      ? [
          {
            id: "start-call",
            label: "Start call",
            icon: <Phone size={16} />,
            onSelect: () => {
              void handleStartCall();
            },
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-[4.25rem] shrink-0 flex-col gap-0.5 border-b border-[#e7ebf3] bg-white px-2 py-1 sm:px-4 md:h-16 md:min-h-[4rem] md:flex-row md:flex-nowrap md:items-center md:gap-3 md:px-5 md:py-0">
      <div className="flex w-full min-w-0 items-center gap-1 sm:gap-2 md:contents">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3 md:gap-3.5">
          {onBack ? (
            <BackButton ariaLabel="Back to inbox" onClick={onBack}  size="sm"/>
          ) : null}

          <div className="relative">
            {onOpenContactDetails ? (
              <>
                <Button
                  type="button"
                  onClick={onOpenContactDetails}
                  iconOnly
                  variant="ghost"
                  size="sm"
                  radius="full"
                  className="md:hidden"
                  aria-label="Open contact details"
                >
                  <Avatar
                    src={selectedConversation?.contact?.avatarUrl}
                    name={contactName}
                    size="sm"
                    fallbackTone="neutral"
                  />
                </Button>
                <Tooltip content="Open contact details">
                  <Button
                    type="button"
                    onClick={onOpenContactDetails}
                    iconOnly
                    variant="ghost"
                    size="md"
                    radius="full"
                    className="hidden md:inline-flex"
                    aria-label="Open contact details"
                  >
                    <Avatar
                      src={selectedConversation?.contact?.avatarUrl}
                      name={contactName}
                      size="base"
                      fallbackTone="neutral"
                    />
                  </Button>
                </Tooltip>
              </>
            ) : (
              <>
                <span className="md:hidden">
                  <Avatar
                    src={selectedConversation?.contact?.avatarUrl}
                    name={contactName}
                    size="sm"
                    fallbackTone="neutral"
                  />
                </span>
                <span className="hidden md:inline-flex">
                  <Avatar
                    src={selectedConversation?.contact?.avatarUrl}
                    name={contactName}
                    size="md"
                    fallbackTone="neutral"
                  />
                </span>
              </>
            )}
          </div>

          <div className="min-w-0 max-w-[calc(100%-9rem)] flex-1 md:max-w-none">
            {onOpenContactDetails ? (
              <div className="flex min-w-0 max-w-full flex-col items-start text-left md:hidden">
                <button
                  type="button"
                  onClick={onOpenContactDetails}
                  className="block min-w-0 max-w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1"
                  aria-label="Open contact details"
                >
                <span className="block min-w-0 max-w-full whitespace-nowrap text-[14px] font-semibold leading-tight text-gray-900">
                  {mobileContactName}
                </span>
                </button>
              </div>
            ) : null}

            <div
              className={`${onOpenContactDetails ? "hidden md:flex" : "flex"} min-w-0 flex-col gap-0`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-950 sm:text-base md:text-[17px]">
                  {contactName}
                </h3>
                <AiConversationBadges
                  conversationId={selectedConversation?.id}
                />
              </div>
              <FeatureGate flag="lifecycle">
                <LifecycleSelectMenu
                  value={selectedConversation?.contact?.lifecycleId}
                  stages={lifecycles ?? []}
                  onChange={(stageId) => {
                    void handleLifecycleChange(stageId);
                  }}
                  fallbackLabel={fallbackLifecycleName || undefined}
                  variant="inline"
                  className="mt-0.5 hidden md:block text-gray-500"
                />
              </FeatureGate>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1 md:ml-auto md:w-auto md:flex-nowrap md:justify-end md:gap-2">
          <div className="hidden max-w-[13.5rem] md:block">
            <AssigneeSelectMenu
              value={assignee?.id ?? null}
              selectedUser={assignee}
              users={workspaceUsers ?? []}
              onChange={(userId) => {
                void handleAssign(userId);
              }}
              variant="toolbar"
              fullWidth
              searchable
              triggerClassName="max-w-[13.5rem]"
            />
          </div>

          <Button
            type="button"
            onClick={() =>
              void handleStatusAction(
                chatStatus === "closed" ? "open" : "closed",
              )
            }
            iconOnly
            variant="secondary"
            className="md:hidden"
            aria-label={mobileStatusLabel}
          >
            {chatStatus === "closed" ? (
              <LockOpen size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </Button>

          <Tooltip content="Search messages">
            <IconButton
              type="button"
              onClick={onToggleMsgSearch}
              variant={desktopSearchButtonVariant}
              size="sm"
              className="hidden md:inline-flex"
              aria-label="Search messages"
              icon={<Search size={18} />}
            />
          </Tooltip>

          {selectedChannel?.type === "exotel_call" ? (
            <Tooltip content="Start call">
              <Button
                type="button"
                onClick={handleStartCall}
                iconOnly
                variant="secondary"
                className="hidden md:inline-flex"
                aria-label="Start call"
              >
                <Phone size={18} />
              </Button>
            </Tooltip>
          ) : null}

          <div className="relative hidden md:block">
            {chatStatus === "closed" ? (
              <Button
                type="button"
                onClick={() => void handleStatusAction("open")}
                variant="secondary"
                leftIcon={<LockOpen size={16} />}
                className="border-gray-300 bg-white text-gray-700 shadow-sm"
              >
                Open
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleStatusAction("closed")}
                variant="secondary"
                leftIcon={<CheckCircle2 size={16} />}
                className="border-gray-300 bg-white text-gray-700 shadow-sm"
              >
                Close
              </Button>
            )}
          </div>

          <div className="relative md:hidden">
            <IconButton
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              variant={mobileMenuButtonVariant}
              size="sm"
              aria-label="More actions"
              icon={<MoreVertical size={16} />}
            />

            <ActionMenu
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
              anchorRef={mobileMenuButtonRef}
              items={mobileActionItems}
              align="end"
              width="sm"
              ariaLabel="Conversation actions"
            />
          </div>
        </div>
      </div>

      <div
        className={`w-full min-w-0 items-center border-t border-gray-100 md:hidden ${
          showLifecycleToolbar
            ? "grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]"
            : "block"
        }`}
      >
        <FeatureGate flag="lifecycle">
          <>
            <div className="min-w-0 py-0.5 pr-2">
              <LifecycleSelectMenu
                value={selectedConversation?.contact?.lifecycleId}
                stages={lifecycles ?? []}
                onChange={(stageId) => {
                  void handleLifecycleChange(stageId);
                }}
                fallbackLabel={fallbackLifecycleName || undefined}
                variant="inline"
                className="min-w-0 w-full"
                fullWidth
                triggerClassName="w-full min-h-[1.75rem] rounded-lg px-2 py-0.5 text-[13px]"
                mobileSheetTitle="Select lifecycle"
                mobileSheetSubtitle={contactName}
              />
            </div>

            <div aria-hidden="true" className="h-6 bg-gray-200" />
          </>
        </FeatureGate>

        <div className={`min-w-0 py-0.5 ${showLifecycleToolbar ? "pl-2" : ""}`}>
          <AssigneeSelectMenu
            value={assignee?.id ?? null}
            selectedUser={assignee}
            users={workspaceUsers ?? []}
            onChange={(userId) => {
              void handleAssign(userId);
            }}
            variant="toolbar"
            className="min-w-0 w-full"
            fullWidth
            searchable
            mobileSheetTitle="Assign conversation"
            mobileSheetSubtitle={contactName}
            triggerClassName="w-full max-w-none min-h-[1.75rem] rounded-lg px-2 py-0.5 text-[13px]"
          />
        </div>
      </div>
    </div>
  );
}
