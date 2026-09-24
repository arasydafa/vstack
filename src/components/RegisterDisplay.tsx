import { memo } from 'react';
import { Register } from '../types';
import { Cpu } from 'lucide-react';

/** Props for the RegisterDisplay component. */
interface RegisterDisplayProps {
  /** Register name (rax, rdi, rsi, rip). */
  name: Register;
  /** Current hex value of the register. */
  value: string;
  /** Whether to highlight this register as active (green glow). */
  isActive?: boolean;
}

/**
 * Displays a single CPU register with its name and current value.
 *
 * Visual states:
 * - Default: Dark background with muted text
 * - Active (`isActive=true`): Green border, glow effect, highlighted text
 *
 * @param props - RegisterDisplayProps with register name and value.
 * @returns A styled register display element.
 */
export const RegisterDisplay = memo(({ name, value, isActive }: RegisterDisplayProps) => {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-ot-md border ot-transition ${
        isActive
          ? 'border-navy bg-navy-bg shadow-ot-md'
          : 'border-ot-border bg-ot-surface'
      }`}
    >
      <div className="flex items-center gap-2">
        <Cpu size={16} aria-hidden className={isActive ? 'text-success' : 'text-ot-muted'} />
        <span className="text-xs font-mono uppercase tracking-wider text-ot-muted">{name}</span>
      </div>
      <span
        className={`font-mono text-sm font-semibold ${
          isActive ? 'text-success' : 'text-ot-text'
        }`}
      >
        {value}
      </span>
    </div>
  );
});

RegisterDisplay.displayName = 'RegisterDisplay';
