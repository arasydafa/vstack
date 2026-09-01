/**
 * Single register display component showing name and hex value.
 * Highlights when the register is actively being used (e.g., RIP during execution).
 *
 * @module components/RegisterDisplay
 */

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
export const RegisterDisplay = ({ name, value, isActive }: RegisterDisplayProps) => {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
        isActive
          ? 'border-cyber-green bg-cyber-green/10 shadow-lg shadow-cyber-green/20'
          : 'border-zinc-700 bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <Cpu className={`w-4 h-4 ${isActive ? 'text-cyber-green' : 'text-zinc-500'}`} />
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">{name}</span>
      </div>
      <span
        className={`font-mono text-sm font-semibold ${
          isActive ? 'text-cyber-green' : 'text-zinc-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
};
