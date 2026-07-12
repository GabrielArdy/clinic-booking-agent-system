import { useId } from 'react';
import { cx } from '../../utils/cx';
import { controlClass } from './controls';
import { Label, HelpText } from './fieldStyles';
import { IconExpand } from '../icons';

// Untitled UI select — native <select> (keeps <option>/<optgroup> + onChange),
// with a UUI chevron. Pass options as children.
export default function Select({
  label, hint, error, required, className, id, children, ...props
}) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={selectId} required={required}>{label}</Label>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={controlClass(error, cx('h-10 pl-3 pr-9 cursor-pointer', className))}
          {...props}
        >
          {children}
        </select>
        <IconExpand aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
      </div>
      <HelpText error={error} hint={hint} />
    </div>
  );
}
