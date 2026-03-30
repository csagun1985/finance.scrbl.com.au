/**
 * AI analysis prompt construction for the SHC Finance Dashboard
 *
 * Uses the Claude API to generate executive-quality, plain-English
 * insights from the dashboard data.
 */

import {
  DashboardKPIs,
  KPIDelta,
  PackageLevelSummary,
  TrendPoint,
  DashboardFilters,
  AIInsight,
} from '@/types';
import {
  formatCurrency,
  formatPercent,
  LOW_UTIL_THRESHOLD,
} from '@/lib/dataTransforms';

// ---------------------------------------------------------------------------
// Context builder — creates a structured data summary for the AI prompt
// ---------------------------------------------------------------------------

export function buildDataContext(params: {
  kpis: DashboardKPIs;
  kpiDeltas: Record<string, KPIDelta>;
  packageLevelSummaries: PackageLevelSummary[];
  trendPoints: TrendPoint[];
  filters: DashboardFilters;
  priorPeriodKpis?: DashboardKPIs;
}): string {
  const { kpis, kpiDeltas, packageLevelSummaries, trendPoints, filters, priorPeriodKpis } = params;

  const periodLabel = `${filters.periodFrom} to ${filters.periodTo}`;
  const levelFilter = filters.packageLevels.length > 0
    ? `Package levels: ${filters.packageLevels.join(', ')}`
    : 'All package levels';
  const cpFilter = filters.carePartners.length > 0
    ? `Care partners: ${filters.carePartners.join(', ')}`
    : 'All care partners';

  const recentTrend = trendPoints.slice(-6);

  const lines: string[] = [
    `REPORTING PERIOD: ${periodLabel}`,
    `FILTERS: ${levelFilter} | ${cpFilter}`,
    '',
    '=== KEY PERFORMANCE INDICATORS ===',
    `Active Clients: ${kpis.totalClients} (${formatDelta(kpiDeltas.totalClients, 'number')})`,
    `Fund Subsidy: ${formatCurrency(kpis.totalFundSubsidy)} (${formatDelta(kpiDeltas.totalFundSubsidy, 'currency')})`,
    `CMPMFees: ${formatCurrency(kpis.totalCMPMFees)}`,
    `Total Charged Out: ${formatCurrency(kpis.totalChargedOut)} (${formatDelta(kpiDeltas.totalChargedOut, 'currency')})`,
    `Utilised Fund: ${formatCurrency(kpis.totalUtilisedFund)} (${formatDelta(kpiDeltas.totalUtilisedFund, 'currency')})`,
    `Unutilised Fund: ${formatCurrency(kpis.totalUnutilisedFund)} — risk of underspend`,
    `Utilisation Rate: ${formatPercent(kpis.avgUtilisationRate)} (${formatDelta(kpiDeltas.avgUtilisationRate, 'percent')}) [target: 70%+]`,
    `Co Contribution: ${formatCurrency(kpis.totalCoContribution)}`,
    `Total GM $: ${formatCurrency(kpis.totalGM)} (${formatDelta(kpiDeltas.totalGM, 'currency')})`,
    `GM %: ${formatPercent(kpis.gmPct)} (${formatDelta(kpiDeltas.gmPct, 'percent')})`,
    `Est Net Revenue: ${formatCurrency(kpis.totalEstNetRev)}`,
    `Internal GM: ${formatCurrency(kpis.totalInternalGM)}`,
    `Internal On-Hire GM: ${formatCurrency(kpis.totalInternalOnHireGM)}`,
    `External GM: ${formatCurrency(kpis.totalExternalGM)}`,
    `Clients below 70% utilisation: ${kpis.lowUtilClients} of ${kpis.totalClients}`,
    `Clients over-utilised (>100%): ${kpis.overUtilClients}`,
    `Total Service Hours (Qty): ${kpis.totalQtyHours.toLocaleString()}`,
    '',
  ];

  if (packageLevelSummaries.length > 0) {
    lines.push('=== PACKAGE LEVEL BREAKDOWN ===');
    for (const s of packageLevelSummaries) {
      lines.push(
        `${s.label}: ${s.clientCount} clients | ` +
        `Util: ${formatPercent(s.utilisationRate)} | ` +
        `Unutilised: ${formatCurrency(s.unutilisedFund, true)} | ` +
        `GM: ${formatCurrency(s.totalGM, true)} (${formatPercent(s.gmPct)}) | ` +
        `Internal GM: ${formatCurrency(s.internalGM, true)} | ` +
        `External GM: ${formatCurrency(s.externalGM, true)}`
      );
    }
    lines.push('');
  }

  if (recentTrend.length > 0) {
    lines.push('=== RECENT MONTHLY TREND (last 6 months) ===');
    for (const t of recentTrend) {
      lines.push(
        `${t.label}: Clients=${t.activeClients} | ` +
        `Charged=${formatCurrency(t.chargedOut, true)} | ` +
        `Util=${formatPercent(t.utilisationRate)} | ` +
        `GM=${formatCurrency(t.totalGM, true)} (${formatPercent(t.gmPct)})`
      );
    }
    lines.push('');
  }

  if (priorPeriodKpis) {
    lines.push('=== PRIOR PERIOD COMPARISON ===');
    lines.push(`Prior Total Charged Out: ${formatCurrency(priorPeriodKpis.totalChargedOut)}`);
    lines.push(`Prior Utilisation Rate: ${formatPercent(priorPeriodKpis.avgUtilisationRate)}`);
    lines.push(`Prior GM %: ${formatPercent(priorPeriodKpis.gmPct)}`);
    lines.push(`Prior Unutilised Fund: ${formatCurrency(priorPeriodKpis.totalUnutilisedFund)}`);
  }

  return lines.join('\n');
}

function formatDelta(delta: KPIDelta | undefined, fmt: 'currency' | 'percent' | 'number'): string {
  if (!delta || delta.direction === 'flat') return 'flat';
  const sign = delta.direction === 'up' ? '+' : '';
  const dir = delta.isPositive ? '▲' : '▼';
  switch (fmt) {
    case 'currency': return `${dir} ${sign}${formatCurrency(delta.value, true)}`;
    case 'percent':  return `${dir} ${sign}${formatPercent(delta.value)}`;
    default:         return `${dir} ${sign}${delta.value.toFixed(0)}`;
  }
}

// ---------------------------------------------------------------------------
// System prompt for analysis
// ---------------------------------------------------------------------------

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert financial analyst specialising in Australian aged care and home care business operations.

You are reviewing data from an SHC (Supported Home Care) Finance Dashboard that tracks:
- Government fund subsidy utilisation (Australian Home Care Packages, levels 1–4)
- Revenue: Fund Subsidy + Client Co-contribution = Total Charged Out
- Fees: Care Management Fees + Package Management Fees = CMPMFees
- Gross Margin: Total GM $ = Total Charged Out - CMPMFees - Direct care delivery costs
- GM breakdown: Internal staff GM / Internal On-Hire GM / External provider GM
- Utilisation Rate: Utilised Fund / Package Fund (target: 70–95%)
- Unutilised Fund: unspent government subsidy (risk if too high)

KEY BUSINESS CONTEXT:
- Home Care Package (HCP) levels 1–4 represent increasing care needs and government subsidies
- Under-utilisation means clients aren't receiving the care they're entitled to AND the provider is losing revenue
- Over-utilisation means spend exceeded the package fund (compliance risk)
- CMPMFees are the provider's management income stream — critical to protecting
- Care Partner = the coordinator/team responsible for managing a group of clients
- SAH Classification = service type under the Support at Home framework

YOUR ROLE:
- Produce executive-quality, plain-English analysis
- Write as if you are an intelligent business analyst briefing the CEO, COO, and Finance Director
- Be commercially specific — use actual numbers from the data
- Identify risks, opportunities, and operational issues with concrete recommendations
- Do NOT use jargon. Do NOT say "leverage" or "synergies". Be direct and clear.
- Be honest about what looks good AND what needs attention
- Prioritise insights that drive operational decisions

OUTPUT FORMAT:
Return valid JSON only (no markdown fences) with this exact structure:
{
  "executiveSummary": "2-3 sentence summary of the period",
  "keyMovements": ["movement 1", "movement 2", "movement 3"],
  "insights": [
    {
      "id": "unique_id",
      "severity": "risk|warning|opportunity|info",
      "category": "utilisation|margin|revenue|cost|operational|opportunity",
      "headline": "Short, specific headline (max 12 words)",
      "body": "2-3 sentences explaining the issue with numbers",
      "affectedSegment": "optional: e.g. Level 4 clients, North branch",
      "suggestedAction": "specific, actionable recommendation"
    }
  ],
  "periodContext": "e.g. Aug–Jan 2026 vs Feb–Jul 2025"
}`;

// ---------------------------------------------------------------------------
// Ask-the-data system prompt
// ---------------------------------------------------------------------------

export const ASK_SYSTEM_PROMPT = `You are a knowledgeable assistant helping users analyse their SHC Finance Dashboard data.

You have access to live KPI data and package-level summaries.
Answer questions concisely and in plain English.
Be specific — use numbers from the data provided.
Focus on actionable insights.
Never make up data not provided to you.
Keep answers to 3-5 sentences unless the user asks for more detail.`;

export function buildAskContext(params: {
  kpis: DashboardKPIs;
  filters: DashboardFilters;
  packageLevelSummaries: PackageLevelSummary[];
}): string {
  const { kpis, packageLevelSummaries } = params;
  return [
    `DASHBOARD DATA SUMMARY:`,
    `Active Clients: ${kpis.totalClients}`,
    `Fund Subsidy: ${formatCurrency(kpis.totalFundSubsidy)}`,
    `Utilisation Rate: ${formatPercent(kpis.avgUtilisationRate)}`,
    `Total GM $: ${formatCurrency(kpis.totalGM)} (${formatPercent(kpis.gmPct)})`,
    `Unutilised Fund: ${formatCurrency(kpis.totalUnutilisedFund)}`,
    `Low utilisation clients: ${kpis.lowUtilClients}`,
    `Over-utilised clients: ${kpis.overUtilClients}`,
    '',
    'By level:',
    ...packageLevelSummaries.map(s =>
      `  ${s.label}: ${s.clientCount} clients, ${formatPercent(s.utilisationRate)} util, ${formatPercent(s.gmPct)} GM`
    ),
  ].join('\n');
}
