import { useToasts, dismiss } from '../lib/toast';
import { cx } from '../utils/cx';
import { IconSuccess, IconWarning, IconClose } from './icons';

// Untitled UI toast stack — fixed bottom-right, one card per active toast.
const STYLES = {
  success: { ring: 'ring-success-600/20', icon: 'text-success-500', Icon: IconSuccess },
  error: { ring: 'ring-error-600/20', icon: 'text-error-500', Icon: IconWarning },
  info: { ring: 'ring-gray-200', icon: 'text-brand-500', Icon: IconSuccess },
};

export default function Toaster() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
         role="region" aria-label="Notifications">
      {toasts.map((t) => {
        const s = STYLES[t.type] ?? STYLES.info;
        const Icon = s.Icon;
        return (
          <div key={t.id} role="alert"
               className={cx(
                 'pointer-events-auto flex w-80 items-start gap-3 rounded-xl bg-white p-4',
                 'shadow-lg ring-1', s.ring,
               )}>
            <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', s.icon)} />
            <p className="flex-1 text-sm text-gray-700">{t.message}</p>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}
                    className="grid size-6 shrink-0 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">
              <IconClose className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
