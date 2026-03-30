'use client';

/**
 * Page 3: Care Partner
 * [CONFIRMED] Mirrors PBIX page 3: Care Partner
 *
 * Visuals:
 *   - 7 KPI cards: Fund Subsidy, CMPMFees, Total Charged Out, Utilised Fund,
 *                  Utilisation Rate, Client Count, Co Contribution
 *   - Pie chart: Fund distribution by provider
 *   - Bar chart: Provider utilisation metrics
 *   - Line chart: Trend by month and care partner
 */

import { useState, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { CarePartnerBarChart } from '@/components/charts/CarePartnerBarChart';
import { CarePartnerTrendChart } from '@/components/charts/CarePartnerTrendChart';
import { UtilisationPieChart } from '@/components/charts/UtilisationPieChart';
import {
  MOCK_ROWS, DEFAULT_PERIOD_FROM, DEFAULT_PERIOD_TO,
} from '@/lib/mockData';
import {
  filterRows, computeKPIs, computeAllKPIDeltas,
  computeCarePartnerSummaries, getPriorPeriod,
  formatCurrency, formatPercent, LOW_UTIL_THRESHOLD,
} from '@/lib/dataTransforms';
import { DashboardFilters } from '@/types';
import { cn } from '@/lib/utils';

const INITIAL_FILTERS: DashboardFilters = {
  periodFrom: DEFAULT_PERIOD_FROM,
  periodTo:   DEFAULT_PERIOD_TO,
  packageLevels: [],
  carePartners:  [],
  activePage: 'care-partner',
};

type MetricKey = 'utilisation' | 'gm' | 'clients' | 'chargedOut';

export default function CarePartnerPage() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [barMetric, setBarMetric] = useState<MetricKey>('utilisation');

  const filteredRows = useMemo(() => filterRows(MOCK_ROWS, filters), [filters]);
  const priorPeriod  = useMemo(() => getPriorPeriod(filters.periodFrom, filters.periodTo), [filters]);
  const priorRows    = useMemo(() =>
    filterRows(MOCK_ROWS, { ...filters, periodFrom: priorPeriod.from, periodTo: priorPeriod.to }),
    [filters, priorPeriod]);

  const kpis         = useMemo(() => computeKPIs(filteredRows), [filteredRows]);
  const priorKpis    = useMemo(() => computeKPIs(priorRows), [priorRows]);
  const deltas       = useMemo(() => computeAllKPIDeltas(kpis, priorKpis), [kpis, priorKpis]);
  const cpSummaries  = useMemo(() => computeCarePartnerSummaries(filteredRows), [filteredRows]);

  const metricOptions: { key: MetricKey; label: string }[] = [
    { key: 'utilisation', label: 'Utilisation %' },
    { key: 'gm',          label: 'GM %' },
    { key: 'clients',     label: 'Clients' },
    { key: 'chargedOut',  label: 'Charged Out' },
  ];

  return (
    <DashboardShell>
      <PageHeader
        title="Care Partners"
        subtitle="Provider performance — utilisation, revenue, and margin by care partner"
      />

      <div className="px-6 pb-8 space-y-5">
        <FilterBar filters={filters} onChange={setFilters} />

        {/* KPI cards — [CONFIRMED] from PBIX Care Partner page */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
          <KPICard data={{ label: 'Active Clients', value: kpis.totalClients, format: 'number', delta: deltas.totalClients }} />
          <KPICard data={{ label: 'Fund Subsidy', value: kpis.totalFundSubsidy, format: 'currency', delta: deltas.totalFundSubsidy }} />
          <KPICard data={{ label: 'CMPMFees', value: kpis.totalCMPMFees, format: 'currency' }} />
          <KPICard data={{ label: 'Total Charged Out', value: kpis.totalChargedOut, format: 'currency', delta: deltas.totalChargedOut }} />
          <KPICard data={{ label: 'Utilised Fund', value: kpis.totalUtilisedFund, format: 'currency', delta: deltas.totalUtilisedFund }} />
          <KPICard data={{
            label: 'Utilisation Rate',
            value: kpis.avgUtilisationRate,
            format: 'percent',
            delta: deltas.avgUtilisationRate,
            alert: kpis.avgUtilisationRate < LOW_UTIL_THRESHOLD ? 'warning' : undefined,
          }} />
          <KPICard data={{ label: 'Co Contribution', value: kpis.totalCoContribution, format: 'currency' }} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Pie chart — [CONFIRMED] */}
          <ChartContainer
            title="Fund Distribution by Provider"
            subtitle="Utilised vs Unutilised — all care partners"
            badge={{ label: 'Confirmed', color: 'emerald' }}
          >
            <UtilisationPieChart kpis={kpis} />
          </ChartContainer>

          {/* Bar chart — [CONFIRMED] */}
          <ChartContainer
            title="Care Partner Performance"
            subtitle="Top 10 by selected metric"
            badge={{ label: 'Confirmed', color: 'emerald' }}
            headerAction={
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {metricOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setBarMetric(opt.key)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium transition-colors',
                      barMetric === opt.key
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            }
          >
            <CarePartnerBarChart summaries={cpSummaries} metric={barMetric} />
          </ChartContainer>
        </div>

        {/* Line chart — utilisation trend by care partner — [CONFIRMED] */}
        <ChartContainer
          title="Utilisation Trend by Care Partner"
          subtitle="Monthly utilisation rate — top 6 partners"
          badge={{ label: 'Confirmed', color: 'emerald' }}
        >
          <CarePartnerTrendChart rows={filteredRows} />
        </ChartContainer>

        {/* Care partner summary table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">
              Care Partner Summary — {cpSummaries.length} partners
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Care Partner</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Clients</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Fund Subsidy</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Charged Out</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Utilised</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Util %</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">GM $</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">GM %</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Hours</th>
                </tr>
              </thead>
              <tbody>
                {cpSummaries.sort((a, b) => b.chargedOut - a.chargedOut).map(cp => (
                  <tr key={cp.carePartner} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{cp.carePartner}</td>
                    <td className="px-4 py-2.5 text-right">{cp.clientCount}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(cp.fundSubsidy, true)}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(cp.chargedOut, true)}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(cp.utilisedFund, true)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cp.utilisationRate < LOW_UTIL_THRESHOLD ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                        {formatPercent(cp.utilisationRate)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">
                      {formatCurrency(cp.totalGM, true)}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatPercent(cp.gmPct)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{cp.qtyHours.toLocaleString()}</td>
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
