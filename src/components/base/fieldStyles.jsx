// Untitled UI field label + help text (form control chrome).
export function Label({ htmlFor, children, required }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-brand-600"> *</span>}
    </label>
  );
}

export function HelpText({ error, hint }) {
  if (error) return <p role="alert" className="text-sm text-error-600">{error}</p>;
  if (hint) return <p className="text-sm text-gray-500">{hint}</p>;
  return null;
}
