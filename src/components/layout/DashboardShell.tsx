'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart2, Users, UserCheck, TrendingUp, Activity,
  LayoutDashboard,
} from 'lucide-react';

// [CONFIRMED] 5 pages matching PBIX: Utilisation_SAH, Client_SAH, Care Partner, GM, Trend
const NAV_ITEMS = [
  { href: '/',                  label: 'Utilisation',  icon: Activity,       description: 'Fund utilisation & subsidy tracking' },
  { href: '/client',            label: 'Clients',      icon: Users,          description: 'Client-level financial analysis' },
  { href: '/care-partner',      label: 'Care Partners',icon: UserCheck,      description: 'Provider performance & utilisation' },
  { href: '/gm',                label: 'Gross Margin', icon: BarChart2,      description: 'Internal, on-hire & external GM' },
  { href: '/trend',             label: 'Trend',        icon: TrendingUp,     description: 'Time series & growth analysis' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <LayoutDashboard size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none">SHC Finance</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Analytics Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                )}
                title={item.description}
              >
                <Icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-500'
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer note */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Data: Mock (replace with SHC export)
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            Built from SHC Dashboard_Finance.pbix
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
