import { useId } from 'react';
import { cx } from '../../utils/cx';
import { controlClass } from './controls';
import { Label, HelpText } from './fieldStyles';

// Untitled UI text input with optional label, hint, error, and leading icon.
export default function Input({
  label,
  hint,
  error,
  required,
  className,
  id,
  iconLeading: Leading,
  ...props
}) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId} required={required}>{label}</Label>
      <div className="relative">
        {Leading && (
          <Leading aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={controlClass(error, cx('h-10 px-3', Leading && 'pl-10', className))}
          {...props}
        />
      </div>
      <HelpText error={error} hint={hint} />
    </div>
  );
}
