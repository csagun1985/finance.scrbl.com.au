/**
 * Core TypeScript types for the SHC Finance Dashboard
 *
 * Data model extracted directly from SHC Dashboard_Finance.pbix
 *
 * LEGEND:
 *   [CONFIRMED]   - Column/field confirmed from PBIX data model
 *   [INFERRED]    - Reasonable assumption for domain; needs validation
 *   [PLACEHOLDER] - Needs validation against actual data values
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/**
 * [CONFIRMED] Package levels extracted from PBIX.
 * Confirmed to be 1–4 matching Australian HCP levels.
 */
export type PackageLevel = 1 | 2 | 3 | 4;

/**
 * [INFERRED] Care partner / provider — values from PBIX slicer.
 * Excludes 'Unassigned', 'null', '0' per PBIX filter logic.
 */
export type CarePartner = string;

/**
 * [CONFIRMED - field exists] SAH Classification from the SHC table.
 * Likely represents service type categories under the Support at Home program.
 * [PLACEHOLDER] Actual classification values need validation against real data.
 */
export type SAHClassification =
  | 'Personal Care'
  | 'Domestic Assistance'
  | 'Nursing'
  | 'Allied Health'
  | 'Social Support'
  | 'Respite'
  | 'Transport'
  | 'Community Access';

/** [INFERRED] Time period granularity */
export type PeriodGranularity = 'month' | 'quarter' | 'year';

// ---------------------------------------------------------------------------
// [CONFIRMED] Core SHC row — matches the single SHC table in the data model
// ---------------------------------------------------------------------------

/**
 * One row of the SHC table as extracted from the PBIX.
 * All 28 column names confirmed from PBIX data model extraction.
 */
export interface SHCRow {
  // --- Client & Service ---
  /** [CONFIRMED] Client name/identifier */
  Client: string;
  /** [CONFIRMED] Care partner / provider assigned to client */
  'Care Partner': CarePartner;
  /** [CONFIRMED] Service provided description */
  'Service Provided': string;
  /** [CONFIRMED] SAH Classification (Support at Home service type) */
  'SAH Classification': SAHClassification;
  /** [CONFIRMED] Selected package level (1–4) */
  'Selected Package': PackageLevel;
  /** [CONFIRMED] Package number (1–4) */
  Package: PackageLevel;

  // --- Date ---
  /** [CONFIRMED] Statement month — base for date hierarchy */
  'STMNT MONTH': string; // ISO date string YYYY-MM-DD (first of month)

  // --- Funding / Revenue ---
  /** [CONFIRMED] Government fund subsidy amount */
  'Fund Subsidy': number;
  /** [CONFIRMED] Government subsidy (may differ from Fund Subsidy - needs validation) */
  'Government Subsidy': number;
  /** [CONFIRMED] Client co-contribution payment */
  'Co Contribution': number;
  /** [CONFIRMED] Co-contribution rate (%) */
  'Co Contribution Rate': number;
  /** [CONFIRMED] Total charged out = Fund Subsidy + Co Contribution */
  'Total Charged out': number;
  /** [CONFIRMED] Estimated net revenue */
  'Est Net Rev': number;
  /** [CONFIRMED] Package fund (allocated subsidy per package) */
  'Package Fund': number;

  // --- Fees ---
  /** [CONFIRMED] Care Management + Package Management fees combined */
  CMPMFees: number;
  /** [CONFIRMED] Care Management fee component */
  'Care Management Fees': number;
  /** [CONFIRMED] Package Management fee component */
  'Package Management Fees': number;

  // --- Utilisation ---
  /** [CONFIRMED] Fund amount actually utilised (spent) */
  'Utilised Fund': number;
  /** [CONFIRMED] Fund amount not yet utilised (unspent) */
  'Unutilised Fund': number;
  /** [CONFIRMED] Amount over-utilised (spend exceeded subsidy) */
  'Over Utilised Fund': number;
  /** [CONFIRMED] Utilisation rate = Utilised Fund / Package Fund */
  'Utilisation Rate': number; // 0–1

  // --- Gross Margin ---
  /** [CONFIRMED] Total gross margin $ */
  'Total GM $': number;
  /** [CONFIRMED] GM from internally employed staff */
  'Internal GM': number;
  /** [CONFIRMED] GM from internally hired / on-hire staff */
  'Internal, On-Hire GM': number;
  /** [CONFIRMED] GM from external providers */
  'External GM': number;

  // --- Service delivery ---
  /** [CONFIRMED] Quantity of hours delivered */
  Qty: number;
}

// ---------------------------------------------------------------------------
// Aggregated views (computed from SHCRow data)
// ---------------------------------------------------------------------------

/** Aggregated KPIs across a filtered dataset */
export interface DashboardKPIs {
  // Utilisation page KPIs [CONFIRMED from PBIX page 1]
  totalClients: number;
  totalFundSubsidy: number;
  totalCMPMFees: number;
  totalChargedOut: number;
  totalUtilisedFund: number;
  totalUnutilisedFund: number;
  totalOverUtilisedFund: number;
  avgUtilisationRate: number;
  totalCoContribution: number;

  // GM page KPIs [CONFIRMED from PBIX page 4]
  totalGM: number;
  totalEstNetRev: number;
  totalInternalGM: number;
  totalInternalOnHireGM: number;
  totalExternalGM: number;
  totalCareManagementFees: number;
  totalPackageManagementFees: number;

  // Derived
  gmPct: number; // totalGM / totalChargedOut
  lowUtilClients: number; // clients below LOW_UTIL_THRESHOLD
  overUtilClients: number; // clients over 100% utilisation
  totalQtyHours: number;
}

/** KPI comparison delta */
export interface KPIDelta {
  value: number;
  pct: number;
  direction: 'up' | 'down' | 'flat';
  /** Whether the direction is a positive outcome (up is not always good) */
  isPositive: boolean;
}

/** KPI card display data */
export interface KPICardData {
  label: string;
  value: number;
  format: 'currency' | 'percent' | 'number' | 'hours';
  delta?: KPIDelta;
  subtitle?: string;
  alert?: 'warning' | 'danger' | 'info';
  alertMessage?: string;
}

// ---------------------------------------------------------------------------
// Package level summary (for breakdown charts)
// ---------------------------------------------------------------------------

/** Aggregated by package level (1–4) */
export interface PackageLevelSummary {
  level: PackageLevel;
  label: string;
  clientCount: number;
  fundSubsidy: number;
  chargedOut: number;
  utilisedFund: number;
  unutilisedFund: number;
  utilisationRate: number;
  totalGM: number;
  gmPct: number;
  cmpMFees: number;
  coContribution: number;
  qtyHours: number;
  internalGM: number;
  externalGM: number;
}

// ---------------------------------------------------------------------------
// Care partner summary (for Care Partner page)
// ---------------------------------------------------------------------------

/** Aggregated by care partner / provider */
export interface CarePartnerSummary {
  carePartner: CarePartner;
  clientCount: number;
  fundSubsidy: number;
  chargedOut: number;
  utilisedFund: number;
  utilisationRate: number;
  totalGM: number;
  gmPct: number;
  qtyHours: number;
}

// ---------------------------------------------------------------------------
// Client-level summary (for Client_SAH page)
// ---------------------------------------------------------------------------

export interface ClientSummary {
  client: string;
  carePartner: CarePartner;
  packageLevel: PackageLevel;
  fundSubsidy: number;
  chargedOut: number;
  utilisedFund: number;
  unutilisedFund: number;
  utilisationRate: number;
  totalGM: number;
  coContribution: number;
  qtyHours: number;
  serviceLines: ServiceLineSummary[];
}

export interface ServiceLineSummary {
  sahClassification: SAHClassification;
  serviceProvided: string;
  qty: number;
  chargedOut: number;
  coContribution: number;
  estNetRev: number;
}

// ---------------------------------------------------------------------------
// Trend data (for Trend page)
// ---------------------------------------------------------------------------

export interface TrendPoint {
  month: string;         // YYYY-MM
  label: string;         // e.g. "Mar 25"
  fundSubsidy: number;
  chargedOut: number;
  utilisedFund: number;
  unutilisedFund: number;
  utilisationRate: number;
  totalGM: number;
  gmPct: number;
  estNetRev: number;
  cmpMFees: number;
  coContribution: number;
  activeClients: number;
  qtyHours: number;
  // Package fund breakdown by level (for stacked area chart)
  packageFundL1: number;
  packageFundL2: number;
  packageFundL3: number;
  packageFundL4: number;
}

// ---------------------------------------------------------------------------
// SAH Classification breakdown (for service mix charts)
// ---------------------------------------------------------------------------

export interface SAHClassificationSummary {
  classification: SAHClassification;
  qty: number;
  chargedOut: number;
  coContribution: number;
  estNetRev: number;
  pctOfTotal: number;
}

// ---------------------------------------------------------------------------
// Filter state — matches PBIX slicer structure
// ---------------------------------------------------------------------------

export interface DashboardFilters {
  /** STMNT MONTH range */
  periodFrom: string;   // YYYY-MM
  periodTo: string;     // YYYY-MM
  /** Selected package levels (empty = all) */
  packageLevels: PackageLevel[];
  /** Selected care partners (empty = all) */
  carePartners: string[];
  /** Active page context */
  activePage: 'utilisation' | 'client' | 'care-partner' | 'gm' | 'trend';
}

// ---------------------------------------------------------------------------
// AI analysis types
// ---------------------------------------------------------------------------

export type AIInsightSeverity = 'info' | 'warning' | 'risk' | 'opportunity';

export interface AIInsight {
  id: string;
  severity: AIInsightSeverity;
  category:
    | 'utilisation'
    | 'margin'
    | 'revenue'
    | 'cost'
    | 'operational'
    | 'opportunity';
  headline: string;
  body: string;
  affectedSegment?: string;
  suggestedAction?: string;
}

export interface AIAnalysisResult {
  executiveSummary: string;
  keyMovements: string[];
  insights: AIInsight[];
  generatedAt: string;
  periodContext: string;
}

export interface AIAnalysisRequest {
  kpis: DashboardKPIs;
  kpiDeltas: Record<string, KPIDelta>;
  packageLevelSummaries: PackageLevelSummary[];
  trendPoints: TrendPoint[];
  filters: DashboardFilters;
  priorPeriodKpis?: DashboardKPIs;
}
