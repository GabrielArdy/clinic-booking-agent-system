import { cx } from '../../utils/cx';

// Untitled UI data table primitives. Wrap in <TableCard> for the bordered,
// horizontally-scrollable container UUI uses.
export function TableCard({ className, children }) {
  return (
    <div className={cx('overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs', className)}>
      {children}
    </div>
  );
}

export function Table({ className, children }) {
  return <table className={cx('w-full text-left text-sm', className)}>{children}</table>;
}

export function THead({ children }) {
  return (
    <thead className="border-b border-gray-200 bg-gray-50">
      {children}
    </thead>
  );
}

export function TH({ className, children, ...props }) {
  return (
    <th className={cx('px-6 py-3 text-xs font-semibold text-gray-500', className)} {...props}>
      {children}
    </th>
  );
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TR({ className, children, ...props }) {
  return <tr className={cx('hover:bg-gray-50/60', className)} {...props}>{children}</tr>;
}

export function TD({ className, children, ...props }) {
  return <td className={cx('px-6 py-4 text-sm text-gray-700 align-middle', className)} {...props}>{children}</td>;
}
