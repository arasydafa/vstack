/**
 * Error and success explanations for CPU execution states.
 * Each explanation provides educational feedback for learning purposes.
 *
 * @module data/explanations
 */

import { StatusExplanation } from '../types';

/**
 * Map of explanation keys to their full educational content.
 *
 * Keys follow the pattern:
 * - `STACK_UNDERFLOW*` - Stack pointer beyond stack bounds
 * - `NO_STARTING_ADDRESS` - First stack value isn't a valid gadget
 * - `INVALID_RIP` - Instruction pointer has invalid value
 * - `NO_GADGET_AT_ADDRESS` - No gadget found at current RIP
 * - `INVALID_SYSCALL` - Syscall registers not set correctly
 * - `UNKNOWN_INSTRUCTION` - Unrecognized instruction encountered
 * - `SHELL_SPAWNED` - Successful execve("/bin/sh") execution
 */
export const EXPLANATIONS: Record<string, StatusExplanation> = {
  STACK_UNDERFLOW: {
    title: 'Stack Underflow',
    whatHappened: 'The CPU tried to read from the stack but RSP (stack pointer) is at or beyond the end of the stack. There are no more values to consume.',
    whyItMatters: 'In ROP, each POP instruction consumes one stack value, and each RET consumes one value (the return address). If you run out of values before your chain completes, execution crashes.',
    howToFix: [
      'Add more values to the stack after your gadgets',
      'Remove extra POP instructions from your chain',
      'Check that each gadget\'s instruction count matches your data layout',
      'Remember: POP RDI; RET consumes 2 values (one for RDI, one for RET)'
    ],
    severity: 'error',
    relatedConcepts: ['stack-memory', 'gadgets']
  },
  NO_STARTING_ADDRESS: {
    title: 'No Valid Starting Address',
    whatHappened: 'The first value on the stack is not a valid gadget address. CPU cannot begin execution without a valid starting point.',
    whyItMatters: 'ROP chains must start with a gadget address. The CPU needs to know where to begin executing. Data values like 0x7fff (/bin/sh) are not executable addresses.',
    howToFix: [
      'Ensure the first item in your stack is a gadget address (e.g., 0x4005d3)',
      'Data values like 0x7fff or 0x3b should come AFTER gadgets that will consume them',
      'Use POP RDI; RET as your first gadget, then place /bin/sh address after it'
    ],
    severity: 'error',
    relatedConcepts: ['rop-basics', 'gadgets']
  },
  INVALID_RIP: {
    title: 'Invalid Instruction Pointer',
    whatHappened: 'The RIP register does not point to a valid hexadecimal address. The CPU cannot decode instructions from an invalid address.',
    whyItMatters: 'RIP (Instruction Pointer) must always point to a valid memory address containing executable code. If RIP becomes corrupted or invalid, the CPU crashes.',
    howToFix: [
      'Ensure the previous gadget ends with RET to load the next address',
      'Check that all addresses in your chain are valid hex values',
      'Verify the gadget at the previous RET address exists in your library'
    ],
    severity: 'error',
    relatedConcepts: ['rop-basics', 'gadgets']
  },
  NO_GADGET_AT_ADDRESS: {
    title: 'Gadget Not Found',
    whatHappened: 'The RIP register points to an address, but no gadget exists at that location in the gadget library.',
    whyItMatters: 'The gadget library contains pre-defined instruction sequences. If RIP points to an address not in the library, the CPU has no instructions to execute.',
    howToFix: [
      'Use a gadget address from the library (0x4005d3 - 0x4005dd)',
      'Verify you typed the address correctly (check for typos)',
      'Use RET gadget to chain to the next address on the stack'
    ],
    severity: 'error',
    relatedConcepts: ['gadgets']
  },
  STACK_UNDERFLOW_POP: {
    title: 'Stack Empty on POP',
    whatHappened: 'A POP instruction tried to read from the stack, but RSP is at the end. No more values available to load into the register.',
    whyItMatters: 'POP reads the value at stack[RSP] and loads it into a register, then increments RSP. Without a value on the stack, POP cannot complete.',
    howToFix: [
      'Add the value you want to load AFTER the gadget address',
      'Example: For POP RDI; RET, stack should be: [gadget_addr] [value_for_rdi]',
      'Remove extra POP instructions if you don\'t need them'
    ],
    severity: 'error',
    relatedConcepts: ['gadgets', 'stack-memory']
  },
  STACK_UNDERFLOW_RET: {
    title: 'Stack Empty on RET',
    whatHappened: 'RET instruction tried to pop the next address from the stack, but RSP is at the end. No return address available.',
    whyItMatters: 'RET pops the value at stack[RSP] into RIP (instruction pointer). This is how gadgets chain together. Without a next address, execution stops.',
    howToFix: [
      'Add a return address after each gadget that ends with RET',
      'If this is the last gadget, you don\'t need RET (but chain will end)',
      'Check your stack layout: every RET needs a following address'
    ],
    severity: 'error',
    relatedConcepts: ['gadgets', 'rop-basics']
  },
  INVALID_SYSCALL: {
    title: 'Invalid Syscall Arguments',
    whatHappened: 'SYSCALL executed but the registers were not set correctly. Expected RAX=0x3b (execve) and RDI=0x7fff (/bin/sh pointer).',
    whyItMatters: 'The execve syscall requires specific register values: RAX must be 0x3b (syscall number for execve), and RDI must point to the "/bin/sh" string.',
    howToFix: [
      'Add POP RAX; RET gadget before SYSCALL',
      'Add 0x3b (execve syscall number) after POP RAX',
      'Add POP RDI; RET gadget before SYSCALL',
      'Add 0x7fff (/bin/sh address) after POP RDI',
      'Order should be: POP RAX → 0x3b → POP RDI → 0x7fff → SYSCALL'
    ],
    severity: 'error',
    relatedConcepts: ['execve', 'calling-convention']
  },
  UNKNOWN_INSTRUCTION: {
    title: 'Unknown Instruction',
    whatHappened: 'The CPU encountered an instruction it doesn\'t recognize. This shouldn\'t happen with valid gadgets.',
    whyItMatters: 'This indicates a problem with the gadget definition or instruction pointer state. The instruction set is limited to POP, RET, and SYSCALL.',
    howToFix: [
      'Check the gadget instructions in the library',
      'Ensure instruction pointer is reset to 0 when entering a new gadget',
      'Reset the CPU and rebuild your chain'
    ],
    severity: 'error',
    relatedConcepts: ['gadgets']
  },
  SHELL_SPAWNED: {
    title: 'Shell Successfully Spawned!',
    whatHappened: 'execve("/bin/sh", NULL, NULL) executed successfully. The SYSCALL instruction triggered the kernel to spawn a shell.',
    whyItMatters: 'You\'ve successfully bypassed NX protection using ROP! The chain correctly set RAX=0x3b (execve) and RDI pointing to "/bin/sh", then triggered the syscall.',
    howToFix: [
      'Congratulations! Your ROP chain worked correctly.',
      'In a real exploit, you would now have interactive shell access.',
      'Try Reset and experiment with different chain variations.'
    ],
    severity: 'success',
    relatedConcepts: ['execve', 'rop-basics']
  }
};
