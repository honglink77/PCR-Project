import { useState } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { useChat } from '@/context/ChatContext';
import { useAppDispatch } from '@/context/AppContext';
import { getAgent } from '@/data/agents';
import { relativeTime } from '@/utils/time';
import { fuzzyMatch } from '@/utils/search';
import { cn } from '@/utils/cn';

export function AllChatsPanel() {
  const [search, setSearch] = useState('');
  const { state, dispatch: chatDispatch } = useChat();
  const appDispatch = useAppDispatch();

  const conversations = Object.values(state.conversations)
    .filter((c) => fuzzyMatch(c.title, search))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  function handleSelect(id: string) {
    chatDispatch({ type: 'SET_ACTIVE_CONVERSATION', id });
    appDispatch({ type: 'NAVIGATE', view: 'chat' });
  }

  return (
    <div className="p-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search conversations..." className="mb-4" />
      <p className="text-xs text-surface-400 mb-3">{conversations.length} conversations</p>
      <div className="space-y-1">
        {conversations.map((conv) => {
          const agent = getAgent(conv.agentId);
          return (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={cn(
                'w-full text-left px-3 py-3 rounded-lg hover:bg-surface-50 transition-colors group',
                state.activeConversationId === conv.id && 'bg-brand-50',
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', agent?.color ?? 'bg-surface-400')} />
                <p className="text-sm font-medium text-surface-800 truncate">{conv.title}</p>
              </div>
              <div className="flex items-center justify-between pl-4">
                <span className="text-xs text-surface-500">{agent?.name ?? 'Unknown'}</span>
                <span className="text-[11px] text-surface-400">{relativeTime(conv.updatedAt)}</span>
              </div>
              {conv.messages.length > 0 && (
                <p className="text-xs text-surface-400 pl-4 mt-1 truncate">{conv.messages[conv.messages.length - 1].content}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
