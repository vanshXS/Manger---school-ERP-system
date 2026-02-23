'use client';

/**
 * Consistent inline error message for form fields.
 * Use below inputs with red border when validation or API error exists.
 */
export default function InlineError({ children, className = '' }) {
  if (!children) return null;
  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`} role="alert">
      {children}
    </p>
  );
}
