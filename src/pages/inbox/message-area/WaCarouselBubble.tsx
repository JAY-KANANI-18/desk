import React, { useState } from "react";
import {
  ImageIcon,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { TruncatedText } from "../../../components/ui/TruncatedText";
import { formatTime } from "../utils";
import { getWaTemplateButtonIcon } from "./helpers";
import type { WaTemplateCarouselCard } from "./types";

export function WaCarouselBubble({
  body,
  cards,
  createdAt,
}: {
  body?: string;
  cards: WaTemplateCarouselCard[];
  createdAt: string;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const CARD_W = 230;

  return (
    <div
      className="max-w-[300px]"
      style={{ fontFamily: '-apple-system, "Segoe UI", sans-serif' }}
    >
      {body && (
        <div className="mb-1.5 max-w-[280px] rounded-[14px] rounded-bl-[4px] bg-white shadow-sm">
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[12.5px] text-[#303030] leading-snug whitespace-pre-wrap">
              {body}
            </p>
          </div>
          <div className="px-3 pb-2 flex justify-end">
            <span className="text-[10px] text-[#8a8a8a]">
              {formatTime(createdAt)} &#10003;&#10003;
            </span>
          </div>
        </div>
      )}

      <div className="w-[230px] overflow-hidden rounded-[14px] bg-white shadow-sm">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${cardIdx * CARD_W}px)`,
              width: `${cards.length * CARD_W}px`,
            }}
          >
            {cards.map((card, i) => {
              const cHeader = card.components.find((c) => c.type === "HEADER");
              const cBody = card.components.find((c) => c.type === "BODY");
              const cButtons = card.components
                .filter((c) => c.type === "BUTTONS")
                .flatMap((c) => c.buttons ?? []);

              return (
                <div key={i} className="w-[230px] shrink-0">
                  {cHeader?.format === "IMAGE" &&
                    (cHeader.example?.header_handle?.[0] ? (
                      <img
                        src={cHeader.example.header_handle[0]}
                        alt=""
                        className="h-[130px] w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[130px] w-full items-center justify-center bg-[#f0f4f8]">
                        <ImageIcon size={24} className="text-gray-400" />
                      </div>
                    ))}
                  {cHeader?.format === "VIDEO" && (
                    <div className="relative flex h-[130px] w-full items-center justify-center bg-gray-900">
                      <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                        <Play
                          size={16}
                          className="text-white ml-0.5"
                          fill="white"
                        />
                      </div>
                    </div>
                  )}

                  {cBody?.text && (
                    <div className="px-3 py-2">
                      <TruncatedText
                        as="p"
                        text={cBody.text}
                        maxLines={6}
                        className="text-[11.5px] text-[#606060] leading-snug whitespace-pre-wrap"
                      />
                    </div>
                  )}

                  {cButtons.map((btn, bi) => {
                    const Icon = getWaTemplateButtonIcon(btn.type);

                    return (
                      <div
                        key={`${btn.type}-${btn.text}-${bi}`}
                        className="border-t border-[#e9edef] text-[var(--color-info)]"
                      >
                        <Button
                          type="button"
                          variant="inherit-ghost"
                          size="sm"
                          radius="none"
                          fullWidth
                          leftIcon={<Icon size={12} />}
                        >
                          <TruncatedText
                            as="span"
                            text={btn.text}
                            maxLines={1}
                            className="max-w-full"
                          />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-3 py-2 border-t border-[#e9edef]">
            <Button
              onClick={() => setCardIdx((i) => Math.max(0, i - 1))}
              type="button"
              variant="secondary"
              size="xs"
              radius="full"
              iconOnly
              leftIcon={<ChevronLeft size={14} />}
              aria-label="Show previous carousel card"
              disabled={cardIdx === 0}
            />
            <div className="flex items-center gap-1">
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === cardIdx ? "bg-gray-500" : "bg-gray-200"}`}
                />
              ))}
            </div>
            <Button
              onClick={() => setCardIdx((i) => Math.min(cards.length - 1, i + 1))}
              type="button"
              variant="secondary"
              size="xs"
              radius="full"
              iconOnly
              leftIcon={<ChevronRight size={14} />}
              aria-label="Show next carousel card"
              disabled={cardIdx === cards.length - 1}
            />
          </div>
        )}
      </div>
    </div>
  );
}
