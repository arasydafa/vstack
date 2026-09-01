/**
 * CPU simulation engine for the ROP chain builder.
 * Handles step-by-step execution of ROP gadgets with register tracking.
 *
 * @module engine/CpuEngine
 */

import { CpuState, Register, StackItem } from '../types';
import { EXPLANATIONS } from '../data/explanations';

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
    rip: '0x0',
  },
  stack: [],
  stackItems: [],
  rsp: 0,
  status: 'IDLE',
  instructionPointer: 0,
});

/**
 * Validates whether a string is a valid hexadecimal value (e.g., '0x4005d3').
 *
 * @param val - The string to validate.
 * @returns `true` if the string matches the pattern `0x[0-9a-fA-F]+`.
 */
const isHexValid = (val: string): boolean => {
  return /^0x[0-9a-fA-F]+$/.test(val);
};

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
export const executeStep = (state: CpuState, gadgetMap: Map<string, { instructions: string[] }>): CpuState => {
  if (state.status === 'CRASHED' || state.status === 'SHELL_SPAWNED') {
    return state;
  }

  if (state.rsp >= state.stack.length) {
    return { ...state, status: 'CRASHED', currentInstruction: 'Stack underflow', explanation: EXPLANATIONS.STACK_UNDERFLOW };
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
      return { ...state, status: 'CRASHED', currentInstruction: 'No valid starting address', explanation: EXPLANATIONS.NO_STARTING_ADDRESS };
    }
    return { ...state, status: 'CRASHED', currentInstruction: 'Invalid RIP', explanation: EXPLANATIONS.INVALID_RIP };
  }

  const gadget = gadgetMap.get(currentRip);

  if (!gadget) {
    return { ...state, status: 'CRASHED', currentInstruction: `No gadget at ${currentRip}`, explanation: { ...EXPLANATIONS.NO_GADGET_AT_ADDRESS, whatHappened: EXPLANATIONS.NO_GADGET_AT_ADDRESS.whatHappened.replace('{address}', currentRip) } };
  }

  const instruction = gadget.instructions[state.instructionPointer];

  if (!instruction) {
    return { ...state, status: 'CRASHED', currentInstruction: `No instruction at pointer ${state.instructionPointer}`, explanation: EXPLANATIONS.UNKNOWN_INSTRUCTION };
  }

  const upperInstr = instruction.toUpperCase();

  if (upperInstr.startsWith('POP ')) {
    const regMatch = upperInstr.match(/POP\s+(RAX|RDI|RSI|RIP)/);
    if (!regMatch) {
      return { ...state, status: 'CRASHED', currentInstruction: `Invalid POP target: ${instruction}`, explanation: EXPLANATIONS.UNKNOWN_INSTRUCTION };
    }

    const reg = regMatch[1].toLowerCase() as Register;

    if (state.rsp >= state.stack.length) {
      return { ...state, status: 'CRASHED', currentInstruction: 'Stack underflow on POP', explanation: EXPLANATIONS.STACK_UNDERFLOW_POP };
    }

    const value = state.stack[state.rsp];
    return {
      ...state,
      registers: { ...state.registers, [reg]: value },
      rsp: state.rsp + 1,
      instructionPointer: state.instructionPointer + 1,
      currentInstruction: `${instruction} => ${reg} = ${value}`,
    };
  }

  if (upperInstr === 'RET') {
    if (state.rsp >= state.stack.length) {
      return { ...state, status: 'CRASHED', currentInstruction: 'Stack underflow on RET', explanation: EXPLANATIONS.STACK_UNDERFLOW_RET };
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

  if (upperInstr === 'SYSCALL') {
    const rax = state.registers.rax;
    const rdi = state.registers.rdi;

    if (rax === '0x3b' && rdi === '0x7fff') {
      return {
        ...state,
        status: 'SHELL_SPAWNED',
        currentInstruction: 'SYSCALL => execve("/bin/sh") - SHELL SPAWNED!',
        explanation: EXPLANATIONS.SHELL_SPAWNED
      };
    }

    return {
      ...state,
      status: 'CRASHED',
      currentInstruction: `SYSCALL => Invalid syscall: RAX=${rax}, RDI=${rdi}`,
      explanation: EXPLANATIONS.INVALID_SYSCALL
    };
  }

  return {
    ...state,
    status: 'CRASHED',
    currentInstruction: `Unknown instruction: ${instruction}`,
    explanation: EXPLANATIONS.UNKNOWN_INSTRUCTION
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
