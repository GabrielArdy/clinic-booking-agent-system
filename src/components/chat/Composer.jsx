import { useState } from 'react';

// Free-text input — always available beside chips (contract §3 requires free text).
// Uncontrolled-ish: one local state for the draft, submitted on send. Cheap enough
// (a single input; controlled render per keystroke is fine for one field).
export default function Composer({ disabled, onSend }) {
  const [draft, setDraft] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
  };

  return (
    <form className="composer" onSubmit={submit}>
      <input
        className="composer__input"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type a message…"
        maxLength={2000}
        aria-label="Type a message"
        autoComplete="off"
      />
      <button className="composer__send" type="submit" disabled={disabled || !draft.trim()}
              aria-label="Send message">
        ➤
      </button>
    </form>
  );
}
