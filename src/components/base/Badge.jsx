import { cx } from '../../utils/cx';

// Untitled UI badge — soft pill with a subtle ring, optional leading dot/icon.
const COLORS = {
  gray: 'bg-gray-50 text-gray-700 ring-gray-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  success: 'bg-success-50 text-success-700 ring-success-600/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-600/25',
  error: 'bg-error-50 text-error-700 ring-error-600/20',
  accent: 'bg-sky-50 text-accent-700 ring-accent-600/20',
};

const DOTS = {
  gray: 'bg-gray-400', brand: 'bg-brand-500', success: 'bg-success-500',
  warning: 'bg-warning-400', error: 'bg-error-500', accent: 'bg-accent-500',
};

export default function Badge({
  color = 'gray', dot = false, icon: Icon, className, children,
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        COLORS[color], className,
      )}
    >
      {dot && <span className={cx('size-1.5 rounded-full', DOTS[color])} aria-hidden="true" />}
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {children}
    </span>
  );
}
