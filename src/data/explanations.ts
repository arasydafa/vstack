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
      'Use a gadget address from the library (e.g., 0x4005d3, 0x4005e1, 0x4005c0)',
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
    whatHappened: 'SYSCALL executed but RAX is not 0x3b (execve). Current registers do not select the execve syscall.',
    whyItMatters: 'x86-64 Linux selects the syscall via RAX. execve is 59 (0x3b). RDI/RSI/RDX are arguments, not the selector. See: man syscall(2), syscall_64.tbl.',
    howToFix: [
      'Add POP RAX; RET gadget before SYSCALL',
      'Add 0x3b (execve syscall number) after POP RAX',
      'Order should be: POP RAX → 0x3b → ... → SYSCALL'
    ],
    severity: 'error',
    relatedConcepts: ['execve', 'calling-convention']
  },
  INVALID_RDI: {
    title: 'Invalid RDI for execve',
    whatHappened: 'SYSCALL selected execve (RAX=0x3b) but RDI does not point to "/bin/sh". Expected 0x601080 (.bss) or 0x7fff (legacy simplified).',
    whyItMatters: 'execve arg0 (RDI) must be a pointer to the program path. A garbage immediate is not a valid string pointer. In real exploits this comes from ELF/.bss or libc search.',
    howToFix: [
      'Add POP RDI; RET gadget before SYSCALL',
      'Add 0x601080 (.bss /bin/sh, recommended) after POP RDI',
      'Legacy 0x7fff still accepted for simplified level'
    ],
    severity: 'error',
    relatedConcepts: ['execve', 'calling-convention']
  },
  RSI_NOT_NULL: {
    title: 'RSI Must Be NULL',
    whatHappened: 'SYSCALL selected execve but RSI is not 0x0. execve arg1 (argv) must be NULL for execve("/bin/sh", NULL, NULL).',
    whyItMatters: 'Kernel validates argv/envp pointers. Garbage in RSI causes EFAULT and no shell, even if RAX/RDI are correct. Zero unused args.',
    howToFix: [
      'Add POP RSI; RET gadget before SYSCALL',
      'Add 0x0 (NULL) after POP RSI',
      'Registers default to 0x0 — do not overwrite RSI with garbage'
    ],
    severity: 'error',
    relatedConcepts: ['execve', 'calling-convention']
  },
  RDX_NOT_NULL: {
    title: 'RDX Must Be NULL',
    whatHappened: 'SYSCALL selected execve but RDX is not 0x0. execve arg2 (envp) must be NULL for execve("/bin/sh", NULL, NULL).',
    whyItMatters: 'Same as RSI: kernel checks envp. RDX garbage fails the syscall. x86-64 syscall args are RDI,RSI,RDX,R10,R8,R9.',
    howToFix: [
      'Add POP RDX; RET gadget (0x4005e1) before SYSCALL',
      'Add 0x0 (NULL) after POP RDX',
      'Registers default to 0x0 — do not overwrite RDX with garbage'
    ],
    severity: 'error',
    relatedConcepts: ['execve', 'calling-convention']
  },
  POP_RIP_INVALID: {
    title: 'Cannot POP into RIP',
    whatHappened: 'Encountered POP RIP. RIP cannot be loaded with POP — control flow changes only via RET (which pops into RIP internally).',
    whyItMatters: 'x86-64 has no POP RIP encoding. ROP hijacks RIP via overwritten return address + RET. Teaching POP RIP creates a wrong mental model.',
    howToFix: [
      'Use RET gadget to load next address into RIP',
      'To set RIP, place target address after a RET-ending gadget',
      'Remove any POP RIP gadget from your chain'
    ],
    severity: 'error',
    relatedConcepts: ['rop-basics', 'gadgets']
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
    whatHappened: 'execve("/bin/sh", NULL, NULL) executed successfully. RAX=0x3b, RDI points to "/bin/sh", RSI=0x0, RDX=0x0.',
    whyItMatters: 'You\'ve successfully bypassed NX protection using ROP! The chain correctly set all execve args per x86-64 syscall convention (RDI,RSI,RDX), then triggered SYSCALL.',
    howToFix: [
      'Congratulations! Your ROP chain worked correctly.',
      'In a real exploit, you would now have interactive shell access.',
      'Try Reset and experiment with different chain variations.'
    ],
    severity: 'success',
    relatedConcepts: ['execve', 'rop-basics']
  }
};
