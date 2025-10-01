import 'server-only';

export type LlmRequest = { prompt: string; model?: string };
export type LlmResponse = { content: string };

export async function callLlm(req: LlmRequest): Promise<LlmResponse> {
  // Placeholder: wire OpenAI or other LLM later
  void req;
  return { content: 'LLM response placeholder' };
}

