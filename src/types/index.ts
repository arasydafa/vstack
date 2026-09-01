/**
 * Type definitions for the VStack (Visual ROP Chain Builder) application.
 *
 * @module types
 */

/** Supported CPU register names in the x86-64 simulated environment. */
export type Register = 'rax' | 'rdi' | 'rsi' | 'rip';

/**
 * Educational explanation displayed when the CPU encounters an error or succeeds.
 * Provides structured feedback for learning purposes.
 */
export interface StatusExplanation {
  /** Short title of the error or success state. */
  title: string;
  /** Description of what happened during execution. */
  whatHappened: string;
  /** Why this error/success is significant for binary exploitation. */
  whyItMatters: string;
  /** Step-by-step instructions on how to fix the issue. */
  howToFix: string[];
  /** Severity level determining the UI color and icon. */
  severity: 'info' | 'warning' | 'error' | 'success';
  /** IDs of related educational concepts for "Learn More" links. */
  relatedConcepts: string[];
}

/**
 * Educational concept covering ROP fundamentals, techniques, or security topics.
 * Used in the Theory sidebar and Concept modal.
 */
export interface Concept {
  /** Unique identifier for the concept (e.g., 'stack-memory', 'rop-basics'). */
  id: string;
  /** Display title of the concept. */
  title: string;
  /** Category for grouping in the Theory sidebar. */
  category: 'fundamentals' | 'rop-technique' | 'security';
  /** Short summary shown in the concept list. */
  summary: string;
  /** Full educational content with detailed explanations. */
  content: string;
  /** ASCII art diagrams illustrating the concept. */
  diagrams: string[];
  /** Key takeaways displayed as bullet points. */
  keyPoints: string[];
  /** Code examples with titles demonstrating the concept. */
  examples: { title: string; code: string }[];
  /** IDs of related concepts for cross-referencing. */
  relatedConcepts: string[];
}

/**
 * Complete state of the simulated CPU at any point during execution.
 * Tracks registers, stack, instruction pointer, and status.
 */
export interface CpuState {
  /** Current values of simulated registers (rax, rdi, rsi, rip). */
  registers: Record<Register, string>;
  /** Stack contents as an array of hex string values (used by CPU engine). */
  stack: string[];
  /** Full stack items with metadata (used by UI for display and drag-and-drop). */
  stackItems: StackItem[];
  /** Current stack pointer index into the stack array. */
  rsp: number;
  /** Execution status: IDLE, RUNNING, CRASHED, or SHELL_SPAWNED. */
  status: 'IDLE' | 'RUNNING' | 'CRASHED' | 'SHELL_SPAWNED';
  /** Description of the last executed instruction (shown in CPU Monitor). */
  currentInstruction?: string;
  /** Index into the current gadget's instruction array. */
  instructionPointer: number;
  /** Educational explanation for the current status (shown in StatusExplanation). */
  explanation?: StatusExplanation;
}

/**
 * A ROP gadget available in the simulated binary.
 * Each gadget represents a short instruction sequence found at a specific address.
 */
export interface Gadget {
  /** Unique identifier for the gadget (e.g., 'gadget-pop-rdi-ret'). */
  id: string;
  /** Memory address of the gadget in hex format (e.g., '0x4005d3'). */
  address: string;
  /** Assembly instructions this gadget executes (e.g., ['POP RDI', 'RET']). */
  instructions: string[];
  /** Human-readable description of what the gadget does. */
  description: string;
}

/**
 * An item on the visual stack canvas.
 * Can be either a ROP gadget or a data value.
 */
export interface StackItem {
  /** Unique identifier for this stack item instance. */
  id: string;
  /** Whether this item is a gadget or a raw data value. */
  type: 'gadget' | 'value';
  /** Hex string value stored on the stack (e.g., '0x4005d3' or '0x7fff'). */
  value: string;
  /** ID linking to the Gadget definition (only for gadget type items). */
  gadgetId?: string;
  /** Human-readable label for display (e.g., 'POP RDI; RET' or '/bin/sh'). */
  label?: string;
}

/**
 * Discriminated union of all possible CPU state transitions.
 * Used with useReducer in the useCpu hook.
 */
export type CpuAction =
  | { type: 'STEP' }
  | { type: 'RESET' }
  | { type: 'SET_STACK'; payload: StackItem[] }
  | { type: 'INSERT_ITEM'; payload: { item: StackItem; index: number } }
  | { type: 'REMOVE_ITEM'; payload: { index: number } }
  | { type: 'REORDER_STACK'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_STATUS'; payload: CpuState['status'] };
