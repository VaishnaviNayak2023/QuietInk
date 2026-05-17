
import { SAFETY_LIBRARY } from '../constants/library';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  engine: 'gemma' | 'local';
}

/**
 * Calls the server-side Gemma API proxy.
 */
async function askOnline(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Local RAG fallback — keyword-matching against the safety library.
 * Works fully offline with zero network dependencies.
 */
function askOffline(query: string): string {
  const keywords = query.toLowerCase().split(' ').filter(k => k.length > 2);

  const results = SAFETY_LIBRARY.map(doc => {
    let score = 0;
    keywords.forEach(k => {
      if (doc.title.toLowerCase().includes(k)) score += 10;
      if (doc.content.toLowerCase().includes(k)) score += 2;
    });
    return { ...doc, score };
  }).filter(d => d.score > 0).sort((a, b) => b.score - a.score);

  if (results.length > 0) {
    const top = results[0];
    return `Based on safety protocol "${top.title}":\n\n${top.content.split('\n').slice(0, 8).join('\n')}...\n\nRefer to the full entry in "Help Library" for detailed steps.`;
  }

  return "No specific match found in local knowledge base.\n\nGENERAL SAFETY: If you are in immediate danger, use the SOS SYSTEM or head to a safe public location immediately. Do not stay in an isolated area.";
}

/**
 * Unified AI assistant entry point.
 * Routes to Gemma API when online, falls back to local RAG when offline.
 */
export async function askAssistant(messages: ChatMessage[]): Promise<AIResponse> {
  const lastMessage = messages[messages.length - 1];

  if (navigator.onLine) {
    try {
      const content = await askOnline(messages);
      return { content, engine: 'gemma' };
    } catch (error) {
      console.warn('Online AI unavailable, falling back to local engine:', error);
      return { content: askOffline(lastMessage.content), engine: 'local' };
    }
  }

  return { content: askOffline(lastMessage.content), engine: 'local' };
}
