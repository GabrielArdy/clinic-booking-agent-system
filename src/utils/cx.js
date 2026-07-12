import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Untitled UI class combiner: clsx for conditionals, tailwind-merge to
// dedupe conflicting Tailwind utilities (later wins).
export function cx(...classes) {
  return twMerge(clsx(classes));
}
