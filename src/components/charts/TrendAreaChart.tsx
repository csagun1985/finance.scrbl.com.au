'use client';

import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendPoint } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/dataTransforms';

// ---------------------------------------------------------------------------
// Revenue & GM trend — [CONFIRMED] from PBIX Trend page area chart
// ---------------------------------------------------------------------------
interface RevenueGMTrendProps {
  data: TrendPoint[];
  /** Highlight selected period range */
  selectedFrom?: string;
  selectedTo?: string;
}

export function RevenueGMTrendChart({ data, selectedFrom, selectedTo }: RevenueGMTrendProps) {
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1 min-w-[160px]">
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
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0f9e9e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0f9e9e" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="gradGM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#34d399" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
        <Area
          type="monotone"
          dataKey="chargedOut"
          name="Total Charged Out"
          stroke="#0f9e9e"
          strokeWidth={2}
          fill="url(#gradRevenue)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="totalGM"
          name="Total GM $"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#gradGM)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Utilisation trend line — [CONFIRMED] from PBIX Trend page
// ---------------------------------------------------------------------------
export function UtilisationTrendChart({ data }: { data: TrendPoint[] }) {
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="text-brand-600">
          Utilisation: <span className="font-medium">{formatPercent(payload[0].value)}</span>
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0.3, 1.05]}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Reference line at 70% low-util threshold */}
        <ReferenceLine y={0.70} stroke="#fbbf24" strokeDasharray="4 4" label={{
          value: '70%', position: 'insideTopRight', fontSize: 10, fill: '#d97706',
        }} />
        <Line
          type="monotone"
          dataKey="utilisationRate"
          name="Utilisation Rate"
          stroke="#0f9e9e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Package fund stacked area — [CONFIRMED] from PBIX Trend page stacked area
// ---------------------------------------------------------------------------
export function PackageFundStackedAreaChart({ data }: { data: TrendPoint[] }) {
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((a, p) => a + p.value, 0);
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-slate-800">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-medium">{formatCurrency(p.value, true)}</span>
          </p>
        ))}
        <p className="border-t border-slate-100 pt-1 font-semibold">
          Total: {formatCurrency(total, true)}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} stackOffset="none">
        <defs>
          {[
            { id: 'gl1', color: '#38bdf8' },
            { id: 'gl2', color: '#a78bfa' },
            { id: 'gl3', color: '#fb923c' },
            { id: 'gl4', color: '#f87171' },
          ].map(g => (
            <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={g.color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={g.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
        <Area type="monotone" dataKey="packageFundL1" name="Level 1" stackId="1"
          stroke="#38bdf8" fill="url(#gl1)" strokeWidth={1.5} dot={false} />
        <Area type="monotone" dataKey="packageFundL2" name="Level 2" stackId="1"
          stroke="#a78bfa" fill="url(#gl2)" strokeWidth={1.5} dot={false} />
        <Area type="monotone" dataKey="packageFundL3" name="Level 3" stackId="1"
          stroke="#fb923c" fill="url(#gl3)" strokeWidth={1.5} dot={false} />
        <Area type="monotone" dataKey="packageFundL4" name="Level 4" stackId="1"
          stroke="#f87171" fill="url(#gl4)" strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Client count trend — [CONFIRMED] from PBIX Trend page
// ---------------------------------------------------------------------------
export function ClientCountTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradClients" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => [v, 'Active Clients']}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Area
          type="monotone"
          dataKey="activeClients"
          name="Active Clients"
          stroke="#818cf8"
          strokeWidth={2}
          fill="url(#gradClients)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
