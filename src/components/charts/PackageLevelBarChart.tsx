'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { PackageLevelSummary } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/dataTransforms';

interface Props {
  summaries: PackageLevelSummary[];
  /** Which metric to show in the bar chart */
  metric?: 'utilisation' | 'gm' | 'chargedOut' | 'unutilised';
}

// Package level colours — used consistently across all charts
export const LEVEL_COLORS: Record<number, string> = {
  1: '#38bdf8', // sky
  2: '#a78bfa', // violet
  3: '#fb923c', // amber-orange
  4: '#f87171', // rose
};

export function PackageLevelBarChart({ summaries, metric = 'utilisation' }: Props) {
  const chartData = summaries.map(s => ({
    name: s.label,
    level: s.level,
    value: metric === 'utilisation' ? s.utilisationRate
         : metric === 'gm'          ? s.gmPct
         : metric === 'chargedOut'  ? s.chargedOut
         :                            s.unutilisedFund,
    clients: s.clientCount,
    raw: s,
  }));

  const isPercent = metric === 'utilisation' || metric === 'gm';

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: typeof chartData[0] }>;
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const s = d.raw;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-slate-800">{d.name}</p>
        <p className="text-slate-600">{d.clients} clients</p>
        <p>Fund Subsidy: <span className="font-medium">{formatCurrency(s.fundSubsidy, true)}</span></p>
        <p>Utilisation: <span className="font-medium">{formatPercent(s.utilisationRate)}</span></p>
        <p>Unutilised: <span className="font-medium text-amber-600">{formatCurrency(s.unutilisedFund, true)}</span></p>
        <p>Total GM: <span className="font-medium text-emerald-600">{formatCurrency(s.totalGM, true)}</span></p>
        <p>GM %: <span className="font-medium">{formatPercent(s.gmPct)}</span></p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => isPercent ? `${(v * 100).toFixed(0)}%` : `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={LEVEL_COLORS[entry.level] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Grouped bar chart — utilised vs unutilised side by side
// ---------------------------------------------------------------------------
export function PackageLevelGroupedBarChart({ summaries }: { summaries: PackageLevelSummary[] }) {
  const chartData = summaries.map(s => ({
    name: s.label,
    level: s.level,
    'Utilised Fund': s.utilisedFund,
    'Unutilised Fund': s.unutilisedFund,
    'Total GM': s.totalGM,
  }));

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-slate-800">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-medium">{formatCurrency(p.value, true)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
        <Bar dataKey="Utilised Fund" fill="#0f9e9e" radius={[3,3,0,0]} maxBarSize={40} />
        <Bar dataKey="Unutilised Fund" fill="#e2e8f0" radius={[3,3,0,0]} maxBarSize={40} />
        <Bar dataKey="Total GM" fill="#34d399" radius={[3,3,0,0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
