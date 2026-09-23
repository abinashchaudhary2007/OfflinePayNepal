import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({
  showLabel = false,
  className = '',
  size = 'md', // 'sm' | 'md'
}) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = size === 'sm' ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl';
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        inline-flex items-center gap-2 border transition-all duration-200 cursor-pointer
        ${isDark
          ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-amber-300 shadow-xs'
          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 shadow-xs hover:text-slate-900'}
        ${sizeClasses}
        ${className}
      `}
    >
      <div className="relative flex items-center justify-center transition-transform duration-300">
        {isDark ? (
          <Sun size={iconSize} className="animate-spin-once text-amber-400" />
        ) : (
          <Moon size={iconSize} className="text-slate-600" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold select-none">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
