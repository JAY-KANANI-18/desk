import React, { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { formatAudioTime } from "./helpers";

export function MiniAudioPlayer({
  url,
  isVoice,
  dark,
}: {
  url: string;
  isVoice?: boolean;
  dark?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setProgress(pct * 100);
  };

  const trackBg = dark ? "bg-white/30" : "bg-gray-200";
  const fill = dark ? "bg-white" : "bg-indigo-500";
  const labelClr = dark ? "text-white/80" : "text-gray-500";
  const timeClr = dark ? "text-white/70" : "text-gray-400";
  const wrapBg = dark ? "bg-indigo-600" : "bg-gray-100";
  const playPauseIcon = playing ? (
    <Pause size={14} className={dark ? "text-indigo-600" : undefined} />
  ) : (
    <Play
      size={14}
      className={dark ? "ml-0.5 text-indigo-600" : "ml-0.5"}
    />
  );

  return (
    <div
      className={`flex items-center gap-2.5 ${wrapBg} rounded-2xl px-3 py-2.5 min-w-[200px] max-w-[260px] shadow-sm`}
    >
      <Button
        onClick={toggle}
        type="button"
        variant={dark ? "secondary" : "primary"}
        size="sm"
        radius="full"
        iconOnly
        leftIcon={playPauseIcon}
        aria-label={playing ? "Pause audio" : "Play audio"}
      />
      <div className="flex-1 min-w-0">
        {isVoice && (
          <p className={`text-[10px] font-medium mb-1 ${labelClr}`}>
            Voice message
          </p>
        )}
        <div
          className={`h-1.5 ${trackBg} rounded-full cursor-pointer`}
          onClick={handleSeek}
        >
          <div
            className={`h-full ${fill} rounded-full transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`flex justify-between text-[10px] mt-0.5 ${timeClr}`}>
          <span>{formatAudioTime(Math.floor((progress / 100) * duration))}</span>
          <span>{formatAudioTime(Math.floor(duration))}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current && duration)
            setProgress((audioRef.current.currentTime / duration) * 100);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
      />
    </div>
  );
}
