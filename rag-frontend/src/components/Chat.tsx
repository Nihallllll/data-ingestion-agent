import { useState, useRef, useEffect } from 'react';
import type{ Message, Source, StreamUpdate } from '../types';
import { MessageBubble, ProgressBar } from './Message';
import { SourceCard } from './SourceCard';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

const API_URL = 'http://localhost:3001';

export function Chat() {
  //const { isDark, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ step: '', progress: 0 });
  const [sourceFilter, setSourceFilter] = useState<'all' | 'Discord' | 'Github'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setProgress({ step: '', progress: 0 });

    try {
      const response = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          source: sourceFilter === 'all' ? undefined : sourceFilter,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const update: StreamUpdate = JSON.parse(data);

              if (update.type === 'progress') {
                setProgress({ step: update.step, progress: update.progress });
              } else if (update.type === 'result') {
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  type: 'assistant',
                  content: update.answer,
                  sources: update.sources,
                  timestamp: new Date(update.timestamp),
                };
                setMessages((prev) => [...prev, assistantMessage]);
              } else if (update.type === 'error') {
                const errorMessage: Message = {
                  id: Date.now().toString(),
                  type: 'assistant',
                  content: `Error: ${update.error}`,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, there was an error processing your request. Make sure the API server is running on port 3001.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setProgress({ step: '', progress: 0 });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#212121]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              RAG Query System
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ask questions about your Discord and GitHub data
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Source Filter */}
            <div className="flex items-center gap-1 text-sm">
              {(['all', 'Discord', 'Github'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    sourceFilter === filter
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter}
                </button>
              ))}
            </div>

            {/* <ThemeToggle isDark={isDark} onToggle={toggleTheme} /> */}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto px-6">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">
                What would you like to know?
              </h2>
              <div className="grid grid-cols-1 gap-3 max-w-xl mx-auto">
                <button
                  onClick={() => setInput('What is this project about?')}
                  className="btn-secondary text-left justify-start"
                >
                  What is this project about?
                </button>
                <button
                  onClick={() => setInput('Show me code examples')}
                  className="btn-secondary text-left justify-start"
                >
                  Show me code examples
                </button>
                <button
                  onClick={() => setInput('What did people discuss recently?')}
                  className="btn-secondary text-left justify-start"
                >
                  What did people discuss recently?
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble message={message} onCopy={handleCopy} />
                {message.type === 'assistant' && message.sources && message.sources.length > 0 && (
                  <SourceCard sources={message.sources} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-50 dark:bg-[#2f2f2f]">
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  AI
                </div>
                <div className="flex-1">
                  <ProgressBar step={progress.step} progress={progress.progress} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copy Success Notification */}
        {copySuccess && (
          <div className="fixed top-20 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg text-sm">
            Copied to clipboard
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-white dark:bg-[#212121] border-t border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              rows={1}
              disabled={isLoading}
              className="input pr-12"
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg
                  className="w-5 h-5 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Enter to send, Shift+Enter for new line
          </p>
        </div>
      </footer>
    </div>
  );
}
