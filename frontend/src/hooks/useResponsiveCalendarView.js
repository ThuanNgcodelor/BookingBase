import { useEffect, useRef, useState } from 'react';

const COMPACT_BREAKPOINT = 768;

function isCompactViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < COMPACT_BREAKPOINT;
}

function getPreferredView() {
  return isCompactViewport() ? 'day' : 'week';
}

export function useResponsiveCalendarView() {
  const compactRef = useRef(isCompactViewport());
  const frameRef = useRef(null);
  const [view, setView] = useState(getPreferredView);
  const [layoutRevision, setLayoutRevision] = useState(0);

  useEffect(() => {
    const syncViewport = (forceRelayout = false) => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        const nextCompact = isCompactViewport();
        const changedMode = nextCompact !== compactRef.current;

        if (changedMode) {
          compactRef.current = nextCompact;
          setView((currentView) => {
            if (nextCompact && currentView === 'week') return 'day';
            if (!nextCompact && currentView === 'day') return 'week';
            return currentView;
          });
        }

        if (changedMode || forceRelayout) {
          setLayoutRevision((revision) => revision + 1);
        }
      });
    };

    const handleResize = () => syncViewport(false);
    const handleOrientationChange = () => syncViewport(true);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return { view, setView, layoutRevision };
}
