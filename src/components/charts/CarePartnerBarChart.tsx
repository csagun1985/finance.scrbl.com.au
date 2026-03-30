'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { CarePartnerSummary } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/dataTransforms';

interface Props {
  summaries: CarePartnerSummary[];
  metric: 'utilisation' | 'gm' | 'clients' | 'chargedOut';
}

export function CarePartnerBarChart({ summaries, metric }: Props) {
  const sorted = [...summaries].sort((a, b) => {
    switch (metric) {
      case 'utilisation': return b.utilisationRate - a.utilisationRate;
      case 'gm':          return b.gmPct - a.gmPct;
      case 'clients':     return b.clientCount - a.clientCount;
      default:            return b.chargedOut - a.chargedOut;
    }
  }).slice(0, 10); // show top 10

  const isPercent = metric === 'utilisation' || metric === 'gm';

  const chartData = sorted.map(s => ({
    name: s.carePartner.split(' ')[0], // first name for brevity on axis
    fullName: s.carePartner,
    value: metric === 'utilisation' ? s.utilisationRate
         : metric === 'gm'          ? s.gmPct
         : metric === 'clients'     ? s.clientCount
         :                            s.chargedOut,
    raw: s,
    color: s.utilisationRate < 0.70 ? '#fbbf24' : '#0f9e9e',
  }));

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: typeof chartData[0] }>;
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const s = d.raw;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1 min-w-[180px]">
        <p className="font-semibold text-slate-800">{d.fullName}</p>
        <p className="text-slate-500">{s.clientCount} clients · {s.qtyHours.toLocaleString()} hrs</p>
        <p>Charged Out: <span className="font-medium">{formatCurrency(s.chargedOut, true)}</span></p>
        <p>Utilisation: <span className={`font-medium ${s.utilisationRate < 0.70 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {formatPercent(s.utilisationRate)}
        </span></p>
        <p>GM: <span className="font-medium text-emerald-600">{formatCurrency(s.totalGM, true)} ({formatPercent(s.gmPct)})</span></p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 60, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => isPercent ? `${(v * 100).toFixed(0)}%` : `$${(v / 1000).toFixed(0)}K`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => isPercent ? `${(v * 100).toFixed(0)}%` : formatCurrency(v, true)}
            style={{ fontSize: 10, fill: '#64748b' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
