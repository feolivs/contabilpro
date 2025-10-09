import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  sources?: Array<{
    type: string;
    id: string;
    relevance: number;
  }>;
  timestamp: Date;
}

interface StreamEvent {
  type: 'start' | 'token' | 'done' | 'error';
  text?: string;
  confidence?: number;
  sources?: Message['sources'];
  error?: string;
}

export function useAIAssistantStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<number>(0);
  const { user } = useAuthStore();
  const supabase = createClient();

  const sendMessage = useCallback(async (clientId: string, question: string) => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setIsStreaming(true);
    setError(null);

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Criar mensagem do assistente (vazia)
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // ✅ CRÍTICO: Obter JWT do usuário autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session || sessionError) {
        throw new Error('Sessão inválida ou expirada. Faça login novamente.');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // ✅ CRÍTICO: Enviar JWT do usuário + apikey
      const response = await fetch(
        `${supabaseUrl}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`, // ✅ JWT do usuário
            'apikey': supabaseAnonKey,                         // ✅ ANON_KEY como apikey
            'Content-Type': 'application/json',
            'Last-Event-ID': lastEventId.toString()            // ✅ Para reconexão
          },
          body: JSON.stringify({ 
            clientId, 
            question
            // ❌ NÃO enviar userId - será extraído do JWT no backend
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let currentEventId: number | null = null;
      let currentData: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('id: ')) {
            currentEventId = parseInt(line.slice(4));
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
          } else if (line === '' && currentData) {
            // Evento completo
            try {
              const event: StreamEvent = JSON.parse(currentData);
              
              // Atualizar lastEventId para reconexão
              if (currentEventId !== null) {
                setLastEventId(currentEventId);
              }

              switch (event.type) {
                case 'start':
                  console.log('Stream started');
                  break;

                case 'token':
                  // Atualizar mensagem incrementalmente
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + event.text }
                      : msg
                  ));
                  break;

                case 'done':
                  // Adicionar metadados finais
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { 
                          ...msg, 
                          confidence: event.confidence,
                          sources: event.sources
                        }
                      : msg
                  ));
                  console.log('Stream completed', {
                    confidence: event.confidence,
                    sources: event.sources
                  });
                  break;

                case 'error':
                  throw new Error(event.error || 'Unknown streaming error');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data', parseError);
            }
            
            currentData = null;
          }
        }
      }
    } catch (err) {
      console.error('Streaming error', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Remover mensagem do assistente em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsStreaming(false);
    }
  }, [user, supabase, lastEventId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages
  };
}

