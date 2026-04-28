import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LibraryEmojiPicker, {
  EmojiClickData,
  EmojiStyle,
  Theme,
} from "emoji-picker-react";

interface EmojiPickerProps {
  mode: "reply" | "comment" | "tag";
  accent: "gray" | "amber" | "indigo";
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ accent, onSelect }: EmojiPickerProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    ready: false,
  });

  const accentStyles =
    accent === "amber"
      ? {
          border: "#fcd34d",
          background: "#fff7ed",
        }
      : accent === "indigo"
        ? {
            border: "#c7d2fe",
            background: "#eef2ff",
          }
        : {
            border: "#e5e7eb",
            background: "#ffffff",
          };

  useLayoutEffect(() => {
    const updatePosition = () => {
      const picker = pickerRef.current;
      const anchor = anchorRef.current?.parentElement;
      if (!picker || !anchor) return;

      const margin = 8;
      const anchorRect = anchor.getBoundingClientRect();
      const pickerRect = picker.getBoundingClientRect();

      let top = anchorRect.top - pickerRect.height - margin;
      if (top < margin) {
        top = Math.min(
          window.innerHeight - pickerRect.height - margin,
          anchorRect.bottom + margin,
        );
      }

      let left = anchorRect.left;
      if (left + pickerRect.width > window.innerWidth - margin) {
        left = window.innerWidth - pickerRect.width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      setPosition({ top, left, ready: true });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  if (typeof document === "undefined") {
    return <span ref={anchorRef} className="hidden" aria-hidden="true" />;
  }

  return (
    <>
      <span ref={anchorRef} className="hidden" aria-hidden="true" />
      {createPortal(
        <div
          ref={pickerRef}
          className="fixed z-[1100] overflow-hidden rounded-xl shadow-xl"
          style={{
            top: position.top,
            left: position.left,
            visibility: position.ready ? "visible" : "hidden",
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <LibraryEmojiPicker
            onEmojiClick={(emojiData: EmojiClickData) => onSelect(emojiData.emoji)}
            theme={Theme.LIGHT}
            emojiStyle={EmojiStyle.NATIVE}
            lazyLoadEmojis
            searchDisabled={false}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            width={320}
            height={Math.min(380, window.innerHeight - 24)}
            style={{
              boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
              borderRadius: 16,
              border: `1px solid ${accentStyles.border}`,
              backgroundColor: accentStyles.background,
            }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
