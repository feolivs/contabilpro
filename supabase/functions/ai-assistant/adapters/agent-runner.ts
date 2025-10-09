import { Agent, run } from '@openai/agents';
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AssistantResponseSchema, type AssistantResponse } from '../guardrails/output.ts';

// ============================================================================
// INTERFACE ABSTRATA - Permite trocar backend do agente
// ============================================================================

export interface AgentContext {
  clientId: string;
  userId: string;
  supabase: SupabaseClient;
}

export interface IAgentRunner {
  run(
    question: string,
    context: AgentContext
  ): Promise<AssistantResponse>;
  
  runStream(
    question: string,
    context: AgentContext
  ): AsyncIterable<string>;
  
  getCompletedOutput(): AssistantResponse | null;
}

// ============================================================================
// IMPLEMENTAÇÃO COM OPENAI AGENTS SDK
// ============================================================================

export class OpenAIAgentsRunner implements IAgentRunner {
  private agent: Agent;
  private completedOutput: AssistantResponse | null = null;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(question: string, context: AgentContext): Promise<AssistantResponse> {
    const result = await run(this.agent, question, { context });
    this.completedOutput = result.finalOutput as AssistantResponse;
    return this.completedOutput;
  }

  async *runStream(question: string, context: AgentContext): AsyncIterable<string> {
    const stream = await run(this.agent, question, {
      stream: true,
      context
    });

    for await (const chunk of stream.toTextStream()) {
      yield chunk;
    }

    // Aguardar conclusão para obter output final
    await stream.completed;
    this.completedOutput = stream.state.finalOutput as AssistantResponse;
  }

  getCompletedOutput(): AssistantResponse | null {
    return this.completedOutput;
  }
}

// ============================================================================
// FACTORY - Permite trocar implementação via env var
// ============================================================================

export function createAgentRunner(agent: Agent): IAgentRunner {
  const backend = Deno.env.get('AGENT_BACKEND') || 'openai-agents';
  
  switch (backend) {
    case 'openai-agents':
      return new OpenAIAgentsRunner(agent);
    // Adicionar outras implementações aqui no futuro
    // case 'openai-responses':
    //   return new OpenAIResponsesRunner(agent);
    default:
      throw new Error(`Unknown agent backend: ${backend}`);
  }
}

/**
 * Exemplo de uso:
 * 
 * const agent = new Agent({ ... });
 * const runner = createAgentRunner(agent);
 * 
 * // Streaming
 * for await (const chunk of runner.runStream(question, context)) {
 *   // enviar chunk
 * }
 * const output = runner.getCompletedOutput();
 * 
 * // Ou sem streaming
 * const output = await runner.run(question, context);
 */

