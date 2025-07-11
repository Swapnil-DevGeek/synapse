'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Sparkles, 
  MessageSquare,
  Clock,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  _id?: string;
  question: string;
  answer: string;
  timestamp: string;
}

interface AIChatPanelProps {
  noteId: string;
  noteTitle: string;
  noteContent: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function AIChatPanel({ 
  noteId, 
  noteTitle, 
  noteContent, 
  isVisible,
  onClose 
}: AIChatPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation history when component mounts or noteId changes
  useEffect(() => {
    if (noteId && isVisible) {
      fetchConversations();
    }
  }, [noteId, isVisible]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, streamingAnswer]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/ai/conversations/${noteId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim() || isLoading) return;

    const question = currentQuestion.trim();
    setLastQuestion(question);
    setCurrentQuestion('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingAnswer('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId,
          question,
          noteContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response reader available');
      }

      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                fullAnswer += data.content;
                setStreamingAnswer(fullAnswer);
              } else if (data.type === 'complete') {
                setIsStreaming(false);
                setStreamingAnswer('');
                
                // Add the complete conversation to the list
                const newConversation: Conversation = {
                  question,
                  answer: data.content,
                  timestamp: new Date().toISOString(),
                };
                
                setConversations(prev => [...prev, newConversation]);
                
              } else if (data.type === 'error') {
                setIsStreaming(false);
                setStreamingAnswer('');
                console.error('AI Error:', data.content);
              }
            } catch (parseError) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setStreamingAnswer('');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversations = async () => {
    if (confirm('Are you sure you want to clear all conversations for this note?')) {
      setConversations([]);
      // You could add an API call here to clear conversations from the database
    }
  };

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm border-l">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Ask about this note</p>
            </div>
          </div>
          {conversations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversations}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Current Note</span>
          </div>
          <p className="text-sm font-medium truncate">{noteTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {conversations.length === 0 && !isStreaming && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h4 className="font-medium mb-2">Start a conversation</h4>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about this note and I'll help you understand it better.
                </p>
              </div>
            )}

            {conversations.map((conversation, index) => (
              <div key={index} className="space-y-3">
                {/* User Question */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-sm">{conversation.question}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Answer */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{conversation.answer}</p>
                    </div>
                  </div>
                </div>

                {index < conversations.length - 1 && <Separator className="my-4" />}
              </div>
            ))}

            {/* Streaming Response */}
            {isStreaming && (
              <div className="space-y-3">
                {/* Current Question */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-sm">{lastQuestion}</p>
                    </div>
                  </div>
                </div>

                {/* Streaming Answer */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {streamingAnswer}
                        <span className="inline-block w-2 h-4 bg-primary/60 ml-1 animate-pulse" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Ask about this note..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !currentQuestion.trim()}
            size="sm"
            className="px-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {conversations.length > 0 && (
          <div className="flex items-center justify-center mt-2">
            <Badge variant="secondary" className="text-xs">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
} 