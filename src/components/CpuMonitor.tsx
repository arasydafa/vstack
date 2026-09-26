import { useState, useEffect, memo, useCallback, useRef, useMemo } from 'react';
import { CpuState, StackItem } from '../types';
import { RegisterDisplay } from './RegisterDisplay';
import { StatusExplanation } from './StatusExplanation';
import { ConceptTooltip } from './ConceptTooltip';
import { exportToPwntools, copyToClipboard } from '../utils/exportPwntools';
import { rspAddr } from '../utils/memory';
import { Activity, Play, Pause, RotateCcw, Download, Check, Undo2, Eye } from 'lucide-react';
import { Badge, Button, Slider, Modal, CodeBlock, Input, Alert } from '@omega-os/ui';
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
  /** Callback to undo last step. */
  onUndo: () => void;
  /** Whether undo is available. */
  canUndo: boolean;
  /** Number of steps taken (history length). */
  stepsTaken: number;
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
export const CpuMonitor = memo(({ state, items, onStep, onReset, onUndo, canUndo, stepsTaken, onConceptClick }: CpuMonitorProps) => {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(4); // steps per second
  const [offset, setOffset] = useState(40);
  const [previewOpen, setPreviewOpen] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;

  const exportCode = useMemo(() => exportToPwntools(items, offset), [items, offset]);

  const isTerminal = state.status === 'CRASHED' || state.status === 'SHELL_SPAWNED';

  useEffect(() => {
    if (!running) return;
    if (isTerminal) {
      setRunning(false);
      return;
    }
    const id = window.setInterval(() => {
      if (runningRef.current) onStep();
    }, Math.max(100, Math.round(1000 / speed)));
    return () => window.clearInterval(id);
  }, [running, speed, isTerminal, onStep]);

  useEffect(() => {
    if (isTerminal) setRunning(false);
  }, [isTerminal]);

  // Register diff: compare with previous registers to flash changed ones.
  const prevRegs = useRef(state.registers);
  const changed = {
    rax: prevRegs.current.rax !== state.registers.rax,
    rdi: prevRegs.current.rdi !== state.registers.rdi,
    rsi: prevRegs.current.rsi !== state.registers.rsi,
    rdx: prevRegs.current.rdx !== state.registers.rdx,
    rip: prevRegs.current.rip !== state.registers.rip,
  };
  useEffect(() => {
    prevRegs.current = state.registers;
  }, [state.registers]);

  const handleExport = useCallback(async () => {
    const success = await copyToClipboard(exportCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [exportCode]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ot-border">
        <h2 className="text-lg font-semibold text-ot-text flex items-center gap-2">
          <Activity size={20} aria-hidden className="text-navy-text" />
          CPU Monitor
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2" aria-live="polite" aria-label="Registers">
          <RegisterDisplay name="rax" value={state.registers.rax} changed={changed.rax} />
          <RegisterDisplay name="rdi" value={state.registers.rdi} changed={changed.rdi} />
          <RegisterDisplay name="rsi" value={state.registers.rsi} changed={changed.rsi} />
          <RegisterDisplay name="rdx" value={state.registers.rdx} changed={changed.rdx} />
          <RegisterDisplay
            name="rip"
            value={state.registers.rip}
            isActive={state.status === 'RUNNING'}
            changed={changed.rip}
          />
        </div>

        <div className="p-3 rounded-ot-md border border-ot-border bg-ot-surface">
          <div className="text-xs text-ot-muted mb-1">
            <ConceptTooltip conceptId="stack-memory" onConceptClick={onConceptClick}>
              <span className="cursor-help border-b border-dashed border-ot-muted">Stack Pointer (RSP)</span>
            </ConceptTooltip>
          </div>
          <div className="font-mono text-lg text-success">[{state.rsp}]</div>
          <div className="font-mono text-xs text-ot-muted">{rspAddr(state.rsp)} · RSP += 8 per POP/RET</div>
          <div className="mt-1 text-xs text-ot-muted" aria-live="polite">Steps taken: {stepsTaken}</div>
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
          <div className="flex gap-2">
            <Button
              onClick={onStep}
              disabled={isTerminal}
              icon={<Play size={16} aria-hidden />}
              className="flex-1"
            >
              Step
            </Button>
            <Button
              onClick={() => setRunning((r) => !r)}
              disabled={isTerminal && !running}
              variant="solid"
              icon={running ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              className="flex-1"
              aria-pressed={running}
            >
              {running ? 'Pause' : 'Run'}
            </Button>
          </div>

          <Slider label="Run speed (steps/sec)" min={1} max={10} step={1} value={speed} onChange={setSpeed} />

          <div className="flex gap-2">
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              variant="secondary"
              icon={<Undo2 size={16} aria-hidden />}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => { setRunning(false); onReset(); }}
              variant="solid"
              icon={<RotateCcw size={16} aria-hidden />}
              className="flex-1"
            >
              Reset
            </Button>
          </div>

          <Input
            label="Exploit offset (padding to RIP)"
            helper="Find with cyclic + pattern_offset. Default 40 = 32 buf + 8 RBP."
            type="number"
            min={0}
            max={512}
            value={offset}
            onChange={(e) => setOffset(Math.max(0, Number(e.target.value) || 0))}
          />

          <Alert tone="info" title="Alignment note.">
            Raw SYSCALL needs no 16-byte align. Extra RET matters for system()/call (MOVAPS). See stack-alignment concept.
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => setPreviewOpen(true)}
              disabled={items.length === 0}
              variant="solid"
              icon={<Eye size={16} aria-hidden />}
              className="flex-1"
            >
              Preview
            </Button>
            <Button
              onClick={handleExport}
              disabled={items.length === 0}
              variant="secondary"
              icon={copied ? <Check size={16} aria-hidden /> : <Download size={16} aria-hidden />}
              className="flex-1"
            >
              {copied ? 'Copied!' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Pwntools export (offset ${offset})`}
        footer={
          <Button size="sm" onClick={handleExport} icon={copied ? <Check size={14} aria-hidden /> : <Download size={14} aria-hidden />}>
            {copied ? 'Copied!' : 'Copy code'}
          </Button>
        }
      >
        <div className="max-w-[560px]">
          <CodeBlock code={exportCode} language="python" maxHeight={420} />
        </div>
      </Modal>
    </div>
  );
});

CpuMonitor.displayName = 'CpuMonitor';
