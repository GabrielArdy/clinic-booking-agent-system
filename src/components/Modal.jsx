import { useEffect, useRef } from 'react';
import { IconClose } from './icons';

// Reusable modal over the native <dialog> — free focus-trap, Esc, top-layer
// backdrop. `open` is the source of truth; two small effects sync it to the
// imperative dialog API (a legitimate DOM-sync use of useEffect).
export default function Modal({ open, onClose, title, size, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e) => { e.preventDefault(); onClose(); };  // Esc
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={`modal ${size ? `modal--${size}` : ''}`}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}  // backdrop click
    >
      <div className="modal__head">
        <h2>{title}</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <div className="modal__body">{open ? children : null}</div>
    </dialog>
  );
}
