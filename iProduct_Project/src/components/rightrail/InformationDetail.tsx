import { FileText, Clock, Tag } from 'lucide-react';
import { informationItems } from '@/data/workspace';
import { relativeTime } from '@/utils/time';
import { Badge } from '@/components/ui/Badge';

export function InformationDetail({ entityId }: { entityId: string | null }) {
  const item = informationItems.find((i) => i.id === entityId);

  if (!item) {
    return <div className="p-6 text-sm text-surface-400 text-center">Select an information item to view details.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-surface-800">{item.title}</h3>
          <p className="text-xs text-surface-500 mt-0.5">{item.source}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-surface-500">
          <Clock className="w-3.5 h-3.5" />
          {relativeTime(item.updatedAt)}
        </div>
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-surface-400" />
          <Badge label={item.category} />
        </div>
      </div>

      <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Summary</h4>
        <p className="text-sm text-surface-700 leading-relaxed">{item.snippet}</p>
      </div>
    </div>
  );
}
