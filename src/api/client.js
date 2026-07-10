// Thin fetch layer for the clinic backend. See mockups/API_CONTRACT.md.
// Base is the backend origin; empty string uses same-origin (Vite proxy in dev).
const BASE = import.meta.env.VITE_API_BASE ?? '';
const SESSION_KEY = 'clinicSession';

// A typed-ish error carrying the domain `code` so UI branches on code, not string.
export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code; // NOT_FOUND | SLOT_TAKEN | INVALID_INPUT | PHONE_MISMATCH | ALREADY_CANCELLED | RATE_LIMIT
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Network error — could not reach the clinic.', { code: 'NETWORK' });
  }

  if (res.status === 429) {
    throw new ApiError('Too many requests. Please wait a moment.', { status: 429, code: 'RATE_LIMIT' });
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, {
      status: res.status,
      code: data?.code,
      details: data?.details,
    });
  }
  return data;
}

/* ---------------- Session ---------------- */
export const getSessionId = () => localStorage.getItem(SESSION_KEY) || undefined;
export const setSessionId = (id) => id && localStorage.setItem(SESSION_KEY, id);
export const clearSessionId = () => localStorage.removeItem(SESSION_KEY);

/* ---------------- Patient ---------------- */

// Advance the conversation one turn → AssistantTurn. Persists returned sessionId.
export async function sendChat(message, { signal } = {}) {
  const turn = await request('/api/chat', {
    method: 'POST',
    body: { sessionId: getSessionId(), message },
    signal,
  });
  setSessionId(turn.sessionId);
  return turn;
}

// Rehydrate a session's transcript → { messages: ChatMessage[] }.
export function fetchHistory(sessionId, { signal } = {}) {
  return request(`/api/chat/${encodeURIComponent(sessionId)}/history`, { signal });
}

export function cancelBooking({ reference, phone }, { signal } = {}) {
  return request('/api/booking/cancel', { method: 'POST', body: { reference, phone }, signal });
}

/* ---------------- Admin ---------------- */
// Token is read per-call so it can live in memory/localStorage without a rebuild.
const adminHeaders = (token) => ({ 'x-admin-token': token });

export const admin = {
  listDoctors: (token, { signal } = {}) =>
    request('/api/admin/doctors', { headers: adminHeaders(token), signal }),
  createDoctor: (token, body, { signal } = {}) =>
    request('/api/admin/doctors', { method: 'POST', headers: adminHeaders(token), body, signal }),
  listSchedules: (token, doctorId, { signal } = {}) =>
    request(`/api/admin/schedules?doctorId=${doctorId}`, { headers: adminHeaders(token), signal }),
  createSchedule: (token, body, { signal } = {}) =>
    request('/api/admin/schedules', { method: 'POST', headers: adminHeaders(token), body, signal }),
  createException: (token, body, { signal } = {}) =>
    request('/api/admin/schedule-exceptions', { method: 'POST', headers: adminHeaders(token), body, signal }),
  listBookings: (token, { doctorId, date }, { signal } = {}) =>
    request(`/api/admin/bookings?doctorId=${doctorId}&date=${date}`, { headers: adminHeaders(token), signal }),
};
