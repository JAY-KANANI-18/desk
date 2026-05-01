import { useEffect, useRef } from "react";

type StackEntry = {
  id: string;
  entryKey: string;
  closeFromHistory: () => void;
};

type SheetHistoryEntry = {
  id?: string;
  entryKey?: string;
};

const SHEET_HASH_PREFIX = "sheet-";

const stack: StackEntry[] = [];
let listenerRegistered = false;
let entrySequence = 0;

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

function replaceCurrentHistoryWithSheet(entry: StackEntry) {
  const entryKey = createEntryKey(entry.id);
  entry.entryKey = entryKey;

  window.history.replaceState(
    {
      ...getHistoryStateWithoutSheet(),
      mobileSheet: true,
      sheetId: entry.id,
      sheetEntryKey: entryKey,
    },
    "",
    getSheetUrl(entry.id),
  );
}

function replaceCurrentHistoryWithoutSheet() {
  window.history.replaceState(getHistoryStateWithoutSheet(), "", getBaseUrl());
}

function cleanupUnknownSheetHistory(current: SheetHistoryEntry) {
  if (current.id && !hasStackEntry(current.id)) {
    replaceCurrentHistoryWithoutSheet();
  }
}

function registerGlobalListener() {
  if (listenerRegistered || typeof window === "undefined") return;
  listenerRegistered = true;

  window.addEventListener("popstate", () => {
    const topEntry = stack[stack.length - 1];
    const current = readCurrentSheetEntry();

    if (!topEntry) {
      cleanupUnknownSheetHistory(current);
      return;
    }

    const stillOnTopEntry =
      current.id === topEntry.id && current.entryKey === topEntry.entryKey;

    if (stillOnTopEntry) return;

    stack.pop();
    topEntry.closeFromHistory();
    cleanupUnknownSheetHistory(current);
  });
}

export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const idRef = useRef(createSheetId());
  const pushedRef = useRef(false);
  const closedFromHistoryRef = useRef(false);

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

      stack.push({
        id,
        entryKey,
        closeFromHistory: () => {
          closedFromHistoryRef.current = true;
          onCloseRef.current();
        },
      });

      window.history.pushState(
        {
          ...getHistoryStateWithoutSheet(),
          mobileSheet: true,
          sheetId: id,
          sheetEntryKey: entryKey,
        },
        "",
        getSheetUrl(id),
      );

      pushedRef.current = true;
      return;
    }

    if (!pushedRef.current) return;

    const id = idRef.current;
    const closedFromHistory = closedFromHistoryRef.current;
    closedFromHistoryRef.current = false;
    pushedRef.current = false;
    removeStackEntry(id);

    if (closedFromHistory) return;

    const current = readCurrentSheetEntry();
    if (current.id === id) {
      const nextTopEntry = stack[stack.length - 1];
      if (nextTopEntry) {
        replaceCurrentHistoryWithSheet(nextTopEntry);
      } else {
        replaceCurrentHistoryWithoutSheet();
      }
      return;
    }

    cleanupUnknownSheetHistory(current);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (!pushedRef.current) return;

      pushedRef.current = false;
      removeStackEntry(idRef.current);
    };
  }, []);
}
