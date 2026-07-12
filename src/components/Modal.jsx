import { useEffect, useRef } from 'react';
import { cx } from '../utils/cx';
import { IconClose } from './icons';

// Untitled UI modal over the native <dialog> — free focus-trap, Esc, top-layer
// backdrop. `open` is the source of truth; two small effects sync it to the
// imperative dialog API (a legitimate DOM-sync use of useEffect).
const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ open, onClose, title, subtitle, size = 'md', children }) {
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
      onClick={(e) => { if (e.target === ref.current) onClose(); }}  // backdrop click
      className={cx(
        'w-[calc(100vw-2rem)] rounded-2xl border-0 bg-white p-0 shadow-xl',
        'backdrop:bg-gray-950/50 backdrop:backdrop-blur-sm',
        'my-auto', SIZES[size],
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
        >
          <IconClose className="size-5" />
        </button>
      </div>
      <div className="px-6 pb-6">{open ? children : null}</div>
    </dialog>
  );
}
