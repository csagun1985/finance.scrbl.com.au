/**
 * API Route: POST /api/ask-the-data
 *
 * Conversational Q&A endpoint for the Ask-the-Data assistant.
 * Accepts a user question + dashboard context and returns an answer.
 *
 * Requires: ANTHROPIC_API_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ASK_SYSTEM_PROMPT, buildAskContext } from '@/lib/ai/prompts';
import { DashboardKPIs, DashboardFilters, PackageLevelSummary } from '@/types';

interface AskRequest {
  question: string;
  kpis: DashboardKPIs;
  filters: DashboardFilters;
  packageLevelSummaries: PackageLevelSummary[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

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

  let body: AskRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { question, kpis, filters, packageLevelSummaries, conversationHistory } = body;

  const dataContext = buildAskContext({ kpis, filters, packageLevelSummaries });

  // Build conversation with data context in first turn
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Here is the current dashboard data:\n\n${dataContext}\n\nPlease answer the following question: ${question}`,
    },
  ];

  // Append conversation history (excluding the first turn since we rebuilt it)
  if (conversationHistory.length > 0) {
    // Interleave prior history
    const historyMessages: Anthropic.MessageParam[] = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    // Prepend history before current question
    messages.splice(0, 0, ...historyMessages);
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: ASK_SYSTEM_PROMPT,
      messages,
    });

    const textContent = response.content.find(c => c.type === 'text');
    const answer = textContent?.type === 'text' ? textContent.text : 'Unable to generate answer.';

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Ask-the-data error:', error);
    return NextResponse.json(
      { answer: 'I had trouble generating an answer. Please check your API key and try again.' },
      { status: 200 } // Return 200 so frontend shows the message
    );
  }
}
