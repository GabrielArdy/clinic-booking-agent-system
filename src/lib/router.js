import { useSyncExternalStore } from 'react';

// Minimal hash router — URL is the single source of truth (no two-way effect sync).
// Public app at '#/', admin at '#/admin', admin sections at '#/admin/<section>'.

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
function getSnapshot() {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function useRoute() {
  return useSyncExternalStore(subscribe, getSnapshot, () => '/');
}

export function navigate(path) {
  const next = path.startsWith('#') ? path : `#${path}`;
  if (window.location.hash !== next) window.location.hash = next;
}
