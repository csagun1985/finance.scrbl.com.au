'use client';

import { KPICardData } from '@/types';
import { formatCurrency, formatPercent, formatNumber, formatHours, formatDelta } from '@/lib/dataTransforms';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface KPICardProps {
  data: KPICardData;
  className?: string;
}

function formatValue(value: number, format: KPICardData['format']): string {
  switch (format) {
    case 'currency': return formatCurrency(value, true);
    case 'percent':  return formatPercent(value);
    case 'hours':    return formatHours(value);
    default:         return formatNumber(value);
  }
}

export function KPICard({ data, className }: KPICardProps) {
  const { label, value, format, delta, subtitle, alert, alertMessage } = data;

  const alertColors = {
    warning: 'border-amber-300 bg-amber-50',
    danger: 'border-red-300 bg-red-50',
    info: 'border-brand-300 bg-brand-50',
  };

  const AlertIcon = {
    warning: AlertTriangle,
    danger: AlertCircle,
    info: Info,
  };

  const alertIconColors = {
    warning: 'text-amber-500',
    danger: 'text-red-500',
    info: 'text-brand-500',
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        alert && alertColors[alert],
        !alert && 'border-slate-200',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {alert && (
          <span className={cn('mt-0.5 shrink-0', alertIconColors[alert])}>
            {(() => { const Icon = AlertIcon[alert]; return <Icon size={14} />; })()}
          </span>
        )}
      </div>

      {/* Main value */}
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {formatValue(value, format)}
      </div>

      {/* Delta badge */}
      {delta && delta.direction !== 'flat' && (
        <div className="mt-1.5 flex items-center gap-1">
          {delta.direction === 'up'
            ? <TrendingUp size={13} className={delta.isPositive ? 'text-emerald-500' : 'text-red-500'} />
            : delta.direction === 'down'
            ? <TrendingDown size={13} className={delta.isPositive ? 'text-emerald-500' : 'text-red-500'} />
            : <Minus size={13} className="text-slate-400" />}
          <span
            className={cn(
              'text-xs font-medium',
              delta.isPositive ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {formatDelta(delta, format)}
          </span>
          <span className="text-xs text-slate-400">vs prior period</span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <div className="mt-1.5 text-xs text-slate-500">{subtitle}</div>
      )}

      {/* Alert message */}
      {alertMessage && (
        <div className={cn(
          'mt-2 rounded-md px-2 py-1.5 text-xs leading-relaxed',
          alert === 'danger' && 'bg-red-100 text-red-700',
          alert === 'warning' && 'bg-amber-100 text-amber-700',
          alert === 'info' && 'bg-brand-100 text-brand-700',
        )}>
          {alertMessage}
        </div>
      )}
    </div>
  );
}
