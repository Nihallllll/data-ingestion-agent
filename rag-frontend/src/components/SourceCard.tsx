import type{ Source } from '../types';

interface SourceCardProps {
  sources: Source[];
}

export function SourceCard({ sources }: SourceCardProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 pb-4">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Sources
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {source.source}
                  </span>
                  {source.source === 'Github' && source.filename && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      {source.filename}
                    </span>
                  )}
                  {source.source === 'Discord' && source.username && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      @{source.username}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                  {source.content}
                </p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {(source.similarity * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
