import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceWorkerNavigateListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type !== 'NAVIGATE' || !event.data.url) return;
      try {
        const url = new URL(event.data.url, window.location.origin);
        if (url.origin === window.location.origin) {
          navigate(`${url.pathname}${url.search}${url.hash}`);
        }
      } catch {
        // Ignore malformed URLs from stale or unexpected service worker messages.
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
  }, [navigate]);

  return null;
}
