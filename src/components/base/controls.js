import { cx } from '../../utils/cx';

// Shared Untitled UI control surface for Input / Select / TextArea.
export function controlClass(error, extra) {
  return cx(
    'w-full bg-white text-gray-900 text-sm rounded-lg border shadow-xs',
    'transition-shadow duration-100 outline-none appearance-none',
    'placeholder:text-gray-500',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    error
      ? 'border-error-300 focus-visible:border-error-300 focus-visible:ring-4 focus-visible:ring-error-500/18'
      : 'border-gray-300 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-600/18',
    extra,
  );
}
