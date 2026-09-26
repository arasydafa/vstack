/**
 * Curriculum levels for progressive ROP learning.
 * L0 → L4 scaffolding from RIP control to constrained execve.
 *
 * Completion:
 * - L0/L1/L2/L4 are checklist-based (UI, no engine change).
 * - L3 requires engine SHELL_SPAWNED (strict execve).
 *
 * Web-validated:
 * - offset/padding + p64 (pwntools), ROPgadget pop rdi/rsi/rdx/rax + ret align,
 * - x86-64 syscall RDI,RSI,RDX,R10 + execve 59, MOVAPS 16-byte (call only).
 *
 * @module curriculum/levels
 */

import type { StackItem } from '../types';

export interface LevelCheckDef {
  id: string;
  label: string;
}

export interface LevelDef {
  id: string;
  title: string;
  short: string;
  description: string;
  /** Gadget IDs allowed in this level. Empty = all. */
  allowedGadgetIds: string[];
  checks: LevelCheckDef[];
  hints: [string, string, string];
  relatedConcepts: string[];
  exampleChain: Array<{ type: 'gadget' | 'value'; value: string; gadgetId?: string; label?: string }>;
}

export const LEVELS: LevelDef[] = [
  {
    id: 'l0-offset',
    title: 'L0 — Offset & RIP Control',
    short: 'L0 Offset',
    description:
      'Learn how padding reaches RIP. Chain must start with a gadget address, not a data value. In real exploits: cyclic pattern + p64, offset = padding length.',
    allowedGadgetIds: [],
    checks: [
      { id: 'starts-gadget', label: 'Chain starts with a gadget' },
      { id: 'len-2', label: 'Has at least 2 stack items' },
    ],
    hints: [
      'General: vulnerable strcpy/gets overwrites saved RBP then return address. Find offset first, chain second.',
      'Specific: first row must be a gadget like 0x4005d3. Data values (0x3b, 0x601080) go AFTER a POP gadget.',
      'Command: use pwntools cyclic + pattern_offset, payload = b"A"*offset + chain. Here try Load example.',
    ],
    relatedConcepts: ['buffer-overflow', 'stack-memory', 'rop-basics'],
    exampleChain: [
      { type: 'gadget', value: '0x4005d3', gadgetId: 'gadget-pop-rdi-ret', label: 'POP RDI; RET' },
      { type: 'value', value: '0x601080', label: '/bin/sh (.bss)' },
    ],
  },
  {
    id: 'l1-retsled',
    title: 'L1 — RET Sled & Chaining',
    short: 'L1 RET',
    description:
      'Understand RET = pop RIP. Bare RET (0x4005c0) shifts RSP by 8 and fixes 16-byte alignment before call. Required for system(), not raw SYSCALL.',
    allowedGadgetIds: ['gadget-ret', 'gadget-nop-ret', 'gadget-pop-rdi-ret'],
    checks: [
      { id: 'has-ret', label: 'Contains bare RET 0x4005c0' },
      { id: 'len-2', label: 'Has at least 2 stack items' },
    ],
    hints: [
      'General: each RET pops next address into RIP. Extra RET = +8 RSP = alignment fix for MOVAPS.',
      'Specific: add 0x4005c0 anywhere before the final target. See stack-alignment concept.',
      'Command: ROPgadget --binary ./vuln | grep ": ret$" to find bare RET.',
    ],
    relatedConcepts: ['stack-alignment', 'gadgets', 'rop-basics'],
    exampleChain: [
      { type: 'gadget', value: '0x4005c0', gadgetId: 'gadget-ret', label: 'RET' },
      { type: 'gadget', value: '0x4005d3', gadgetId: 'gadget-pop-rdi-ret', label: 'POP RDI; RET' },
      { type: 'value', value: '0x601080', label: '/bin/sh (.bss)' },
    ],
  },
  {
    id: 'l2-onearg',
    title: 'L2 — One Arg (POP RDI)',
    short: 'L2 RDI',
    description:
      'Set first argument per System V ABI: RDI = pointer to "/bin/sh". One step toward ret2system / execve. No RAX needed yet.',
    allowedGadgetIds: ['gadget-pop-rdi-ret', 'gadget-pop-rdi-rsi-ret', 'gadget-ret', 'gadget-syscall'],
    checks: [
      { id: 'rdi-binsh', label: 'RDI points to /bin/sh after run' },
      { id: 'starts-gadget', label: 'Chain starts with a gadget' },
    ],
    hints: [
      'General: functions take args in RDI,RSI,RDX. Syscalls use RDI,RSI,RDX,R10.',
      'Specific: POP RDI then 0x601080, then Step until RDI changes. Watch register diff.',
      'Command: ROPgadget --binary ./vuln | grep "pop rdi".',
    ],
    relatedConcepts: ['calling-convention', 'gadgets', 'execve'],
    exampleChain: [
      { type: 'gadget', value: '0x4005d3', gadgetId: 'gadget-pop-rdi-ret', label: 'POP RDI; RET' },
      { type: 'value', value: '0x601080', label: '/bin/sh (.bss)' },
    ],
  },
  {
    id: 'l3-execve',
    title: 'L3 — Full execve Strict',
    short: 'L3 execve',
    description:
      'Complete ret2syscall: RAX=0x3b, RDI=/bin/sh, RSI=0, RDX=0, then SYSCALL. Engine enforces all four (man syscall(2), syscall_64.tbl).',
    allowedGadgetIds: [],
    checks: [
      { id: 'shell', label: 'Engine reports SHELL_SPAWNED' },
      { id: 'rsi-null', label: 'RSI is NULL (0x0)' },
      { id: 'rdx-null', label: 'RDX is NULL (0x0)' },
    ],
    hints: [
      'General: execve needs 4 regs. Zero unused args — garbage fails with EFAULT.',
      'Specific: order POP RAX→0x3b, POP RDI→0x601080, POP RSI→0x0, POP RDX→0x0, SYSCALL.',
      'Command: pwntools ROP(elf).execve(binsh,0,0) or manual find_gadget pop rax/rdi/rsi/rdx.',
    ],
    relatedConcepts: ['execve', 'calling-convention', 'reading-gadgets'],
    exampleChain: [
      { type: 'gadget', value: '0x4005e5', gadgetId: 'gadget-pop-rax-ret', label: 'POP RAX; RET' },
      { type: 'value', value: '0x3b', label: 'execve (59)' },
      { type: 'gadget', value: '0x4005d3', gadgetId: 'gadget-pop-rdi-ret', label: 'POP RDI; RET' },
      { type: 'value', value: '0x601080', label: '/bin/sh (.bss)' },
      { type: 'gadget', value: '0x4005d9', gadgetId: 'gadget-pop-rsi-ret', label: 'POP RSI; RET' },
      { type: 'value', value: '0x0', label: 'NULL' },
      { type: 'gadget', value: '0x4005e1', gadgetId: 'gadget-pop-rdx-ret', label: 'POP RDX; RET' },
      { type: 'value', value: '0x0', label: 'NULL' },
      { type: 'gadget', value: '0x4005e9', gadgetId: 'gadget-syscall', label: 'SYSCALL; RET' },
    ],
  },
  {
    id: 'l4-constrained',
    title: 'L4 — Constrained (no multi-pop, bad bytes)',
    short: 'L4 Hard',
    description:
      'Same execve goal but single-POP only (no 0x4005db/dd). Plus bad-bytes awareness: strcpy cuts at 0x00, addresses like 0x4005xx contain nulls.',
    allowedGadgetIds: [
      'gadget-pop-rdi-ret',
      'gadget-pop-rsi-ret',
      'gadget-pop-rdx-ret',
      'gadget-pop-rax-ret',
      'gadget-ret',
      'gadget-syscall',
    ],
    checks: [
      { id: 'shell', label: 'Engine reports SHELL_SPAWNED' },
      { id: 'no-multipop', label: 'No multi-pop gadgets used' },
    ],
    hints: [
      'General: real binaries filter bytes (e.g. 0x00 via strcpy). Use --badbytes, find alternative gadgets in libc.',
      'Specific: do not use 0x4005db or 0x4005dd here. Order matters more with single POPs.',
      'Next: learn MOV [rdi],rsi write-what-where to place /bin/sh yourself (memory-writing).',
    ],
    relatedConcepts: ['memory-writing', 'mitigations-map', 'reading-gadgets'],
    exampleChain: [
      { type: 'gadget', value: '0x4005e5', gadgetId: 'gadget-pop-rax-ret', label: 'POP RAX; RET' },
      { type: 'value', value: '0x3b', label: 'execve (59)' },
      { type: 'gadget', value: '0x4005d3', gadgetId: 'gadget-pop-rdi-ret', label: 'POP RDI; RET' },
      { type: 'value', value: '0x601080', label: '/bin/sh (.bss)' },
      { type: 'gadget', value: '0x4005d9', gadgetId: 'gadget-pop-rsi-ret', label: 'POP RSI; RET' },
      { type: 'value', value: '0x0', label: 'NULL' },
      { type: 'gadget', value: '0x4005e1', gadgetId: 'gadget-pop-rdx-ret', label: 'POP RDX; RET' },
      { type: 'value', value: '0x0', label: 'NULL' },
      { type: 'gadget', value: '0x4005e9', gadgetId: 'gadget-syscall', label: 'SYSCALL; RET' },
    ],
  },
];

export const getLevel = (id: string): LevelDef =>
  LEVELS.find((l) => l.id === id) ?? LEVELS[0];

export interface CheckResult {
  id: string;
  label: string;
  done: boolean;
}

const isBinSh = (v: string) => v === '0x601080' || v === '0x7fff';

/** Evaluate checklist for a level from CPU state + stack items. */
export const evalLevelChecks = (
  level: LevelDef,
  params: { status: string; registers: Record<string, string>; items: StackItem[] },
): CheckResult[] => {
  const { status, registers, items } = params;
  return level.checks.map((c) => {
    switch (c.id) {
      case 'starts-gadget':
        return { ...c, done: items.length > 0 && items[0].type === 'gadget' };
      case 'len-2':
        return { ...c, done: items.length >= 2 };
      case 'has-ret':
        return { ...c, done: items.some((it) => it.value === '0x4005c0') };
      case 'rdi-binsh':
        return { ...c, done: isBinSh(registers.rdi ?? '') };
      case 'shell':
        return { ...c, done: status === 'SHELL_SPAWNED' };
      case 'rsi-null':
        return { ...c, done: (registers.rsi ?? '') === '0x0' };
      case 'rdx-null':
        return { ...c, done: (registers.rdx ?? '') === '0x0' };
      case 'no-multipop':
        return {
          ...c,
          done: !items.some((it) => it.value === '0x4005db' || it.value === '0x4005dd'),
        };
      default:
        return { ...c, done: false };
    }
  });
};

export const isLevelComplete = (results: CheckResult[]): boolean =>
  results.length > 0 && results.every((r) => r.done);

const PROGRESS_KEY = 'vstack-level-progress-v1';

export const loadProgress = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}');
  } catch {
    return {};
  }
};

export const saveLevelComplete = (levelId: string) => {
  try {
    const cur = loadProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...cur, [levelId]: true }));
  } catch {
    /* ignore */
  }
};
