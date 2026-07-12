import { cx } from '../../utils/cx';

// Untitled UI button. Native <button> (drop-in for existing onClick handlers),
// styled to the UUI spec over the client teal (brand-600).
const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-xs hover:bg-brand-700 disabled:bg-brand-600',
  secondary:
    'bg-white text-gray-700 border border-gray-300 shadow-xs hover:bg-gray-50 hover:text-gray-800',
  tertiary:
    'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800',
  destructive:
    'bg-error-500 text-white shadow-xs hover:bg-error-600 disabled:bg-error-500',
  'destructive-secondary':
    'bg-white text-error-600 border border-error-200 shadow-xs hover:bg-error-50',
  link: 'bg-transparent text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline px-0 shadow-none',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-3.5 text-sm gap-1.5 rounded-lg',
  lg: 'h-11 px-4 text-sm gap-2 rounded-lg',
  xl: 'h-12 px-[18px] text-base gap-2 rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  iconLeading: Leading,
  iconTrailing: Trailing,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-colors duration-100 outline-none cursor-pointer',
        'focus-visible:ring-4 focus-visible:ring-brand-600/20',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Leading && <Leading aria-hidden="true" className="size-5 shrink-0" />}
      {children}
      {Trailing && <Trailing aria-hidden="true" className="size-5 shrink-0" />}
    </button>
  );
}
