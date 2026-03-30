/**
 * API Route: POST /api/ai-analysis
 *
 * Accepts dashboard KPI context and returns AI-generated insights
 * using the Anthropic Claude API.
 *
 * Requires: ANTHROPIC_API_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildDataContext,
  ANALYSIS_SYSTEM_PROMPT,
} from '@/lib/ai/prompts';
import { AIAnalysisRequest, AIAnalysisResult } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local' },
      { status: 500 }
    );
  }

  let body: AIAnalysisRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { kpis, kpiDeltas, packageLevelSummaries, trendPoints, filters, priorPeriodKpis } = body;

  const dataContext = buildDataContext({
    kpis, kpiDeltas, packageLevelSummaries, trendPoints, filters, priorPeriodKpis,
  });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please analyse the following SHC Finance Dashboard data and return your analysis as JSON:\n\n${dataContext}`,
        },
      ],
    });

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse JSON — the model returns valid JSON per system prompt instructions
    let parsed: Partial<AIAnalysisResult>;
    try {
      // Strip any accidental markdown fences
      const cleaned = textContent.text.replace(/^```json\n?/m, '').replace(/\n?```$/m, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: return a minimal result with the raw text as summary
      parsed = {
        executiveSummary: textContent.text.slice(0, 500),
        keyMovements: [],
        insights: [],
        periodContext: `${filters.periodFrom} to ${filters.periodTo}`,
      };
    }

    const result: AIAnalysisResult = {
      executiveSummary: parsed.executiveSummary ?? 'Analysis complete.',
      keyMovements: parsed.keyMovements ?? [],
      insights: (parsed.insights ?? []).map((ins, i) => ({
        id: ins.id ?? `insight_${i}`,
        severity: ins.severity ?? 'info',
        category: ins.category ?? 'operational',
        headline: ins.headline ?? '',
        body: ins.body ?? '',
        affectedSegment: ins.affectedSegment,
        suggestedAction: ins.suggestedAction,
      })),
      generatedAt: new Date().toISOString(),
      periodContext: parsed.periodContext ?? `${filters.periodFrom} to ${filters.periodTo}`,
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('AI analysis error:', error);

    const errMsg = error instanceof Error ? error.message : 'Unknown error';

    // Return a graceful error response so the frontend can show it
    return NextResponse.json(
      { error: `AI analysis failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
