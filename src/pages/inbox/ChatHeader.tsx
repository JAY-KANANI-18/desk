import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Search,
  Phone,
  ChevronDown,
  ChevronLeft,
  UserCircle2,
  CheckCircle2,
  LockOpen,
  MoreVertical,
} from "lucide-react";
import type { Conversation } from "./types";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useInbox } from "../../context/InboxContext";
import { inboxApi } from "../../lib/inboxApi";
import { useCall } from "../../context/CallContext";
import { MobileSheet } from "../../components/ui/modal";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  CompactSelectMenu,
  type CompactSelectMenuGroup,
} from "../../components/ui/select";
import { Tooltip } from "../../components/ui/Tooltip";
import { IconButton } from "../../components/ui/button/IconButton";
import { AiConversationBadges } from "../../modules/ai-agents/components/AiConversationBadges";

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

interface LifecycleStage {
  id: string | number;
  name: string;
  emoji: string;
  type: "lifecycle" | "lost";
}

interface LifecycleSelectorProps {
  currentStageId: string | number | null | undefined;
  lifecycles: LifecycleStage[];
  onSelect: (stageId: string | number | null) => Promise<void>;
  fallbackLabel?: string;
  className?: string;
}

const NO_STAGE_VALUE = "__no-stage__";
const UNASSIGNED_VALUE = "__unassigned__";

function ActionListButton({
  selected,
  tone = "primary",
  onClick,
  leading,
  title,
  subtitle,
  subtitleTone = "default",
  trailing,
}: {
  selected: boolean;
  tone?: "primary" | "warning" | "neutral";
  onClick: () => void;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleTone?: "default" | "muted" | "success" | "warning";
  trailing?: ReactNode;
}) {
  const selectedVariant =
    tone === "warning"
      ? "soft-warning"
      : tone === "neutral"
        ? "soft"
        : "soft-primary";

  return (
    <Button
      type="button"
      onClick={onClick}
      variant={selected ? selectedVariant : "ghost"}
   
      fullWidth
      contentAlign="start"
    >
      <div className="flex w-full items-center gap-3 text-left">
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm font-medium ${
              selected
                ? tone === "warning"
                  ? "text-[#c2410c]"
                  : tone === "neutral"
                    ? "text-gray-700"
                    : "text-indigo-700"
                : "text-gray-800"
            }`}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              className={`mt-0.5 truncate text-xs ${
                subtitleTone === "success"
                  ? "text-green-600"
                  : subtitleTone === "warning"
                    ? "text-[#c2410c]"
                    : subtitleTone === "muted"
                      ? "text-gray-400"
                      : "text-gray-500"
              }`}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </div>
    </Button>
  );
}

function LifecycleSelector({
  currentStageId,
  lifecycles,
  onSelect,
  fallbackLabel,
  className,
}: LifecycleSelectorProps) {
  const current = lifecycles.find(
    (lifecycle) => String(lifecycle.id) === String(currentStageId),
  );
  const lifecycleStages = lifecycles.filter(
    (lifecycle) => lifecycle.type === "lifecycle",
  );
  const lostStages = lifecycles.filter(
    (lifecycle) => lifecycle.type === "lost",
  );
  const selectedValue =
    currentStageId === null || currentStageId === undefined
      ? NO_STAGE_VALUE
      : String(currentStageId);
  const triggerLabel =
    current?.name || fallbackLabel || "No stage";
  const hasLifecycleValue =
    currentStageId !== null && currentStageId !== undefined
      ? true
      : Boolean(fallbackLabel);
  const menuGroups = useMemo<CompactSelectMenuGroup[]>(
    () => [
      {
        options: [
          {
            value: NO_STAGE_VALUE,
            label: "No stage",
            leading: <span className="w-4 text-center leading-none">-</span>,
            tone: "neutral",
            alwaysVisible: true,
          },
        ],
      },
      ...(lifecycleStages.length > 0
        ? [
            {
              label: "Lifecycle",
              options: lifecycleStages.map((stage) => ({
                value: String(stage.id),
                label: stage.name,
                leading: (
                  <span className="w-4 text-center text-sm leading-none">
                    {stage.emoji}
                  </span>
                ),
                tone: "primary" as const,
                searchText: `${stage.name} ${stage.emoji}`,
              })),
            },
          ]
        : []),
      ...(lostStages.length > 0
        ? [
            {
              label: "Lost",
              options: lostStages.map((stage) => ({
                value: String(stage.id),
                label: stage.name,
                leading: (
                  <span className="w-4 text-center text-sm leading-none">
                    {stage.emoji}
                  </span>
                ),
                tone: "warning" as const,
                searchText: `${stage.name} ${stage.emoji}`,
              })),
            },
          ]
        : []),
    ],
    [lifecycleStages, lostStages],
  );

  return (
    <CompactSelectMenu
      value={selectedValue}
      groups={menuGroups}
      onChange={(value) => {
        void onSelect(value === NO_STAGE_VALUE ? null : value);
      }}
      triggerAppearance="inline"
      size="sm"
      hasValue={hasLifecycleValue}
      dropdownWidth="md"
      triggerClassName={className}
      emptyMessage="No stages configured"
      triggerContent={
        <span className="flex min-w-0 items-center gap-1.5">
          {current?.emoji ? (
            <span className="text-sm leading-none">{current.emoji}</span>
          ) : null}
          <span
            className={`truncate text-sm font-medium ${
              current?.type === "lost"
                ? "text-[#c2410c]"
                :"text-[var(--color-gray-500)]"
            }`}
          >
            {triggerLabel}
          </span>
        </span>
      }
    />
  );
}

export function ChatHeader({
  selectedConversation,
  msgSearchOpen,
  onToggleMsgSearch,
  onBack,
  onOpenContactDetails,
}: ChatHeaderProps) {
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState<"open" | "closed" | null>(null);

  const assignSheetRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
  const { startOutgoingCall } = useCall();

  useEffect(() => {
    fetchLifecycles();
  }, [fetchLifecycles]);

  const filteredMembers =
    workspaceUsers?.filter(
      (member) => {
        const normalizedQuery = assignSearch.toLowerCase();
        return [
          member?.firstName,
          member?.lastName,
          member?.email,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      },
    ) || [];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    setChatStatus(
      (selectedConversation?.contact?.status as "open" | "closed" | undefined) ??
        null,
    );
  }, [selectedConversation, selectedConversation?.contact?.status]);

  const assignee = useMemo(
    () =>
      workspaceUsers?.find(
        (user) => user.id === selectedConversation?.contact?.assigneeId,
      ) || null,
    [workspaceUsers, selectedConversation?.contact?.assigneeId],
  );

  const currentLifecycle = useMemo(
    () =>
      (lifecycles ?? []).find(
        (stage: LifecycleStage) =>
          String(stage.id) === String(selectedConversation?.contact?.lifecycleId),
      ) ?? null,
    [lifecycles, selectedConversation?.contact?.lifecycleId],
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
    contactName.length > 7 ? `${contactName.slice(0, 7)}...` : contactName;
  const assigneeDisplayName = assignee
    ? [assignee.firstName, assignee.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || assignee.email || "Assigned"
    : "Unassigned";
  const fallbackLifecycleName =
    selectedConversation?.contact?.lifecycleStage?.trim() || "";
  const mobileLifecycleLabel = currentLifecycle
    ? `${currentLifecycle.emoji} ${currentLifecycle.name}`
    : fallbackLifecycleName
      ? `Lifecycle: ${fallbackLifecycleName}`
      : "Lifecycle details";
  const mobileStatusLabel =
    chatStatus === "closed" ? "Open conversation" : "Close conversation";
  const assigneeTriggerVisual =
    assignee === null ? (
      <UserCircle2 size={18} className="text-gray-400" />
    ) : (
      <Avatar
        src={assignee.avatarUrl}
        name={assigneeDisplayName}
        size="xs"
      />
    );
  const assigneeMenuGroups = useMemo<CompactSelectMenuGroup[]>(
    () => [
      {
        options: [
          {
            value: UNASSIGNED_VALUE,
            label: "Unassigned",
            leading: <UserCircle2 size={18} className="text-gray-400" />,
            tone: "primary",
            alwaysVisible: true,
          },
        ],
      },
      ...(workspaceUsers && workspaceUsers.length > 0
        ? [
            {
              label: "Agents",
              options: workspaceUsers.map((member) => {
                const memberName =
                  `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim() ||
                  member?.email ||
                  "User";

                return {
                  value: member.id,
                  label: memberName,
                  description:
                    member?.activityStatus === "online" ? "Online" : "Offline",
                  descriptionTone:
                    member?.activityStatus === "online" ? "success" : "muted",
                  leading: (
                    <Avatar
                      src={member.avatarUrl}
                      name={memberName}
                      size="sm"
                    />
                  ),
                  tone: "primary" as const,
                  searchText: `${memberName} ${member?.email ?? ""}`,
                };
              }),
            },
          ]
        : []),
    ],
    [workspaceUsers],
  );
  const desktopSearchButtonVariant = msgSearchOpen
    ? "soft-primary"
    : "ghost";
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
    setAssignSheetOpen(false);
    setAssignSearch("");
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

  return (
    <div className="flex min-h-[3rem] shrink-0 flex-nowrap items-center gap-1.5 border-b border-gray-200 bg-white px-2 py-1.5 sm:gap-2 sm:px-4 md:min-h-[3.75rem] md:flex-wrap md:px-6 md:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onBack ? (
          <Button
            type="button"
            onClick={onBack}
            iconOnly
            variant="secondary"
           
            className="md:hidden"
            aria-label="Back to inbox"
          >
            <ChevronLeft size={16} />
          </Button>
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
              <span className="block min-w-0 max-w-full whitespace-nowrap text-[14px] font-semibold leading-tight text-gray-900">
                {mobileContactName}
              </span>
              <LifecycleSelector
                currentStageId={selectedConversation?.contact?.lifecycleId}
                lifecycles={lifecycles ?? []}
                onSelect={handleLifecycleChange}
                fallbackLabel={fallbackLifecycleName || undefined}
                className="mt-0.5"
              />
            </div>
          ) : null}

          <div
            className={`${onOpenContactDetails ? "hidden md:flex" : "flex"} min-w-0 flex-col gap-0`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
                {contactName}
              </h3>
              <AiConversationBadges conversationId={selectedConversation?.id} />
        </div>
            <LifecycleSelector
              currentStageId={selectedConversation?.contact?.lifecycleId}
              lifecycles={lifecycles ?? []}
              onSelect={handleLifecycleChange}
              fallbackLabel={fallbackLifecycleName || undefined}
              className="mt-0.5"
            />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1 md:ml-auto md:w-auto md:flex-wrap md:justify-end md:gap-2">
        <Button
          type="button"
          onClick={() => {
            setAssignSheetOpen(true);
            setAssignSearch("");
          }}
          variant="secondary"
          size="sm"
          radius="lg"
          iconOnly
          className="md:hidden"
          aria-label={`Assign conversation, current assignee: ${assigneeDisplayName}`}
        >
          {assigneeTriggerVisual}
        </Button>

        <div className="hidden  md:block">
          <CompactSelectMenu
            value={assignee?.id ?? UNASSIGNED_VALUE}
            groups={assigneeMenuGroups}
            onChange={(value) => {
              void handleAssign(value === UNASSIGNED_VALUE ? null : value);
            }}
            fullWidth
            searchable
            searchPlaceholder="Search agents or teams..."
            emptyMessage="No agents found."
            triggerAppearance="toolbar"
            size="sm"
            dropdownWidth="lg"
            triggerContent={
              <span className="flex min-w-0 items-center gap-2.5">
                {assigneeTriggerVisual}
                <span
                  className={`truncate ${
                    assignee === null ? "text-gray-500" : "text-gray-700"
                  }`}
                >
                  {assigneeDisplayName}
                </span>
              </span>
            }
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
            >
              Open
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleStatusAction("closed")}
              variant="secondary"
             
              leftIcon={<CheckCircle2 size={16} />}
            >
              Close
            </Button>
          )}
        </div>

        <div className="relative md:hidden" ref={mobileMenuRef}>
          <IconButton
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            variant={mobileMenuButtonVariant}
            size="sm"
            aria-label="More actions"
            icon={<MoreVertical size={16} />}
          />

          {mobileMenuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
              <div className="space-y-0.5">
                <ActionListButton
                  selected={msgSearchOpen}
                  onClick={() => {
                    onToggleMsgSearch();
                    setMobileMenuOpen(false);
                  }}
                  leading={<Search size={16} />}
                  title="Search messages"
                />

                {selectedChannel?.type === "exotel_call" ? (
                  <ActionListButton
                    selected={false}
                    onClick={handleStartCall}
                    leading={<Phone size={16} />}
                    title="Start call"
                  />
                ) : null}

                {onOpenContactDetails ? (
                  <ActionListButton
                    selected={false}
                    onClick={() => {
                      onOpenContactDetails();
                      setMobileMenuOpen(false);
                    }}
                    leading={<ChevronDown size={16} />}
                    title={mobileLifecycleLabel}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <MobileSheet
        isOpen={assignSheetOpen}
        onClose={() => {
          setAssignSheetOpen(false);
          setAssignSearch("");
        }}
        title={
          <div>
            <p className="text-base font-semibold text-gray-900">
              Assign conversation
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {contactName}
            </p>
          </div>
        }
      >
        <div className="p-4" ref={assignSheetRef}>
          <Input
            autoFocus
            type="search"
            value={assignSearch}
            onChange={(event) => setAssignSearch(event.target.value)}
            placeholder="Search agents or teams..."
            leftIcon={<Search size={16} />}
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 p-1.5">
            {!assignSearch ? (
              <ActionListButton
                selected={assignee === null}
                onClick={() => {
                  void handleAssign(null);
                }}
                leading={
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    <UserCircle2 size={20} className="text-gray-400" />
                  </span>
                }
                title="Unassigned"
                trailing={
                  assignee === null ? (
                    <CheckCircle2 size={16} className="text-indigo-600" />
                  ) : undefined
                }
              />
            ) : null}

            {filteredMembers.length > 0 ? (
              <>
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Agents
                  </span>
                </div>

                {filteredMembers.map((member) => {
                  const isSelected = assignee?.id === member.id;
                  const memberName =
                    `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim() ||
                    member?.email ||
                    "User";

                  return (
                    <ActionListButton
                      key={member.id}
                      selected={isSelected}
                      onClick={() => {
                        void handleAssign(member.id);
                      }}
                      leading={
                        <Avatar
                          src={member.avatarUrl}
                          name={memberName}
                          size="md"
                          showStatus
                          statusColor={
                            member?.activityStatus === "online"
                              ? "var(--color-success)"
                              : "var(--color-gray-300)"
                          }
                        />
                      }
                      title={memberName}
                      subtitle={
                        member?.activityStatus === "online" ? "Online" : "Offline"
                      }
                      subtitleTone={
                        member?.activityStatus === "online" ? "success" : "muted"
                      }
                      trailing={
                        isSelected ? (
                          <CheckCircle2
                            size={16}
                            className="shrink-0 text-indigo-600"
                          />
                        ) : undefined
                      }
                    />
                  );
                })}
              </>
            ) : null}

            {filteredMembers.length === 0 ? (
              <p className="bg-white py-8 text-center text-sm text-gray-400">
                No results
              </p>
            ) : null}
          </div>
        </div>
      </MobileSheet>
    </div>
  );
}
