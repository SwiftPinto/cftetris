import { useCallback, useEffect, useRef } from 'react';

interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onHold: () => void;
}

export default function TouchControls({
  onLeft, onRight, onSoftDrop, onHardDrop,
  onRotateCW, onRotateCCW, onHold,
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
    if (dy > 60 && dt < 300 && Math.abs(dy) > Math.abs(dx)) {
      onHardDrop();
    }
  }, [onHardDrop]);

  // Always render. CSS @media (max-width: 640px) shows this. Desktop hides it.
  return (
    <div
      className="touch-controls"
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        padding: '4px 8px',
        gap: 8,
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* D-Pad (left side) */}
      <div style={{
        display: 'grid',
        gridTemplateAreas: `". up ." "left center right" ". down ."`,
        gridTemplateColumns: 'repeat(3, 48px)',
        gridTemplateRows: 'repeat(3, 48px)',
        gap: 2,
      }}>
        <button className="touch-btn" style={{ gridArea: 'up' }}
          onTouchStart={e => { e.preventDefault(); startRepeat(onRotateCW); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Rotate CW">↻</button>
        <button className="touch-btn" style={{ gridArea: 'left' }}
          onTouchStart={e => { e.preventDefault(); startRepeat(onLeft); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Move left">←</button>
        <button className="touch-btn" style={{ gridArea: 'center' }}
          tabIndex={-1} disabled />
        <button className="touch-btn" style={{ gridArea: 'right' }}
          onTouchStart={e => { e.preventDefault(); startRepeat(onRight); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Move right">→</button>
        <button className="touch-btn" style={{ gridArea: 'down' }}
          onTouchStart={e => { e.preventDefault(); startRepeat(onSoftDrop); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Soft drop">↓</button>
      </div>

      {/* Action buttons (right side) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="touch-btn action-btn"
          onTouchStart={e => { e.preventDefault(); startRepeat(onRotateCCW); }}
          onTouchEnd={e => { e.preventDefault(); stopRepeat(); }}
          aria-label="Rotate CCW">↺</button>
        <button className="touch-btn action-btn hard-drop-btn"
          onTouchStart={e => { e.preventDefault(); onHardDrop(); }}
          aria-label="Hard drop">⏬</button>
        <button className="touch-btn action-btn hold-btn"
          onTouchStart={e => { e.preventDefault(); onHold(); }}
          aria-label="Hold">H</button>
      </div>
    </div>
  );
}
