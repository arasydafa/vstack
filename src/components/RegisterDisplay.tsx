import { memo } from 'react';
import { Register } from '../types';
import { Cpu } from 'lucide-react';

/** Props for the RegisterDisplay component. */
interface RegisterDisplayProps {
  /** Register name (rax, rdi, rsi, rdx, rip). */
  name: Register;
  /** Current hex value of the register. */
  value: string;
  /** Whether to highlight this register as active (green glow). */
  isActive?: boolean;
  /** Whether value changed on last step (diff flash). */
  changed?: boolean;
}

/**
 * Displays a single CPU register with its name and current value.
 *
 * Visual states:
 * - Default: Dark background with muted text
 * - Active (`isActive=true`): Green border, glow effect, highlighted text
 * - Changed (`changed=true`): Success flash + badge, aria-live announcement
 *
 * @param props - RegisterDisplayProps with register name and value.
 * @returns A styled register display element.
 */
export const RegisterDisplay = memo(({ name, value, isActive, changed }: RegisterDisplayProps) => {
  return (
    <div
      aria-live={changed ? 'polite' : undefined}
      className={`flex items-center justify-between p-3 rounded-ot-md border ot-transition ${
        changed
          ? 'border-success bg-success-bg shadow-ot-md'
          : isActive
            ? 'border-navy bg-navy-bg shadow-ot-md'
            : 'border-ot-border bg-ot-surface'
      }`}
    >
      <div className="flex items-center gap-2">
        <Cpu size={16} aria-hidden className={changed || isActive ? 'text-success' : 'text-ot-muted'} />
        <span className="text-xs font-mono uppercase tracking-wider text-ot-muted">{name}</span>
        {changed && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-success text-white" title="Changed on last step">
            changed
          </span>
        )}
      </div>
      <span
        className={`font-mono text-sm font-semibold ${
          changed || isActive ? 'text-success' : 'text-ot-text'
        }`}
      >
        {value}
      </span>
    </div>
  );
});

RegisterDisplay.displayName = 'RegisterDisplay';
