/**
 * Mock data generator for the SHC Finance Dashboard
 *
 * Data structure mirrors the confirmed SHC table from the PBIX data model.
 * All figures are GENERATED for demonstration — replace with real data export.
 *
 * [CONFIRMED] Government HCP subsidy rates (FY2024-25, Australian Government)
 * [INFERRED]  Fee structures and GM splits — typical provider economics
 * [PLACEHOLDER] SAH Classification values, Care Partner names, actual $ amounts
 *
 * To replace with real data:
 *  1. Export the SHC table from Power BI to CSV
 *  2. Replace this file with a CSV loader that maps columns to SHCRow
 */

import { SHCRow, PackageLevel, SAHClassification, CarePartner } from '@/types';

// ---------------------------------------------------------------------------
// [CONFIRMED] Government HCP subsidy rates FY2024-25 (annual, AUD)
// Source: Australian Government Aged Care website
// ---------------------------------------------------------------------------
export const ANNUAL_SUBSIDY_BY_LEVEL: Record<PackageLevel, number> = {
  1: 10_588,
  2: 18_622,
  3: 40_529,
  4: 61_440,
};

/** Monthly subsidy = annual / 12 */
export const MONTHLY_SUBSIDY: Record<PackageLevel, number> = {
  1: Math.round(ANNUAL_SUBSIDY_BY_LEVEL[1] / 12),  // ~$882
  2: Math.round(ANNUAL_SUBSIDY_BY_LEVEL[2] / 12),  // ~$1,552
  3: Math.round(ANNUAL_SUBSIDY_BY_LEVEL[3] / 12),  // ~$3,377
  4: Math.round(ANNUAL_SUBSIDY_BY_LEVEL[4] / 12),  // ~$5,120
};

// [CONFIRMED] Basic Daily Fee (government-set, ~FY2025)
const BASIC_DAILY_FEE_PER_DAY = 12.75;
const BASIC_DAILY_FEE_MONTHLY = Math.round(BASIC_DAILY_FEE_PER_DAY * 30.44);

// [INFERRED] Fee structure as % of Fund Subsidy
const CARE_MGMT_PCT = 0.12;    // 12% Care Management Fee
const PKG_MGMT_PCT  = 0.08;    // 8% Package Management Fee
// Remaining ~80% goes to direct care services

// [INFERRED] Direct care delivery cost per hour (all-up: wages + oncosts + super)
const DIRECT_CARE_COST_PER_HOUR = 52;

// [INFERRED] GM split: Internal vs External service providers
const INTERNAL_GM_SPLIT = 0.65;   // 65% of GM from internal staff
const ON_HIRE_GM_SPLIT  = 0.20;   // 20% from on-hire staff
// External = remaining 15%

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

// [PLACEHOLDER] Care Partner names — replace with real coordinator names
const CARE_PARTNERS: CarePartner[] = [
  'Sarah Chen',
  'Mark Davidson',
  'Emma Wilson',
  'James O\'Brien',
  'Priya Sharma',
  'Luke Anderson',
  'Natalie Russo',
  'Aaron Mitchell',
];

// [PLACEHOLDER] SAH Classification values — replace with real classifications from data
const SAH_CLASSIFICATIONS: SAHClassification[] = [
  'Personal Care',
  'Domestic Assistance',
  'Nursing',
  'Allied Health',
  'Social Support',
  'Respite',
  'Transport',
  'Community Access',
];

// [PLACEHOLDER] Service descriptions by classification — replace with real service names
const SERVICES_BY_CLASS: Record<SAHClassification, string[]> = {
  'Personal Care':        ['Showering Assistance', 'Dressing Assistance', 'Grooming Support'],
  'Domestic Assistance':  ['House Cleaning', 'Laundry', 'Meal Preparation'],
  'Nursing':              ['Wound Care', 'Medication Management', 'Health Monitoring'],
  'Allied Health':        ['Physiotherapy', 'Occupational Therapy', 'Podiatry'],
  'Social Support':       ['Social Outings', 'Companionship Visits', 'Group Activities'],
  'Respite':              ['Centre-Based Respite', 'In-Home Respite'],
  'Transport':            ['Medical Appointments', 'Shopping Transport', 'Community Access Transport'],
  'Community Access':     ['Day Program', 'Community Participation'],
};

// SAH classification weights by package level [INFERRED]
const CLASS_WEIGHTS: Record<PackageLevel, Partial<Record<SAHClassification, number>>> = {
  1: { 'Domestic Assistance': 0.50, 'Social Support': 0.30, 'Transport': 0.20 },
  2: { 'Domestic Assistance': 0.35, 'Personal Care': 0.30, 'Social Support': 0.20, 'Transport': 0.15 },
  3: { 'Personal Care': 0.35, 'Domestic Assistance': 0.20, 'Nursing': 0.20, 'Allied Health': 0.15, 'Transport': 0.10 },
  4: { 'Personal Care': 0.40, 'Nursing': 0.25, 'Allied Health': 0.20, 'Domestic Assistance': 0.10, 'Respite': 0.05 },
};

// Client name pools [PLACEHOLDER]
const FIRST = ['Margaret','Robert','Patricia','John','Jennifer','Michael','Linda','William',
  'Barbara','David','Elizabeth','Richard','Susan','Joseph','Dorothy','Thomas','Jessica',
  'Charles','Sarah','Christopher','Karen','Daniel','Nancy','Matthew','Betty','Anthony',
  'Helen','Donald','Sandra','Brian','Donna','Kenneth','Carol','Paul','Ruth','George',
  'Sharon','Edward','Michelle','Ronald','Laura','Timothy','Maria','Jason','Frances'];
const LAST  = ['Smith','Jones','Williams','Brown','Wilson','Taylor','Anderson','Thomas',
  'Jackson','White','Harris','Martin','Thompson','Garcia','Robinson','Clark','Lewis',
  'Lee','Walker','Hall','Allen','Young','King','Wright','Hill','Scott','Green','Adams',
  'Baker','Nelson','Carter','Mitchell','Turner','Phillips','Campbell','Parker'];

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (stable mock data across renders)
// ---------------------------------------------------------------------------
function mkRng(seed: number) {
  let s = seed;
  return {
    next: () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; },
    between: (min: number, max: number) => { s = (s * 16807) % 2147483647; return min + ((s - 1) / 2147483646) * (max - min); },
    int: (min: number, max: number) => { s = (s * 16807) % 2147483647; return Math.floor(min + ((s - 1) / 2147483646) * (max - min + 1)); },
    pick: <T>(arr: T[]): T => { s = (s * 16807) % 2147483647; return arr[Math.floor(((s - 1) / 2147483646) * arr.length)]; },
  };
}

const rng = mkRng(42);

// ---------------------------------------------------------------------------
// Client generation
// ---------------------------------------------------------------------------

interface MockClient {
  id: string;
  name: string;
  packageLevel: PackageLevel;
  carePartner: CarePartner;
  commencedMonth: string; // YYYY-MM
  isActive: boolean;
  utilisationBias: number; // 0.4–1.0 — how much they tend to use
}

function generateClients(count = 175): MockClient[] {
  const clients: MockClient[] = [];

  // Level distribution [INFERRED]: typical HCP portfolio
  const levelDist: PackageLevel[] = [
    ...Array(16).fill(1),   // ~9%
    ...Array(40).fill(2),   // ~23%
    ...Array(55).fill(3),   // ~31%
    ...Array(64).fill(4),   // ~37%
  ];

  for (let i = 0; i < count; i++) {
    const level = levelDist[i % levelDist.length] as PackageLevel;
    const name = `${rng.pick(FIRST)} ${rng.pick(LAST)}`;

    // Commenced date: spread over last 3 years
    const monthsAgo = rng.int(2, 36);
    const base = new Date(2026, 2, 1); // March 2026
    base.setMonth(base.getMonth() - monthsAgo);
    const commencedMonth = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;

    // Small % inactive
    const isActive = rng.next() < 0.92;

    clients.push({
      id: `SHC${String(i + 1).padStart(4, '0')}`,
      name,
      packageLevel: level,
      carePartner: rng.pick(CARE_PARTNERS),
      commencedMonth,
      isActive,
      utilisationBias: rng.between(0.50, 0.97),
    });
  }

  return clients;
}

// ---------------------------------------------------------------------------
// Monthly row generation — produces rows matching the SHC table structure
// ---------------------------------------------------------------------------

function generateRows(clients: MockClient[]): SHCRow[] {
  const rows: SHCRow[] = [];

  // Generate 14 months: Jan 2025 – Feb 2026 (current Mar 2026 partial)
  const months: string[] = [];
  for (let m = 0; m < 15; m++) {
    const d = new Date(2025, 0 + m, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  for (const client of clients) {
    for (const month of months) {
      // Skip before commencement
      if (month < client.commencedMonth) continue;
      // Inactive clients: no rows after cessation month [INFERRED]
      if (!client.isActive && month > '2025-10') continue;

      const level = client.packageLevel;
      const monthlySubsidy = MONTHLY_SUBSIDY[level];

      // Utilisation variance [INFERRED]
      const monthIdx = months.indexOf(month);
      const trendBump = monthIdx * 0.003;
      const rawUtil = Math.min(0.99, Math.max(0.25,
        client.utilisationBias + trendBump + rng.between(-0.10, 0.10)
      ));

      // Package Fund = monthly subsidy
      const packageFund = monthlySubsidy;

      // Fund Subsidy (government payment) = Package Fund [CONFIRMED they are same field]
      const fundSubsidy = packageFund;
      const governmentSubsidy = fundSubsidy;

      // Co-contribution = Basic Daily Fee + optional income-tested fee
      const incomeTestedFee = level >= 3 ? rng.int(0, 250) : 0;
      const coContribution = BASIC_DAILY_FEE_MONTHLY + incomeTestedFee;
      const coContributionRate = coContribution / fundSubsidy;

      // Utilised Fund
      const utilisedFund = Math.round(packageFund * rawUtil);
      const unutilisedFund = Math.max(0, packageFund - utilisedFund);
      const overUtilisedFund = Math.max(0, utilisedFund - packageFund);
      const utilisationRate = packageFund > 0 ? utilisedFund / packageFund : 0;

      // Fees [INFERRED]
      const careManagementFees = Math.round(fundSubsidy * CARE_MGMT_PCT);
      const packageManagementFees = Math.round(fundSubsidy * PKG_MGMT_PCT);
      const cmpMFees = careManagementFees + packageManagementFees;

      // Total Charged Out = Fund Subsidy + Co Contribution [CONFIRMED from PBIX]
      const totalChargedOut = fundSubsidy + coContribution;

      // Est Net Rev = Total Charged Out - CMPMFees [INFERRED]
      const estNetRev = totalChargedOut - cmpMFees;

      // Direct care value (what's left of utilisedFund after fees)
      const directCareValue = Math.max(0, utilisedFund - cmpMFees);

      // Hours
      const qty = Math.round(directCareValue / DIRECT_CARE_COST_PER_HOUR);

      // GM calculation [INFERRED]
      // Revenue from services = directCareValue
      // Cost of delivery = ~85-92% of that value
      const deliveryCostRatio = rng.between(0.82, 0.91);
      const deliveryCost = Math.round(directCareValue * deliveryCostRatio);
      const totalGM = totalChargedOut - cmpMFees - deliveryCost;

      // GM splits [INFERRED]
      const internalGM = Math.round(totalGM * (INTERNAL_GM_SPLIT + rng.between(-0.05, 0.05)));
      const onHireGM   = Math.round(totalGM * (ON_HIRE_GM_SPLIT  + rng.between(-0.03, 0.03)));
      const externalGM = totalGM - internalGM - onHireGM;

      // Service breakdowns — one row per SAH classification [INFERRED per-row structure]
      const classWeights = CLASS_WEIGHTS[level];
      const classes = Object.keys(classWeights) as SAHClassification[];

      for (const sahClass of classes) {
        const weight = (classWeights as Record<string, number>)[sahClass];
        const classQty = Math.round(qty * weight);
        if (classQty === 0) continue;

        const classChargedOut = Math.round(totalChargedOut * weight);
        const classCoContrib  = Math.round(coContribution * weight);
        const classEstNetRev  = Math.round(estNetRev * weight);

        const serviceProvided = rng.pick(SERVICES_BY_CLASS[sahClass]);
        const stmntMonth = new Date(`${month}-01`).toISOString().split('T')[0];

        rows.push({
          Client: client.name,
          'Care Partner': client.carePartner,
          'Service Provided': serviceProvided,
          'SAH Classification': sahClass,
          'Selected Package': level,
          Package: level,
          'STMNT MONTH': stmntMonth,
          'Fund Subsidy': Math.round(fundSubsidy * weight),
          'Government Subsidy': Math.round(governmentSubsidy * weight),
          'Co Contribution': classCoContrib,
          'Co Contribution Rate': coContributionRate,
          'Total Charged out': classChargedOut,
          'Est Net Rev': classEstNetRev,
          'Package Fund': Math.round(packageFund * weight),
          CMPMFees: Math.round(cmpMFees * weight),
          'Care Management Fees': Math.round(careManagementFees * weight),
          'Package Management Fees': Math.round(packageManagementFees * weight),
          'Utilised Fund': Math.round(utilisedFund * weight),
          'Unutilised Fund': Math.round(unutilisedFund * weight),
          'Over Utilised Fund': Math.round(overUtilisedFund * weight),
          'Utilisation Rate': utilisationRate,
          'Total GM $': Math.round(totalGM * weight),
          'Internal GM': Math.round(internalGM * weight),
          'Internal, On-Hire GM': Math.round(onHireGM * weight),
          'External GM': Math.round(externalGM * weight),
          Qty: classQty,
        });
      }
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Export static mock dataset
// ---------------------------------------------------------------------------

export const MOCK_CLIENTS = generateClients(175);
export const MOCK_ROWS: SHCRow[] = generateRows(MOCK_CLIENTS);

/** All unique months in the dataset, sorted */
export const ALL_MONTHS: string[] = [
  ...new Set(MOCK_ROWS.map(r => r['STMNT MONTH'].substring(0, 7)))
].sort();

/** All unique care partners, excluding template values per PBIX filter */
export const ALL_CARE_PARTNERS: string[] = [
  ...new Set(MOCK_ROWS.map(r => r['Care Partner']))
].filter(cp => cp && cp !== 'Unassigned' && cp !== 'null' && cp !== '0').sort();

/** Default period: last 6 complete months */
export const DEFAULT_PERIOD_FROM = ALL_MONTHS[ALL_MONTHS.length - 7] ?? ALL_MONTHS[0];
export const DEFAULT_PERIOD_TO   = ALL_MONTHS[ALL_MONTHS.length - 2] ?? ALL_MONTHS[ALL_MONTHS.length - 1];
