/**
 * Minimal ISA model for VStack CPU (Fase 5 refactor).
 * Replaces stringly-typed startsWith/match scattered in CpuEngine.
 *
 * @module engine/isa
 */

import type { Register } from '../types';

export type Instruction =
  | { op: 'POP'; reg: Register }
  | { op: 'RET' }
  | { op: 'SYSCALL' }
  | { op: 'NOP' }
  | { op: 'UNKNOWN'; raw: string };

export const parseInstruction = (raw: string): Instruction => {
  const up = raw.trim().toUpperCase();
  if (up === 'RET') return { op: 'RET' };
  if (up === 'SYSCALL') return { op: 'SYSCALL' };
  if (up === 'NOP') return { op: 'NOP' };
  const m = up.match(/^POP\s+(RAX|RDI|RSI|RDX|RIP)$/);
  if (m) return { op: 'POP', reg: m[1].toLowerCase() as Register };
  return { op: 'UNKNOWN', raw };
};
