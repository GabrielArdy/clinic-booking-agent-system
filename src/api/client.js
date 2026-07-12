// Thin fetch layer for the clinic backend. See mockups/API_CONTRACT.md.
// Base is the backend origin; empty string uses same-origin (Vite proxy in dev).
import { getAuth, clearAuth } from '../lib/auth';
import { toast } from '../lib/toast';

const BASE = import.meta.env.VITE_API_BASE ?? '';
const SESSION_KEY = 'clinicSession';

// Expired/forbidden session on an authenticated call → drop the token (App then
// renders <Login/>) and surface a toast. Guarded by getAuth() so a burst of
// parallel 401s only logs out + toasts once.
function handleAuthFailure(status) {
  if (!getAuth()) return;
  clearAuth();
  toast(
    status === 403
      ? 'You don’t have access to that. Please sign in again.'
      : 'Your session has expired. Please sign in again.',
    { type: 'error' },
  );
}

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
    // Only bounce authenticated calls (Bearer header present) — the login POST
    // carries no Authorization, so a wrong-password 401 stays on the form.
    if ((res.status === 401 || res.status === 403) && headers?.Authorization) {
      handleAuthFailure(res.status);
    }
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

/* ---------------- Auth (V4) ---------------- */
// Bearer session token from POST /api/auth/login. Server still accepts the legacy
// x-admin-token header, but the FE authenticates via login now.
const adminHeaders = (token) => ({ Authorization: `Bearer ${token}` });

export const auth = {
  login: (body, { signal } = {}) =>
    request('/api/auth/login', { method: 'POST', body, signal }),
  logout: (token, { signal } = {}) =>
    request('/api/auth/logout', { method: 'POST', headers: adminHeaders(token), signal }),
  me: (token, { signal } = {}) =>
    request('/api/auth/me', { headers: adminHeaders(token), signal }),
};

/* ---------------- Admin ---------------- */
export const admin = {
  listDoctors: (token, { signal } = {}) =>
    request('/api/admin/doctors', { headers: adminHeaders(token), signal }),
  createDoctor: (token, body, { signal } = {}) =>
    request('/api/admin/doctors', { method: 'POST', headers: adminHeaders(token), body, signal }),
  // Active specialties only — feeds the add-doctor <select> (V3).
  listSpecialties: (token, { signal } = {}) =>
    request('/api/admin/specialties', { headers: adminHeaders(token), signal }),
  // Planner feed (V3): one doctor's appointments + exceptions + per-day summaries over a range.
  listAppointments: (token, { doctorId, from, to }, { signal } = {}) =>
    request(`/api/admin/appointments?doctorId=${doctorId}&from=${from}&to=${to}`,
      { headers: adminHeaders(token), signal }),
  listSchedules: (token, doctorId, { signal } = {}) =>
    request(`/api/admin/schedules?doctorId=${doctorId}`, { headers: adminHeaders(token), signal }),
  createSchedule: (token, body, { signal } = {}) =>
    request('/api/admin/schedules', { method: 'POST', headers: adminHeaders(token), body, signal }),
  createException: (token, body, { signal } = {}) =>
    request('/api/admin/schedule-exceptions', { method: 'POST', headers: adminHeaders(token), body, signal }),
  listBookings: (token, { doctorId, date }, { signal } = {}) =>
    request(`/api/admin/bookings?doctorId=${doctorId}&date=${date}`, { headers: adminHeaders(token), signal }),
  // Audit trail (AUDIT_LOG), newest-first, paginated.
  listAuditLogs: (token, { limit = 50, offset = 0, eventType } = {}, { signal } = {}) => {
    const q = new URLSearchParams({ limit, offset });
    if (eventType) q.set('eventType', eventType);
    return request(`/api/admin/audit-logs?${q}`, { headers: adminHeaders(token), signal });
  },
};

/* ---------------- Doctor console (Bearer, auto-scoped to the doctor) ---------------- */
export const doctor = {
  schedule: (token, { from, to }, { signal } = {}) =>
    request(`/api/doctor/schedule?from=${from}&to=${to}`, { headers: adminHeaders(token), signal }),
  shiftToday: (token, { signal } = {}) =>
    request('/api/doctor/shift-today', { headers: adminHeaders(token), signal }),
  listExceptions: (token, { from, to }, { signal } = {}) =>
    request(`/api/doctor/exceptions?from=${from}&to=${to}`, { headers: adminHeaders(token), signal }),
  createException: (token, body, { signal } = {}) =>
    request('/api/doctor/exceptions', { method: 'POST', headers: adminHeaders(token), body, signal }),
  listAppointments: (token, { from, to }, { signal } = {}) =>
    request(`/api/doctor/appointments?from=${from}&to=${to}`, { headers: adminHeaders(token), signal }),
  getAppointment: (token, reference, { signal } = {}) =>
    request(`/api/doctor/appointments/${encodeURIComponent(reference)}`, { headers: adminHeaders(token), signal }),
};

/* ---------------- Staff console (Bearer, auto-scoped to the staff) ---------------- */
export const staff = {
  shiftToday: (token, { signal } = {}) =>
    request('/api/staff/shift-today', { headers: adminHeaders(token), signal }),
};

/* ---------------- CMS console ---------------- */
// Content/config surface (contract V2 §CMS). Same Bearer auth, /api/cms tree.
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
  createDoctor: (token, body, { signal } = {}) =>
    request('/api/cms/doctors', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updateDoctor: (token, id, body, { signal } = {}) =>
    request(`/api/cms/doctors/${id}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
  deleteDoctor: (token, id, { signal } = {}) =>
    request(`/api/cms/doctors/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal }),

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

  // Access control (CMS_POSITION): groups + roles are read-only catalogs.
  listGroups: (token, { signal } = {}) =>
    request('/api/cms/groups', { headers: adminHeaders(token), signal }),
  listRoles: (token, { signal } = {}) =>
    request('/api/cms/roles', { headers: adminHeaders(token), signal }),

  // Positions (keyed by string `code`; delete = soft)
  listPositions: (token, { signal } = {}) =>
    request('/api/cms/positions', { headers: adminHeaders(token), signal }),
  createPosition: (token, body, { signal } = {}) =>
    request('/api/cms/positions', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updatePosition: (token, code, body, { signal } = {}) =>
    request(`/api/cms/positions/${code}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
  deletePosition: (token, code, { signal } = {}) =>
    request(`/api/cms/positions/${code}`, { method: 'DELETE', headers: adminHeaders(token), signal }),

  // User accounts
  listUsers: (token, { signal } = {}) =>
    request('/api/cms/users', { headers: adminHeaders(token), signal }),
  createUser: (token, body, { signal } = {}) =>
    request('/api/cms/users', { method: 'POST', headers: adminHeaders(token), body, signal }),
  updateUser: (token, id, body, { signal } = {}) =>
    request(`/api/cms/users/${id}`, { method: 'PUT', headers: adminHeaders(token), body, signal }),
};
