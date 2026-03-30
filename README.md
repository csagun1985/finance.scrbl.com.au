# SHC Finance Dashboard

A modern analytics dashboard for Supported Home Care (SHC) operations, rebuilt from `SHC Dashboard_Finance.pbix` using Next.js, React, TypeScript, Tailwind CSS, and Recharts — with an AI analysis layer powered by Claude (Anthropic).

---

## What was extracted from the PBIX

### ✅ Confirmed (directly from PBIX data model)

| Item | Detail |
|------|--------|
| **Primary table** | `SHC` — single flat fact table |
| **Date field** | `STMNT MONTH` (Statement Month) |
| **Columns (28 confirmed)** | See `src/types/index.ts` |
| **Revenue** | `Fund Subsidy`, `Government Subsidy`, `Co Contribution`, `Total Charged out`, `Est Net Rev` |
| **Fees** | `CMPMFees`, `Care Management Fees`, `Package Management Fees` |
| **Utilisation** | `Utilised Fund`, `Unutilised Fund`, `Over Utilised Fund`, `Utilisation Rate`, `Package Fund` |
| **Gross Margin** | `Total GM $`, `Internal GM`, `Internal, On-Hire GM`, `External GM` |
| **Service** | `Qty` (hours), `Service Provided`, `SAH Classification` |
| **Dimensions** | `Client`, `Care Partner`, `Package` (1–4) |
| **5 dashboard pages** | Utilisation_SAH, Client_SAH, Care Partner, GM, Trend |
| **Filter exclusions** | Clients: 'ONLY Template', 'NA' / Care Partners: 'Unassigned', 'null', '0' |

### ⚠️ Inferred (needs validation against real data)

| Item | Assumption |
|------|-----------|
| **Actual $ values** | Generated from published Australian Govt HCP subsidy rates (FY2024-25) |
| **SAH Classification values** | Placeholder categories — real values need confirming |
| **Care Partner names** | Fictional — replace with real names |
| **Fee percentages** | 12% Care Mgmt + 8% Package Mgmt (typical for Australian HCP providers) |
| **GM formula** | `Total Charged Out − CMPMFees − direct care cost` |
| **Utilisation Rate formula** | `Utilised Fund / Package Fund` |
| **Est Net Rev formula** | `Total Charged Out − CMPMFees` |

### ❌ Not extractable from PBIX

| Item | Reason |
|------|--------|
| **Actual data** | PBIX connects to a live remote dataset — no embedded data |
| **DAX measures** | Calculations pre-computed in source; no DAX visible |
| **Branch/region dimension** | Not found in PBIX — may not exist |

---

## Running locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
# Add your Anthropic API key to .env.local
```
Get an API key at: https://console.anthropic.com

### 3. Start dev server
```bash
npm run dev
```
Open http://localhost:3000

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Page 1: Utilisation_SAH
│   ├── client/page.tsx             # Page 2: Client_SAH
│   ├── care-partner/page.tsx       # Page 3: Care Partner
│   ├── gm/page.tsx                 # Page 4: GM
│   ├── trend/page.tsx              # Page 5: Trend
│   └── api/
│       ├── ai-analysis/route.ts    # AI insight generation
│       └── ask-the-data/route.ts   # Conversational Q&A
├── components/
│   ├── layout/                     # Sidebar, page headers
│   ├── ui/                         # KPICard, FilterBar, AICommentaryPanel, AskTheData
│   └── charts/                     # All chart components
├── lib/
│   ├── mockData.ts                 # Generated SHCRow dataset
│   ├── dataTransforms.ts           # Filtering, aggregation, formatting
│   └── ai/prompts.ts               # AI context builders and system prompts
└── types/index.ts                  # All types (annotated CONFIRMED/INFERRED)
```

---

## Connecting real data

Export the `SHC` table from Power BI to CSV and replace `MOCK_ROWS` in `src/lib/mockData.ts`.

---

## What still needs validation

- [ ] Confirm `Utilisation Rate` formula
- [ ] Confirm `Est Net Rev` and `Total GM $` formulas
- [ ] Verify `CMPMFees = Care Management Fees + Package Management Fees`
- [ ] Check if `Fund Subsidy = Government Subsidy` (same field?)
- [ ] Confirm actual SAH Classification values
- [ ] Validate Over-utilised Fund logic (rolling cumulative?)
- [ ] Check carry-forward / unspent funds accumulation logic

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Anthropic Claude API |
| Data | Mock (replace with CSV export) |
