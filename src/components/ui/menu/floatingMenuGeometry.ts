export type FloatingMenuPlacement = "top" | "bottom" | "left" | "right";
export type FloatingMenuAlign = "start" | "end";
export type FloatingMenuWidth = "trigger" | "sm" | "md" | "lg" | number;

export interface FloatingMenuGeometry {
  left: number;
  top: number;
  width: number;
  placement: FloatingMenuPlacement;
}

const widthBySize = {
  sm: 240,
  md: 280,
  lg: 320,
} satisfies Record<"sm" | "md" | "lg", number>;

export const hiddenFloatingMenuScale = 0.74;

export function resolveFloatingMenuWidth(
  width: FloatingMenuWidth,
  anchorRect: DOMRect,
) {
  const viewportPadding = 16;
  const maxWidth = window.innerWidth - viewportPadding * 2;
  const requestedWidth =
    typeof width === "number"
      ? width
      : width === "trigger"
        ? anchorRect.width
        : widthBySize[width];

  return Math.min(requestedWidth, maxWidth);
}

export function getFloatingMenuMeasuredWidth(width: FloatingMenuWidth) {
  return typeof width === "number"
    ? width
    : width === "trigger"
      ? undefined
      : widthBySize[width];
}

export function getFloatingMenuGeometry({
  align,
  anchor,
  dropdown,
  placement,
  width,
  allowedPlacements,
}: {
  align: FloatingMenuAlign;
  anchor: HTMLElement;
  dropdown: HTMLElement;
  placement: FloatingMenuPlacement;
  width: FloatingMenuWidth;
  allowedPlacements?: readonly FloatingMenuPlacement[];
}): FloatingMenuGeometry {
  const gap = 8;
  const viewportPadding = 8;
  const anchorRect = anchor.getBoundingClientRect();
  const dropdownHeight = dropdown.offsetHeight;
  const dropdownWidth = resolveFloatingMenuWidth(width, anchorRect);
  const enabledPlacements = new Set(allowedPlacements ?? ["top", "bottom", "left", "right"]);
  const spaceAbove = anchorRect.top - viewportPadding - gap;
  const spaceBelow = window.innerHeight - anchorRect.bottom - viewportPadding - gap;
  const spaceRight = window.innerWidth - anchorRect.right - viewportPadding - gap;
  const spaceLeft = anchorRect.left - viewportPadding - gap;
  const resolvedPlacement =
    placement === "bottom" &&
    enabledPlacements.has("top") &&
    dropdownHeight > spaceBelow &&
    spaceAbove > spaceBelow
      ? "top"
      : placement === "top" &&
          enabledPlacements.has("bottom") &&
          dropdownHeight > spaceAbove &&
          spaceBelow > spaceAbove
        ? "bottom"
        : placement === "right" &&
            enabledPlacements.has("left") &&
            dropdownWidth > spaceRight &&
            spaceLeft > spaceRight
          ? "left"
          : placement === "left" &&
              enabledPlacements.has("right") &&
              dropdownWidth > spaceLeft &&
              spaceRight > spaceLeft
            ? "right"
            : placement;
  const unclampedLeft =
    resolvedPlacement === "right"
      ? anchorRect.right + gap
      : resolvedPlacement === "left"
        ? anchorRect.left - dropdownWidth - gap
        : width === "trigger" || align === "start"
          ? anchorRect.left
          : anchorRect.right - dropdownWidth;
  const unclampedTop =
    resolvedPlacement === "top"
      ? anchorRect.top - dropdownHeight - gap
      : resolvedPlacement === "bottom"
        ? anchorRect.bottom + gap
        : align === "end"
          ? anchorRect.bottom - dropdownHeight
          : anchorRect.top;
  const left = Math.min(
    Math.max(viewportPadding, unclampedLeft),
    Math.max(viewportPadding, window.innerWidth - dropdownWidth - viewportPadding),
  );
  const top = Math.min(
    Math.max(viewportPadding, unclampedTop),
    Math.max(viewportPadding, window.innerHeight - dropdownHeight - viewportPadding),
  );

  return {
    left,
    top,
    width: dropdownWidth,
    placement: resolvedPlacement,
  };
}

export function getFloatingMenuTransformOrigin(
  placement: FloatingMenuPlacement | undefined,
  align: FloatingMenuAlign,
) {
  if (placement === "right") {
    return align === "end" ? "left bottom" : "left top";
  }

  if (placement === "left") {
    return align === "end" ? "right bottom" : "right top";
  }

  const vertical = placement === "top" ? "bottom" : "top";
  const horizontal = align === "end" ? "right" : "left";

  return `${vertical} ${horizontal}`;
}

export function getHiddenFloatingMenuMotionState(
  placement: FloatingMenuPlacement | undefined,
  shouldReduceMotion: boolean,
) {
  if (shouldReduceMotion) {
    return { x: 0, y: 0, scale: 1 };
  }

  if (placement === "top") {
    return { x: 0, y: 7, scale: hiddenFloatingMenuScale };
  }

  if (placement === "left") {
    return { x: 7, y: 0, scale: hiddenFloatingMenuScale };
  }

  if (placement === "right") {
    return { x: -7, y: 0, scale: hiddenFloatingMenuScale };
  }

  return { x: 0, y: -7, scale: hiddenFloatingMenuScale };
}
