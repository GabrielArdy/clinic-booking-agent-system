import { useEffect, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { IconSend } from '../icons';

// One message bubble. `system` messages (claim template, close notices) render
// centered + muted; everyone else is a left/right bubble by ownership.
function Bubble({ m, mine }) {
  if (m.sender === 'system') {
    return <p className="mx-auto max-w-[85%] text-center text-xs text-gray-500">{m.body}</p>;
  }
  return (
    <div className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
          mine
            ? 'rounded-br-sm bg-brand-600 text-white'
            : 'rounded-bl-sm bg-gray-100 text-gray-800',
        )}
      >
        {m.body}
      </div>
    </div>
  );
}

/**
 * Presentational chat thread shared by the patient handoff panel and the staff
 * room. Owns only the composer draft (one field → controlled is fine). Whether a
 * message is "mine" is decided by `mineSender` ('patient' | 'staff'). Omit
 * `onSend` for a read-only transcript (closed sessions).
 */
export default function LiveThread({
  messages, mineSender, banner, footer, disabled,
  placeholder = 'Type a message…', onSend, onTyping,
}) {
  const endRef = useRef(null);
  const [draft, setDraft] = useState('');

  // DOM autoscroll to the newest message — a real external-system sync.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {banner}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4"
           role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((m) => <Bubble key={m.id} m={m} mine={m.sender === mineSender} />)}
        <div ref={endRef} />
      </div>
      {footer}
      {onSend && (
        <form onSubmit={submit} className="flex items-center gap-2 border-t border-gray-200 p-3">
          <input
            value={draft}
            onChange={(e) => { setDraft(e.target.value); onTyping?.(); }}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={2000}
            autoComplete="off"
            aria-label="Type a message"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={disabled || !draft.trim()}
            aria-label="Send message"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          >
            <IconSend className="size-4" aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
