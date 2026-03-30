/**
 * Data transform utilities — aggregation, filtering, and period comparison
 *
 * All aggregation logic mirrors what the PBIX visuals would compute
 * from the SHC table. Column names match exactly.
 *
 * [CONFIRMED] Aggregation patterns extracted from PBIX visual field wells
 * [INFERRED]  Derived metrics not directly visible in the PBIX
 */

import {
  SHCRow,
  DashboardFilters,
  DashboardKPIs,
  KPIDelta,
  PackageLevelSummary,
  CarePartnerSummary,
  ClientSummary,
  ServiceLineSummary,
  TrendPoint,
  SAHClassificationSummary,
  PackageLevel,
  SAHClassification,
} from '@/types';

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** [INFERRED] Low utilisation alert threshold */
export const LOW_UTIL_THRESHOLD = 0.70;
/** [INFERRED] Over-utilisation threshold (client has spent > package fund) */
export const OVER_UTIL_THRESHOLD = 1.00;

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

/**
 * Filter SHC rows by dashboard filters.
 * Mirrors PBIX slicer behaviour — excludes 'ONLY Template' and 'NA' clients
 * per confirmed PBIX filter logic.
 */
export function filterRows(
  rows: SHCRow[],
  filters: DashboardFilters
): SHCRow[] {
  const fromDate = `${filters.periodFrom}-01`;
  const toDate   = `${filters.periodTo}-31`;

  return rows.filter(r => {
    // Date range
    if (r['STMNT MONTH'] < fromDate || r['STMNT MONTH'] > toDate) return false;
    // Package level filter
    if (filters.packageLevels.length > 0 && !filters.packageLevels.includes(r.Package)) return false;
    // Care partner filter
    if (filters.carePartners.length > 0 && !filters.carePartners.includes(r['Care Partner'])) return false;
    // [CONFIRMED] Exclude template/placeholder clients
    if (r.Client === 'ONLY Template' || r.Client === 'NA') return false;
    // [CONFIRMED] Exclude unassigned care partners
    const cp = r['Care Partner'];
    if (!cp || cp === 'Unassigned' || cp === 'null' || cp === '0') return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// KPI aggregation — [CONFIRMED] from PBIX page field wells
// ---------------------------------------------------------------------------

export function computeKPIs(rows: SHCRow[]): DashboardKPIs {
  if (rows.length === 0) return emptyKPIs();

  const uniqueClients = new Set(rows.map(r => r.Client));
  const latestMonth   = rows.reduce((a, r) => r['STMNT MONTH'] > a ? r['STMNT MONTH'] : a, '');

  // Totals — matching PBIX Sum() aggregations
  const totalFundSubsidy         = sum(rows, 'Fund Subsidy');
  const totalCMPMFees            = sum(rows, 'CMPMFees');
  const totalChargedOut          = sum(rows, 'Total Charged out');
  const totalUtilisedFund        = sum(rows, 'Utilised Fund');
  const totalUnutilisedFund      = sum(rows, 'Unutilised Fund');
  const totalOverUtilisedFund    = sum(rows, 'Over Utilised Fund');
  const totalCoContribution      = sum(rows, 'Co Contribution');
  const totalGM                  = sum(rows, 'Total GM $');
  const totalEstNetRev           = sum(rows, 'Est Net Rev');
  const totalInternalGM          = sum(rows, 'Internal GM');
  const totalInternalOnHireGM    = sum(rows, 'Internal, On-Hire GM');
  const totalExternalGM          = sum(rows, 'External GM');
  const totalCareManagementFees  = sum(rows, 'Care Management Fees');
  const totalPackageManagementFees = sum(rows, 'Package Management Fees');
  const totalQtyHours            = sum(rows, 'Qty');

  // Weighted average utilisation [INFERRED - weighted by Fund Subsidy]
  const totalPackageFund = sum(rows, 'Package Fund');
  const avgUtilisationRate = totalPackageFund > 0 ? totalUtilisedFund / totalPackageFund : 0;

  // Per-client utilisation in latest month for alerting
  const latestRows = rows.filter(r => r['STMNT MONTH'].startsWith(latestMonth.substring(0, 7)));
  const clientUtilMap = new Map<string, { used: number; fund: number }>();
  for (const r of latestRows) {
    const prev = clientUtilMap.get(r.Client) ?? { used: 0, fund: 0 };
    clientUtilMap.set(r.Client, {
      used: prev.used + r['Utilised Fund'],
      fund: prev.fund + r['Package Fund'],
    });
  }

  let lowUtilClients = 0;
  let overUtilClients = 0;
  for (const { used, fund } of clientUtilMap.values()) {
    const rate = fund > 0 ? used / fund : 0;
    if (rate < LOW_UTIL_THRESHOLD) lowUtilClients++;
    if (rate > OVER_UTIL_THRESHOLD) overUtilClients++;
  }

  const gmPct = totalChargedOut > 0 ? totalGM / totalChargedOut : 0;

  return {
    totalClients: uniqueClients.size,
    totalFundSubsidy: Math.round(totalFundSubsidy),
    totalCMPMFees: Math.round(totalCMPMFees),
    totalChargedOut: Math.round(totalChargedOut),
    totalUtilisedFund: Math.round(totalUtilisedFund),
    totalUnutilisedFund: Math.round(totalUnutilisedFund),
    totalOverUtilisedFund: Math.round(totalOverUtilisedFund),
    avgUtilisationRate,
    totalCoContribution: Math.round(totalCoContribution),
    totalGM: Math.round(totalGM),
    totalEstNetRev: Math.round(totalEstNetRev),
    totalInternalGM: Math.round(totalInternalGM),
    totalInternalOnHireGM: Math.round(totalInternalOnHireGM),
    totalExternalGM: Math.round(totalExternalGM),
    totalCareManagementFees: Math.round(totalCareManagementFees),
    totalPackageManagementFees: Math.round(totalPackageManagementFees),
    gmPct,
    lowUtilClients,
    overUtilClients,
    totalQtyHours: Math.round(totalQtyHours),
  };
}

function emptyKPIs(): DashboardKPIs {
  return {
    totalClients: 0, totalFundSubsidy: 0, totalCMPMFees: 0,
    totalChargedOut: 0, totalUtilisedFund: 0, totalUnutilisedFund: 0,
    totalOverUtilisedFund: 0, avgUtilisationRate: 0, totalCoContribution: 0,
    totalGM: 0, totalEstNetRev: 0, totalInternalGM: 0, totalInternalOnHireGM: 0,
    totalExternalGM: 0, totalCareManagementFees: 0, totalPackageManagementFees: 0,
    gmPct: 0, lowUtilClients: 0, overUtilClients: 0, totalQtyHours: 0,
  };
}

// ---------------------------------------------------------------------------
// Period-over-period delta
// ---------------------------------------------------------------------------

export function computeKPIDelta(
  current: number,
  prior: number,
  isPositiveWhenUp = true
): KPIDelta {
  const diff = current - prior;
  const pct  = prior !== 0 ? diff / Math.abs(prior) : 0;
  const direction = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat';
  return {
    value: diff,
    pct,
    direction,
    isPositive: direction === 'flat' ? true
      : isPositiveWhenUp ? direction === 'up'
      : direction === 'down',
  };
}

export function computeAllKPIDeltas(
  current: DashboardKPIs,
  prior: DashboardKPIs
): Record<string, KPIDelta> {
  return {
    totalClients:         computeKPIDelta(current.totalClients,         prior.totalClients,         true),
    totalFundSubsidy:     computeKPIDelta(current.totalFundSubsidy,     prior.totalFundSubsidy,     true),
    totalCMPMFees:        computeKPIDelta(current.totalCMPMFees,        prior.totalCMPMFees,        false),
    totalChargedOut:      computeKPIDelta(current.totalChargedOut,      prior.totalChargedOut,      true),
    totalUtilisedFund:    computeKPIDelta(current.totalUtilisedFund,    prior.totalUtilisedFund,    true),
    totalUnutilisedFund:  computeKPIDelta(current.totalUnutilisedFund,  prior.totalUnutilisedFund,  false),
    avgUtilisationRate:   computeKPIDelta(current.avgUtilisationRate,   prior.avgUtilisationRate,   true),
    totalGM:              computeKPIDelta(current.totalGM,              prior.totalGM,              true),
    gmPct:                computeKPIDelta(current.gmPct,                prior.gmPct,                true),
    totalEstNetRev:       computeKPIDelta(current.totalEstNetRev,       prior.totalEstNetRev,       true),
    lowUtilClients:       computeKPIDelta(current.lowUtilClients,       prior.lowUtilClients,       false),
    totalQtyHours:        computeKPIDelta(current.totalQtyHours,        prior.totalQtyHours,        true),
  };
}

// ---------------------------------------------------------------------------
// Package Level Summaries — [CONFIRMED] from PBIX breakdown visuals
// ---------------------------------------------------------------------------

export function computePackageLevelSummaries(rows: SHCRow[]): PackageLevelSummary[] {
  const levels: PackageLevel[] = [1, 2, 3, 4];
  const labels: Record<PackageLevel, string> = {
    1: 'Level 1', 2: 'Level 2', 3: 'Level 3', 4: 'Level 4',
  };

  return levels.map(level => {
    const lvlRows = rows.filter(r => r.Package === level);
    if (lvlRows.length === 0) return null;

    const clientCount    = new Set(lvlRows.map(r => r.Client)).size;
    const fundSubsidy    = sum(lvlRows, 'Fund Subsidy');
    const chargedOut     = sum(lvlRows, 'Total Charged out');
    const utilisedFund   = sum(lvlRows, 'Utilised Fund');
    const unutilisedFund = sum(lvlRows, 'Unutilised Fund');
    const packageFund    = sum(lvlRows, 'Package Fund');
    const totalGM        = sum(lvlRows, 'Total GM $');
    const cmpMFees       = sum(lvlRows, 'CMPMFees');
    const coContribution = sum(lvlRows, 'Co Contribution');
    const qtyHours       = sum(lvlRows, 'Qty');
    const internalGM     = sum(lvlRows, 'Internal GM');
    const externalGM     = sum(lvlRows, 'External GM');

    return {
      level,
      label: labels[level],
      clientCount,
      fundSubsidy: Math.round(fundSubsidy),
      chargedOut:  Math.round(chargedOut),
      utilisedFund: Math.round(utilisedFund),
      unutilisedFund: Math.round(unutilisedFund),
      utilisationRate: packageFund > 0 ? utilisedFund / packageFund : 0,
      totalGM: Math.round(totalGM),
      gmPct: chargedOut > 0 ? totalGM / chargedOut : 0,
      cmpMFees: Math.round(cmpMFees),
      coContribution: Math.round(coContribution),
      qtyHours: Math.round(qtyHours),
      internalGM: Math.round(internalGM),
      externalGM: Math.round(externalGM),
    };
  }).filter(Boolean) as PackageLevelSummary[];
}

// ---------------------------------------------------------------------------
// Care Partner Summaries — [CONFIRMED] from PBIX Care Partner page
// ---------------------------------------------------------------------------

export function computeCarePartnerSummaries(rows: SHCRow[]): CarePartnerSummary[] {
  const partners = [...new Set(rows.map(r => r['Care Partner']))].sort();

  return partners.map(cp => {
    const cpRows = rows.filter(r => r['Care Partner'] === cp);
    const clientCount  = new Set(cpRows.map(r => r.Client)).size;
    const fundSubsidy  = sum(cpRows, 'Fund Subsidy');
    const chargedOut   = sum(cpRows, 'Total Charged out');
    const utilisedFund = sum(cpRows, 'Utilised Fund');
    const packageFund  = sum(cpRows, 'Package Fund');
    const totalGM      = sum(cpRows, 'Total GM $');
    const qtyHours     = sum(cpRows, 'Qty');

    return {
      carePartner: cp,
      clientCount,
      fundSubsidy: Math.round(fundSubsidy),
      chargedOut:  Math.round(chargedOut),
      utilisedFund: Math.round(utilisedFund),
      utilisationRate: packageFund > 0 ? utilisedFund / packageFund : 0,
      totalGM: Math.round(totalGM),
      gmPct: chargedOut > 0 ? totalGM / chargedOut : 0,
      qtyHours: Math.round(qtyHours),
    };
  });
}

// ---------------------------------------------------------------------------
// Client Summaries — [CONFIRMED] from PBIX Client_SAH page
// ---------------------------------------------------------------------------

export function computeClientSummaries(rows: SHCRow[]): ClientSummary[] {
  const clients = [...new Set(rows.map(r => r.Client))].sort();

  return clients.map(client => {
    const cRows = rows.filter(r => r.Client === client);
    const firstRow = cRows[0];

    // Service line detail [CONFIRMED] from PBIX table visual
    const serviceLineMap = new Map<string, ServiceLineSummary>();
    for (const r of cRows) {
      const key = `${r['SAH Classification']}::${r['Service Provided']}`;
      const prev = serviceLineMap.get(key) ?? {
        sahClassification: r['SAH Classification'],
        serviceProvided: r['Service Provided'],
        qty: 0, chargedOut: 0, coContribution: 0, estNetRev: 0,
      };
      serviceLineMap.set(key, {
        ...prev,
        qty: prev.qty + r.Qty,
        chargedOut: prev.chargedOut + r['Total Charged out'],
        coContribution: prev.coContribution + r['Co Contribution'],
        estNetRev: prev.estNetRev + r['Est Net Rev'],
      });
    }

    const chargedOut     = sum(cRows, 'Total Charged out');
    const utilisedFund   = sum(cRows, 'Utilised Fund');
    const unutilisedFund = sum(cRows, 'Unutilised Fund');
    const packageFund    = sum(cRows, 'Package Fund');

    return {
      client,
      carePartner: firstRow['Care Partner'],
      packageLevel: firstRow.Package,
      fundSubsidy: Math.round(sum(cRows, 'Fund Subsidy')),
      chargedOut: Math.round(chargedOut),
      utilisedFund: Math.round(utilisedFund),
      unutilisedFund: Math.round(unutilisedFund),
      utilisationRate: packageFund > 0 ? utilisedFund / packageFund : 0,
      totalGM: Math.round(sum(cRows, 'Total GM $')),
      coContribution: Math.round(sum(cRows, 'Co Contribution')),
      qtyHours: Math.round(sum(cRows, 'Qty')),
      serviceLines: [...serviceLineMap.values()]
        .sort((a, b) => b.chargedOut - a.chargedOut),
    };
  });
}

// ---------------------------------------------------------------------------
// Trend points — [CONFIRMED] from PBIX Trend page
// ---------------------------------------------------------------------------

export function computeTrendPoints(
  allRows: SHCRow[],
  filters: DashboardFilters
): TrendPoint[] {
  const months = [...new Set(allRows.map(r => r['STMNT MONTH'].substring(0, 7)))].sort();

  return months.map(month => {
    const monthRows = allRows.filter(r => {
      if (!r['STMNT MONTH'].startsWith(month)) return false;
      if (filters.packageLevels.length > 0 && !filters.packageLevels.includes(r.Package)) return false;
      if (filters.carePartners.length > 0 && !filters.carePartners.includes(r['Care Partner'])) return false;
      if (r.Client === 'ONLY Template' || r.Client === 'NA') return false;
      return true;
    });

    const [year, mon] = month.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label = `${monthNames[parseInt(mon) - 1]} ${year.slice(2)}`;

    const fundSubsidy    = sum(monthRows, 'Fund Subsidy');
    const chargedOut     = sum(monthRows, 'Total Charged out');
    const utilisedFund   = sum(monthRows, 'Utilised Fund');
    const unutilisedFund = sum(monthRows, 'Unutilised Fund');
    const packageFund    = sum(monthRows, 'Package Fund');
    const totalGM        = sum(monthRows, 'Total GM $');
    const estNetRev      = sum(monthRows, 'Est Net Rev');
    const cmpMFees       = sum(monthRows, 'CMPMFees');
    const coContribution = sum(monthRows, 'Co Contribution');
    const qtyHours       = sum(monthRows, 'Qty');

    // Package fund by level for stacked area [CONFIRMED - PBIX Trend page has this]
    const byLevel = (lvl: PackageLevel) =>
      sum(monthRows.filter(r => r.Package === lvl), 'Package Fund');

    return {
      month,
      label,
      fundSubsidy: Math.round(fundSubsidy),
      chargedOut: Math.round(chargedOut),
      utilisedFund: Math.round(utilisedFund),
      unutilisedFund: Math.round(unutilisedFund),
      utilisationRate: packageFund > 0 ? utilisedFund / packageFund : 0,
      totalGM: Math.round(totalGM),
      gmPct: chargedOut > 0 ? totalGM / chargedOut : 0,
      estNetRev: Math.round(estNetRev),
      cmpMFees: Math.round(cmpMFees),
      coContribution: Math.round(coContribution),
      activeClients: new Set(monthRows.map(r => r.Client)).size,
      qtyHours: Math.round(qtyHours),
      packageFundL1: Math.round(byLevel(1)),
      packageFundL2: Math.round(byLevel(2)),
      packageFundL3: Math.round(byLevel(3)),
      packageFundL4: Math.round(byLevel(4)),
    };
  });
}

// ---------------------------------------------------------------------------
// SAH Classification Summaries
// ---------------------------------------------------------------------------

export function computeSAHClassificationSummaries(
  rows: SHCRow[]
): SAHClassificationSummary[] {
  const classMap = new Map<SAHClassification, {qty:number; chargedOut:number; coContrib:number; estNetRev:number}>();

  for (const r of rows) {
    const prev = classMap.get(r['SAH Classification']) ?? { qty:0, chargedOut:0, coContrib:0, estNetRev:0 };
    classMap.set(r['SAH Classification'], {
      qty: prev.qty + r.Qty,
      chargedOut: prev.chargedOut + r['Total Charged out'],
      coContrib: prev.coContrib + r['Co Contribution'],
      estNetRev: prev.estNetRev + r['Est Net Rev'],
    });
  }

  const totalQty = [...classMap.values()].reduce((a, v) => a + v.qty, 0);

  return [...classMap.entries()]
    .map(([cls, v]) => ({
      classification: cls,
      qty: v.qty,
      chargedOut: v.chargedOut,
      coContribution: v.coContrib,
      estNetRev: v.estNetRev,
      pctOfTotal: totalQty > 0 ? v.qty / totalQty : 0,
    }))
    .sort((a, b) => b.qty - a.qty);
}

// ---------------------------------------------------------------------------
// Prior period helper
// ---------------------------------------------------------------------------

export function getPriorPeriod(from: string, to: string): { from: string; to: string } {
  const fromDate = new Date(`${from}-01`);
  const toDate   = new Date(`${to}-01`);
  const months   = (toDate.getFullYear() - fromDate.getFullYear()) * 12
    + (toDate.getMonth() - fromDate.getMonth()) + 1;

  const priorTo = new Date(fromDate);
  priorTo.setMonth(priorTo.getMonth() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setMonth(priorFrom.getMonth() - (months - 1));

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  return { from: fmt(priorFrom), to: fmt(priorTo) };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(Math.round(value));
}

export function formatHours(value: number): string {
  return `${formatNumber(Math.round(value))} hrs`;
}

export function formatDelta(delta: KPIDelta, format: 'currency' | 'percent' | 'number' | 'hours'): string {
  const sign = delta.direction === 'up' ? '+' : '';
  switch (format) {
    case 'currency': return `${sign}${formatCurrency(delta.value, true)}`;
    case 'percent':  return `${sign}${formatPercent(delta.value)}`;
    case 'hours':    return `${sign}${formatNumber(Math.round(delta.value))} hrs`;
    default:         return `${sign}${formatNumber(delta.value)}`;
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sum(rows: SHCRow[], field: keyof SHCRow): number {
  return rows.reduce((a, r) => a + ((r[field] as number) || 0), 0);
}
