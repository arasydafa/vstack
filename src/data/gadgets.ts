/**
 * Predefined ROP gadgets available in the simulated binary.
 *
 * @module data/gadgets
 */

import { Gadget } from '../types';

/**
 * Array of available ROP gadgets for the simulated binary.
 * Each gadget represents a short instruction sequence at a specific memory address.
 *
 * The simulated binary contains 6 gadgets covering common ROP patterns:
 * - POP instructions for loading values into registers
 * - SYSCALL for triggering system calls
 * - Multi-register POP gadgets for efficiency
 */
export const GADGETS: Gadget[] = [
  {
    id: 'gadget-pop-rdi-ret',
    address: '0x4005d3',
    instructions: ['POP RDI', 'RET'],
    description: 'Pop value into RDI register',
  },
  {
    id: 'gadget-pop-rsi-ret',
    address: '0x4005d9',
    instructions: ['POP RSI', 'RET'],
    description: 'Pop value into RSI register',
  },
  {
    id: 'gadget-pop-rax-ret',
    address: '0x4005e5',
    instructions: ['POP RAX', 'RET'],
    description: 'Pop value into RAX register',
  },
  {
    id: 'gadget-syscall',
    address: '0x4005e9',
    instructions: ['SYSCALL', 'RET'],
    description: 'Execute system call',
  },
  {
    id: 'gadget-pop-rdi-rsi-ret',
    address: '0x4005db',
    instructions: ['POP RDI', 'POP RSI', 'RET'],
    description: 'Pop values into RDI and RSI',
  },
  {
    id: 'gadget-pop-rax-rdi-ret',
    address: '0x4005dd',
    instructions: ['POP RAX', 'POP RDI', 'RET'],
    description: 'Pop values into RAX and RDI',
  },
];

/**
 * Predefined data values for quick insertion onto the stack.
 * These represent common values used in ROP chains.
 */
export const VALUES: { value: string; label: string }[] = [
  { value: '0x7fff', label: '/bin/sh' },
  { value: '0x3b', label: 'execve (59)' },
  { value: '0x0', label: 'NULL' },
  { value: '0x1', label: '1' },
  { value: '0x2', label: '2' },
  { value: '0x3', label: '3' },
];

/**
 * Creates a Map from gadget addresses to their instruction arrays.
 * Used by the CPU engine for O(1) gadget lookups during execution.
 *
 * @returns A Map where keys are hex addresses and values contain instruction arrays.
 *
 * @example
 * ```typescript
 * const map = getGadgetMap();
 * const gadget = map.get('0x4005d3');
 * // { instructions: ['POP RDI', 'RET'] }
 * ```
 */
export const getGadgetMap = (): Map<string, { instructions: string[] }> => {
  const map = new Map<string, { instructions: string[] }>();
  for (const gadget of GADGETS) {
    map.set(gadget.address, { instructions: gadget.instructions });
  }
  return map;
};
