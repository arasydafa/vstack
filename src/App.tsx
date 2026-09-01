/**
 * Root application component for VStack (Visual ROP Chain Builder).
 *
 * Manages the main layout with three panels:
 * - Left: GadgetLibrary (draggable ROP gadgets)
 * - Center: StackCanvas (visual stack memory)
 * - Right: CpuMonitor (register state and controls)
 *
 * Handles drag-and-drop operations, stack state, and theory sidebar/modal.
 *
 * @module App
 */

import { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { StackItem, Gadget } from './types';
import { GadgetLibrary } from './components/GadgetLibrary';
import { StackCanvas } from './components/StackCanvas';
import { CpuMonitor } from './components/CpuMonitor';
import { TheorySidebar } from './components/TheorySidebar';
import { ConceptModal } from './components/ConceptModal';
import { useCpu } from './hooks/useCpu';
import { Shield, Terminal, BookOpen } from 'lucide-react';

/** Auto-incrementing ID generator for unique stack item IDs. */
let nextId = 1;
const generateId = () => `item-${nextId++}`;

/**
 * Main application component.
 *
 * Layout:
 * - Sticky header with logo, Theory button, and tagline
 * - Three-column grid: GadgetLibrary | StackCanvas | CpuMonitor
 * - DragOverlay for visual feedback during drag operations
 * - TheorySidebar (slide-out) and ConceptModal (full-screen) overlays
 *
 * State management:
 * - `useCpu()` hook for CPU simulation state
 * - `items` state for stack items (StackItem[])
 * - `activeItem` for drag overlay display
 * - `theoryOpen` and `selectedConcept` for theory navigation
 */
function App() {
  const { state, step, reset } = useCpu();
  const [items, setItems] = useState<StackItem[]>([]);
  const [activeItem, setActiveItem] = useState<StackItem | Gadget | null>(null);
  
  // Theory state
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  /**
   * Handles concept selection from TheorySidebar or ConceptTooltip.
   * Opens the ConceptModal with the selected concept.
   */
  const handleConceptClick = useCallback((conceptId: string) => {
    setSelectedConcept(conceptId);
  }, []);

  /**
   * Handles drag start from GadgetLibrary.
   * Sets the active item for the DragOverlay preview.
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === 'gadget') {
      setActiveItem(data.gadget as Gadget);
    }
  }, []);

  /**
   * Handles drag end events.
   *
   * Two scenarios:
   * 1. Gadget dropped onto StackCanvas: Creates new StackItem and appends to stack
   * 2. StackItem reordered within StackCanvas: Uses arrayMove to reorder
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeData = active.data.current;
    const overId = over.id as string;

    if (activeData?.type === 'gadget' && overId === 'stack-canvas') {
      const gadget = activeData.gadget as Gadget;
      const newItem: StackItem = {
        id: generateId(),
        type: 'gadget',
        value: gadget.address,
        gadgetId: gadget.id,
        label: gadget.instructions.join('; '),
      };
      const newItems = [...items, newItem];
      setItems(newItems);
      return;
    }

    const activeIndex = items.findIndex(item => item.id === active.id);
    const overIndex = items.findIndex(item => item.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const newItems = arrayMove(items, activeIndex, overIndex);
      setItems(newItems);
    }
  }, [items]);

  /**
   * Inserts a data value at the end of the stack.
   * Used by the quick-insert buttons in StackCanvas.
   */
  const handleInsertValue = useCallback((value: string, label: string) => {
    const newItem: StackItem = {
      id: generateId(),
      type: 'value',
      value,
      label,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
  }, [items]);

  /**
   * Removes a stack item by index.
   * Used by the X button on each StackRow.
   */
  const handleRemoveItem = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  }, [items]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-green/10 border border-cyber-green/30">
              <Shield className="w-6 h-6 text-cyber-green" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">VStack</h1>
              <p className="text-xs text-zinc-500">Visual ROP Chain Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Theory Button */}
            <button
              onClick={() => setTheoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Theory</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Terminal className="w-4 h-4" />
              <span>Educational Tool for Binary Exploitation</span>
            </div>
          </div>
        </div>
      </header>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
            <div className="lg:col-span-3 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <GadgetLibrary />
            </div>

            <div className="lg:col-span-5 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <StackCanvas
                items={items}
                currentRsp={state.rsp}
                onRemoveItem={handleRemoveItem}
                onInsertValue={handleInsertValue}
              />
            </div>

            <div className="lg:col-span-4 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <CpuMonitor
                state={state}
                items={items}
                onStep={() => {
                  const stackValues = items.map(item => item.value);
                  if (JSON.stringify(state.stack) !== JSON.stringify(stackValues)) {
                    reset();
                  }
                  step();
                }}
                onReset={() => {
                  reset();
                }}
                onConceptClick={handleConceptClick}
              />
            </div>
          </div>
        </main>

        <DragOverlay>
          {activeItem && 'instructions' in activeItem && (
            <div className="p-3 rounded-lg border border-cyber-blue bg-zinc-800 shadow-lg shadow-cyber-blue/30 w-64">
              <div className="font-mono text-sm text-cyber-blue">
                {(activeItem as Gadget).instructions.join('; ')}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {(activeItem as Gadget).address}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Theory Sidebar */}
      <TheorySidebar
        isOpen={theoryOpen}
        onClose={() => setTheoryOpen(false)}
        onConceptSelect={handleConceptClick}
      />

      {/* Concept Modal */}
      {selectedConcept && (
        <ConceptModal
          conceptId={selectedConcept}
          onClose={() => setSelectedConcept(null)}
          onNavigate={handleConceptClick}
        />
      )}
    </div>
  );
}

export default App;
