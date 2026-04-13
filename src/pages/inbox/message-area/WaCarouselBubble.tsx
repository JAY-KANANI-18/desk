import React, { useState } from "react";
import {
  CornerUpLeft,
  ExternalLink,
  ImageIcon,
  Phone,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatTime } from "../utils";

export function WaCarouselBubble({
  body,
  cards,
  createdAt,
}: {
  body?: string;
  cards: Array<{
    components: Array<{
      type: string;
      format?: string;
      text?: string;
      example?: any;
      buttons?: any[];
    }>;
  }>;
  createdAt: string;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const CARD_W = 230;

  return (
    <div
      style={{
        maxWidth: 300,
        fontFamily: '-apple-system, "Segoe UI", sans-serif',
      }}
    >
      {body && (
        <div
          className="shadow-sm mb-1.5"
          style={{
            background: "#fff",
            borderRadius: 14,
            borderBottomLeftRadius: 4,
            maxWidth: 280,
          }}
        >
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

      <div
        className="overflow-hidden shadow-sm"
        style={{ background: "#fff", borderRadius: 14, width: CARD_W }}
      >
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
                <div key={i} style={{ width: CARD_W, flexShrink: 0 }}>
                  {cHeader?.format === "IMAGE" &&
                    (cHeader.example?.header_handle?.[0] ? (
                      <img
                        src={cHeader.example.header_handle[0]}
                        alt=""
                        className="w-full object-cover"
                        style={{ height: 130 }}
                      />
                    ) : (
                      <div
                        className="w-full bg-[#f0f4f8] flex items-center justify-center"
                        style={{ height: 130 }}
                      >
                        <ImageIcon size={24} className="text-gray-400" />
                      </div>
                    ))}
                  {cHeader?.format === "VIDEO" && (
                    <div
                      className="w-full bg-gray-900 flex items-center justify-center relative"
                      style={{ height: 130 }}
                    >
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
                      <p className="text-[11.5px] text-[#606060] leading-snug whitespace-pre-wrap">
                        {cBody.text}
                      </p>
                    </div>
                  )}

                  {cButtons.map((btn, bi) => (
                    <div
                      key={bi}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-[#00a5f4] text-[12.5px] font-medium cursor-pointer hover:bg-[#f5f5f5] transition-colors ${bi === 0 ? "border-t border-[#e9edef]" : "border-t border-[#e9edef]"}`}
                    >
                      {btn.type === "URL" && <ExternalLink size={12} />}
                      {btn.type === "PHONE_NUMBER" && <Phone size={12} />}
                      {btn.type === "QUICK_REPLY" && <CornerUpLeft size={12} />}
                      <span>{btn.text}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-3 py-2 border-t border-[#e9edef]">
            <button
              onClick={() => setCardIdx((i) => Math.max(0, i - 1))}
              className={`w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center ${cardIdx === 0 ? "opacity-40" : ""}`}
              disabled={cardIdx === 0}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1">
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === cardIdx ? "bg-gray-500" : "bg-gray-200"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCardIdx((i) => Math.min(cards.length - 1, i + 1))}
              className={`w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center ${cardIdx === cards.length - 1 ? "opacity-40" : ""}`}
              disabled={cardIdx === cards.length - 1}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
