/**
 * Educational concepts for the Theory sidebar and Concept modal.
 * Covers ROP fundamentals, techniques, and security topics.
 *
 * @module data/concepts
 */

import { Concept } from '../types';

/**
 * Array of educational concepts organized by category.
 *
 * Categories:
 * - **fundamentals**: Core x86-64 concepts (stack memory, calling convention)
 * - **rop-technique**: ROP-specific techniques (gadgets, execve, chain building)
 * - **security**: Security mechanisms (NX bit, stack alignment)
 *
 * Each concept includes:
 * - Full educational content with detailed explanations
 * - ASCII art diagrams for visual learning
 * - Key takeaways as bullet points
 * - Code examples with real exploit snippets
 * - Cross-references to related concepts
 */
export const CONCEPTS: Concept[] = [
  {
    id: 'stack-memory',
    title: 'Stack Memory',
    category: 'fundamentals',
    summary: 'LIFO data structure used for function calls and local variables',
    content: `The stack is a Last-In-First-Out (LIFO) data structure used by programs for function calls, local variables, and return addresses. In x86-64 Linux, the stack grows downward from high memory addresses to low addresses.

The RSP (Stack Pointer) register always points to the top of the stack. When you PUSH a value, RSP decreases by 8 bytes (on 64-bit). When you POP, RSP increases by 8 bytes.

Stack frames are created for each function call:
- Saved RBP (base pointer) - marks the start of the frame
- Return address - where to go after the function returns
- Local variables - allocated by subtracting from RSP

In ROP exploitation, we control the stack contents through a buffer overflow. By overwriting the return address, we redirect execution to our gadgets.`,
    diagrams: [
      `Stack Memory Layout:
+---------------------------+ High Address
|       ...                 |
+---------------------------+
|    Function A Frame       |
|   +-------------------+   |
|   | Local Variables    |   |
|   +-------------------+   |
|   | Saved RBP          |   |
|   +-------------------+   |
|   | Return Address     |<--|--- We overwrite this!
|   +-------------------+   |
+---------------------------+
|    Function B Frame       |
|   +-------------------+   |
|   | Local Variables    |<--|--- RSP points here
|   +-------------------+   |
+---------------------------+ Low Address`
    ],
    keyPoints: [
      'RSP (Stack Pointer) tracks the top of the stack',
      'Stack grows downward (high to low addresses)',
      'PUSH decrements RSP, writes value',
      'POP reads value, increments RSP',
      'Stack frames: saved RBP, return address, local variables'
    ],
    examples: [
      {
        title: 'PUSH and POP Operations',
        code: `; PUSH RAX - decrements RSP, writes value
sub rsp, 8        ; RSP = RSP - 8
mov [rsp], rax    ; Write RAX to stack

; POP RDI - reads value, increments RSP  
mov rdi, [rsp]    ; Read from stack into RDI
add rsp, 8        ; RSP = RSP + 8`
      }
    ],
    relatedConcepts: ['rop-basics', 'gadgets']
  },
  {
    id: 'rop-basics',
    title: 'ROP Fundamentals',
    category: 'rop-technique',
    summary: 'Chaining existing code gadgets to bypass NX protection',
    content: `Return-Oriented Programming (ROP) is a technique for bypassing NX (No-Execute) protection. When the stack is non-executable, we can't run injected shellcode. Instead, ROP reuses existing executable code.

A ROP chain is a sequence of "gadgets" - short instruction sequences ending in RET. The RET instruction pops the next address from the stack into RIP, allowing us to chain gadgets together.

How it works:
1. Attacker overwrites the return address with first gadget address
2. CPU executes the gadget's instructions
3. RET pops the next address from stack
4. CPU jumps to next gadget
5. Process repeats until desired effect achieved

The "program" we write is actually a list of addresses on the stack, not actual code. Each address points to a gadget that performs a small task.`,
    diagrams: [
      `ROP Chain Execution Flow:

Before Overflow:
+-----------------+
| Buffer Data     |
| ...             |
| Saved RBP       |
| Return Addr     |--> Normal return
+-----------------+

After Overflow:
+-----------------+
| Buffer Data     |
| [Padding]       |
| Gadget1 Addr    |--> POP RDI; RET
| Value for RDI   |
| Gadget2 Addr    |--> POP RAX; RET  
| Value for RAX   |
| Syscall Addr    |--> SYSCALL
+-----------------+

Execution Chain:
1. RET from main --> Gadget1 (POP RDI; RET)
2. POP loads value into RDI
3. RET --> Gadget2 (POP RAX; RET)
4. POP loads value into RAX
5. RET --> Syscall gadget
6. SYSCALL executes`
    ],
    keyPoints: [
      'NX makes stack non-executable (can\'t run shellcode)',
      'ROP reuses existing executable code',
      'Gadgets are short sequences ending in RET',
      'RET pops next address into RIP',
      'We "program" by controlling the stack contents'
    ],
    examples: [
      {
        title: 'Simple 2-Gadget Chain',
        code: `# Python exploit structure
from pwn import *

# Gadgets (addresses from binary)
pop_rdi = 0x4005d3    # POP RDI; RET
syscall = 0x4005d9    # SYSCALL

# Build chain on stack
payload = b'A' * 40           # Padding to reach return address
payload += p64(pop_rdi)       # Gadget 1: POP RDI
payload += p64(0x7fff)        # Value: /bin/sh address
payload += p64(syscall)       # Gadget 2: SYSCALL

# Send to vulnerable program
p.send(payload)`
      }
    ],
    relatedConcepts: ['gadgets', 'nx-bit', 'execve']
  },
  {
    id: 'gadgets',
    title: 'ROP Gadgets',
    category: 'rop-technique',
    summary: 'Short instruction sequences ending in RET that perform small tasks',
    content: `A ROP gadget is a short sequence of machine instructions found in the binary's executable code, ending with a RET instruction. The RET is what enables chaining - it pops the next address from the stack into RIP.

Common gadget types:
- POP REG; RET - Loads a value from stack into a register
- MOV [REG], REG; RET - Writes data to memory
- SYSCALL; RET - Triggers a system call
- ADD/SUB REG, IMM; RET - Arithmetic operations

Gadgets are found by scanning the binary's executable sections. Tools like ROPgadget, ropper, and pwntools automate this search.

The key insight: these instruction sequences already exist in the binary. We're not injecting code - we're reusing what's already there, just chaining them in a new order.`,
    diagrams: [
      `Gadget Structure:

Memory Address    Instructions
--------------    ------------
0x4005d3:        POP RDI      <-- Load value into RDI
                 RET          <-- Jump to next address

0x4005d5:        POP RSI      <-- Load value into RSI  
                 RET          <-- Jump to next address

0x4005d7:        POP RAX      <-- Load value into RAX
                 RET          <-- Jump to next address

0x4005d9:        SYSCALL      <-- Execute system call

How RET Enables Chaining:

Stack State:
+-------------+
| 0x4005d3    | <-- Current gadget address (POP RDI; RET)
| 0x1234      | <-- Value to load into RDI
| 0x4005d9    | <-- Next gadget (SYSCALL)
+-------------+

Execution:
1. POP RDI: RDI = 0x1234, RSP += 8
2. RET: RIP = 0x4005d9 (pops from stack)
3. SYSCALL executes with RDI = 0x1234`
    ],
    keyPoints: [
      'Gadgets end with RET for chaining',
      'POP REG; RET loads values from stack',
      'Found in binary\'s executable sections',
      'Tools: ROPgadget, ropper, pwntools',
      'Each gadget performs one small, specific task'
    ],
    examples: [
      {
        title: 'Finding Gadgets with ROPgadget',
        code: `# Command line
ROPgadget --binary ./vuln | grep "pop rdi"
# Output: 0x00000000004015a3 : pop rdi ; ret

ROPgadget --binary ./vuln | grep "syscall"
# Output: 0x0000000000401004 : syscall ; ret

# In pwntools
from pwn import *
elf = ELF('./vuln')
rop = ROP(elf)
pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]
print(f"POP RDI gadget: {hex(pop_rdi)}")`
      }
    ],
    relatedConcepts: ['rop-basics', 'stack-memory']
  },
  {
    id: 'calling-convention',
    title: 'x86-64 Calling Convention',
    category: 'fundamentals',
    summary: 'How functions receive arguments in registers (System V ABI)',
    content: `The x86-64 System V ABI (used on Linux) defines how functions receive arguments and return values. Understanding this is crucial for calling functions via ROP.

Register Usage:
- RDI: 1st argument
- RSI: 2nd argument  
- RDX: 3rd argument
- RCX: 4th argument
- R8: 5th argument
- R9: 6th argument
- RAX: Return value / Syscall number

For syscalls specifically:
- RAX: Syscall number (what syscall to execute)
- RDI, RSI, RDX, R10, R8, R9: Syscall arguments

For execve specifically:
- RAX = 0x3b (59 decimal) - execve syscall number
- RDI = pointer to "/bin/sh" string
- RSI = 0 (NULL - no arguments)
- RDX = 0 (NULL - no environment)

To call a function via ROP, you must set the registers BEFORE the function address is reached.`,
    diagrams: [
      `x86-64 System V ABI Register Usage:

Function Arguments:
+-------------------------------------+
| Register | Purpose                  |
+----------+--------------------------+
| RDI      | 1st argument             |
| RSI      | 2nd argument             |
| RDX      | 3rd argument             |
| RCX      | 4th argument             |
| R8       | 5th argument             |
| R9       | 6th argument             |
+----------+--------------------------+
| RAX      | Return value / Syscall # |
+-------------------------------------+

System Call Arguments:
+-------------------------------------+
| Register | Purpose                  |
+----------+--------------------------+
| RAX      | Syscall number           |
| RDI      | 1st syscall argument     |
| RSI      | 2nd syscall argument     |
| RDX      | 3rd syscall argument     |
| R10      | 4th syscall argument     |
| R8       | 5th syscall argument     |
| R9       | 6th syscall argument     |
+-------------------------------------+`
    ],
    keyPoints: [
      'Arguments go in RDI, RSI, RDX (first 3)',
      'Return value comes back in RAX',
      'Syscall number goes in RAX',
      'Must set registers before calling function',
      'Stack must be 16-byte aligned before CALL'
    ],
    examples: [
      {
        title: 'Setting Up Arguments for system("/bin/sh")',
        code: `# To call system("/bin/sh"):
# RDI must contain address of "/bin/sh" string

# ROP chain structure:
pop_rdi_ret = 0x4005d3    # POP RDI; RET gadget
system_addr = 0x401040    # address of system()
binsh_addr  = 0x7fff      # address of "/bin/sh" string

payload = b'A' * 40               # Padding
payload += p64(pop_rdi_ret)       # POP RDI; RET
payload += p64(binsh_addr)        # RDI = "/bin/sh"
payload += p64(system_addr)       # Call system()`
      }
    ],
    relatedConcepts: ['execve', 'gadgets']
  },
  {
    id: 'execve',
    title: 'execve Syscall',
    category: 'rop-technique',
    summary: 'System call to execute a program (spawn a shell)',
    content: `execve is the system call used to execute a program. In binary exploitation, we use it to spawn a shell (/bin/sh).

Syscall Details:
- Syscall number: 0x3b (59 decimal)
- RDI: Pointer to program name ("/bin/sh")
- RSI: Pointer to argv array (NULL for shell)
- RDX: Pointer to envp array (NULL for shell)

The execve syscall replaces the current process with the specified program. When we call execve("/bin/sh", NULL, NULL), we get an interactive shell.

To trigger a syscall, we use the SYSCALL instruction. Before executing SYSCALL, we must set RAX to the syscall number and the argument registers accordingly.

This is the goal of our ROP chain: set up registers for execve, then trigger SYSCALL.`,
    diagrams: [
      `execve("/bin/sh", NULL, NULL) Setup:

Register Setup:
+-------------------------------------+
| Register | Value   | Purpose        |
+----------+---------+----------------+
| RAX      | 0x3b    | execve syscall |
| RDI      | 0x7fff  | "/bin/sh" addr |
| RSI      | 0x0     | NULL (no args) |
| RDX      | 0x0     | NULL (no env)  |
+-------------------------------------+

ROP Chain Layout:
+-------------------------+
| 0x4005d7 (POP RAX;RET) |--> RAX = 0x3b
| 0x3b                    |
| 0x4005d3 (POP RDI;RET) |--> RDI = 0x7fff
| 0x7fff                  |
| 0x4005d9 (SYSCALL)     |--> execve("/bin/sh")
+-------------------------+

Execution Flow:
1. POP RAX: RAX = 0x3b (execve number)
2. POP RDI: RDI = 0x7fff (pointer to "/bin/sh")
3. SYSCALL: Kernel executes execve()
4. Shell spawns!`
    ],
    keyPoints: [
      'execve syscall number is 0x3b (59 decimal)',
      'RDI = pointer to "/bin/sh" string',
      'RSI = 0 (NULL - no arguments)',
      'RDX = 0 (NULL - no environment)',
      'SYSCALL instruction triggers the kernel'
    ],
    examples: [
      {
        title: 'Complete ret2syscall Chain',
        code: `from pwn import *

# Gadgets
pop_rax = 0x4005d7  # POP RAX; RET
pop_rdi = 0x4005d3  # POP RDI; RET
pop_rsi = 0x4005d5  # POP RSI; RET
syscall = 0x4005d9  # SYSCALL

# Values
binsh = 0x7fff      # Address of "/bin/sh"
execve_num = 0x3b   # execve syscall number

# Build chain
payload = b'A' * 40           # Padding to RIP
payload += p64(pop_rax)       # Set RAX = 0x3b
payload += p64(execve_num)    
payload += p64(pop_rdi)       # Set RDI = "/bin/sh"
payload += p64(binsh)
payload += p64(pop_rsi)       # Set RSI = 0
payload += p64(0)
payload += p64(syscall)       # Trigger execve

p.send(payload)
p.interactive()  # You now have a shell!`
      }
    ],
    relatedConcepts: ['calling-convention', 'rop-basics']
  },
  {
    id: 'nx-bit',
    title: 'NX Bit (DEP)',
    category: 'security',
    summary: 'Security feature that makes stack non-executable',
    content: `NX (No-Execute) bit, also called DEP (Data Execution Prevention), is a security feature that marks certain memory regions as non-executable. This prevents attackers from executing injected shellcode on the stack.

Before NX:
- Stack was both writable AND executable
- Attacker could inject shellcode and jump to it
- Simple buffer overflow = code execution

After NX:
- Stack is writable but NOT executable
- Injected shellcode cannot run (SIGSEGV)
- Attacker needs alternative techniques

This is why ROP exists! Since we can't execute our own code, we reuse existing executable code (gadgets) that's already in the binary or libraries.

NX is enforced by the CPU's memory management unit (MMU). When code tries to execute from a non-executable page, the CPU generates a fault (SIGSEGV).`,
    diagrams: [
      `NX Bit Protection:

Before NX (Vulnerable):
+-------------------------------------+
| Stack Memory                        |
| +---------------------------------+ |
| | Shellcode (injected)     [RWX] | | <-- Executable!
| | jmp to shellcode          ...  | |
| +---------------------------------+ |
| Attack: Overflow -> inject -> execute |
+-------------------------------------+

After NX (Protected):
+-------------------------------------+
| Stack Memory                        |
| +---------------------------------+ |
| | Buffer overflow data      [RW-] | | <-- NOT executable
| | Overwritten return addr   ...  | |
| +---------------------------------+ |
| Attack: Overflow -> inject -> CRASH! |
+-------------------------------------+

ROP Bypass:
+-------------------------------------+
| .text Section (Executable Code)     |
| +---------------------------------+ |
| | POP RDI; RET              [R-X] | | <-- Already executable
| | SYSCALL                   [R-X] | |
| +---------------------------------+ |
| ROP: Chain existing gadgets         |
+-------------------------------------+`
    ],
    keyPoints: [
      'Makes stack non-executable',
      'Prevents executing injected shellcode',
      'Forces attackers to use ROP',
      'ROP reuses existing executable code',
      'Bypassed by chaining gadgets'
    ],
    examples: [
      {
        title: 'NX Protection in Action',
        code: `# Compile without NX (vulnerable)
gcc -z execstack -o vuln vuln.c

# Compile with NX (protected)
gcc -o vuln vuln.c  # NX enabled by default

# Check protections
checksec --file=vuln
# NX: enabled - stack is non-executable

# With NX, this fails:
shellcode = asm(shellcraft.sh())  # /bin/sh shellcode
payload = b'A' * 40 + shellcode
# Result: SIGSEGV (cannot execute on stack)

# ROP bypasses this by using existing code:
rop_chain = p64(pop_rdi) + p64(binsh) + p64(syscall)
# This works because gadgets are in executable .text`
      }
    ],
    relatedConcepts: ['rop-basics', 'gadgets']
  },
  {
    id: 'stack-alignment',
    title: 'Stack Alignment',
    category: 'security',
    summary: '16-byte alignment requirement for certain instructions',
    content: `Stack alignment is a requirement that the stack pointer (RSP) must be aligned to a 16-byte boundary before certain instructions execute. This is particularly important when calling libc functions.

The Problem:
Modern libc uses SSE instructions (like MOVAPS) for performance. MOVAPS requires its memory operand to be 16-byte aligned. If RSP is not aligned when a function uses MOVAPS, the CPU generates a general protection fault (SIGSEGV).

This is a common "gotcha" in ROP chains. You might set up everything correctly, but if the stack is misaligned, you'll crash inside the called function.

The Solution:
Add an extra RET gadget before calling the function. Since each stack entry is 8 bytes, an extra RET adjusts RSP by 8 bytes, which can fix alignment.

Alignment Rule:
RSP must be divisible by 16 at the point of the CALL instruction (or when the function expects it).`,
    diagrams: [
      `Stack Alignment Issue:

Misaligned (CRASH):
+-------------------------------------+
| Stack Address | Value               |
+---------------+---------------------+
| 0x7fff...f0   | padding             |
| 0x7fff...e8   | pop_rdi gadget      |
| 0x7fff...e0   | /bin/sh address     |
| 0x7fff...d8   | system() address    | <-- RSP here
| 0x7fff...d0   | ...                 |
+-------------------------------------+
RSP = 0x7fff...d8 (NOT divisible by 16)
Result: MOVAPS crash inside system()

Aligned (WORKS):
+-------------------------------------+
| Stack Address | Value               |
+---------------+---------------------+
| 0x7fff...f0   | padding             |
| 0x7fff...e8   | pop_rdi gadget      |
| 0x7fff...e0   | /bin/sh address     |
| 0x7fff...d8   | extra RET gadget    | <-- Fix!
| 0x7fff...d0   | system() address    | <-- RSP here
| 0x7fff...c8   | ...                 |
+-------------------------------------+
RSP = 0x7fff...d0 (divisible by 16)
Result: system() works correctly!`
    ],
    keyPoints: [
      'MOVAPS requires 16-byte aligned addresses',
      'Modern libc uses MOVAPS for performance',
      'Misaligned RSP causes SIGSEGV inside function',
      'Fix: Add extra RET before function call',
      'Each stack entry is 8 bytes'
    ],
    examples: [
      {
        title: 'Fixing Alignment with Extra RET',
        code: `# Problem: system() crashes with MOVAPS
pop_rdi = 0x4005d3
system_addr = 0x401040
binsh = 0x7fff

# This CRASHES (misaligned):
payload = b'A' * 40
payload += p64(pop_rdi)      # POP RDI; RET
payload += p64(binsh)        # "/bin/sh"
payload += p64(system_addr)  # system() - CRASH!

# This WORKS (aligned):
ret_gadget = 0x4005d4  # Just RET instruction

payload = b'A' * 40
payload += p64(ret_gadget)   # Extra RET for alignment
payload += p64(pop_rdi)      # POP RDI; RET
payload += p64(binsh)        # "/bin/sh"
payload += p64(system_addr)  # system() - Works!

# The extra RET shifts RSP by 8 bytes,
# fixing the 16-byte alignment issue.`
      }
    ],
    relatedConcepts: ['rop-basics', 'calling-convention']
  },
  {
    id: 'buffer-overflow',
    title: 'Buffer Overflow & Offset',
    category: 'fundamentals',
    summary: 'How padding reaches RIP: offset discovery with cyclic + p64',
    content: `Most ROP chains start with a buffer overflow that overwrites the saved return address. You must know the exact offset (padding length) from buffer start to RIP.

Workflow (validated against CTF practice + pwntools):
1. Find offset with cyclic pattern: pwntools cyclic(100), send, read crash RIP, then cyclic_find / pattern_offset.
2. Build payload = padding + chain: b"A"*offset + p64(gadget) + ...
3. p64 is little-endian 64-bit pack. Endianness matters — x86-64 is little-endian.

Example: offset 40 means 40 bytes padding (buffer + saved RBP) before first gadget address. VStack Level 0 simulates the post-overflow stack; the offset skill is what gets you there in real binaries.`,
    diagrams: [
      `Buffer Overflow Layout:
+-----------------+ High
| Buffer (e.g. 32)|
| Saved RBP (8)   | 32+8 = offset 40
| Return Addr RIP |<-- overwrite with gadget
+-----------------+ Low (stack grows down)

payload = b"A"*40 + p64(pop_rdi) + p64(binsh) + ...`
    ],
    keyPoints: [
      'Offset = buffer + saved RBP, find with cyclic',
      'payload = padding + chain, pack with p64 (little-endian)',
      'VStack starts post-overflow; real exploit needs this step first'
    ],
    examples: [
      {
        title: 'Offset Discovery with Pwntools',
        code: `from pwn import *
# 1. Generate pattern, crash, read RIP
# cyclic(100) -> send -> RIP = 0x6161616b
# offset = cyclic_find(0x6161616b)  # e.g. 40
offset = 40
payload = b"A"*offset
payload += p64(0x4005d3)  # POP RDI; RET
payload += p64(0x601080)  # /bin/sh
p.send(payload)`
      }
    ],
    relatedConcepts: ['stack-memory', 'rop-basics']
  },
  {
    id: 'mitigations-map',
    title: 'Mitigations Map (NX/ASLR/PIE/Canary)',
    category: 'security',
    summary: 'Which mitigation blocks what, and what bypass to learn next',
    content: `NX alone is bypassed by ROP. Modern binaries add more (check with checksec):
- NX (DEP): stack RW- not R-X. Bypass: ROP with .text gadgets.
- Canary: secret cookie before RIP, checked on return. Bypass: leak it, brute-force (fork), or avoid overwrite.
- PIE: .text addresses randomized per run. Bypass: leak a .text pointer, compute base + offset.
- ASLR: libc/stack randomized. Bypass: leak libc address (puts/write), compute system/bin_sh.
- RELRO: GOT read-only after load. Full RELRO blocks GOT overwrite; use ret2libc instead.

VStack addresses are fixed (like PIE off) for learning. Next level after VStack: practice leak + base calculation.`,
    diagrams: [
      `Mitigation -> Bypass:
NX      -> ROP (.text gadgets)
Canary  -> leak / brute-force
PIE     -> leak .text ptr, base+offset
ASLR    -> leak libc, compute system
RELRO   -> no GOT overwrite, use ret2libc`
    ],
    keyPoints: [
      'checksec first: NX, Canary, PIE, RELRO',
      'Fixed 0x4005xx here = PIE off; real CTF needs leak+offset',
      'ASLR/PIE need info leak, not just chain building'
    ],
    examples: [
      {
        title: 'Check + PIE Leak Math',
        code: `# checksec --file=./vuln
# PIE enabled -> gadget = leak - offset_known + offset_want
# leak = puts@0x7f... (runtime)
# base = leak - puts_offset_libc
# system = base + system_offset
# binsh = base + binsh_offset`
      }
    ],
    relatedConcepts: ['nx-bit', 'rop-basics']
  },
  {
    id: 'memory-writing',
    title: 'Memory Writing & Bad Bytes',
    category: 'rop-technique',
    summary: 'Place /bin/sh yourself with MOV [reg],reg; handle 0x00 cuts',
    content: `Real binaries may not contain "/bin/sh". Write it to writable .bss with a write gadget, then point RDI there.

- Sections: .text R-X (gadgets), .bss RW- (write target, e.g. 0x601080).
- Gadget: MOV [RDI], RSI; RET — writes 8 bytes from RSI to address in RDI.
- Split "/bin/sh" into 8-byte chunks, write each, then execve.
- Bad bytes: strcpy stops at 0x00, newlines (0x0a) cut input. Addresses like 0x4005xx contain 0x00 — use ROPgadget --badbytes "00" to filter, or find libc gadgets without them.

VStack Level 4 introduces constrained gadget sets as a first step toward this.`,
    diagrams: [
      `Write-what-where:
RDI = 0x601080 (.bss)   RSI = "/bin/sh\\0" (8 bytes)
MOV [RDI], RSI; RET  ->  [0x601080] = "/bin/sh"

Bad bytes (strcpy):
input 0x40 0x05 0xd3 ... contains 0x00? cut here
-> pick gadgets without 00 0a 0d`
    ],
    keyPoints: [
      '.bss is writable target for string writes',
      'MOV [RDI],RSI writes 8 bytes per gadget',
      'Filter bad bytes with --badbytes; 0x00 cuts strcpy'
    ],
    examples: [
      {
        title: 'Find Write Gadget + Bad Bytes',
        code: `# Find write gadget
# ROPgadget --binary ./vuln | grep "mov \\[rdi\\]"
# 0x... : mov qword ptr [rdi], rsi ; ret
# Avoid null bytes
# ROPgadget --binary ./vuln --badbytes "000a0d" | grep "pop rdi"`
      }
    ],
    relatedConcepts: ['gadgets', 'execve']
  },
  {
    id: 'reading-gadgets',
    title: 'Reading Gadgets (ROPgadget/ropper)',
    category: 'rop-technique',
    summary: 'Multi-pop order, side effects, and tool workflow',
    content: `Gadgets are found, not written. Tools: ROPgadget, ropper, pwntools ROP(elf).filter workflow (validated):

- ROPgadget --binary ./vuln | grep "pop rdi" — most common (5f c3).
- pop rsi 5e c3, pop rdx 5a c3 (rare — check libc), pop rax 58 c3, ret c3 (align), syscall 0f 05 c3.
- Multi-pop order matters: POP RDI; POP RSI; RET consumes [gadget][val_rdi][val_rsi] in order. Swapping values swaps registers — top cause of "why is RDI wrong?".
- Side effects: some gadgets do extra ops (e.g. pop rdi; or [rax],eax; ret clobbers memory). Prefer clean gadgets.
- pwntools: rop = ROP(elf); rop.find_gadget(['pop rdi','ret']); rop.execve(binsh,0,0); rop.dump().

VStack multi-pop 0x4005db/dd teaches this ordering explicitly.`,
    diagrams: [
      `Multi-pop layout:
Stack: [0x4005db] [val_RDI] [val_RSI] [next...]
Exec:  POP RDI=val_RDI, POP RSI=val_RSI, RET->next

Bytes: pop rdi 5f c3 | pop rsi 5e c3 | pop rdx 5a c3
       pop rax 58 c3 | ret c3 | syscall 0f 05 c3`
    ],
    keyPoints: [
      'Order of values matches order of POPs',
      'Prefer clean gadgets; check side effects',
      'Use rop.dump() to verify layout before sending'
    ],
    examples: [
      {
        title: 'Gadget Hunt Workflow',
        code: `# 1. Hunt
# ROPgadget --binary ./vuln | grep "pop rdi"
# ROPgadget --binary ./libc.so.6 | grep "pop rdx"
# ROPgadget --binary ./vuln | grep ": ret$"
# 2. Verify in pwntools
from pwn import *
elf = ELF('./vuln')
rop = ROP(elf)
print(hex(rop.find_gadget(['pop rdi','ret'])[0]))
print(rop.dump())`
      }
    ],
    relatedConcepts: ['gadgets', 'calling-convention']
  }
];
