'use client';

/**
 * Page 4: GM (Gross Margin)
 * [CONFIRMED] Mirrors PBIX page 4: GM
 *
 * Visuals:
 *   - 9 KPI cards: Fund Subsidy, CMPMFees, Total Charged Out, Utilised Fund,
 *                  Utilisation Rate, Client Count, Co Contribution, Total GM $, Est Net Rev
 *   - Pie chart: GM breakdown — Internal / Internal On-Hire / External
 *   - Bar chart: Multi-dimensional GM analysis by package level
 */

import { useState, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { GMPieChart } from '@/components/charts/GMPieChart';
import { PackageLevelBarChart } from '@/components/charts/PackageLevelBarChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  MOCK_ROWS, DEFAULT_PERIOD_FROM, DEFAULT_PERIOD_TO,
} from '@/lib/mockData';
import {
  filterRows, computeKPIs, computeAllKPIDeltas,
  computePackageLevelSummaries, computeCarePartnerSummaries,
  getPriorPeriod, formatCurrency, formatPercent, LOW_UTIL_THRESHOLD,
} from '@/lib/dataTransforms';
import { DashboardFilters } from '@/types';

const INITIAL_FILTERS: DashboardFilters = {
  periodFrom: DEFAULT_PERIOD_FROM,
  periodTo:   DEFAULT_PERIOD_TO,
  packageLevels: [],
  carePartners:  [],
  activePage: 'gm',
};

export default function GMPage() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);

  const filteredRows = useMemo(() => filterRows(MOCK_ROWS, filters), [filters]);
  const priorPeriod  = useMemo(() => getPriorPeriod(filters.periodFrom, filters.periodTo), [filters]);
  const priorRows    = useMemo(() =>
    filterRows(MOCK_ROWS, { ...filters, periodFrom: priorPeriod.from, periodTo: priorPeriod.to }),
    [filters, priorPeriod]);

  const kpis      = useMemo(() => computeKPIs(filteredRows), [filteredRows]);
  const priorKpis = useMemo(() => computeKPIs(priorRows), [priorRows]);
  const deltas    = useMemo(() => computeAllKPIDeltas(kpis, priorKpis), [kpis, priorKpis]);
  const levelSummaries = useMemo(() => computePackageLevelSummaries(filteredRows), [filteredRows]);
  const cpSummaries    = useMemo(() => computeCarePartnerSummaries(filteredRows), [filteredRows]);

  // GM by care partner bar chart data
  const cpGMData = cpSummaries
    .sort((a, b) => b.totalGM - a.totalGM)
    .slice(0, 8)
    .map(cp => ({
      name: cp.carePartner.split(' ')[0],
      fullName: cp.carePartner,
      gmPct: cp.gmPct,
      totalGM: cp.totalGM,
    }));

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const cp = cpSummaries.find(c => c.carePartner.startsWith(label ?? ''));
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-slate-800">{cp?.carePartner ?? label}</p>
        {payload.map((p, i) => (
          <p key={i}>{p.name}: <span className="font-medium">{
            p.name === 'GM %' ? formatPercent(p.value) : formatCurrency(p.value, true)
          }</span></p>
        ))}
      </div>
    );
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Gross Margin"
        subtitle="Internal, on-hire, and external GM analysis"
      />

      <div className="px-6 pb-8 space-y-5">
        <FilterBar filters={filters} onChange={setFilters} />

        {/* 9 KPI cards — [CONFIRMED] from PBIX GM page */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <KPICard data={{ label: 'Active Clients', value: kpis.totalClients, format: 'number', delta: deltas.totalClients }} />
          <KPICard data={{ label: 'Fund Subsidy', value: kpis.totalFundSubsidy, format: 'currency', delta: deltas.totalFundSubsidy }} />
          <KPICard data={{ label: 'CMPMFees', value: kpis.totalCMPMFees, format: 'currency' }} />
          <KPICard data={{ label: 'Total Charged Out', value: kpis.totalChargedOut, format: 'currency', delta: deltas.totalChargedOut }} />
          <KPICard data={{ label: 'Co Contribution', value: kpis.totalCoContribution, format: 'currency' }} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard data={{
            label: 'Total GM $',
            value: kpis.totalGM,
            format: 'currency',
            delta: deltas.totalGM,
            subtitle: `${formatPercent(kpis.gmPct)} GM margin`,
            alert: kpis.gmPct < 0.20 ? 'warning' : undefined,
            alertMessage: kpis.gmPct < 0.20 ? 'GM % below 20% threshold' : undefined,
          }} />
          <KPICard data={{
            label: 'GM %',
            value: kpis.gmPct,
            format: 'percent',
            delta: deltas.gmPct,
            alert: kpis.gmPct < 0.20 ? 'warning' : undefined,
          }} />
          <KPICard data={{ label: 'Est Net Revenue', value: kpis.totalEstNetRev, format: 'currency', delta: deltas.totalEstNetRev }} />
          <KPICard data={{
            label: 'Utilisation Rate',
            value: kpis.avgUtilisationRate,
            format: 'percent',
            delta: deltas.avgUtilisationRate,
            alert: kpis.avgUtilisationRate < LOW_UTIL_THRESHOLD ? 'warning' : undefined,
          }} />
        </div>

        {/* GM breakdown charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* GM Pie — [CONFIRMED] from PBIX */}
          <ChartContainer
            title="GM Split: Internal / On-Hire / External"
            subtitle="Gross margin by delivery model"
            badge={{ label: 'Confirmed', color: 'emerald' }}
            commentary={
              kpis.totalExternalGM / kpis.totalGM > 0.25
                ? `External providers contributing ${formatPercent(kpis.totalExternalGM / kpis.totalGM)} of total GM. ` +
                  `Monitor external provider cost rates to protect margin.`
                : `Internal and on-hire staff driving ${formatPercent((kpis.totalInternalGM + kpis.totalInternalOnHireGM) / kpis.totalGM)} of GM. ` +
                  `Good mix — consider expanding internal capacity if demand grows.`
            }
          >
            <GMPieChart kpis={kpis} />
          </ChartContainer>

          {/* GM by package level — [CONFIRMED] */}
          <ChartContainer
            title="GM % by Package Level"
            subtitle="Gross margin rate per package level"
            badge={{ label: 'Confirmed', color: 'emerald' }}
          >
            <PackageLevelBarChart summaries={levelSummaries} metric="gm" />
          </ChartContainer>
        </div>

        {/* GM by care partner */}
        <ChartContainer
          title="Gross Margin by Care Partner"
          subtitle="Total GM $ and GM % — top 8 care partners"
          badge={{ label: 'Inferred', color: 'amber' }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cpGMData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false} tickLine={false} domain={[0, 0.5]}
                tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
              <Bar yAxisId="left" dataKey="totalGM" name="Total GM $" fill="#34d399" radius={[4,4,0,0]} maxBarSize={40} />
              <Bar yAxisId="right" dataKey="gmPct" name="GM %" fill="#818cf8" radius={[4,4,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Package level GM detail table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">GM by Package Level</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Level</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Clients</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Charged Out</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">CMPMFees</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Internal GM</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">External GM</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Total GM $</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">GM %</th>
                </tr>
              </thead>
              <tbody>
                {levelSummaries.map(s => (
                  <tr key={s.level} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{s.label}</td>
                    <td className="px-4 py-2.5 text-right">{s.clientCount}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(s.chargedOut, true)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(s.cmpMFees, true)}</td>
                    <td className="px-4 py-2.5 text-right text-brand-600">{formatCurrency(s.internalGM, true)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-600">{formatCurrency(s.externalGM, true)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
                      {formatCurrency(s.totalGM, true)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      <span className={s.gmPct < 0.20 ? 'text-amber-600' : 'text-emerald-600'}>
                        {formatPercent(s.gmPct)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
