import { cx } from '../../utils/cx';

// Untitled UI page header — title + optional subtitle on the left, actions right.
export function PageHeader({ title, subtitle, children, className }) {
  return (
    <div className={cx('mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5', className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

// Responsive two-column grid for modal forms; children can span with `col-span-2`.
export function FormGrid({ className, children }) {
  return <div className={cx('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

// Titled card panel with an optional header action (used for grouped sub-lists).
export function Panel({ title, action, className, children }) {
  return (
    <div className={cx('overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// Right-aligned modal footer (Cancel + submit).
export function ModalFooter({ className, children }) {
  return (
    <div className={cx('mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4', className)}>
      {children}
    </div>
  );
}
