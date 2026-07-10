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
    // NOT_FOUND | SLOT_TAKEN | INVALID_INPUT | PHONE_MISMATCH | ALREADY_CANCELLED
    // | TOO_LATE_TO_BOOK | TOO_LATE_TO_CANCEL | RATE_LIMIT | NETWORK
    this.code = code;
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

/* ---------------- CMS console ---------------- */
// Content/config surface (contract V2 §CMS). Same x-admin-token, /api/cms tree.
// Singletons are PUT-partial; the rest are REST CRUD.
export const cms = {
  // Clinic setting (singleton)
  getClinic: (token, { signal } = {}) =>
    request('/api/cms/clinic', { headers: adminHeaders(token), signal }),
  updateClinic: (token, body, { signal } = {}) =>
    request('/api/cms/clinic', { method: 'PUT', headers: adminHeaders(token), body, signal }),

  // Theme (singleton)
  getTheme: (token, { signal } = {}) =>
    request('/api/cms/theme', { headers: adminHeaders(token), signal }),
  updateTheme: (token, body, { signal } = {}) =>
    request('/api/cms/theme', { method: 'PUT', headers: adminHeaders(token), body, signal }),

  // Specialties
  listSpecialties: (token, { signal } = {}) =>
    request('/api/cms/specialties', { headers: adminHeaders(token), signal }),
  createSpecialty: (token, body, { signal } = {}) =>
    request('/api/cms/specialties', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updateSpecialty: (token, id, body, { signal } = {}) =>
    request(`/api/cms/specialties/${id}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
  deleteSpecialty: (token, id, { signal } = {}) =>
    request(`/api/cms/specialties/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal }),

  // Doctors (rich: email/phone/bio/photo)
  listDoctors: (token, { signal } = {}) =>
    request('/api/cms/doctors', { headers: adminHeaders(token), signal }),

  // Staff (non-doctor)
  listStaff: (token, { signal } = {}) =>
    request('/api/cms/staff', { headers: adminHeaders(token), signal }),
  createStaff: (token, body, { signal } = {}) =>
    request('/api/cms/staff', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updateStaff: (token, id, body, { signal } = {}) =>
    request(`/api/cms/staff/${id}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
  deleteStaff: (token, id, { signal } = {}) =>
    request(`/api/cms/staff/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal }),

  // Slot presets
  listSlotPresets: (token, { signal } = {}) =>
    request('/api/cms/slot-presets', { headers: adminHeaders(token), signal }),
  createSlotPreset: (token, body, { signal } = {}) =>
    request('/api/cms/slot-presets', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updateSlotPreset: (token, id, body, { signal } = {}) =>
    request(`/api/cms/slot-presets/${id}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
  deleteSlotPreset: (token, id, { signal } = {}) =>
    request(`/api/cms/slot-presets/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal }),

  // Shifts
  listShifts: (token, { signal } = {}) =>
    request('/api/cms/shifts', { headers: adminHeaders(token), signal }),
  createShift: (token, body, { signal } = {}) =>
    request('/api/cms/shifts', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updateShift: (token, id, body, { signal } = {}) =>
    request(`/api/cms/shifts/${id}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
  deleteShift: (token, id, { signal } = {}) =>
    request(`/api/cms/shifts/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal }),

  // Shift assignments (on-duty roster)
  listAssignments: (token, date, { signal } = {}) =>
    request(`/api/cms/shift-assignments${date ? `?date=${date}` : ''}`, { headers: adminHeaders(token), signal }),
  createAssignment: (token, body, { signal } = {}) =>
    request('/api/cms/shift-assignments', { method: 'POST', headers: adminHeaders(token), body, signal }),
  deleteAssignment: (token, id, { signal } = {}) =>
    request(`/api/cms/shift-assignments/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal }),
};
