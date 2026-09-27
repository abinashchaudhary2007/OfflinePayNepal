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
  style,
  ...props
}, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const resolvedType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const padLeft = leftIcon ? '48px' : '18px';
  const padRight = (rightIcon || type === 'password') ? '48px' : '18px';

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs sm:text-sm font-bold text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] pointer-events-none flex items-center justify-center z-10">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          style={{
            paddingLeft: padLeft,
            paddingRight: padRight,
            paddingTop: '14px',
            paddingBottom: '14px',
            minHeight: '50px',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            boxSizing: 'border-box',
            width: '100%',
            ...style,
          }}
          className={`
            input-field
            ${leftIcon ? 'has-left-icon' : ''}
            ${rightIcon || type === 'password' ? 'has-right-icon' : ''}
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
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)] focus:text-[var(--color-indigo-600)] transition-colors cursor-pointer rounded-md flex items-center justify-center z-10 select-none hover:bg-[var(--color-gray-100)] focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(s => !s);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            id={`${inputId}-toggle-password`}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : rightIcon ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] pointer-events-none flex items-center justify-center">
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
