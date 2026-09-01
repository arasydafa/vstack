import { useState, memo, useCallback } from 'react';
import { CpuState, StackItem } from '../types';
import { RegisterDisplay } from './RegisterDisplay';
import { StatusExplanation } from './StatusExplanation';
import { ConceptTooltip } from './ConceptTooltip';
import { exportToPwntools, copyToClipboard } from '../utils/exportPwntools';
import { Activity, Play, RotateCcw, Download, Check } from 'lucide-react';

/** Status color mappings - defined outside component to avoid recreation. */
const STATUS_COLORS: Record<CpuState['status'], string> = {
  IDLE: 'text-zinc-400 bg-zinc-800',
  RUNNING: 'text-cyber-blue bg-cyber-blue/10',
  CRASHED: 'text-cyber-red bg-cyber-red/10',
  SHELL_SPAWNED: 'text-cyber-green bg-cyber-green/10',
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
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyber-purple" />
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

        <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50">
          <div className="text-xs text-zinc-500 mb-1">
            <ConceptTooltip conceptId="stack-memory" onConceptClick={onConceptClick}>
              <span className="cursor-help border-b border-dashed border-zinc-500">Stack Pointer (RSP)</span>
            </ConceptTooltip>
          </div>
          <div className="font-mono text-lg text-cyber-green">[{state.rsp}]</div>
        </div>

        <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50">
          <div className="text-xs text-zinc-500 mb-1">Status</div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[state.status]}`}>
            <span className={`w-2 h-2 rounded-full ${
              state.status === 'RUNNING' ? 'bg-cyber-blue animate-pulse' :
              state.status === 'CRASHED' ? 'bg-cyber-red' :
              state.status === 'SHELL_SPAWNED' ? 'bg-cyber-green animate-pulse' :
              'bg-zinc-500'
            }`} />
            {state.status}
          </div>
        </div>

        {state.currentInstruction && (
          <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50">
            <div className="text-xs text-zinc-500 mb-1">Last Instruction</div>
            <div className={`font-mono text-sm ${
              state.status === 'CRASHED' ? 'text-cyber-red' :
              state.status === 'SHELL_SPAWNED' ? 'text-cyber-green' :
              'text-zinc-200'
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
          <button
            onClick={onStep}
            disabled={state.status === 'CRASHED' || state.status === 'SHELL_SPAWNED'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-medium hover:bg-cyber-blue/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            Step
          </button>

          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleExport}
            disabled={items.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyber-green/20 border border-cyber-green text-cyber-green font-medium hover:bg-cyber-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export to Pwntools
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

CpuMonitor.displayName = 'CpuMonitor';
