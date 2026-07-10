import { useEffect, useRef } from 'react';
import TypingIndicator from './TypingIndicator';

// Renders the transcript. Autoscroll + aria-live so screen readers announce
// the newest assistant turn. DOM scroll is a real external-system sync → effect.
export default function MessageList({ messages, pending }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, pending]);

  return (
    <div className="msglist" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((m) => (
        <div key={m.id} className={`bubble bubble--${m.role}`}>
          {m.role === 'assistant' && <span className="sr-only">Assistant said: </span>}
          {m.content}
        </div>
      ))}
      {pending && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
