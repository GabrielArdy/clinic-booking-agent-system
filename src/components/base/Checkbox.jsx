import { useId } from 'react';
import { cx } from '../../utils/cx';

// Untitled UI checkbox — native input with accent brand, aligned label.
export default function Checkbox({ label, hint, className, id, ...props }) {
  const auto = useId();
  const boxId = id ?? auto;
  return (
    <div className="flex gap-2">
      <input
        id={boxId}
        type="checkbox"
        className={cx(
          'mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-brand-600',
          'focus-visible:ring-4 focus-visible:ring-brand-600/20 outline-none',
          className,
        )}
        {...props}
      />
      {label && (
        <label htmlFor={boxId} className="cursor-pointer select-none">
          <span className="block text-sm font-medium text-gray-700">{label}</span>
          {hint && <span className="block text-sm text-gray-500">{hint}</span>}
        </label>
      )}
    </div>
  );
}
