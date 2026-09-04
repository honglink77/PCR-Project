import { Plus, PanelLeftClose, PanelLeft, MoreHorizontal } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { agents } from '@/data/agents';
import { isToday, isYesterday, relativeTime } from '@/utils/time';
import { cn } from '@/utils/cn';
import type { Conversation } from '@/types/chat';

export function Sidebar() {
  const { sidebarCollapsed } = useAppState();
  const appDispatch = useAppDispatch();
  const { state: chatState, dispatch: chatDispatch, openDraft } = useChat();

  const conversations = Object.values(chatState.conversations)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 20);

  const today = conversations.filter((c) => isToday(c.updatedAt));
  const yesterday = conversations.filter((c) => isYesterday(c.updatedAt));
  const older = conversations.filter((c) => !isToday(c.updatedAt) && !isYesterday(c.updatedAt));

  function handleNewChat() {
    openDraft(null);
    appDispatch({ type: 'NAVIGATE', view: 'chat' });
  }

  function handleSelectChat(id: string) {
    chatDispatch({ type: 'SET_ACTIVE_CONVERSATION', id });
    appDispatch({ type: 'NAVIGATE', view: 'chat' });
  }

  function handleAllChats() {
    appDispatch({ type: 'OPEN_RIGHT_RAIL', mode: 'allChats' });
  }

  const collapsed = sidebarCollapsed;
  const isDraftActive = chatState.draft.active;

  return (
    <aside className={cn(
      'flex flex-col bg-surface-50 border-r border-surface-200 overflow-hidden transition-all duration-200',
      collapsed ? 'items-center' : '',
    )}>
      <div className={cn('flex items-center p-3', collapsed ? 'flex-col gap-2' : 'justify-between')}>
        {!collapsed && (
          <button
            onClick={handleNewChat}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex-1 justify-center',
              isDraftActive
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-white bg-brand-600 hover:bg-brand-700',
            )}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        )}
        {collapsed && (
          <button
            onClick={handleNewChat}
            title="New Chat"
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              isDraftActive
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-white bg-brand-600 hover:bg-brand-700',
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => appDispatch({ type: 'TOGGLE_SIDEBAR' })}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-200 transition-colors',
            collapsed && 'mt-1',
          )}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <ChatGroup label="Today" items={today} activeId={chatState.activeConversationId} onSelect={handleSelectChat} />
          <ChatGroup label="Yesterday" items={yesterday} activeId={chatState.activeConversationId} onSelect={handleSelectChat} />
          <ChatGroup label="Older" items={older} activeId={chatState.activeConversationId} onSelect={handleSelectChat} />

          {conversations.length > 0 && (
            <button
              onClick={handleAllChats}
              className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-xs font-medium text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              All chats
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

function ChatGroup({ label, items, activeId, onSelect }: { label: string; items: Conversation[]; activeId: string | null; onSelect: (id: string) => void }) {
  if (items.length === 0) return null;

  const getAgentColor = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.color ?? 'bg-surface-400';
  };

  return (
    <div className="mb-3">
      <h4 className="px-3 py-1.5 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">{label}</h4>
      {items.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group',
            activeId === conv.id ? 'bg-brand-50 text-brand-700' : 'text-surface-700 hover:bg-surface-100',
          )}
        >
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', getAgentColor(conv.agentId))} />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{conv.title}</p>
            <p className="text-[11px] text-surface-400 truncate">{relativeTime(conv.updatedAt)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
