'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardKPIs } from '@/types';
import { formatCurrency } from '@/lib/dataTransforms';

interface Props {
  kpis: DashboardKPIs;
}

// [CONFIRMED] Matches PBIX Utilisation_SAH page pie chart:
//   Utilised Fund / Unutilised Fund / Over Utilised Fund
const COLORS = {
  utilised:    '#0f9e9e', // brand teal
  unutilised:  '#e2e8f0', // light grey
  overUtilised:'#ef4444', // red — overspend alert
};

export function UtilisationPieChart({ kpis }: Props) {
  const data = [
    {
      name: 'Utilised',
      value: kpis.totalUtilisedFund,
      color: COLORS.utilised,
      description: 'Fund subsidy spent on care services',
    },
    {
      name: 'Unutilised',
      value: kpis.totalUnutilisedFund,
      color: COLORS.unutilised,
      description: 'Available funds not yet spent (unspent balance)',
    },
    ...(kpis.totalOverUtilisedFund > 0 ? [{
      name: 'Over-utilised',
      value: kpis.totalOverUtilisedFund,
      color: COLORS.overUtilised,
      description: 'Spend that exceeded the available fund subsidy',
    }] : []),
  ].filter(d => d.value > 0);

  const total = data.reduce((a, d) => a + d.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{payload: typeof data[0]; value: number}> }) => {
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
        <Legend
          formatter={(value) => (
            <span className="text-xs text-slate-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
