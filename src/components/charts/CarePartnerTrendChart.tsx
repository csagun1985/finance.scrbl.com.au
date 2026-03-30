'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { SHCRow } from '@/types';
import { formatPercent } from '@/lib/dataTransforms';

interface Props {
  rows: SHCRow[];
}

const LINE_COLORS = [
  '#0f9e9e', '#818cf8', '#fb923c', '#f87171',
  '#34d399', '#38bdf8', '#a78bfa', '#fbbf24',
];

// [CONFIRMED] From PBIX Care Partner page — line chart of utilisation by month & care partner
export function CarePartnerTrendChart({ rows }: Props) {
  const months = [...new Set(rows.map(r => r['STMNT MONTH'].substring(0, 7)))].sort();
  const partners = [...new Set(rows.map(r => r['Care Partner']))].slice(0, 6); // top 6 for readability

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt = (m: string) => {
    const [y, mo] = m.split('-');
    return `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`;
  };

  const chartData = months.map(month => {
    const point: Record<string, string | number> = { month, label: fmt(month) };
    for (const cp of partners) {
      const cpRows = rows.filter(r =>
        r['STMNT MONTH'].startsWith(month) && r['Care Partner'] === cp
      );
      if (cpRows.length === 0) {
        point[cp] = 0;
      } else {
        const used = cpRows.reduce((a, r) => a + r['Utilised Fund'], 0);
        const fund = cpRows.reduce((a, r) => a + r['Package Fund'], 0);
        point[cp] = fund > 0 ? used / fund : 0;
      }
    }
    return point;
  });

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
            {p.name}: <span className="font-medium">{formatPercent(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0.2, 1.05]}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
        {partners.map((cp, i) => (
          <Line
            key={cp}
            type="monotone"
            dataKey={cp}
            name={cp.split(' ')[0]} // first name for legend
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
