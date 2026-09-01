# VStack - Visual ROP Chain Builder

> An interactive educational tool for learning binary exploitation through visual ROP chain construction.
<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-4.4-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?logo=tailwindcss" alt="Tailwind CSS">
  <a href="https://arasydafa.github.io/vstack/"><img src="https://img.shields.io/badge/Live-Demo-brightgreen" alt="Live Demo"></a>
</p>

## Overview

VStack is a web-based simulator that teaches Return-Oriented Programming (ROP) by allowing users to visually build and execute ROP chains on a simulated CPU. Users drag-and-drop assembly gadgets onto a stack, step through execution, and learn how ROP techniques bypass NX-bit protections.

## Features

### Interactive Stack Builder
- **Drag & Drop**: Drag ROP gadgets from the library to the stack canvas
- **Reorder**: Sort stack items by dragging within the canvas
- **Quick Insert**: Add common values (`NULL`, `/bin/sh`, syscall numbers) with one click
- **Remove**: Delete unwanted stack items with the X button

### CPU Simulator
- **Step-by-step Execution**: Watch each instruction execute one at a time
- **Register Tracking**: See how `POP`, `RET`, and `SYSCALL` modify registers
- **Visual Feedback**: Color-coded status (idle, running, crashed, shell spawned)
- **Error Explanations**: Educational feedback when things go wrong

### Educational Content
- **Theory Sidebar**: 7 concepts covering fundamentals, ROP techniques, and security
- **Concept Tooltips**: Hover over terms like "Stack Pointer (RSP)" to learn more
- **Status Explanations**: Detailed breakdowns of errors and successes
- **Pwntools Export**: Export your ROP chain as working Python code

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Vite 4 | Build tool |
| Tailwind CSS 3 | Styling |
| @dnd-kit | Drag-and-drop |
| lucide-react | Icons |

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
git clone https://github.com/arasydafa/vstack.git
cd vstack
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run build
# Copy dist/ contents to your gh-pages branch
```

## Project Structure

```
vstack/
├── src/
│   ├── components/          # React UI components
│   │   ├── ConceptModal.tsx      # Full-screen concept detail view
│   │   ├── ConceptTooltip.tsx    # Hover tooltip with "Learn more"
│   │   ├── CpuMonitor.tsx        # Register display and controls
│   │   ├── GadgetLibrary.tsx     # Draggable gadget list
│   │   ├── StackCanvas.tsx       # Drop target with sortable items
│   │   ├── StackRow.tsx          # Individual stack item row
│   │   ├── StatusExplanation.tsx # Error/success explanation panel
│   │   └── TheorySidebar.tsx     # Slide-in theory panel
│   ├── data/                # Static data definitions
│   │   ├── concepts.ts           # 7 educational concepts
│   │   ├── explanations.ts       # 9 status explanations
│   │   └── gadgets.ts           # 6 ROP gadgets + 6 insertable values
│   ├── engine/              # CPU simulation logic
│   │   └── CpuEngine.ts          # Step execution, register tracking
│   ├── hooks/               # React hooks
│   │   └── useCpu.ts            # useReducer-based state management
│   ├── types/               # TypeScript definitions
│   │   └── index.ts             # All interfaces and types
│   ├── utils/               # Utility functions
│   │   └── exportPwntools.ts    # Pwntools Python export
│   ├── App.tsx              # Root component with layout
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind + custom styles
├── public/
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## CPU Simulation

The simulator supports three x86-64 instructions:

| Instruction | Behavior |
|-------------|----------|
| `POP reg` | Pop top of stack into register (`RAX`, `RDI`, `RSI`, `RIP`) |
| `RET` | Pop top of stack into `RIP` (control flow hijack) |
| `SYSCALL` | Execute syscall with current register values |

### Success Condition

Shell is spawned when:
- `RAX = 0x3b` (execve syscall number)
- `RDI = 0x7fff` (pointer to `"/bin/sh"`)

## Available Gadgets

| Address | Instructions | Description |
|---------|--------------|-------------|
| `0x4005d3` | `POP RDI`; `RET` | Load value into `RDI` |
| `0x4005d9` | `POP RSI`; `RET` | Load value into `RSI` |
| `0x4005e5` | `POP RAX`; `RET` | Load value into `RAX` |
| `0x4005e1` | `POP RDX`; `RET` | Load value into `RDX` |
| `0x4005e9` | `SYSCALL`; `RET` | Execute `syscall` |
| `0x4005a0` | `NOP`; `RET` | No operation (padding) |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built as an educational tool for learning binary exploitation
- Inspired by pwntools and ROP tutorial resources
- Designed for CTF players and security researchers

---

**Author**: Arasy Dafa Sulistya Kurniawan

**Live Demo**: [https://arasydafa.github.io/vstack/](https://arasydafa.github.io/vstack/)
