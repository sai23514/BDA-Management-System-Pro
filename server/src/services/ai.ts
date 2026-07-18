import { env, isAiConfigured } from '../config/env.js';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Thin wrapper over the OpenAI Chat Completions REST API using the native
 * `fetch` (Node 20+). Throws a clear error when AI is not configured.
 */
export const aiComplete = async (messages: AiMessage[]): Promise<string> => {
  if (!isAiConfigured) {
    throw new Error('AI is not configured. Set OPENAI_API_KEY in the server environment.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? '';
};
