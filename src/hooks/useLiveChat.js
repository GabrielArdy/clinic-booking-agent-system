import { useCallback, useEffect, useRef, useState } from 'react';
import { buildWs } from '../lib/ws';

// Outgoing `typing` frames are a keepalive that resets the server idle timer —
// throttle so we send at most one per this interval, not one per keystroke.
const TYPING_THROTTLE_MS = 2000;

// The live-chat message shape isn't fully pinned in the contract, so normalize
// defensively: accept whatever the backend calls the sender / body / id fields.
function normalize(m, i) {
  if (!m || typeof m !== 'object') return { id: `m${i}`, sender: 'system', body: String(m ?? '') };
  const sender = m.sender ?? m.role ?? m.from ?? (m.isStaff ? 'staff' : 'patient');
  const body = m.body ?? m.content ?? m.text ?? m.message ?? '';
  const id = m.id ?? `${sender}-${m.createdAt ?? ''}-${i}`;
  return { id, sender, body, createdAt: m.createdAt ?? null };
}

// De-dupe by id: our own messages are echoed back to us, so the echo is the one
// that lands in the thread (no optimistic append → no doubles, no ghost order).
function appendUnique(list, msg) {
  return list.some((m) => m.id === msg.id) ? list : [...list, msg];
}

/**
 * Drives one live-chat WebSocket connection. `url` is the full ws:// URL (build
 * with lib/ws.buildWs). A WS is a real external system → this effect is the
 * legit use of useEffect: one concern (socket lifecycle), cleanup always closes.
 * Passing a falsy `url` keeps the hook idle (e.g. before a session is claimed).
 */
export function useLiveChat(url) {
  const [status, setStatus] = useState('idle');   // idle | connecting | open | closed
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [idleWarning, setIdleWarning] = useState(null); // { secondsLeft } | null (patient only)
  const [closeReason, setCloseReason] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const lastTyping = useRef(0);

  useEffect(() => {
    // setState-in-effect is intentional throughout: this effect owns an external
    // subscription (the WebSocket), the sanctioned use case for the pattern.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!url) { setStatus('idle'); return undefined; }
    setStatus('connecting');
    setError(null);
    setCloseReason(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    let ws;
    try { ws = new WebSocket(url); } catch {
      setStatus('closed');
      setError({ message: 'Could not open the chat connection.' });
      return undefined;
    }
    wsRef.current = ws;

    ws.onopen = () => setStatus('open');
    ws.onmessage = (ev) => {
      let f;
      try { f = JSON.parse(ev.data); } catch { return; }
      switch (f.type) {
        case 'history':
          if (f.session) setSession(f.session);
          setMessages((f.messages ?? []).map(normalize));
          break;
        case 'message':
          setMessages((prev) => appendUnique(prev, normalize(f.message, prev.length)));
          setIdleWarning(null); // any traffic clears a pending idle warning
          break;
        case 'session_claimed':
          if (f.session) setSession(f.session);
          break;
        case 'idle_warning':
          setIdleWarning({ secondsLeft: f.secondsLeft });
          break;
        case 'session_closed':
          if (f.session) setSession(f.session);
          setCloseReason(f.reason ?? 'closed');
          setStatus('closed');
          break;
        case 'error':
          setError({ message: f.error, code: f.code });
          break;
        default:
          break;
      }
    };
    ws.onerror = () => setError((prev) => prev ?? { message: 'Connection error.' });
    ws.onclose = (ev) => {
      setStatus('closed');
      if (ev.code === 4401) setError({ message: 'This chat link is no longer valid.', code: '4401' });
      else if (ev.code === 4403) setError({ message: 'Not authorized for this chat.', code: '4403' });
      else if (ev.code === 4400) setError({ message: 'Chat connection was rejected.', code: '4400' });
    };

    return () => {
      wsRef.current = null;
      // Normal closure on unmount — do NOT send `complete` (that would end the
      // session for both sides; navigating away should just drop the socket).
      try { ws.close(1000); } catch { /* already closing */ }
    };
  }, [url]);

  const send = useCallback((body) => {
    const text = body?.trim();
    const ws = wsRef.current;
    if (!text || ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'message', body: text }));
  }, []);

  const sendTyping = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (now - lastTyping.current < TYPING_THROTTLE_MS) return;
    lastTyping.current = now;
    ws.send(JSON.stringify({ type: 'typing' }));
  }, []);

  const complete = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'complete' }));
  }, []);

  return { status, messages, session, idleWarning, closeReason, error, send, sendTyping, complete };
}

/**
 * Staff/admin dashboard notification socket: role=staff with no session id. Only
 * surfaces `new_session` (a patient wants to connect). Kept separate from the
 * room socket so it stays alive across console sections. `onNewSession` is held
 * in a ref so a changing callback doesn't churn the connection.
 */
export function useStaffChatNotifications(token, onNewSession) {
  const cbRef = useRef(onNewSession);
  useEffect(() => { cbRef.current = onNewSession; }, [onNewSession]);

  useEffect(() => {
    if (!token) return undefined;
    let ws;
    try { ws = new WebSocket(buildWs('/ws', { role: 'staff', token })); } catch { return undefined; }
    ws.onmessage = (ev) => {
      let f;
      try { f = JSON.parse(ev.data); } catch { return; }
      if (f.type === 'new_session') cbRef.current?.(f);
    };
    return () => { try { ws.close(1000); } catch { /* noop */ } };
  }, [token]);
}
