import { useState, useRef, useEffect } from 'react';
import { Send, Play, Pause, Trash2, Square } from 'lucide-react';
import { WAVEFORM_BARS } from './data';
import { formatTime } from './utils';

interface AudioRecorderProps {
  onSend: (audioUrl: string) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [phase, setPhase] = useState<'recording' | 'recorded'>('recording');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef       = useRef<string | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
        setPhase('recorded');
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone access to record audio.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
  };

  const handleDelete = () => {
    stopRecording();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    onCancel();
  };

  const handleSend = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    const url = audioUrlRef.current ?? '';
    audioUrlRef.current = null; // don't revoke — URL is passed to message
    onSend(url);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || !audioDuration) return;
    setAudioProgress((audioRef.current.currentTime / audioDuration) * 100);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false); setAudioProgress(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * audioDuration;
    setAudioProgress(pct * 100);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {phase === 'recording' ? (
        <div className="px-4 py-4 flex items-center gap-3 bg-red-50">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-sm font-semibold text-red-600 whitespace-nowrap">Recording</span>
          </div>
          <div className="flex items-center gap-0.5 flex-1 justify-center">
            {WAVEFORM_BARS.map((h, i) => (
              <div key={i} className="w-1 bg-red-400 rounded-full"
                style={{ height: `${h}px`, animation: `pulse 0.8s ease-in-out ${(i * 0.04).toFixed(2)}s infinite alternate` }} />
            ))}
          </div>
          <span className="text-sm font-mono font-semibold text-red-700 tabular-nums flex-shrink-0">{formatTime(recordingTime)}</span>
          <button onClick={stopRecording}
            className="flex-shrink-0 w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
            title="Stop recording">
            <Square size={14} fill="white" />
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlayback}
              className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
              title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="relative h-8 flex items-center cursor-pointer" onClick={handleSeek}>
                <div className="absolute inset-0 flex items-center gap-0.5 px-0.5">
                  {WAVEFORM_BARS.map((h, i) => {
                    const played = (i / WAVEFORM_BARS.length) * 100 <= audioProgress;
                    return <div key={i} className={`flex-1 rounded-full transition-colors ${played ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ height: `${h}px` }} />;
                  })}
                </div>
                <div className="absolute inset-0" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 tabular-nums">
                <span>{formatTime((audioProgress / 100) * audioDuration)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>
            <button onClick={handleDelete}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete recording">
              <Trash2 size={17} />
            </button>
            <button onClick={handleSend}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Send size={14} />Send
            </button>
          </div>
          <audio ref={audioRef} src={audioUrl || ''}
            onTimeUpdate={handleTimeUpdate} onEnded={handleAudioEnded} onLoadedMetadata={handleLoadedMetadata} />
        </div>
      )}
    </div>
  );
}
