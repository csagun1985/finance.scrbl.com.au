'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardKPIs } from '@/types';
import { formatCurrency } from '@/lib/dataTransforms';

interface Props {
  kpis: DashboardKPIs;
}

// [CONFIRMED] GM breakdown from PBIX GM page pie chart:
//   Internal GM / Internal On-Hire GM / External GM
const GM_COLORS = {
  internal: '#0f9e9e',
  onHire:   '#818cf8',
  external: '#fb923c',
};

export function GMPieChart({ kpis }: Props) {
  const data = [
    {
      name: 'Internal Staff',
      value: kpis.totalInternalGM,
      color: GM_COLORS.internal,
      description: 'Gross margin from directly employed care workers',
    },
    {
      name: 'Internal On-Hire',
      value: kpis.totalInternalOnHireGM,
      color: GM_COLORS.onHire,
      description: 'Gross margin from internally managed on-hire staff',
    },
    {
      name: 'External Providers',
      value: kpis.totalExternalGM,
      color: GM_COLORS.external,
      description: 'Gross margin from external / subcontracted providers',
    },
  ].filter(d => Math.abs(d.value) > 0);

  const total = data.reduce((a, d) => a + d.value, 0);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: typeof data[0]; value: number }>;
  }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-800">{item.name}</p>
        <p className="text-slate-600">{formatCurrency(item.value)} ({pct}%)</p>
        <p className="text-slate-400 mt-0.5">{item.description}</p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
