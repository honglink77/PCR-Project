import { useRef, useEffect } from 'react';
import { Send, Paperclip, ArrowLeft, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { getAgent } from '@/data/agents';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ChatDraftView } from '@/components/chat/ChatDraftView';
import { cn } from '@/utils/cn';
import { formatTime } from '@/utils/time';
import { currentUser } from '@/data/users';
import type { Message, Citation } from '@/types/chat';

export function ChatView() {
  const { state } = useChat();

  if (state.draft.active) {
    return <ChatDraftView />;
  }

  if (!state.activeConversationId || !state.conversations[state.activeConversationId]) {
    return <ChatDraftView />;
  }

  return <ConversationView />;
}

function ConversationView() {
  const { state, dispatch, sendMessage, retryMessage } = useChat();
  const appDispatch = useAppDispatch();
  const { rightRail } = useAppState();
  const conv = state.conversations[state.activeConversationId!];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendStatus, composerText, failedMessageText } = state;
  const isBusy = sendStatus === 'sending' || sendStatus === 'answering';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages.length, sendStatus]);

  useEffect(() => {
    if (conv && textareaRef.current) textareaRef.current.focus();
  }, [conv?.id]);

  const agent = getAgent(conv.agentId);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (composerText.trim() && !isBusy) sendMessage(composerText);
    }
  }

  function handleSend() {
    if (composerText.trim() && !isBusy) sendMessage(composerText);
  }

  function handleCitationClick(citation: Citation) {
    appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'contextDetail', entityId: citation.id });
  }

  function handleBack() {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', id: null });
    appDispatch({ type: 'NAVIGATE', view: 'workspace' });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-surface-200 bg-white">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-surface-800 truncate">{conv.title}</h2>
            {agent && <Badge label={agent.name} variant="info" />}
          </div>
        </div>
        <button
          onClick={() => appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'promptLibrary' })}
          className={cn(
            'p-2 rounded-lg transition-colors',
            rightRail.mode === 'promptLibrary' ? 'bg-brand-50 text-brand-600' : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100',
          )}
          title="Prompt Library"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {conv.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onCitationClick={handleCitationClick} />
        ))}
        {sendStatus === 'sending' && <SendingIndicator />}
        {sendStatus === 'answering' && <TypingIndicator agentName={agent?.name ?? 'AI'} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Failed state banner */}
      {sendStatus === 'failed' && failedMessageText && (
        <div className="px-6">
          <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">Failed to send message.</p>
            <button
              onClick={retryMessage}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SEND_STATUS', status: 'idle' })}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-surface-200 bg-white px-6 py-4">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <button className="p-2.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors flex-shrink-0">
            <Paperclip className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={composerText}
              onChange={(e) => dispatch({ type: 'SET_COMPOSER', text: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={isBusy}
              className={cn(
                'w-full resize-none px-4 py-3 text-sm border rounded-xl text-surface-800 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow max-h-32',
                isBusy ? 'bg-surface-100 border-surface-200 cursor-not-allowed' : 'bg-surface-50 border-surface-200',
              )}
              style={{ minHeight: '44px' }}
            />
            {isBusy && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-surface-400 animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!composerText.trim() || isBusy}
            className={cn(
              'p-2.5 rounded-lg transition-colors flex-shrink-0',
              composerText.trim() && !isBusy
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-surface-100 text-surface-300 cursor-not-allowed',
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, onCitationClick }: { message: Message; onCitationClick: (c: Citation) => void }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : '')}>
      {isUser ? (
        <Avatar name={currentUser.name} initials={currentUser.initials} size="sm" className="mt-0.5" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-surface-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white">AI</span>
        </div>
      )}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : '')}>
        <div className={cn(
          'inline-block text-left rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-full',
          isUser ? 'bg-brand-600 text-white rounded-tr-md' : 'bg-surface-50 text-surface-800 rounded-tl-md border border-surface-200',
        )}>
          <div className="whitespace-pre-wrap break-words prose-sm">
            {renderContent(message.content, isUser)}
          </div>
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-surface-200 flex-wrap">
              {message.citations.map((cit) => (
                <button
                  key={cit.id}
                  onClick={() => onCitationClick(cit)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-md hover:bg-brand-100 transition-colors"
                >
                  {cit.label}
                  <span className="text-brand-500 truncate max-w-[120px]">{cit.source}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className={cn('text-[11px] text-surface-400 mt-1', isUser ? 'text-right' : '')}>{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}

function renderContent(content: string, isUser: boolean) {
  if (isUser) return content;
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function SendingIndicator() {
  return (
    <div className="flex gap-3 max-w-3xl ml-auto flex-row-reverse">
      <Avatar name={currentUser.name} initials={currentUser.initials} size="sm" className="mt-0.5" />
      <div className="text-right">
        <div className="inline-flex items-center gap-2 bg-brand-600/80 text-white rounded-2xl rounded-tr-md px-4 py-3">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="text-sm">Sending...</span>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="w-7 h-7 rounded-full bg-surface-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-white">AI</span>
      </div>
      <div className="bg-surface-50 border border-surface-200 rounded-2xl rounded-tl-md px-4 py-3">
        <p className="text-xs text-surface-500 mb-1">{agentName} is thinking...</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-surface-400 animate-pulse-dot" />
          <span className="w-2 h-2 rounded-full bg-surface-400 animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
          <span className="w-2 h-2 rounded-full bg-surface-400 animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>
    </div>
  );
}
