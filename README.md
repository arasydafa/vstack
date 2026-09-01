# VStack

**Visual ROP Chain Builder** — An interactive educational tool for learning binary exploitation through visual ROP chain construction.

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-4.4-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?logo=tailwindcss" alt="Tailwind CSS">
</p>

## Overview

VStack is a browser-based simulator that teaches Return-Oriented Programming (ROP) — a technique used in binary exploitation to bypass NX (No-Execute) protection. Build ROP chains visually, step through execution, and learn how each gadget affects CPU registers and memory.

### Why VStack?

Traditional ROP tutorials rely on static text and code snippets. VStack lets you **see** the CPU state change in real-time as you construct and execute chains, making abstract concepts tangible.

## Features

- **Visual ROP Chain Builder** — Drag and drop gadgets onto a visual stack canvas
- **Simulated CPU Engine** — Step-through execution with register tracking (RAX, RDI, RSI, RIP)
- **Interactive Stack Memory** — Reorder, insert values, and watch RSP update
- **Real-time Register Display** — See registers change with each instruction
- **Educational Explanations** — Detailed error/success feedback with "What Happened", "Why It Matters", and "How to Fix"
- **Theory Library** — Built-in knowledge base covering:
  - Stack Memory (LIFO, RSP, PUSH/POP)
  - ROP Fundamentals (bypassing NX)
  - ROP Gadgets (finding and chaining)
  - x86-64 Calling Convention (System V ABI)
  - execve Syscall (spawning shells)
  - NX Bit / DEP (why ROP exists)
  - Stack Alignment (16-byte alignment, MOVAPS)
- **Export to Pwntools** — Generate valid Python pwntools code from your chain
- **Pre-loaded Gadgets** — 6 simulated gadgets from a typical vulnerable binary

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/ArasyDafa/vstack.git
cd vstack
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Building a ROP Chain

1. **Drag gadgets** from the Gadget Library (left panel) onto the Stack Memory (center)
2. **Insert values** using the quick-insert buttons: `/bin/sh`, `execve (59)`, `NULL`, etc.
3. **Reorder items** by dragging within the stack to get the correct chain order
4. **Step through execution** using the Step button in the CPU Monitor (right panel)
5. **Watch registers update** in real-time as each instruction executes

### Target Chain (execve shell)

To spawn a shell, build this chain:

```
[POP RAX; RET]  →  0x3b (execve syscall number)
[POP RDI; RET]  →  0x7fff (/bin/sh address)
[SYSCALL]        →  triggers execve("/bin/sh")
```

### Export to Pwntools

Click **Export to Pwntools** to copy a valid Python script to your clipboard. Paste it into your exploit script and run with `python exploit.py`.

## Architecture

```
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Root component (DnD context, layout, state)
├── index.css                 # Global Tailwind styles + custom animations
├── components/
│   ├── GadgetLibrary.tsx     # Sidebar: draggable ROP gadgets
│   ├── StackCanvas.tsx       # Center: droppable stack visualization
│   ├── StackRow.tsx          # Individual sortable stack entry
│   ├── CpuMonitor.tsx        # Right panel: CPU state, registers, controls
│   ├── RegisterDisplay.tsx   # Single register display
│   ├── TheorySidebar.tsx     # Slide-out theory/knowledge sidebar
│   ├── ConceptModal.tsx      # Modal for detailed concept explanation
│   ├── ConceptTooltip.tsx    # Hover tooltip for concept references
│   └── StatusExplanation.tsx # Expandable error/success explanation panel
├── data/
│   ├── gadgets.ts            # 6 ROP gadgets with addresses + descriptions
│   ├── explanations.ts       # 9 detailed error/success explanations
│   └── concepts.ts           # 7 educational concepts with diagrams & examples
├── engine/
│   └── CpuEngine.ts          # Simulated CPU execution engine
├── hooks/
│   └── useCpu.ts             # React hook wrapping CPU state with useReducer
├── types/
│   └── index.ts              # All TypeScript interfaces/types
└── utils/
    └── exportPwntools.ts     # Exports ROP chain to pwntools Python code
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Component-based UI rendering |
| TypeScript 5 | Type-safe JavaScript |
| Vite 4 | Fast dev server and production bundler |
| Tailwind CSS 3 | Utility-first CSS styling |
| @dnd-kit | Drag-and-drop interactions |
| Lucide React | SVG icon library |

## Deployment

### GitHub Pages (Recommended)

The project includes a GitHub Actions workflow that auto-deploys on push to `main`:

1. Push to your GitHub repository
2. Go to **Settings > Pages**
3. Set **Source** to **GitHub Actions**
4. The site will be available at `https://<username>.github.io/vstack/`

### Vercel

1. Import your repository on [vercel.com](https://vercel.com)
2. Vercel auto-detects Vite — no configuration needed
3. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Arasy Dafa** — [GitHub](https://github.com/ArasyDafa)

---

Built as an educational tool for binary exploitation. Learn ROP visually, understand the concepts, and apply them in real-world scenarios.
