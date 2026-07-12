// WebSocket URL builders for the live chat hub (/ws). Browsers can't set custom
// headers on a WS handshake, so credentials ride the query string (ENDPOINTS_V2
// §live-chat). Mirrors api/client.js's BASE: empty = same-origin (Vite proxy).
const BASE = import.meta.env.VITE_API_BASE ?? '';

// Turn an http(s) origin into a ws(s) one; same-origin falls back to location.
function wsOrigin() {
  if (BASE) {
    const u = new URL(BASE);
    return `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

// Build a full ws URL from a path (which may already carry a query, e.g. the
// bot's liveChat.wsPath) plus extra params. Provided params win on key clash.
export function buildWs(path, params = {}) {
  const [pathname, existing] = String(path || '/ws').split('?');
  const q = new URLSearchParams(existing);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, v);
  }
  const qs = q.toString();
  return `${wsOrigin()}${pathname}${qs ? `?${qs}` : ''}`;
}
