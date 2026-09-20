import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Input — styled text/number/email/password input with label and error handling.
 */
const Input = forwardRef(function Input({
  label,
  error,
  hint,
  type = 'text',
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const resolvedType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--color-gray-700)]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-[var(--color-gray-400)] pointer-events-none flex">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={`
            input-field
            ${leftIcon ? 'has-left-icon pl-11' : ''}
            ${rightIcon || type === 'password' ? 'has-right-icon pr-11' : ''}
            ${error ? 'error' : ''}
            ${className}
          `}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />

        {type === 'password' ? (
          <button
            type="button"
            className="absolute right-3.5 text-[var(--color-gray-400)] hover:text-[var(--color-gray-600)] transition-colors"
            onClick={() => setShowPassword(s => !s)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : rightIcon ? (
          <span className="absolute right-3.5 text-[var(--color-gray-400)] pointer-events-none flex">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-red-500)]"
          role="alert"
        >
          <AlertCircle size={13} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="text-xs text-[var(--color-gray-400)]"
        >
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
