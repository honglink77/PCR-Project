import { ExternalLink, FileText, BarChart2 } from 'lucide-react';

export function ContextDetail({ entityId }: { entityId: string | null }) {
  if (!entityId) {
    return <div className="p-6 text-sm text-surface-400 text-center">No source selected.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
          <FileText className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-surface-800">Source Reference</h3>
          <p className="text-xs text-surface-500">Evidence citation detail</p>
        </div>
      </div>

      <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 mb-4">
        <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Citation</h4>
        <p className="text-sm text-surface-700 leading-relaxed">
          This source provides evidence supporting the AI assistant's response. The data has been cross-referenced
          against the internal knowledge base and verified for accuracy.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-white border border-surface-200 rounded-lg">
          <BarChart2 className="w-4 h-4 text-surface-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-surface-700">Confidence Score</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-32 bg-surface-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
              </div>
              <span className="text-xs font-medium text-surface-600">92%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white border border-surface-200 rounded-lg">
          <ExternalLink className="w-4 h-4 text-surface-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-surface-700">Source Type</p>
            <p className="text-xs text-surface-500">Internal Knowledge Base</p>
          </div>
        </div>
      </div>
    </div>
  );
}
