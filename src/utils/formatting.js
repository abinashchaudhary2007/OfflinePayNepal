/**
 * Formatting utilities for OfflinePay Nepal
 * Currency: NPR (Nepalese Rupee)
 */

/**
 * Format NPR amount — e.g., Rs. 5,000.00
 */
export function formatCurrency(amount, options = {}) {
  const {
    currency = 'NPR',
    symbol = 'Rs.',
    decimals = 2,
    showSign = false,
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol} --`;
  }

  const num = parseFloat(amount);
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const sign = showSign ? (num >= 0 ? '+' : '-') : '';
  return `${sign}${symbol} ${formatted}`;
}

/**
 * Format transaction amount with +/- sign
 */
export function formatTransactionAmount(amount, type) {
  const num = parseFloat(amount);
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = type === 'received' ? '+Rs. ' : '-Rs. ';
  return `${prefix}${formatted}`;
}

/**
 * Format date/time relative — e.g., "2 hours ago", "just now"
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 5)   return 'just now';
  if (diffSecs < 60)  return `${diffSecs}s ago`;
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7)   return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Format date — e.g., "Sep 17, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time — e.g., "Sep 17, 2026 · 08:30 AM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const datePart = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
}

/**
 * Format device ID — e.g., "DEVICE-AB29F1"
 */
export function formatDeviceId(deviceId) {
  return deviceId || 'Unknown Device';
}

/**
 * Format transaction ID short — e.g., "TX-2026-001" → "TX-001"
 */
export function formatTxIdShort(txId) {
  if (!txId) return '--';
  const parts = txId.split('-');
  return parts.length >= 3 ? `TX-${parts[parts.length - 1]}` : txId;
}

/**
 * Calculate percentage used
 */
export function calcPercentage(used, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

/**
 * Get status badge class name
 */
export function getStatusBadgeClass(status) {
  const map = {
    SETTLED:         'badge-settled',
    VERIFIED:        'badge-verified',
    OFFLINE_PENDING: 'badge-pending',
    PENDING:         'badge-pending',
    SYNCING:         'badge-syncing',
    REJECTED:        'badge-rejected',
    FAILED:          'badge-failed',
    ACTIVE:          'badge-active',
    CREATED:         'badge-syncing',
    EXPIRED:         'badge-failed',
  };
  return map[status] || 'badge-syncing';
}

/**
 * Get status label for display
 */
export function getStatusLabel(status) {
  const map = {
    SETTLED:         'Settled',
    VERIFIED:        'Verified',
    OFFLINE_PENDING: 'Offline Pending',
    PENDING:         'Pending',
    SYNCING:         'Syncing',
    REJECTED:        'Rejected',
    FAILED:          'Failed',
    ACTIVE:          'Active',
    CREATED:         'Created',
    EXPIRED:         'Expired',
  };
  return map[status] || status;
}

/**
 * Truncate long strings
 */
export function truncate(str, maxLen = 24) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
