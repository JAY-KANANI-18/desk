// ─────────────────────────────────────────────────────────────────────────────
// Notification Sound — Web Audio API synthesis (no external files required)
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationSoundType = 'new_message' | 'assign' | 'mention';

let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gainValue = 0.25,
  type: OscillatorType = 'sine',
) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/**
 * Play a synthesised notification sound.
 *
 * new_message — soft double-ping (two ascending notes)
 * assign      — gentle triple ascending chime
 * mention     — two-tone emphasis (higher, more distinct)
 */
export function playNotificationSound(type: NotificationSoundType): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'new_message':
        // Soft double ping
        playTone(ctx, 880,  now,        0.18, 0.22);
        playTone(ctx, 1100, now + 0.20, 0.18, 0.18);
        break;

      case 'assign':
        // Triple ascending chime — friendly, positive
        playTone(ctx, 660,  now,        0.14, 0.20);
        playTone(ctx, 880,  now + 0.16, 0.14, 0.20);
        playTone(ctx, 1100, now + 0.32, 0.20, 0.26);
        break;

      case 'mention':
        // Two-tone with a third echo — more urgent / attention-grabbing
        playTone(ctx, 1200, now,        0.10, 0.28);
        playTone(ctx, 1400, now + 0.13, 0.10, 0.28);
        playTone(ctx, 1200, now + 0.26, 0.14, 0.20);
        break;
    }
  } catch (e) {
    // Silently fail — audio may be blocked before first user gesture
    console.warn('[notificationSound] Audio playback skipped:', e);
  }
}
