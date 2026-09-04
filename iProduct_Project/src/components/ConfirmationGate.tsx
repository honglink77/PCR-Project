import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { cn } from '@/utils/cn';

const riskColors = {
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
};

export function ConfirmationGate() {
  const { confirmationGate } = useAppState();
  const dispatch = useAppDispatch();

  function handleConfirm() {
    confirmationGate.onConfirm?.();
    dispatch({ type: 'CLOSE_CONFIRMATION' });
  }

  const risk = riskColors[confirmationGate.riskLevel];
  const RiskIcon = confirmationGate.riskLevel === 'critical' ? ShieldAlert
    : confirmationGate.riskLevel === 'high' ? AlertTriangle
    : ShieldCheck;

  return (
    <Modal open={confirmationGate.open} onClose={() => dispatch({ type: 'CLOSE_CONFIRMATION' })}>
      <div className="p-6">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', risk.bg, risk.border, 'border')}>
          <RiskIcon className={cn('w-6 h-6', risk.icon)} />
        </div>

        <h3 className="text-lg font-semibold text-surface-900 mb-2">{confirmationGate.title || 'Confirm Action'}</h3>
        <p className="text-sm text-surface-600 leading-relaxed mb-6">{confirmationGate.description || 'Are you sure you want to proceed?'}</p>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" onClick={() => dispatch({ type: 'CLOSE_CONFIRMATION' })}>Cancel</Button>
          <Button variant={confirmationGate.riskLevel === 'critical' ? 'danger' : 'primary'} onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
