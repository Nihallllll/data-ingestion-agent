import type{ Message } from '../types';

interface ProgressBarProps {
  step: string;
  progress: number;
}

export function ProgressBar({ step, progress }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{step}</span>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onCopy?: (text: string) => void;
}

export function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  const isUser = message.type === 'user';

  return (
    <div className={`group w-full ${isUser ? 'bg-transparent' : 'bg-gray-50 dark:bg-[#2f2f2f]'}`}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
            {isUser ? 'U' : 'AI'}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <p className="whitespace-pre-wrap break-words m-0 text-gray-900 dark:text-gray-100">{message.content}</p>
            </div>

            {/* Copy button for assistant messages */}
            {!isUser && onCopy && (
              <button
                onClick={() => onCopy(message.content)}
                className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
