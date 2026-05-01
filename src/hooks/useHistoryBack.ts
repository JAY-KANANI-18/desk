// hooks/useHistoryBack.ts
import { useEffect, useRef } from "react";

/**
 * Pushes a dummy history entry when `isOpen` becomes true.
 * When the user hits the back button (popstate), calls `onClose`.
 * When `isOpen` becomes false programmatically, calls history.back()
 * to clean up the dummy entry — but only if we pushed it.
 */

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

      const handlePopState = (e: PopStateEvent) => {
        // Only handle if it's our dummy state being popped
        if (!e.state?.mobileSheet) return;
        pushed.current = false;
        onCloseRef.current();
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    } else {
      if (pushed.current) {
        pushed.current = false;
        // Check if a navigation just happened
        // If location changed, our dummy entry is already gone — skip back()
        const isDummyStillOnTop = window.history.state?.mobileSheet === true;
        if (isDummyStillOnTop) {
          window.history.back();
        }
      }
    }
  }, [isOpen]);
}