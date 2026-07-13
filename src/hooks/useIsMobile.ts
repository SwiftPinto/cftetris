import { useEffect, useState } from 'react';

export function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');

    // Initial check
    if (mq.matches) setMobile(true);

    // Safari < 14 uses addListener, modern browsers use addEventListener
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mq as any).addListener(handler);
      return () => (mq as any).removeListener(handler);
    }
  }, []);

  return mobile;
}
