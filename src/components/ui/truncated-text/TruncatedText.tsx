import {
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { Tooltip } from "../tooltip/Tooltip";
import { cx } from "../inputs/shared";

export interface TruncatedTextProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  text: string;
  maxLines?: number;
  maxLength?: number;
  showTooltip?: boolean;
  className?: string;
  as?: ElementType;
}

function truncateByLength(text: string, maxLength?: number) {
  if (!maxLength || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function TruncatedText({
  text,
  maxLines,
  maxLength,
  showTooltip,
  className,
  as: Component = "span",
  style,
  ...props
}: TruncatedTextProps) {
  const isMobile = useIsMobile();
  const elementRef = useRef<HTMLElement>(null);
  const [isLineClamped, setIsLineClamped] = useState(false);

  const displayText = useMemo(
    () => truncateByLength(text, maxLength),
    [maxLength, text],
  );

  const isLengthTruncated = displayText !== text;

  useLayoutEffect(() => {
    if (!maxLines || !elementRef.current) {
      setIsLineClamped(false);
      return;
    }

    const element = elementRef.current;
    const nextValue =
      element.scrollHeight > element.clientHeight + 1 ||
      element.scrollWidth > element.clientWidth + 1;

    setIsLineClamped(nextValue);
  }, [displayText, maxLines, text]);

  const shouldShowTooltip =
    (showTooltip ?? true) && !isMobile && (isLengthTruncated || isLineClamped);

  const textStyle: CSSProperties = {
    ...style,
    ...(maxLines
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: String(maxLines),
          overflow: "hidden",
        }
      : null),
  };

  const content = (
    <Component
      {...props}
      ref={elementRef}
      className={cx(maxLines && "break-words", className)}
      style={textStyle}
    >
      {displayText}
    </Component>
  );

  if (shouldShowTooltip) {
    return <Tooltip content={text}>{content}</Tooltip>;
  }

  return content;
}
