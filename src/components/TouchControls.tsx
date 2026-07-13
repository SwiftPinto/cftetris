import { useCallback, useEffect, useRef } from 'react';

interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onHold: () => void;
  visible: boolean;
}

export default function TouchControls({
  onLeft, onRight, onSoftDrop, onHardDrop,
  onRotateCW, onRotateCCW, onHold, visible,
}: TouchControlsProps) {
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swipeRef = useRef({ startY: 0, startX: 0, startTime: 0 });

  const stopRepeat = useCallback(() => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  }, []);

  const startRepeat = useCallback((action: () => void) => {
    stopRepeat();
    action();
    repeatRef.current = setInterval(action, 50);
  }, [stopRepeat]);

  useEffect(() => {
    return () => stopRepeat();
  }, []);

  // Swipe detection — skip button presses to avoid double-input
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    const t = e.changedTouches[0];
    swipeRef.current = { startY: t.clientY, startX: t.clientX, startTime: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dy = t.clientY - swipeRef.current.startY;
    const dx = t.clientX - swipeRef.current.startX;
    const dt = Date.now() - swipeRef.current.startTime;

    // Fast swipe down → hard drop
    if (dy > 60 && dt < 300 && Math.abs(dy) > Math.abs(dx)) {
      onHardDrop();
    }
  }, [onHardDrop]);

  if (!visible) {
    // Always render in DOM so CSS can control visibility;
    // use a hidden wrapper when game is not active
    return (
      <div
        className="touch-controls touch-controls-hidden"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="touch-controls"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* D-Pad (left side) */}
      <div className="dpad">
        <button
          className="touch-btn dpad-up"
          onTouchStart={e => { e.preventDefault(); startRepeat(onRotateCW); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Rotate CW"
        >
          ↻
        </button>
        <button
          className="touch-btn dpad-left"
          onTouchStart={e => { e.preventDefault(); startRepeat(onLeft); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Move left"
        >
          ←
        </button>
        <button
          className="touch-btn dpad-center"
          tabIndex={-1}
          disabled
        />
        <button
          className="touch-btn dpad-right"
          onTouchStart={e => { e.preventDefault(); startRepeat(onRight); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Move right"
        >
          →
        </button>
        <button
          className="touch-btn dpad-down"
          onTouchStart={e => { e.preventDefault(); startRepeat(onSoftDrop); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Soft drop"
        >
          ↓
        </button>
      </div>

      {/* Action buttons (right side) */}
      <div className="action-buttons">
        <button
          className="touch-btn action-btn"
          onTouchStart={e => { e.preventDefault(); startRepeat(onRotateCCW); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Rotate CCW"
        >
          ↺
        </button>
        <button
          className="touch-btn action-btn hard-drop-btn"
          onTouchStart={e => { e.preventDefault(); onHardDrop(); }}
          aria-label="Hard drop"
        >
          ⏬
        </button>
        <button
          className="touch-btn action-btn hold-btn"
          onTouchStart={e => { e.preventDefault(); onHold(); }}
          aria-label="Hold"
        >
          H
        </button>
      </div>
    </div>
  );
}
