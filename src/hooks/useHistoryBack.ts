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
  
  // Keep ref fresh without making it a dependency
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ mobileSheet: true }, "");
      pushed.current = true;

      const handlePopState = () => {
        pushed.current = false;
        onCloseRef.current(); // use ref, not the dep
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    } else {
      if (pushed.current) {
        pushed.current = false;
        window.history.back();
      }
    }
  }, [isOpen]); // only isOpen as dep now, onClose stability irrelevant
}