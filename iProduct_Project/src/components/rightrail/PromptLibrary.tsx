import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { useChat } from '@/context/ChatContext';
import { useAppDispatch } from '@/context/AppContext';
import { promptTemplates } from '@/data/prompts';
import { fuzzyMatch } from '@/utils/search';

export function PromptLibrary() {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { dispatch: chatDispatch } = useChat();
  const appDispatch = useAppDispatch();

  const filtered = promptTemplates.filter(
    (p) => fuzzyMatch(p.title, search) || fuzzyMatch(p.description, search) || fuzzyMatch(p.category, search),
  );

  function handleUse(template: string) {
    chatDispatch({ type: 'SET_COMPOSER', text: template });
    appDispatch({ type: 'CLOSE_RIGHT_RAIL' });
  }

  function handleCopy(id: string, template: string) {
    navigator.clipboard.writeText(template);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="p-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search prompts..." className="mb-4" />
      <p className="text-xs text-surface-400 mb-3">{filtered.length} prompt templates</p>
      <div className="space-y-3">
        {filtered.map((prompt) => (
          <div key={prompt.id} className="bg-surface-50 border border-surface-200 rounded-lg p-4 hover:border-brand-300 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-sm font-semibold text-surface-800">{prompt.title}</h4>
                <p className="text-xs text-surface-500 mt-0.5">{prompt.description}</p>
              </div>
              <Badge label={prompt.category} />
            </div>
            <p className="text-xs text-surface-600 bg-white border border-surface-100 rounded px-3 py-2 mb-3 font-mono leading-relaxed">{prompt.template}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleUse(prompt.template)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors"
              >
                Use in Chat
              </button>
              <button
                onClick={() => handleCopy(prompt.id, prompt.template)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-surface-600 bg-white border border-surface-200 rounded-md hover:bg-surface-50 transition-colors"
              >
                {copiedId === prompt.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedId === prompt.id ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
