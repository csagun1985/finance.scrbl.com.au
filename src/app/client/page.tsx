'use client';

/**
 * Page 2: Client_SAH
 * [CONFIRMED] Mirrors PBIX page 2: Client_SAH
 *
 * Visuals:
 *   - KPI cards: Fund Subsidy, Care Mgmt Fees, Co Contribution,
 *                Total Charged Out, Utilised Fund, Utilisation Rate
 *   - Cards: Selected Package, Unutilised Fund, Care Partner
 *   - Table: Service lines (Qty, Amount, SAH Classification, Co Contribution, Est Net Rev)
 *   - Pie chart: Fund utilisation by client
 *   - Bar chart: Services / co-contribution breakdown
 */

import { useState, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { UtilisationPieChart } from '@/components/charts/UtilisationPieChart';
import { PackageLevelBarChart } from '@/components/charts/PackageLevelBarChart';
import {
  MOCK_ROWS, DEFAULT_PERIOD_FROM, DEFAULT_PERIOD_TO,
} from '@/lib/mockData';
import {
  filterRows,
  computeKPIs,
  computeAllKPIDeltas,
  computePackageLevelSummaries,
  computeClientSummaries,
  getPriorPeriod,
  formatCurrency,
  formatPercent,
  formatHours,
  LOW_UTIL_THRESHOLD,
} from '@/lib/dataTransforms';
import { DashboardFilters, ClientSummary } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const INITIAL_FILTERS: DashboardFilters = {
  periodFrom: DEFAULT_PERIOD_FROM,
  periodTo:   DEFAULT_PERIOD_TO,
  packageLevels: [],
  carePartners:  [],
  activePage: 'client',
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4',
};
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-sky-100 text-sky-700',
  2: 'bg-violet-100 text-violet-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-rose-100 text-rose-700',
};

function ClientRow({ client, isSelected, onSelect }: {
  client: ClientSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <>
      <tr
        onClick={onSelect}
        className={cn(
          'cursor-pointer border-b border-slate-100 text-xs transition-colors hover:bg-slate-50',
          isSelected && 'bg-brand-50'
        )}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            {isSelected
              ? <ChevronDown size={12} className="text-brand-500 shrink-0" />
              : <ChevronRight size={12} className="text-slate-400 shrink-0" />}
            <span className="font-medium text-slate-800">{client.client}</span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-semibold',
            LEVEL_COLORS[client.packageLevel]
          )}>
            {LEVEL_LABELS[client.packageLevel]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-slate-600">{client.carePartner}</td>
        <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(client.fundSubsidy, true)}</td>
        <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(client.chargedOut, true)}</td>
        <td className="px-4 py-2.5 text-right">
          <span className={cn(
            'font-medium',
            client.utilisationRate < LOW_UTIL_THRESHOLD ? 'text-amber-600' : 'text-emerald-600'
          )}>
            {formatPercent(client.utilisationRate)}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <span className={cn(
            client.unutilisedFund > 0 ? 'text-amber-600' : 'text-slate-400'
          )}>
            {formatCurrency(client.unutilisedFund, true)}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right font-medium text-emerald-600">
          {formatCurrency(client.totalGM, true)}
        </td>
      </tr>

      {/* Expandable service line detail — [CONFIRMED] from PBIX table visual */}
      {isSelected && client.serviceLines.length > 0 && (
        <tr className="bg-slate-50">
          <td colSpan={8} className="px-6 py-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Service Lines
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left pb-1">SAH Classification</th>
                  <th className="text-left pb-1">Service</th>
                  <th className="text-right pb-1">Hours (Qty)</th>
                  <th className="text-right pb-1">Charged Out</th>
                  <th className="text-right pb-1">Co Contribution</th>
                  <th className="text-right pb-1">Est Net Rev</th>
                </tr>
              </thead>
              <tbody>
                {client.serviceLines.map((line, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1 font-medium text-slate-700">{line.sahClassification}</td>
                    <td className="py-1 text-slate-500">{line.serviceProvided}</td>
                    <td className="py-1 text-right">{line.qty.toLocaleString()} hrs</td>
                    <td className="py-1 text-right">{formatCurrency(line.chargedOut, true)}</td>
                    <td className="py-1 text-right">{formatCurrency(line.coContribution, true)}</td>
                    <td className="py-1 text-right">{formatCurrency(line.estNetRev, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ClientPage() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof ClientSummary>('chargedOut');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => filterRows(MOCK_ROWS, filters), [filters]);
  const priorPeriod  = useMemo(() => getPriorPeriod(filters.periodFrom, filters.periodTo), [filters]);
  const priorRows    = useMemo(() =>
    filterRows(MOCK_ROWS, { ...filters, periodFrom: priorPeriod.from, periodTo: priorPeriod.to }),
    [filters, priorPeriod]);

  const kpis         = useMemo(() => computeKPIs(filteredRows), [filteredRows]);
  const priorKpis    = useMemo(() => computeKPIs(priorRows), [priorRows]);
  const deltas       = useMemo(() => computeAllKPIDeltas(kpis, priorKpis), [kpis, priorKpis]);
  const levelSummaries = useMemo(() => computePackageLevelSummaries(filteredRows), [filteredRows]);

  const clientSummaries = useMemo(() => {
    let list = computeClientSummaries(filteredRows);
    if (search) {
      list = list.filter(c =>
        c.client.toLowerCase().includes(search.toLowerCase()) ||
        c.carePartner.toLowerCase().includes(search.toLowerCase())
      );
    }
    list.sort((a, b) => {
      const av = a[sortField] as number ?? 0;
      const bv = b[sortField] as number ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [filteredRows, search, sortField, sortDir]);

  function toggleSort(field: keyof ClientSummary) {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const SortHeader = ({ field, label }: { field: keyof ClientSummary; label: string }) => (
    <th
      onClick={() => toggleSort(field)}
      className="cursor-pointer select-none px-4 py-2.5 text-right text-xs font-semibold text-slate-500 hover:text-slate-700"
    >
      {label} {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  const selectedClientData = selectedClient
    ? clientSummaries.find(c => c.client === selectedClient) ?? null
    : null;

  return (
    <DashboardShell>
      <PageHeader
        title="Clients"
        subtitle="Client-level financial analysis and service line detail"
      />

      <div className="px-6 pb-8 space-y-5">
        <FilterBar filters={filters} onChange={(f) => { setFilters(f); setSelectedClient(null); }} />

        {/* KPI cards — [CONFIRMED] from PBIX Client_SAH page */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <KPICard data={{ label: 'Active Clients', value: kpis.totalClients, format: 'number', delta: deltas.totalClients }} />
          <KPICard data={{ label: 'Fund Subsidy', value: kpis.totalFundSubsidy, format: 'currency', delta: deltas.totalFundSubsidy }} />
          <KPICard data={{ label: 'Care Mgmt Fees', value: kpis.totalCareManagementFees, format: 'currency', delta: deltas.totalCMPMFees }} />
          <KPICard data={{ label: 'Co Contribution', value: kpis.totalCoContribution, format: 'currency', delta: deltas.totalCoContribution }} />
          <KPICard data={{ label: 'Total Charged Out', value: kpis.totalChargedOut, format: 'currency', delta: deltas.totalChargedOut }} />
          <KPICard data={{
            label: 'Utilisation Rate',
            value: kpis.avgUtilisationRate,
            format: 'percent',
            delta: deltas.avgUtilisationRate,
            alert: kpis.avgUtilisationRate < LOW_UTIL_THRESHOLD ? 'warning' : undefined,
          }} />
        </div>

        {/* Selected client detail cards — [CONFIRMED] from PBIX */}
        {selectedClientData && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-xs text-brand-500 font-medium">Selected Package</p>
              <p className="text-xl font-bold text-brand-800 mt-0.5">Level {selectedClientData.packageLevel}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-600 font-medium">Unutilised Fund</p>
              <p className="text-xl font-bold text-amber-800 mt-0.5">
                {formatCurrency(selectedClientData.unutilisedFund, true)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">Care Partner</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">{selectedClientData.carePartner}</p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartContainer
            title="Fund Utilisation Split"
            subtitle="Utilised vs Unutilised across filtered clients"
            badge={{ label: 'Confirmed', color: 'emerald' }}
          >
            <UtilisationPieChart kpis={kpis} />
          </ChartContainer>
          <ChartContainer
            title="Utilisation by Package Level"
            badge={{ label: 'Confirmed', color: 'emerald' }}
          >
            <PackageLevelBarChart summaries={levelSummaries} metric="utilisation" />
          </ChartContainer>
        </div>

        {/* Client table — [CONFIRMED] from PBIX Client_SAH table visual */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">
              Client Detail — {clientSummaries.length} clients
            </h3>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search client or care partner..."
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 w-56 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Client</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Level</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Care Partner</th>
                  <SortHeader field="fundSubsidy" label="Fund Subsidy" />
                  <SortHeader field="chargedOut" label="Charged Out" />
                  <SortHeader field="utilisationRate" label="Util %" />
                  <SortHeader field="unutilisedFund" label="Unutilised" />
                  <SortHeader field="totalGM" label="GM $" />
                </tr>
              </thead>
              <tbody>
                {clientSummaries.slice(0, 100).map(client => (
                  <ClientRow
                    key={client.client}
                    client={client}
                    isSelected={selectedClient === client.client}
                    onSelect={() => setSelectedClient(
                      selectedClient === client.client ? null : client.client
                    )}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {clientSummaries.length > 100 && (
            <div className="px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
              Showing first 100 of {clientSummaries.length} clients. Use search or filters to narrow.
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
