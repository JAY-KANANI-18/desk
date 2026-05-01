// useHistoryBack.ts
import { useEffect, useRef } from "react";

// ─── Singleton Stack ────────────────────────────────────────────────────────

type StackEntry = {
  id: string;
  close: () => void;
};

const stack: StackEntry[] = [];
let listenerRegistered = false;

function registerGlobalListener() {
  if (listenerRegistered || typeof window === "undefined") return;
  listenerRegistered = true;

  window.addEventListener("popstate", (e) => {
    // Only handle if it was our hash entry being removed
    const currentHash = window.location.hash;
    const topEntry = stack[stack.length - 1];

    if (!topEntry) return;

    // If hash no longer contains our sheet id, back was pressed
    if (!currentHash.includes(topEntry.id)) {
      // Remove from stack first to prevent double-fire
      stack.pop();
      topEntry.close();
    }
  });
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const idRef = useRef(`sheet-${Math.random().toString(36).slice(2, 8)}`);
  const pushedRef = useRef(false);

  // Always keep onClose ref fresh
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    registerGlobalListener();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Push hash entry — doesn't affect pathname so router won't react
      const id = idRef.current;
      const currentHash = window.location.hash;
      window.history.pushState(
        { ...window.history.state, mobileSheet: true, sheetId: id },
        "",
        // Append our sheet id to existing hash
        `${window.location.pathname}${window.location.search}#sheet-${id}`
      );
      pushedRef.current = true;

      stack.push({
        id: `sheet-${id}`,
        close: () => onCloseRef.current(),
      });

    } else {
      if (!pushedRef.current) return;
      pushedRef.current = false;

      const id = idRef.current;
      const stackIndex = stack.findIndex((e) => e.id === `sheet-${id}`);

      if (stackIndex !== -1) {
        stack.splice(stackIndex, 1);
      }

      // Only go back if our hash is still in the URL
      // If router already navigated, hash is gone — don't touch history
      const isOurHashPresent = window.location.hash.includes(`sheet-${id}`);
      if (isOurHashPresent) {
        // Remove the hash cleanly without triggering router
        window.history.back();
      }
    }
  }, [isOpen]);
}