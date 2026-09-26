/**
 * CPU simulation engine for the ROP chain builder.
 * Handles step-by-step execution of ROP gadgets with register tracking.
 *
 * @module engine/CpuEngine
 */

import { CpuState, StackItem } from '../types';
import { isHexAddress } from '../types';
import { EXPLANATIONS } from '../data/explanations';
import { parseInstruction } from './isa';
import { checkExecve } from './syscalls';

type ExplanationRegistry = typeof EXPLANATIONS;

const isHexValid = (val: string): boolean => isHexAddress(val);

/**
 * Creates the default initial CPU state with all registers zeroed.
 *
 * @returns A fresh CpuState with zeroed registers, empty stack, and IDLE status.
 */
const createInitialState = (): CpuState => ({
  registers: {
    rax: '0x0',
    rdi: '0x0',
    rsi: '0x0',
    rdx: '0x0',
    rip: '0x0',
  },
  stack: [],
  stackItems: [],
  rsp: 0,
  status: 'IDLE',
  instructionPointer: 0,
});

/**
 * Executes a single CPU step based on the current state and gadget map.
 *
 * This is the core simulation function. It reads the current RIP, looks up
 * the gadget at that address, and executes the next instruction (POP, RET, or SYSCALL).
 *
 * @param state - The current CPU state.
 * @param gadgetMap - Map of gadget addresses to their instruction arrays.
 * @returns The updated CPU state after executing one instruction.
 *
 * @example
 * ```typescript
 * const gadgetMap = getGadgetMap();
 * let state = getInitialCpuState(['0x4005d3', '0x7fff', '0x4005d9']);
 * state = executeStep(state, gadgetMap); // Loads first gadget into RIP
 * state = executeStep(state, gadgetMap); // Executes POP RDI
 * ```
 */
export const executeStep = (
  state: CpuState,
  gadgetMap: Map<string, { instructions: string[] }>,
  explanations: ExplanationRegistry = EXPLANATIONS,
): CpuState => {
  if (state.status === 'CRASHED' || state.status === 'SHELL_SPAWNED') {
    return state;
  }

  if (state.rsp >= state.stack.length) {
    return { ...state, status: 'CRASHED', currentInstruction: 'Stack underflow', explanation: explanations.STACK_UNDERFLOW };
  }

  const currentRip = state.registers.rip;

  if (currentRip === '0x0' || !isHexValid(currentRip)) {
    if (state.status === 'IDLE') {
      const firstValue = state.stack[state.rsp];
      if (firstValue && isHexValid(firstValue)) {
        return {
          ...state,
          registers: { ...state.registers, rip: firstValue },
          rsp: state.rsp + 1,
          status: 'RUNNING',
          currentInstruction: `Loading first gadget: ${firstValue}`,
        };
      }
      return { ...state, status: 'CRASHED', currentInstruction: 'No valid starting address', explanation: explanations.NO_STARTING_ADDRESS };
    }
    return { ...state, status: 'CRASHED', currentInstruction: 'Invalid RIP', explanation: explanations.INVALID_RIP };
  }

  const gadget = gadgetMap.get(currentRip);

  if (!gadget) {
    return { ...state, status: 'CRASHED', currentInstruction: `No gadget at ${currentRip}`, explanation: { ...explanations.NO_GADGET_AT_ADDRESS, whatHappened: explanations.NO_GADGET_AT_ADDRESS.whatHappened.replace('{address}', currentRip) } };
  }

  const raw = gadget.instructions[state.instructionPointer];

  if (!raw) {
    return { ...state, status: 'CRASHED', currentInstruction: `No instruction at pointer ${state.instructionPointer}`, explanation: explanations.UNKNOWN_INSTRUCTION };
  }

  const instr = parseInstruction(raw);

  if (instr.op === 'POP') {
    // RIP cannot be POPed directly — only via RET. Educational guard.
    if (instr.reg === 'rip') {
      return { ...state, status: 'CRASHED', currentInstruction: `Invalid POP target: ${raw}`, explanation: explanations.POP_RIP_INVALID };
    }

    if (state.rsp >= state.stack.length) {
      return { ...state, status: 'CRASHED', currentInstruction: 'Stack underflow on POP', explanation: explanations.STACK_UNDERFLOW_POP };
    }

    const value = state.stack[state.rsp];
    return {
      ...state,
      registers: { ...state.registers, [instr.reg]: value },
      rsp: state.rsp + 1,
      instructionPointer: state.instructionPointer + 1,
      currentInstruction: `${raw} => ${instr.reg} = ${value}`,
    };
  }

  if (instr.op === 'RET') {
    if (state.rsp >= state.stack.length) {
      return { ...state, status: 'CRASHED', currentInstruction: 'Stack underflow on RET', explanation: explanations.STACK_UNDERFLOW_RET };
    }

    const returnAddr = state.stack[state.rsp];
    return {
      ...state,
      registers: { ...state.registers, rip: returnAddr },
      rsp: state.rsp + 1,
      instructionPointer: 0,
      currentInstruction: `RET => RIP = ${returnAddr}`,
    };
  }

  if (instr.op === 'SYSCALL') {
    const result = checkExecve({
      rax: state.registers.rax,
      rdi: state.registers.rdi,
      rsi: state.registers.rsi,
      rdx: state.registers.rdx,
    });

    if (result.ok) {
      return {
        ...state,
        status: 'SHELL_SPAWNED',
        currentInstruction: 'SYSCALL => execve("/bin/sh", NULL, NULL) - SHELL SPAWNED!',
        explanation: explanations.SHELL_SPAWNED
      };
    }

    if (result.reason === 'RAX') {
      return {
        ...state,
        status: 'CRASHED',
        currentInstruction: `SYSCALL => Invalid syscall: RAX=${state.registers.rax} (expected 0x3b execve)`,
        explanation: explanations.INVALID_SYSCALL
      };
    }

    if (result.reason === 'RDI') {
      return {
        ...state,
        status: 'CRASHED',
        currentInstruction: `SYSCALL => Invalid RDI=${state.registers.rdi} (expected 0x601080 or 0x7fff)`,
        explanation: explanations.INVALID_RDI
      };
    }

    if (result.reason === 'RSI') {
      return {
        ...state,
        status: 'CRASHED',
        currentInstruction: `SYSCALL => Invalid RSI=${state.registers.rsi} (expected 0x0 NULL argv)`,
        explanation: explanations.RSI_NOT_NULL
      };
    }

    return {
      ...state,
      status: 'CRASHED',
      currentInstruction: `SYSCALL => Invalid RDX=${state.registers.rdx} (expected 0x0 NULL envp)`,
      explanation: explanations.RDX_NOT_NULL
    };
  }

  if (instr.op === 'NOP') {
    return {
      ...state,
      instructionPointer: state.instructionPointer + 1,
      currentInstruction: 'NOP => (no operation)',
    };
  }

  return {
    ...state,
    status: 'CRASHED',
    currentInstruction: `Unknown instruction: ${raw}`,
    explanation: explanations.UNKNOWN_INSTRUCTION
  };
};

/**
 * Creates the initial CPU state with a pre-loaded stack.
 *
 * @param stack - Array of hex string values to load onto the stack.
 * @param stackItems - Optional array of StackItem objects for UI display.
 * @returns A CpuState with the stack populated and all registers zeroed.
 *
 * @example
 * ```typescript
 * const state = getInitialCpuState(['0x4005d3', '0x7fff', '0x4005d9']);
 * // state.stack === ['0x4005d3', '0x7fff', '0x4005d9']
 * ```
 */
export const getInitialCpuState = (stack: string[], stackItems: StackItem[] = []): CpuState => ({
  ...createInitialState(),
  stack,
  stackItems,
});

export { createInitialState };
