import { useEffect } from 'react';
import ChatWidget from './ChatWidget';
import { IconChat, IconClose } from '../icons';

// Floating chat dock, bottom-right. The launcher button toggles a popover panel.
// ChatWidget is mounted on first open and kept mounted so the conversation (and
// session) survives minimize — matching the mockup's "Minimized" launcher state.
export default function ChatDock({ open, mounted, onToggle, onClose }) {
  // Esc closes the panel — real keyboard sync, the legit use of an effect.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className="chatdock">
      {mounted && (
        <div
          className={`chatdock__panel ${open ? 'is-open' : ''}`}
          role="dialog"
          aria-label="Book an appointment"
          aria-hidden={!open}
        >
          <ChatWidget onClose={onClose} />
        </div>
      )}

      <button
        type="button"
        className={`chatdock__launcher ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-label={open ? 'Minimize booking chat' : 'Open booking chat'}
        onClick={onToggle}
      >
        {open ? <IconClose /> : <IconChat />}
        {!open && <span className="chatdock__badge" aria-hidden="true" />}
      </button>
    </div>
  );
}
