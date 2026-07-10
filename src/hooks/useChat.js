import { useCallback, useEffect, useRef, useState } from 'react';
import { sendChat, fetchHistory, clearSessionId, getSessionId, ApiError } from '../api/client';

let msgId = 0;
const nextId = () => `m${++msgId}`;

// Owns the whole booking conversation. One concern per state slice; derived
// values (stage, quickReplies) live on `turn` and are read, never duplicated.
export function useChat() {
  const [messages, setMessages] = useState([]);       // {id, role, content}
  const [turn, setTurn] = useState(null);              // latest AssistantTurn meta
  const [pending, setPending] = useState(false);       // awaiting /api/chat
  const [error, setError] = useState(null);            // ApiError (network/rate-limit)
  const [ready, setReady] = useState(false);           // initial load finished

  const inflight = useRef(null); // AbortController for the current turn

  const applyTurn = useCallback((t) => {
    setTurn(t);
    setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: t.message }]);
  }, []);

  const send = useCallback(async (message) => {
    if (pending) return;
    setError(null);
    // Echo the user's message immediately (skip the empty bootstrap message).
    if (message !== '') {
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: message }]);
    }
    setPending(true);
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    try {
      const t = await sendChat(message, { signal: ctrl.signal });
      applyTurn(t);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err instanceof ApiError ? err : new ApiError('Something went wrong.'));
    } finally {
      if (inflight.current === ctrl) {
        inflight.current = null;
        setPending(false);
      }
    }
  }, [pending, applyTurn]);

  const restart = useCallback(() => {
    inflight.current?.abort();
    clearSessionId();
    setMessages([]);
    setTurn(null);
    setError(null);
    send(''); // fresh greeting + specialty chips
  }, [send]);

  // Bootstrap: rehydrate an existing session's transcript, else start fresh.
  // Runs once — external-system sync (network + storage), the legit use of effect.
  useEffect(() => {
    const ctrl = new AbortController();
    const sid = getSessionId();
    (async () => {
      if (sid) {
        try {
          const { messages: log } = await fetchHistory(sid, { signal: ctrl.signal });
          if (log?.length) {
            setMessages(log.map((m) => ({ id: nextId(), role: m.role, content: m.content })));
            setReady(true);
            return; // transcript restored; user continues via free-text input
          }
        } catch (err) {
          if (err?.name === 'AbortError') return;
          // fall through to a fresh start on any rehydrate failure
        }
      }
      setReady(true);
      send('');
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: bootstrap exactly once

  return { messages, turn, pending, error, ready, send, restart };
}
