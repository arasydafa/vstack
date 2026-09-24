import { useState, memo, useCallback } from 'react';
import { CpuState, StackItem } from '../types';
import { RegisterDisplay } from './RegisterDisplay';
import { StatusExplanation } from './StatusExplanation';
import { ConceptTooltip } from './ConceptTooltip';
import { exportToPwntools, copyToClipboard } from '../utils/exportPwntools';
import { Activity, Play, RotateCcw, Download, Check } from 'lucide-react';
import { Badge, Button } from '@omega-os/ui';
import type { BadgeTone } from '@omega-os/ui';

/** Status tone mappings - defined outside component to avoid recreation. */
const STATUS_TONES: Record<CpuState['status'], BadgeTone> = {
  IDLE: 'grey',
  RUNNING: 'info',
  CRASHED: 'danger',
  SHELL_SPAWNED: 'success',
};

/** Status dot colors - defined outside component to avoid recreation. */
const STATUS_DOTS: Record<CpuState['status'], string> = {
  IDLE: 'bg-ot-muted',
  RUNNING: 'bg-info animate-pulse',
  CRASHED: 'bg-danger',
  SHELL_SPAWNED: 'bg-success animate-pulse',
};

/** Props for the CpuMonitor component. */
interface CpuMonitorProps {
  /** Current CPU state to display. */
  state: CpuState;
  /** Current stack items for export. */
  items: StackItem[];
  /** Callback to execute one CPU step. */
  onStep: () => void;
  /** Callback to reset CPU state. */
  onReset: () => void;
  /** Callback when a concept is clicked for details. */
  onConceptClick: (conceptId: string) => void;
}

/**
 * Right panel displaying CPU register state and execution controls.
 *
 * Features:
 * - Register displays for RAX, RDI, RSI, RIP
 * - Stack Pointer (RSP) indicator
 * - Current execution status (IDLE/RUNNING/CRASHED/SHELL_SPAWNED)
 * - Last instruction display
 * - Educational explanation panel (StatusExplanation)
 * - Step, Reset, and Export to Pwntools buttons
 *
 * @param props - CpuMonitorProps with state, items, and callbacks.
 * @returns A scrollable panel with register displays and control buttons.
 */
export const CpuMonitor = memo(({ state, items, onStep, onReset, onConceptClick }: CpuMonitorProps) => {
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(async () => {
    const code = exportToPwntools(items);
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [items]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ot-border">
        <h2 className="text-lg font-semibold text-ot-text flex items-center gap-2">
          <Activity size={20} aria-hidden className="text-navy-text" />
          CPU Monitor
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <RegisterDisplay name="rax" value={state.registers.rax} />
          <RegisterDisplay name="rdi" value={state.registers.rdi} />
          <RegisterDisplay name="rsi" value={state.registers.rsi} />
          <RegisterDisplay
            name="rip"
            value={state.registers.rip}
            isActive={state.status === 'RUNNING'}
          />
        </div>

        <div className="p-3 rounded-ot-md border border-ot-border bg-ot-surface">
          <div className="text-xs text-ot-muted mb-1">
            <ConceptTooltip conceptId="stack-memory" onConceptClick={onConceptClick}>
              <span className="cursor-help border-b border-dashed border-ot-muted">Stack Pointer (RSP)</span>
            </ConceptTooltip>
          </div>
          <div className="font-mono text-lg text-success">[{state.rsp}]</div>
        </div>

        <div className="p-3 rounded-ot-md border border-ot-border bg-ot-surface">
          <div className="text-xs text-ot-muted mb-1">Status</div>
          <Badge tone={STATUS_TONES[state.status]}>
            <span className={`w-2 h-2 rounded-full ${STATUS_DOTS[state.status]}`} aria-hidden />
            {state.status}
          </Badge>
        </div>

        {state.currentInstruction && (
          <div className="p-3 rounded-ot-md border border-ot-border bg-ot-surface">
            <div className="text-xs text-ot-muted mb-1">Last Instruction</div>
            <div className={`font-mono text-sm ${
              state.status === 'CRASHED' ? 'text-danger' :
              state.status === 'SHELL_SPAWNED' ? 'text-success' :
              'text-ot-text'
            }`}>
              {state.currentInstruction}
            </div>
          </div>
        )}

        {state.explanation && (
          <StatusExplanation 
            explanation={state.explanation}
            onConceptClick={onConceptClick}
          />
        )}

        <div className="space-y-2">
          <Button
            onClick={onStep}
            disabled={state.status === 'CRASHED' || state.status === 'SHELL_SPAWNED'}
            icon={<Play size={16} aria-hidden />}
            className="w-full"
          >
            Step
          </Button>

          <Button
            onClick={onReset}
            variant="ghost"
            icon={<RotateCcw size={16} aria-hidden />}
            className="w-full"
          >
            Reset
          </Button>

          <Button
            onClick={handleExport}
            disabled={items.length === 0}
            variant="secondary"
            icon={copied ? <Check size={16} aria-hidden /> : <Download size={16} aria-hidden />}
            className="w-full"
          >
            {copied ? 'Copied!' : 'Export to Pwntools'}
          </Button>
        </div>
      </div>
    </div>
  );
});

CpuMonitor.displayName = 'CpuMonitor';
