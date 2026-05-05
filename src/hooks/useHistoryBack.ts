import { useEffect, useRef, type MutableRefObject } from "react";

type StackEntry = {
  id: string;
  entryKey: string;
  isOpenRef: MutableRefObject<boolean>;
  closeFromHistory: () => void;
};

type SheetHistoryEntry = {
  id?: string;
  entryKey?: string;
};

type PendingHistoryCleanup = {
  id: string;
  entryKey?: string;
  timeout: ReturnType<typeof setTimeout>;
};

const SHEET_HASH_PREFIX = "sheet-";
const INTERNAL_HISTORY_POP_TIMEOUT_MS = 1000;
const SHEET_HISTORY_POP_SUPPRESSION_MS = 1200;

const stack: StackEntry[] = [];
let listenerRegistered = false;
let entrySequence = 0;
let pendingHistoryCleanup: PendingHistoryCleanup | null = null;
let internalHistoryPopTimeout: ReturnType<typeof setTimeout> | null = null;
let sheetHistoryPopSuppressedUntil = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function createSheetId() {
  return `${SHEET_HASH_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
}

function createEntryKey(id: string) {
  entrySequence += 1;
  return `${id}-${entrySequence}`;
}

function getBaseUrl() {
  return `${window.location.pathname}${window.location.search}`;
}

function getSheetUrl(id: string) {
  return `${getBaseUrl()}#${id}`;
}

function readCurrentSheetEntry(): SheetHistoryEntry {
  const state = isRecord(window.history.state) ? window.history.state : {};
  const stateId = readString(state.sheetId);
  const hashId = window.location.hash.slice(1);
  const id =
    stateId ??
    (hashId.startsWith(SHEET_HASH_PREFIX) ? hashId : undefined);

  return {
    id,
    entryKey: readString(state.sheetEntryKey),
  };
}

function getHistoryStateWithoutSheet() {
  const state = isRecord(window.history.state) ? window.history.state : {};
  const nextState: Record<string, unknown> = {};

  Object.entries(state).forEach(([key, value]) => {
    if (
      key !== "mobileSheet" &&
      key !== "sheetId" &&
      key !== "sheetEntryKey"
    ) {
      nextState[key] = value;
    }
  });

  return nextState;
}

function removeStackEntry(id: string) {
  const index = stack.findIndex((entry) => entry.id === id);
  if (index === -1) return undefined;

  const [entry] = stack.splice(index, 1);
  return entry;
}

function hasStackEntry(id: string) {
  return stack.some((entry) => entry.id === id);
}

function findStackEntry(id: string) {
  return stack.find((entry) => entry.id === id);
}

function hasPresentedStackEntry(id: string) {
  return Boolean(findStackEntry(id)?.isOpenRef.current);
}

function replaceCurrentHistoryWithoutSheet() {
  window.history.replaceState(getHistoryStateWithoutSheet(), "", getBaseUrl());
}

function cleanupUnknownSheetHistory(current: SheetHistoryEntry) {
  if (current.id && !hasStackEntry(current.id)) {
    replaceCurrentHistoryWithoutSheet();
  }
}

function entryMatches(
  current: SheetHistoryEntry,
  expected: Pick<SheetHistoryEntry, "id" | "entryKey">,
) {
  return (
    Boolean(expected.id) &&
    current.id === expected.id &&
    (!expected.entryKey || current.entryKey === expected.entryKey)
  );
}

function clearPendingHistoryCleanup() {
  if (!pendingHistoryCleanup) return;

  clearTimeout(pendingHistoryCleanup.timeout);
  pendingHistoryCleanup = null;
}

function markSheetHistoryPopInProgress() {
  sheetHistoryPopSuppressedUntil =
    Date.now() + SHEET_HISTORY_POP_SUPPRESSION_MS;
}

export function isMobileSheetHistoryTransition() {
  if (typeof window === "undefined") return false;

  return (
    Date.now() < sheetHistoryPopSuppressedUntil ||
    Boolean(readCurrentSheetEntry().id) ||
    stack.some((entry) => entry.isOpenRef.current)
  );
}

function armInternalHistoryPop() {
  if (internalHistoryPopTimeout) {
    clearTimeout(internalHistoryPopTimeout);
  }

  markSheetHistoryPopInProgress();
  internalHistoryPopTimeout = setTimeout(() => {
    internalHistoryPopTimeout = null;
  }, INTERNAL_HISTORY_POP_TIMEOUT_MS);
}

function consumeInternalHistoryPop() {
  if (!internalHistoryPopTimeout) return false;

  clearTimeout(internalHistoryPopTimeout);
  internalHistoryPopTimeout = null;
  return true;
}

function consumePendingHistoryCleanup(current: SheetHistoryEntry) {
  if (!pendingHistoryCleanup) return false;

  const matches = entryMatches(current, pendingHistoryCleanup);
  if (matches) {
    clearPendingHistoryCleanup();
  }

  return matches;
}

function scheduleHistoryEntryPop(entry: SheetHistoryEntry) {
  if (!entry.id) return;

  clearPendingHistoryCleanup();
  pendingHistoryCleanup = {
    id: entry.id,
    entryKey: entry.entryKey,
    timeout: setTimeout(() => {
      const pending = pendingHistoryCleanup;
      pendingHistoryCleanup = null;

      if (!pending) return;

      const current = readCurrentSheetEntry();
      if (entryMatches(current, pending)) {
        armInternalHistoryPop();
        window.history.back();
        return;
      }

      cleanupUnknownSheetHistory(current);
    }, 0),
  };
}

function cleanupClosedSheetHistory(id: string, closedFromHistory: boolean) {
  if (closedFromHistory || typeof window === "undefined") return;

  const current = readCurrentSheetEntry();
  if (current.id === id) {
    scheduleHistoryEntryPop(current);
    return;
  }

  cleanupUnknownSheetHistory(current);
}

function registerGlobalListener() {
  if (listenerRegistered || typeof window === "undefined") return;
  listenerRegistered = true;

  window.addEventListener("popstate", () => {
    const topEntry = stack[stack.length - 1];
    const current = readCurrentSheetEntry();

    if (consumeInternalHistoryPop()) {
      cleanupUnknownSheetHistory(current);
      return;
    }

    if (!topEntry) {
      cleanupUnknownSheetHistory(current);
      return;
    }

    const stillOnTopEntry =
      current.id === topEntry.id && current.entryKey === topEntry.entryKey;

    if (stillOnTopEntry) return;

    markSheetHistoryPopInProgress();
    stack.pop();
    topEntry.closeFromHistory();
    cleanupUnknownSheetHistory(current);
  });
}

export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const isOpenRef = useRef(isOpen);
  const idRef = useRef(createSheetId());
  const pushedRef = useRef(false);
  const closedFromHistoryRef = useRef(false);

  isOpenRef.current = isOpen;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    registerGlobalListener();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen) {
      if (pushedRef.current) return;

      const id = idRef.current;
      const entryKey = createEntryKey(id);
      const current = readCurrentSheetEntry();
      const shouldReplaceCurrentEntry =
        consumePendingHistoryCleanup(current) ||
        Boolean(current.id && !hasPresentedStackEntry(current.id));

      stack.push({
        id,
        entryKey,
        isOpenRef,
        closeFromHistory: () => {
          closedFromHistoryRef.current = true;
          onCloseRef.current();
        },
      });

      const nextState = {
        ...getHistoryStateWithoutSheet(),
        mobileSheet: true,
        sheetId: id,
        sheetEntryKey: entryKey,
      };

      if (shouldReplaceCurrentEntry) {
        window.history.replaceState(nextState, "", getSheetUrl(id));
      } else {
        window.history.pushState(nextState, "", getSheetUrl(id));
      }

      pushedRef.current = true;
      return;
    }

    if (!pushedRef.current) return;

    const id = idRef.current;
    const closedFromHistory = closedFromHistoryRef.current;
    closedFromHistoryRef.current = false;
    pushedRef.current = false;
    removeStackEntry(id);

    cleanupClosedSheetHistory(id, closedFromHistory);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (!pushedRef.current) return;

      const id = idRef.current;
      const closedFromHistory = closedFromHistoryRef.current;
      closedFromHistoryRef.current = false;
      pushedRef.current = false;
      removeStackEntry(id);

      cleanupClosedSheetHistory(id, closedFromHistory);
    };
  }, []);
}
