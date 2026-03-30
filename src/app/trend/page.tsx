'use client';

/**
 * Page 5: Trend
 * [CONFIRMED] Mirrors PBIX page 5: Trend
 *
 * Visuals:
 *   - 9 KPI cards: Fund Subsidy, CMPMFees, Total Charged Out, Utilised Fund,
 *                  Utilisation Rate, Client Count, Co Contribution, Total GM $, Est Net Rev
 *   - Area chart: Revenue & GM trend over time
 *   - Area chart: Active client count trend
 *   - Stacked area chart: Package fund by level over time
 */

import { useState, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { AICommentaryPanel } from '@/components/ui/AICommentaryPanel';
import {
  RevenueGMTrendChart,
  UtilisationTrendChart,
  PackageFundStackedAreaChart,
  ClientCountTrendChart,
} from '@/components/charts/TrendAreaChart';
import {
  MOCK_ROWS, DEFAULT_PERIOD_FROM, DEFAULT_PERIOD_TO,
} from '@/lib/mockData';
import {
  filterRows, computeKPIs, computeAllKPIDeltas,
  computeTrendPoints, getPriorPeriod, LOW_UTIL_THRESHOLD,
} from '@/lib/dataTransforms';
import { DashboardFilters, AIAnalysisResult } from '@/types';

const INITIAL_FILTERS: DashboardFilters = {
  periodFrom: DEFAULT_PERIOD_FROM,
  periodTo:   DEFAULT_PERIOD_TO,
  packageLevels: [],
  carePartners:  [],
  activePage: 'trend',
};

export default function TrendPage() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();

  const filteredRows = useMemo(() => filterRows(MOCK_ROWS, filters), [filters]);
  const priorPeriod  = useMemo(() => getPriorPeriod(filters.periodFrom, filters.periodTo), [filters]);
  const priorRows    = useMemo(() =>
    filterRows(MOCK_ROWS, { ...filters, periodFrom: priorPeriod.from, periodTo: priorPeriod.to }),
    [filters, priorPeriod]);

  const kpis       = useMemo(() => computeKPIs(filteredRows), [filteredRows]);
  const priorKpis  = useMemo(() => computeKPIs(priorRows), [priorRows]);
  const deltas     = useMemo(() => computeAllKPIDeltas(kpis, priorKpis), [kpis, priorKpis]);
  const trendPoints = useMemo(() => computeTrendPoints(MOCK_ROWS, filters), [filters]);

  const runAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(undefined);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpis, kpiDeltas: deltas, packageLevelSummaries: [],
          trendPoints, filters, priorPeriodKpis: priorKpis,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setAiResult(await res.json());
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Trend"
        subtitle="Time series — revenue, GM, utilisation, and client growth"
      />

      <div className="px-6 pb-8 space-y-5">
        <FilterBar filters={filters} onChange={(f) => { setFilters(f); setAiResult(null); }} />

        {/* 9 KPI cards — [CONFIRMED] from PBIX Trend page */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <KPICard data={{ label: 'Active Clients', value: kpis.totalClients, format: 'number', delta: deltas.totalClients }} />
          <KPICard data={{ label: 'Fund Subsidy', value: kpis.totalFundSubsidy, format: 'currency', delta: deltas.totalFundSubsidy }} />
          <KPICard data={{ label: 'CMPMFees', value: kpis.totalCMPMFees, format: 'currency' }} />
          <KPICard data={{ label: 'Total Charged Out', value: kpis.totalChargedOut, format: 'currency', delta: deltas.totalChargedOut }} />
          <KPICard data={{ label: 'Co Contribution', value: kpis.totalCoContribution, format: 'currency' }} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard data={{ label: 'Total GM $', value: kpis.totalGM, format: 'currency', delta: deltas.totalGM,
            subtitle: `${(kpis.gmPct * 100).toFixed(1)}% margin`, alert: kpis.gmPct < 0.20 ? 'warning' : undefined }} />
          <KPICard data={{ label: 'GM %', value: kpis.gmPct, format: 'percent', delta: deltas.gmPct }} />
          <KPICard data={{ label: 'Est Net Revenue', value: kpis.totalEstNetRev, format: 'currency', delta: deltas.totalEstNetRev }} />
          <KPICard data={{
            label: 'Utilisation Rate', value: kpis.avgUtilisationRate, format: 'percent', delta: deltas.avgUtilisationRate,
            alert: kpis.avgUtilisationRate < LOW_UTIL_THRESHOLD ? 'warning' : undefined,
          }} />
        </div>

        {/* Revenue & GM trend — [CONFIRMED] */}
        <ChartContainer
          title="Revenue & Gross Margin Trend"
          subtitle="Monthly Total Charged Out and Total GM $"
          badge={{ label: 'Confirmed', color: 'emerald' }}
        >
          <RevenueGMTrendChart
            data={trendPoints}
            selectedFrom={filters.periodFrom}
            selectedTo={filters.periodTo}
          />
        </ChartContainer>

        {/* Utilisation trend — [CONFIRMED] */}
        <ChartContainer
          title="Utilisation Rate Trend"
          subtitle="Monthly average utilisation — dashed line at 70% threshold"
          badge={{ label: 'Confirmed', color: 'emerald' }}
        >
          <UtilisationTrendChart data={trendPoints} />
        </ChartContainer>

        {/* Package fund stacked area — [CONFIRMED] */}
        <ChartContainer
          title="Package Fund by Level — Trend"
          subtitle="Stacked view of government subsidy by package level over time"
          badge={{ label: 'Confirmed', color: 'emerald' }}
        >
          <PackageFundStackedAreaChart data={trendPoints} />
        </ChartContainer>

        {/* Client count trend — [CONFIRMED] */}
        <ChartContainer
          title="Active Client Count Trend"
          subtitle="Number of active clients per month"
          badge={{ label: 'Confirmed', color: 'emerald' }}
        >
          <ClientCountTrendChart data={trendPoints} />
        </ChartContainer>

        {/* AI Analysis */}
        <AICommentaryPanel
          result={aiResult}
          isLoading={aiLoading}
          error={aiError}
          onRefresh={runAIAnalysis}
        />
      </div>
    </DashboardShell>
  );
}
