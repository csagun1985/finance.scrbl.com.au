'use client';

import { DashboardFilters, PackageLevel } from '@/types';
import { ALL_MONTHS, ALL_CARE_PARTNERS } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const PACKAGE_LEVELS: PackageLevel[] = [1, 2, 3, 4];

function monthLabel(ym: string): string {
  const [year, mon] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[parseInt(mon) - 1]} ${year}`;
}

function ToggleButton({
  active, onClick, children, color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? cn('border-brand-500 bg-brand-500 text-white', color)
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600'
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const levelColors: Record<PackageLevel, string> = {
    1: 'bg-sky-500 border-sky-500',
    2: 'bg-violet-500 border-violet-500',
    3: 'bg-amber-500 border-amber-500',
    4: 'bg-rose-500 border-rose-500',
  };

  function togglePackageLevel(level: PackageLevel) {
    const next = filters.packageLevels.includes(level)
      ? filters.packageLevels.filter(l => l !== level)
      : [...filters.packageLevels, level];
    onChange({ ...filters, packageLevels: next });
  }

  function toggleCarePartner(cp: string) {
    const next = filters.carePartners.includes(cp)
      ? filters.carePartners.filter(c => c !== cp)
      : [...filters.carePartners, cp];
    onChange({ ...filters, carePartners: next });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-6">

        {/* Period range */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Period</span>
          <select
            value={filters.periodFrom}
            onChange={e => onChange({ ...filters, periodFrom: e.target.value })}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {ALL_MONTHS.map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">to</span>
          <select
            value={filters.periodTo}
            onChange={e => onChange({ ...filters, periodTo: e.target.value })}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {ALL_MONTHS.map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>

        {/* Package levels — [CONFIRMED] from PBIX slicer */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Level</span>
          <div className="flex gap-1">
            {PACKAGE_LEVELS.map(level => (
              <ToggleButton
                key={level}
                active={filters.packageLevels.includes(level)}
                onClick={() => togglePackageLevel(level)}
                color={filters.packageLevels.includes(level) ? levelColors[level] : undefined}
              >
                L{level}
              </ToggleButton>
            ))}
            {filters.packageLevels.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, packageLevels: [] })}
                className="rounded-full border border-slate-200 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-600"
              >
                All
              </button>
            )}
          </div>
        </div>

        {/* Care partner slicer — [CONFIRMED] from PBIX */}
        {ALL_CARE_PARTNERS.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Care Partner</span>
            <select
              value={filters.carePartners[0] ?? ''}
              onChange={e => {
                const val = e.target.value;
                onChange({ ...filters, carePartners: val ? [val] : [] });
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 max-w-[160px]"
            >
              <option value="">All partners</option>
              {ALL_CARE_PARTNERS.map(cp => (
                <option key={cp} value={cp}>{cp}</option>
              ))}
            </select>
            {filters.carePartners.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, carePartners: [] })}
                className="text-[10px] text-brand-500 underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active filter summary */}
      {(filters.packageLevels.length > 0 || filters.carePartners.length > 0) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span>Filtered to:</span>
          {filters.packageLevels.length > 0 && (
            <span>Level {filters.packageLevels.join(', ')}</span>
          )}
          {filters.carePartners.length > 0 && (
            <span>· {filters.carePartners.join(', ')}</span>
          )}
          <button
            onClick={() => onChange({ ...filters, packageLevels: [], carePartners: [] })}
            className="ml-1 text-brand-500 underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
