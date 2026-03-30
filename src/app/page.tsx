'use client';

/**
 * Page 1: Utilisation_SAH
 * [CONFIRMED] Mirrors PBIX page 1: Utilisation_SAH
 *
 * Visuals:
 *   - 7 KPI cards: Fund Subsidy, CMPMFees, Total Charged Out, Utilised Fund,
 *                  Utilisation Rate, Client Count, Co Contribution
 *   - Pie chart: Utilised / Unutilised / Over-utilised Fund
 *   - Bar chart: Package level utilisation breakdown
 *   - Slicers: Month range, Package Level, Care Partner
 */

import { useState, useMemo, useCallback } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { AICommentaryPanel } from '@/components/ui/AICommentaryPanel';
import { AskTheData } from '@/components/ui/AskTheData';
import { UtilisationPieChart } from '@/components/charts/UtilisationPieChart';
import { PackageLevelBarChart, PackageLevelGroupedBarChart } from '@/components/charts/PackageLevelBarChart';
import {
  MOCK_ROWS, ALL_CARE_PARTNERS, DEFAULT_PERIOD_FROM, DEFAULT_PERIOD_TO,
} from '@/lib/mockData';
import {
  filterRows,
  computeKPIs,
  computeAllKPIDeltas,
  computePackageLevelSummaries,
  computeTrendPoints,
  getPriorPeriod,
  formatCurrency,
  formatPercent,
  LOW_UTIL_THRESHOLD,
} from '@/lib/dataTransforms';
import { DashboardFilters, AIAnalysisResult } from '@/types';

const INITIAL_FILTERS: DashboardFilters = {
  periodFrom: DEFAULT_PERIOD_FROM,
  periodTo:   DEFAULT_PERIOD_TO,
  packageLevels: [],
  carePartners:  [],
  activePage: 'utilisation',
};

export default function UtilisationPage() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();

  // Filtered data
  const filteredRows = useMemo(() => filterRows(MOCK_ROWS, filters), [filters]);

  // Prior period for deltas
  const priorPeriod = useMemo(() =>
    getPriorPeriod(filters.periodFrom, filters.periodTo), [filters]);
  const priorRows = useMemo(() =>
    filterRows(MOCK_ROWS, { ...filters, periodFrom: priorPeriod.from, periodTo: priorPeriod.to }),
    [filters, priorPeriod]);

  const kpis      = useMemo(() => computeKPIs(filteredRows), [filteredRows]);
  const priorKpis = useMemo(() => computeKPIs(priorRows), [priorRows]);
  const deltas    = useMemo(() => computeAllKPIDeltas(kpis, priorKpis), [kpis, priorKpis]);
  const levelSummaries = useMemo(() => computePackageLevelSummaries(filteredRows), [filteredRows]);
  const trendPoints    = useMemo(() => computeTrendPoints(MOCK_ROWS, filters), [filters]);

  const handleFiltersChange = useCallback((f: DashboardFilters) => {
    setFilters(f);
    setAiResult(null); // reset AI on filter change
  }, []);

  const runAIAnalysis = useCallback(async () => {
    setAiLoading(true);
    setAiError(undefined);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpis, kpiDeltas: deltas, packageLevelSummaries: levelSummaries,
          trendPoints, filters, priorPeriodKpis: priorKpis,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setAiResult(data);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setAiLoading(false);
    }
  }, [kpis, deltas, levelSummaries, trendPoints, filters, priorKpis]);

  return (
    <DashboardShell>
      <PageHeader
        title="Utilisation"
        subtitle="Fund subsidy utilisation across all active packages"
      />

      <div className="px-6 pb-8 space-y-5">
        {/* Filters */}
        <FilterBar filters={filters} onChange={handleFiltersChange} />

        {/* KPI Cards — [CONFIRMED] 7 cards from PBIX Utilisation_SAH page */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
          <KPICard data={{
            label: 'Active Clients',
            value: kpis.totalClients,
            format: 'number',
            delta: deltas.totalClients,
            subtitle: `${kpis.lowUtilClients} low utilisation`,
            alert: kpis.lowUtilClients > kpis.totalClients * 0.25 ? 'warning' : undefined,
            alertMessage: kpis.lowUtilClients > kpis.totalClients * 0.25
              ? `${kpis.lowUtilClients} clients below ${(LOW_UTIL_THRESHOLD * 100).toFixed(0)}% utilisation`
              : undefined,
          }} />
          <KPICard data={{
            label: 'Fund Subsidy',
            value: kpis.totalFundSubsidy,
            format: 'currency',
            delta: deltas.totalFundSubsidy,
            subtitle: 'Total govt subsidy',
          }} />
          <KPICard data={{
            label: 'CMPMFees',
            value: kpis.totalCMPMFees,
            format: 'currency',
            delta: deltas.totalCMPMFees,
            subtitle: 'Care + Package Mgmt',
          }} />
          <KPICard data={{
            label: 'Total Charged Out',
            value: kpis.totalChargedOut,
            format: 'currency',
            delta: deltas.totalChargedOut,
            subtitle: 'Subsidy + Co-contribution',
          }} />
          <KPICard data={{
            label: 'Utilised Fund',
            value: kpis.totalUtilisedFund,
            format: 'currency',
            delta: deltas.totalUtilisedFund,
            subtitle: 'Funds spent on care',
          }} />
          <KPICard data={{
            label: 'Utilisation Rate',
            value: kpis.avgUtilisationRate,
            format: 'percent',
            delta: deltas.avgUtilisationRate,
            alert: kpis.avgUtilisationRate < LOW_UTIL_THRESHOLD ? 'warning' : undefined,
            alertMessage: kpis.avgUtilisationRate < LOW_UTIL_THRESHOLD
              ? `Below ${(LOW_UTIL_THRESHOLD * 100).toFixed(0)}% target`
              : undefined,
          }} />
          <KPICard data={{
            label: 'Co Contribution',
            value: kpis.totalCoContribution,
            format: 'currency',
            delta: deltas.totalCoContribution,
            subtitle: 'Client payments',
          }} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Utilisation pie chart — [CONFIRMED] from PBIX */}
          <ChartContainer
            title="Fund Utilisation Split"
            subtitle="Utilised vs Unutilised vs Over-utilised"
            badge={{ label: 'Confirmed', color: 'emerald' }}
            commentary={
              kpis.totalUnutilisedFund > kpis.totalFundSubsidy * 0.25
                ? `${formatCurrency(kpis.totalUnutilisedFund, true)} in unutilised funds across all clients. ` +
                  `This represents ${formatPercent(kpis.totalUnutilisedFund / kpis.totalFundSubsidy)} of total subsidy — ` +
                  `consider service plan reviews for under-utilising clients.`
                : `Utilisation is healthy at ${formatPercent(kpis.avgUtilisationRate)}. ` +
                  `${formatCurrency(kpis.totalUnutilisedFund, true)} remains unspent.`
            }
          >
            <UtilisationPieChart kpis={kpis} />
          </ChartContainer>

          {/* Package level utilisation — [CONFIRMED] from PBIX bar chart */}
          <ChartContainer
            title="Utilisation by Package Level"
            subtitle="Utilisation rate per level"
            badge={{ label: 'Confirmed', color: 'emerald' }}
          >
            <PackageLevelBarChart summaries={levelSummaries} metric="utilisation" />
          </ChartContainer>
        </div>

        {/* Package grouped bar — utilised vs unutilised */}
        <ChartContainer
          title="Package Fund: Utilised vs Unutilised vs GM"
          subtitle="By package level — period total"
          badge={{ label: 'Confirmed', color: 'emerald' }}
        >
          <PackageLevelGroupedBarChart summaries={levelSummaries} />
        </ChartContainer>

        {/* AI Analysis */}
        <AICommentaryPanel
          result={aiResult}
          isLoading={aiLoading}
          error={aiError}
          onRefresh={runAIAnalysis}
        />

        {/* Ask the Data */}
        <AskTheData
          kpis={kpis}
          filters={filters}
          packageLevelSummaries={levelSummaries}
        />
      </div>
    </DashboardShell>
  );
}
