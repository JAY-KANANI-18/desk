// useHistoryBack.ts

import { useEffect, useRef } from "react";

// ─── Singleton Stack ───────────────────────────────────────────────────────────

const stack: Array<() => void> = [];

if (typeof window !== "undefined") {
  window.addEventListener("popstate", (e) => {
    if (e.state?.mobileSheet) {
      const top = stack[stack.length - 1];
      if (top) top();
    }
  });
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ mobileSheet: true }, "");
      pushed.current = true;
      stack.push(() => onCloseRef.current());
    } else {
      if (pushed.current) {
        pushed.current = false;
        stack.pop(); // only pop once here
        const isDummyStillOnTop = window.history.state?.mobileSheet === true;
        if (isDummyStillOnTop) {
          window.history.back();
        }
      }
    }
  }, [isOpen]);
}