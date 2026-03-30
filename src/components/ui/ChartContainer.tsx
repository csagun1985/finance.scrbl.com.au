'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** Narrative commentary shown beside or below the chart */
  commentary?: string;
  /** Badge shown in header, e.g. "Assumed logic" */
  badge?: { label: string; color: 'amber' | 'slate' | 'emerald' | 'red' };
  headerAction?: ReactNode;
  isLoading?: boolean;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  commentary,
  badge,
  headerAction,
  isLoading,
}: ChartContainerProps) {
  const badgeColors = {
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {badge && (
              <span className={cn(
                'rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide',
                badgeColors[badge.color]
              )}>
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Chart body */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Optional AI commentary strip */}
      {commentary && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
              AI
            </span>
            <p className="text-xs leading-relaxed text-slate-600">{commentary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
