/**
 * Card — Base card container with variants.
 * Variants: default | glass | navy | flat
 */
export function Card({
  children,
  variant = 'default',
  className = '',
  padding = true,
  hover = false,
  ...props
}) {
  const variantClasses = {
    default: 'card',
    glass:   'card-glass',
    navy:    'card-navy',
    flat:    'rounded-2xl border border-[var(--color-gray-100)] bg-white',
  };

  const paddingClass = padding ? 'p-6' : '';
  const hoverClass   = hover ? 'cursor-pointer' : '';

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader — Title + subtitle section at the top of a card
 */
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title && (
          <h3 className="font-semibold text-[var(--color-gray-900)] text-base">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-[var(--color-gray-500)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export default Card;
