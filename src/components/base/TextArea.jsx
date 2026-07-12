import { useId } from 'react';
import { cx } from '../../utils/cx';
import { controlClass } from './controls';
import { Label, HelpText } from './fieldStyles';

// Untitled UI multiline input.
export default function TextArea({
  label, hint, error, required, className, id, rows = 4, ...props
}) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={areaId} required={required}>{label}</Label>
      <textarea
        id={areaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={controlClass(error, cx('px-3 py-2.5 leading-6 resize-y', className))}
        {...props}
      />
      <HelpText error={error} hint={hint} />
    </div>
  );
}
