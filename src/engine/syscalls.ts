/**
 * Syscall table + execve goal predicate (Fase 5).
 * Extracted from CpuEngine so new syscalls/levels don't require editing engine core.
 * Web-validated: x86-64 RAX=num, args RDI,RSI,RDX,R10,R8,R9; execve=59 (0x3b).
 *
 * @module engine/syscalls
 */

export const SYSCALL_NUMBERS = {
  read: '0x0',
  write: '0x1',
  execve: '0x3b',
  exit: '0x3c',
} as const;

/** Addresses accepted as "/bin/sh" pointer (realistic .bss + legacy simplified). */
export const BINSH_ADDRESSES = ['0x601080', '0x7fff'] as const;

export interface ExecveRegs {
  rax: string;
  rdi: string;
  rsi: string;
  rdx: string;
}

export type ExecveCheck =
  | { ok: true }
  | { ok: false; reason: 'RAX' | 'RDI' | 'RSI' | 'RDX' };

export const checkExecve = (r: ExecveRegs): ExecveCheck => {
  if (r.rax !== SYSCALL_NUMBERS.execve) return { ok: false, reason: 'RAX' };
  if (!(BINSH_ADDRESSES as readonly string[]).includes(r.rdi)) return { ok: false, reason: 'RDI' };
  if (r.rsi !== '0x0') return { ok: false, reason: 'RSI' };
  if (r.rdx !== '0x0') return { ok: false, reason: 'RDX' };
  return { ok: true };
};
