'use client';

import { AIAnalysisResult, AIInsight, AIInsightSeverity } from '@/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Info, Lightbulb, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Severity styling
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<AIInsightSeverity, {
  icon: typeof Info;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  label: string;
}> = {
  info: {
    icon: Info,
    iconColor: 'text-brand-500',
    borderColor: 'border-brand-200',
    bgColor: 'bg-brand-50',
    label: 'Info',
  },
  opportunity: {
    icon: Lightbulb,
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    label: 'Opportunity',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    label: 'Watch',
  },
  risk: {
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    label: 'Risk',
  },
};

// ---------------------------------------------------------------------------
// Individual insight card
// ---------------------------------------------------------------------------

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity];
  const Icon = cfg.icon;

  return (
    <div className={cn('rounded-lg border p-4', cfg.borderColor, cfg.bgColor)}>
      <div className="flex items-start gap-3">
        <Icon size={16} className={cn('mt-0.5 shrink-0', cfg.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={cn(
                'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-1',
                cfg.iconColor, 'bg-white/70'
              )}>
                {cfg.label}
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{insight.headline}</p>
            </div>
          </div>

          {insight.affectedSegment && (
            <p className="mt-1 text-xs text-slate-500">{insight.affectedSegment}</p>
          )}

          {/* Expandable body */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Less detail' : 'More detail'}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-xs leading-relaxed text-slate-600">{insight.body}</p>
              {insight.suggestedAction && (
                <div className="rounded bg-white/60 border border-slate-200 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                    Suggested action
                  </p>
                  <p className="text-xs text-slate-700">{insight.suggestedAction}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Executive summary panel
// ---------------------------------------------------------------------------

interface ExecutiveSummaryProps {
  summary: string;
  periodContext: string;
  keyMovements: string[];
}

function ExecutiveSummary({ summary, periodContext, keyMovements }: ExecutiveSummaryProps) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-brand-600" />
        <h3 className="text-sm font-semibold text-brand-800">Executive Summary</h3>
        <span className="ml-auto text-xs text-brand-500">{periodContext}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{summary}</p>

      {keyMovements.length > 0 && (
        <div className="mt-3 space-y-1">
          {keyMovements.map((movement, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <p className="text-xs leading-relaxed text-slate-600">{movement}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AI Commentary Panel
// ---------------------------------------------------------------------------

interface AICommentaryPanelProps {
  result: AIAnalysisResult | null;
  isLoading: boolean;
  error?: string;
  onRefresh: () => void;
}

export function AICommentaryPanel({ result, isLoading, error, onRefresh }: AICommentaryPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'insights'>('summary');

  const risks = result?.insights.filter(i => i.severity === 'risk') ?? [];
  const warnings = result?.insights.filter(i => i.severity === 'warning') ?? [];
  const opportunities = result?.insights.filter(i => i.severity === 'opportunity') ?? [];
  const infos = result?.insights.filter(i => i.severity === 'info') ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-800">AI Analysis</h2>
          {result && (
            <span className="text-xs text-slate-400">
              {new Date(result.generatedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          {result && (
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['summary', 'insights'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium transition-colors',
                    activeTab === tab
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {tab === 'summary' ? 'Summary' : `Insights ${result.insights.length > 0 ? `(${result.insights.length})` : ''}`}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : null}
            {isLoading ? 'Analysing...' : 'Refresh analysis'}
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="p-5">
        {isLoading && !result && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin text-brand-400" />
            <p className="text-sm">Analysing your dashboard data...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {result && !isLoading && (
          <>
            {activeTab === 'summary' && (
              <ExecutiveSummary
                summary={result.executiveSummary}
                periodContext={result.periodContext}
                keyMovements={result.keyMovements}
              />
            )}

            {activeTab === 'insights' && (
              <div className="space-y-3">
                {risks.length === 0 && warnings.length === 0 && opportunities.length === 0 && infos.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">No insights flagged for the selected period.</p>
                )}
                {risks.map(i => <InsightCard key={i.id} insight={i} />)}
                {warnings.map(i => <InsightCard key={i.id} insight={i} />)}
                {opportunities.map(i => <InsightCard key={i.id} insight={i} />)}
                {infos.map(i => <InsightCard key={i.id} insight={i} />)}
              </div>
            )}
          </>
        )}

        {!result && !isLoading && !error && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-slate-400">
              Click &ldquo;Refresh analysis&rdquo; to generate AI insights for the current view.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
