import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — Reusable button with variants, sizes, and loading state.
 *
 * Variants: primary | navy | emerald | outline | outline-white | ghost | danger
 * Sizes: sm | md | lg | xl
 */
const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  disabled,
  ...props
}, ref) {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const blockClass = block ? 'btn-block' : '';

  return (
    <button
      ref={ref}
      className={`btn ${variantClass} ${sizeClass} ${blockClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!loading && rightIcon ? rightIcon : null}
    </button>
  );
});

export default Button;
