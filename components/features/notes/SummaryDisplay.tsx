'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryDisplayProps {
  noteId: string;
  noteContent: string;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export function SummaryDisplay({ 
  noteId, 
  noteContent, 
  isVisible, 
  onClose, 
  className 
}: SummaryDisplayProps) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && noteId && noteContent) {
      generateSummary();
    }
  }, [isVisible, noteId, noteContent]);

  const generateSummary = async () => {
    if (!noteId || !noteContent?.trim()) {
      setError('No content to summarize');
      return;
    }

    setIsLoading(true);
    setIsStreaming(false);
    setSummary('');
    setError(null);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId,
          noteContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      setIsLoading(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                setSummary(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setIsStreaming(false);
              } else if (data.type === 'error') {
                setError(data.content);
                setIsStreaming(false);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate summary');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={cn(
      "mb-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              AI Summary
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating summary...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {summary && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {summary}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && !summary && (
            <div className="text-blue-600 dark:text-blue-400 text-sm">
              Click the Summarize button to generate an AI summary of this note.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 