import { useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Database, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAppDispatch } from '@/context/AppContext';
import { getAgent } from '@/data/agents';
import { currentUser } from '@/data/users';
import { promptTemplates } from '@/data/prompts';
import { cn } from '@/utils/cn';

const MAX_QUICK_PROMPTS = 4;

export function ChatDraftView() {
  const { state, dispatch, sendDraftMessage } = useChat();
  const appDispatch = useAppDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agentId = state.draft.agentId;
  const agent = agentId ? getAgent(agentId) : null;
  const { sendStatus, composerText, failedMessageText } = state;
  const isBusy = sendStatus === 'sending';

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  const quickPrompts = agent
    ? promptTemplates.filter((p) => {
        const cat = p.category.toLowerCase();
        const name = agent.name.toLowerCase();
        return name.includes(cat) || cat.includes('product') || cat.includes('research');
      }).slice(0, MAX_QUICK_PROMPTS)
    : promptTemplates.slice(0, MAX_QUICK_PROMPTS);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (composerText.trim() && !isBusy) sendDraftMessage(composerText);
    }
  }

  function handleSend() {
    if (composerText.trim() && !isBusy) sendDraftMessage(composerText);
  }

  function handlePromptClick(template: string) {
    dispatch({ type: 'SET_COMPOSER', text: template });
    textareaRef.current?.focus();
  }

  function handleShowMore() {
    appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'promptLibrary' });
  }

  function handleBack() {
    dispatch({ type: 'CLEAR_DRAFT' });
    appDispatch({ type: 'NAVIGATE', view: 'workspace' });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-12 pb-8">
          {/* Persona-aware welcome */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-surface-900 mb-1.5">
              {greeting}, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-surface-500">How can I help you today?</p>
          </div>

          {/* Context hint */}
          {agent && (
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl mb-8">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0', agent.color)}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-700">{agent.name} Workbench</p>
                <p className="text-xs text-surface-500">{agent.description} &middot; AI-powered context for your {agent.name.toLowerCase()} tasks</p>
              </div>
            </div>
          )}

          {!agent && (
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl mb-8">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-700">General Workspace</p>
                <p className="text-xs text-surface-500">Ask anything across all your product workbenches</p>
              </div>
            </div>
          )}

          {/* Quick prompts */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Suggested prompts</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {quickPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePromptClick(p.template)}
                  className="group text-left p-3.5 bg-white border border-surface-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all duration-150"
                >
                  <p className="text-sm font-medium text-surface-700 group-hover:text-brand-700 transition-colors mb-0.5">{p.title}</p>
                  <p className="text-xs text-surface-400 line-clamp-2">{p.description}</p>
                </button>
              ))}
            </div>
            {promptTemplates.length > MAX_QUICK_PROMPTS && (
              <button
                onClick={handleShowMore}
                className="flex items-center gap-1 mt-3 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                More prompts
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Evidence & data source hint */}
          <div className="flex items-start gap-3 px-4 py-3 bg-sky-50/50 border border-sky-200/60 rounded-xl">
            <Database className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-sky-800">Evidence-backed responses</p>
              <p className="text-[11px] text-sky-600 mt-0.5 leading-relaxed">
                Responses are grounded in your internal knowledge base, analytics dashboards, and verified data sources.
                Citations are provided inline so you can trace every claim.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Failed state banner */}
      {sendStatus === 'failed' && failedMessageText && (
        <FailedBanner />
      )}

      {/* Composer */}
      <div className="border-t border-surface-200 bg-white px-6 py-4">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <button className="p-2.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors flex-shrink-0">
            <Paperclip className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={composerText}
              onChange={(e) => dispatch({ type: 'SET_COMPOSER', text: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
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
        <p className="text-[11px] text-surface-400 text-center mt-2 max-w-2xl mx-auto">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function FailedBanner() {
  const { retryMessage, dispatch } = useChat();

  return (
    <div className="px-6">
      <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-3 animate-fade-in">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700 flex-1">Failed to send message. Please try again.</p>
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
  );
}
