import { getStatusBadgeClass, getStatusLabel } from '../../utils/formatting';

/**
 * Badge — Status pill component.
 * Can use a known status string or provide a custom variant.
 */
export function Badge({ status, variant, children, dot = false, className = '' }) {
  // If "status" is given, derive classes from status map
  const badgeClass = variant
    ? `badge badge-${variant}`
    : `badge ${getStatusBadgeClass(status)}`;

  const label = children || getStatusLabel(status);

  return (
    <span className={`${badgeClass} ${className}`}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: 'currentColor', opacity: 0.8 }}
        />
      )}
      {label}
    </span>
  );
}

/**
 * DemoBadge — "DEMO — SIMULATED MONEY ONLY" badge
 */
export function DemoBadge({ className = '' }) {
  return (
    <span className={`badge badge-demo text-[10px] tracking-widest ${className}`}>
      🎭 DEMO — SIMULATED MONEY ONLY
    </span>
  );
}

/**
 * SecurityBadge — For security status indicators
 */
export function SecurityBadge({ level, className = '' }) {
  const config = {
    LOW:      { cls: 'badge-settled',  label: '🟢 LOW' },
    MEDIUM:   { cls: 'badge-pending',  label: '🟡 MEDIUM' },
    HIGH:     { cls: 'badge-rejected', label: '🔴 HIGH' },
    CRITICAL: { cls: 'badge-rejected', label: '🚨 CRITICAL' },
  };
  const { cls, label } = config[level] || config.LOW;

  return (
    <span className={`badge ${cls} ${className}`}>{label}</span>
  );
}

export default Badge;
