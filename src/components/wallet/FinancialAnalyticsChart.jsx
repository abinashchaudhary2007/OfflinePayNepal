import { useState, useMemo } from 'react';
import { BarChart3, ArrowDownRight, ArrowUpRight, TrendingUp, Calendar, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { useAuth } from '../../context/DemoAuthContext';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * FinancialAnalyticsChart — Interactive Debit & Credit Bar Graph.
 * Visualizes income (Credits) vs expenditures (Debits) over 7 Days, 4 Weeks, or 6 Months.
 */
function FinancialAnalyticsChart() {
  const { currentUser } = useAuth();
  const { transactions } = useWallet();
  const { isDark } = useTheme();
  const [timeframe, setTimeframe] = useState('7d'); // '7d' | '4w' | '6m'
  const [hoveredBucket, setHoveredBucket] = useState(null);

  const userId = currentUser?.id;

  // Process transactions into Debit vs Credit data based on timeframe
  const chartData = useMemo(() => {
    const now = new Date();
    const settledTxs = (transactions || []).filter(tx => {
      // Include settled transactions or valid offline/online transactions
      return tx.status === 'SETTLED' || tx.status === 'VERIFIED' || tx.status === 'RECEIVER_ACKNOWLEDGED' || !tx.status || tx.status === 'CREATED';
    });

    if (timeframe === '7d') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const dayName = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        let debits = 0;
        let credits = 0;
        let count = 0;

        settledTxs.forEach(tx => {
          const txTime = new Date(tx.timestamp || tx.createdAt || now);
          if (txTime >= d && txTime < nextD) {
            const isSent = tx.senderId === userId;
            const isReceived = tx.receiverId === userId;
            const amt = Number(tx.amount) || 0;

            if (isSent) {
              debits += amt;
              count++;
            } else if (isReceived) {
              credits += amt;
              count++;
            }
          }
        });

        days.push({
          key: `d-${i}`,
          label: dayName,
          sublabel: dateLabel,
          debits,
          credits,
          count,
        });
      }
      return days;
    }

    if (timeframe === '4w') {
      // Last 4 weeks
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const endD = new Date(now);
        endD.setDate(now.getDate() - i * 7);
        endD.setHours(23, 59, 59, 999);

        const startD = new Date(endD);
        startD.setDate(endD.getDate() - 6);
        startD.setHours(0, 0, 0, 0);

        const weekLabel = i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `Week -${i}`;
        const rangeLabel = `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        let debits = 0;
        let credits = 0;
        let count = 0;

        settledTxs.forEach(tx => {
          const txTime = new Date(tx.timestamp || tx.createdAt || now);
          if (txTime >= startD && txTime <= endD) {
            const isSent = tx.senderId === userId;
            const isReceived = tx.receiverId === userId;
            const amt = Number(tx.amount) || 0;

            if (isSent) {
              debits += amt;
              count++;
            } else if (isReceived) {
              credits += amt;
              count++;
            }
          }
        });

        weeks.push({
          key: `w-${i}`,
          label: weekLabel,
          sublabel: rangeLabel,
          debits,
          credits,
          count,
        });
      }
      return weeks;
    }

    // Default: '6m' (Last 6 Months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const yearLabel = d.getFullYear().toString();

      let debits = 0;
      let credits = 0;
      let count = 0;

      settledTxs.forEach(tx => {
        const txTime = new Date(tx.timestamp || tx.createdAt || now);
        if (txTime >= d && txTime <= endMonth) {
          const isSent = tx.senderId === userId;
          const isReceived = tx.receiverId === userId;
          const amt = Number(tx.amount) || 0;

          if (isSent) {
            debits += amt;
            count++;
          } else if (isReceived) {
            credits += amt;
            count++;
          }
        }
      });

      months.push({
        key: `m-${i}`,
        label: monthName,
        sublabel: `${monthName} ${yearLabel}`,
        debits,
        credits,
        count,
      });
    }
    return months;
  }, [transactions, timeframe, userId]);

  // Aggregate totals
  const totals = useMemo(() => {
    const debits = chartData.reduce((acc, cur) => acc + cur.debits, 0);
    const credits = chartData.reduce((acc, cur) => acc + cur.credits, 0);
    const net = credits - debits;
    const maxVal = Math.max(...chartData.map(d => Math.max(d.debits, d.credits)), 100);

    return { debits, credits, net, maxVal };
  }, [chartData]);

  // Y-axis ticks calculation (4 steps)
  const yTicks = useMemo(() => {
    const max = totals.maxVal;
    // Round max to neat number
    const niceMax = max <= 200 ? 200 : max <= 500 ? 500 : max <= 1000 ? 1000 : max <= 2500 ? 2500 : Math.ceil(max / 1000) * 1000;
    return [
      niceMax,
      Math.round(niceMax * 0.66),
      Math.round(niceMax * 0.33),
      0,
    ];
  }, [totals.maxVal]);

  const yMax = yTicks[0] || 100;

  return (
    <div
      style={{
        borderRadius: '1.25rem',
        border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        padding: '24px 28px',
        boxShadow: isDark ? 'var(--shadow-card)' : '0 1px 4px rgba(23,43,117,0.06)',
      }}
      className="space-y-6 transition-all"
    >
      {/* ─── Header & Timeframe Switcher ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: isDark ? 'var(--border-color)' : '#DCE3F2' }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: '0.75rem',
              background: isDark ? 'rgba(79,111,216,0.15)' : '#EAF0FF',
              color: isDark ? '#738EE4' : '#172B75',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BarChart3 size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Debit & Credit Flow
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Breakdown of money sent (Debit) and received (Credit)
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div
          style={{
            background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            borderRadius: '0.75rem',
            padding: '3px',
          }}
          className="flex items-center self-start sm:self-auto"
        >
          {[
            { id: '7d', label: '7 Days' },
            { id: '4w', label: '4 Weeks' },
            { id: '6m', label: '6 Months' },
          ].map(tab => {
            const isActive = timeframe === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #172B75 0%, #3155B8 100%)' : 'transparent',
                  boxShadow: isActive ? '0 2px 6px rgba(23,43,117,0.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Summary Analytics Metrics Strip ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Credits */}
        <div
          style={{
            background: isDark ? 'rgba(22,166,106,0.08)' : '#F2FBF6',
            border: `1px solid ${isDark ? 'rgba(22,166,106,0.2)' : 'rgba(22,166,106,0.25)'}`,
            borderRadius: '1rem',
            padding: '14px 16px',
          }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16A66A] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#16A66A]" />
              <span>Total Credited (Inflow)</span>
            </div>
            <div className="text-lg sm:text-xl font-black" style={{ color: isDark ? '#34D399' : '#0F7249' }}>
              +{formatCurrency(totals.credits)}
            </div>
          </div>
          <div
            style={{
              width: 36, height: 36, borderRadius: '0.625rem',
              background: isDark ? 'rgba(22,166,106,0.2)' : '#E8F8F1',
              color: '#16A66A',
            }}
            className="flex items-center justify-center shrink-0"
          >
            <ArrowDownRight size={18} strokeWidth={2.4} />
          </div>
        </div>

        {/* Total Debits */}
        <div
          style={{
            background: isDark ? 'rgba(214,69,69,0.08)' : '#FEF6F6',
            border: `1px solid ${isDark ? 'rgba(214,69,69,0.2)' : 'rgba(214,69,69,0.25)'}`,
            borderRadius: '1rem',
            padding: '14px 16px',
          }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D64545] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#D64545]" />
              <span>Total Debited (Outflow)</span>
            </div>
            <div className="text-lg sm:text-xl font-black" style={{ color: isDark ? '#F87171' : '#A83636' }}>
              -{formatCurrency(totals.debits)}
            </div>
          </div>
          <div
            style={{
              width: 36, height: 36, borderRadius: '0.625rem',
              background: isDark ? 'rgba(214,69,69,0.2)' : '#FDECEC',
              color: '#D64545',
            }}
            className="flex items-center justify-center shrink-0"
          >
            <ArrowUpRight size={18} strokeWidth={2.4} />
          </div>
        </div>

        {/* Net Flow */}
        <div
          style={{
            background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
            border: `1px solid ${isDark ? 'var(--border-color)' : '#DCE3F2'}`,
            borderRadius: '1rem',
            padding: '14px 16px',
          }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1" style={{ color: 'var(--text-secondary)' }}>
              <TrendingUp size={13} />
              <span>Net Cash Flow</span>
            </div>
            <div
              className="text-lg sm:text-xl font-black"
              style={{
                color: totals.net >= 0
                  ? (isDark ? '#34D399' : '#16A66A')
                  : (isDark ? '#F87171' : '#D64545'),
              }}
            >
              {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
            </div>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 9999,
              background: totals.net >= 0
                ? (isDark ? 'rgba(22,166,106,0.2)' : '#E8F8F1')
                : (isDark ? 'rgba(214,69,69,0.2)' : '#FDECEC'),
              color: totals.net >= 0 ? '#16A66A' : '#D64545',
            }}
          >
            {totals.net >= 0 ? 'Surplus' : 'Deficit'}
          </span>
        </div>
      </div>

      {/* ─── Legend Indicator ─── */}
      <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-[#16A66A] to-[#34D399]" />
            <span style={{ color: 'var(--text-primary)' }}>Credit (Money In)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-gradient-to-t from-[#D64545] to-[#F87171]" />
            <span style={{ color: 'var(--text-primary)' }}>Debit (Money Out)</span>
          </div>
        </div>
        <span className="text-[11px] opacity-75 hidden sm:inline-block">
          Amounts in Nepalese Rupee (NPR)
        </span>
      </div>

      {/* ─── Interactive Bar Chart Area ─── */}
      <div className="relative pt-6 pb-2 select-none">
        {/* Y-Axis Guide Lines */}
        <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
          {yTicks.map((val, idx) => (
            <div key={idx} className="w-full flex items-center gap-2">
              <span className="text-[10px] font-mono w-14 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
                Rs. {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 !== 0 ? 1 : 0)}k` : val}
              </span>
              <div className="w-full border-b border-dashed" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#DCE3F2' }} />
            </div>
          ))}
        </div>

        {/* Columns & Bars */}
        <div className="relative z-10 pl-16 pr-2 h-56 flex items-end justify-around gap-2 sm:gap-4">
          {chartData.map((item, idx) => {
            const creditHeightPct = Math.min(100, Math.round((item.credits / yMax) * 100));
            const debitHeightPct = Math.min(100, Math.round((item.debits / yMax) * 100));
            const isHovered = hoveredBucket === item.key;
            const hasActivity = item.credits > 0 || item.debits > 0;

            return (
              <div
                key={item.key}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredBucket(item.key)}
                onMouseLeave={() => setHoveredBucket(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      marginBottom: '8px',
                      background: isDark ? '#1C294F' : '#172033',
                      color: '#FFFFFF',
                      borderRadius: '0.625rem',
                      padding: '8px 12px',
                      fontSize: '0.6875rem',
                      whiteSpace: 'nowrap',
                      zIndex: 30,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                      pointerEvents: 'none',
                    }}
                    className="animate-fade-in flex flex-col gap-1"
                  >
                    <div className="font-bold border-b border-white/20 pb-1 text-white/90">
                      {item.sublabel}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[#34D399] font-medium">
                      <span>Credit:</span>
                      <span className="font-bold font-mono">+{formatCurrency(item.credits)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[#F87171] font-medium">
                      <span>Debit:</span>
                      <span className="font-bold font-mono">-{formatCurrency(item.debits)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-white/80 font-medium pt-1 border-t border-white/10 text-[10px]">
                      <span>Activity:</span>
                      <span>{item.count} transaction{item.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}

                {/* Bars Twin Container */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44 pb-1">
                  {/* Credit Bar (Green) */}
                  <div className="w-1/2 max-w-[20px] h-full flex items-end">
                    <div
                      style={{
                        height: `${Math.max(creditHeightPct, item.credits > 0 ? 6 : 2)}%`,
                        background: item.credits > 0
                          ? 'linear-gradient(180deg, #34D399 0%, #16A66A 100%)'
                          : (isDark ? 'rgba(255,255,255,0.05)' : '#EAF0FF'),
                        boxShadow: isHovered && item.credits > 0 ? '0 0 12px rgba(22,166,106,0.5)' : 'none',
                      }}
                      className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-90"
                    />
                  </div>

                  {/* Debit Bar (Red) */}
                  <div className="w-1/2 max-w-[20px] h-full flex items-end">
                    <div
                      style={{
                        height: `${Math.max(debitHeightPct, item.debits > 0 ? 6 : 2)}%`,
                        background: item.debits > 0
                          ? 'linear-gradient(180deg, #F87171 0%, #D64545 100%)'
                          : (isDark ? 'rgba(255,255,255,0.05)' : '#EAF0FF'),
                        boxShadow: isHovered && item.debits > 0 ? '0 0 12px rgba(214,69,69,0.5)' : 'none',
                      }}
                      className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-90"
                    />
                  </div>
                </div>

                {/* X-Axis Label */}
                <div className="text-center pt-2 w-full">
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: isHovered ? 700 : 600,
                      color: isHovered
                        ? (isDark ? '#738EE4' : '#172B75')
                        : 'var(--text-secondary)',
                    }}
                    className="truncate transition-colors"
                  >
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Footer Insight Note ─── */}
      <div
        style={{
          background: isDark ? 'var(--bg-elevated)' : '#F5F7FF',
          border: `1px solid ${isDark ? 'var(--border-color)' : '#EAF0FF'}`,
          borderRadius: '0.875rem',
          padding: '12px 16px',
        }}
        className="flex items-center justify-between text-xs gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Info size={14} className="shrink-0 text-[#3155B8]" />
          <span>
            {totals.credits >= totals.debits
              ? `Healthy balance flow. Credits exceed debits by ${formatCurrency(totals.net)} in this period.`
              : `Spending exceeds inflows by ${formatCurrency(Math.abs(totals.net))}. Monitor your offline spending limits.`}
          </span>
        </div>
        <div className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          Real-time local ledger
        </div>
      </div>
    </div>
  );
}

export default FinancialAnalyticsChart;
