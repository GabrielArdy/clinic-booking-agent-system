import { useSyncExternalStore } from 'react';

// Auth store (V4). Holds the login response { token, expiresAt, user } where
// user carries { roles[], groupCode, doctorId, staffId }. localStorage-backed so
// a reload keeps the session; useSyncExternalStore mirrors the router pattern —
// storage is the single source of truth, no two-way effect sync.
const KEY = 'clinicAuth';
const listeners = new Set();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
let current = load();

function emit() { listeners.forEach((l) => l()); }

export function getAuth() { return current; }
export function setAuth(auth) {
  current = auth;
  localStorage.setItem(KEY, JSON.stringify(auth));
  emit();
}
export function clearAuth() {
  current = null;
  localStorage.removeItem(KEY);
  emit();
}

function subscribe(cb) {
  listeners.add(cb);
  const onStorage = (e) => { if (e.key === KEY) { current = load(); cb(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}
export function useAuth() {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/* ---- Role helpers ---- */
// Legacy admin token (me → { user: null, legacyAdmin: true }) passes every check.
export const isLegacy = (auth) => !!auth && (auth.legacyAdmin || !auth.user);

export function can(auth, roleCode) {
  if (!auth) return false;
  if (isLegacy(auth)) return true;
  return auth.user?.roles?.includes(roleCode) ?? false;
}
// True if the user holds ANY of the given roles (nav grouping / OR-gated pages).
export const canAny = (auth, codes) => codes.some((c) => can(auth, c));

export const groupOf = (auth) =>
  auth?.user?.groupCode || (isLegacy(auth) ? 'AD100' : null);

// Landing console for a freshly-logged-in user, by group.
export function defaultPath(auth) {
  const g = groupOf(auth);
  if (g === 'DOC100') return '/doctor';
  if (g === 'STF100') return '/staff';
  return '/admin';
}
