import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowUpRight } from 'lucide-react';

function PlaceholderPage({ title, subtitle, phase, icon: Icon = ArrowUpRight, color = 'var(--color-indigo-500)' }) {
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-black text-[var(--color-gray-900)] mb-1">{title}</h1>
        <p className="text-[var(--color-gray-500)] text-sm mb-8">{subtitle}</p>
        <div
          className="rounded-2xl p-12 text-center border-2 border-dashed"
          style={{ borderColor: `${color}40`, background: `${color}08` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${color}15` }}
          >
            <Icon size={32} style={{ color }} />
          </div>
          <p className="font-bold text-[var(--color-gray-700)] text-lg">{title}</p>
          <p className="text-sm text-[var(--color-gray-400)] mt-2 max-w-sm mx-auto">
            This feature is implemented in <strong>{phase}</strong>.
            The architecture, routing, and layout are already in place.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PlaceholderPage;
