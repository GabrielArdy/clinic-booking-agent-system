import { useSyncExternalStore } from 'react';

// Toast store — same external-store pattern as auth/router (single source of
// truth, no effect sync). `toast(msg, { type, duration })` pushes; entries
// auto-dismiss after `duration` (0 = sticky).
const listeners = new Set();
const EMPTY = [];
let toasts = EMPTY;
let seq = 0;

function emit() { listeners.forEach((l) => l()); }

export function toast(message, { type = 'info', duration = 5000 } = {}) {
  const id = ++seq;
  toasts = [...toasts, { id, message, type }];
  emit();
  if (duration) setTimeout(() => dismiss(id), duration);
  return id;
}

export function dismiss(id) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next.length ? next : EMPTY;
  emit();
}

function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
}
