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
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { StackItem, Gadget } from './types';
import { GadgetLibrary } from './components/GadgetLibrary';
import { StackCanvas } from './components/StackCanvas';
import { CpuMonitor } from './components/CpuMonitor';
import { TheorySidebar } from './components/TheorySidebar';
import { ConceptModal } from './components/ConceptModal';
import { useCpu } from './hooks/useCpu';
import { Shield, Terminal, BookOpen, Sun, Moon } from 'lucide-react';
import { Navbar, Button, ToasterProvider, toggleThemeReveal } from '@omega-os/ui';

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
 * - `useCpu()` hook as single source of truth for CPU and stack state
 * - `activeItem` for drag overlay display
 * - `theoryOpen` and `selectedConcept` for theory navigation
 */
function App() {
  const { state, stackItems, step, reset, setStackItems, insertItem, removeItem, clearStack } = useCpu();
  const [activeItem, setActiveItem] = useState<StackItem | Gadget | null>(null);

  // Theory state
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  // Theme state — VStack ships dark by default (see index.html).
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  /**
   * Toggles light/dark with a circular reveal from the clicked button.
   */
  const handleToggleTheme = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const x = e.clientX || window.innerWidth - 60;
      const y = e.clientY || 40;
      toggleThemeReveal(x, y, () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
      });
    },
    [dark],
  );

  // Configure sensors for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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
      setStackItems(prev => [...prev, newItem]);
      return;
    }

    // For reordering, we need the current items from the hook
    // Use functional updater to get current state
    setStackItems(prev => {
      const activeIndex = prev.findIndex(item => item.id === active.id);
      const overIndex = prev.findIndex(item => item.id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        return arrayMove(prev, activeIndex, overIndex);
      }
      return prev;
    });
  }, [setStackItems]);

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
    insertItem(newItem, stackItems.length);
  }, [insertItem, stackItems.length]);

  /**
   * Removes a stack item by index.
   * Used by the X button on each StackRow.
   */
  const handleRemoveItem = useCallback((index: number) => {
    removeItem(index);
  }, [removeItem]);

  /**
   * Clears all items from the stack.
   */
  const handleClearAll = useCallback(() => {
    clearStack();
  }, [clearStack]);

  /**
   * Handles stepping through CPU execution.
   * Since useCpu is now the single source of truth, no sync needed.
   */
  const handleStep = useCallback(() => {
    step();
  }, [step]);

  /**
   * Handles resetting CPU state.
   */
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  /**
   * Closes the theory sidebar.
   */
  const handleCloseTheory = useCallback(() => {
    setTheoryOpen(false);
  }, []);

  /**
   * Closes the concept modal.
   */
  const handleCloseConcept = useCallback(() => {
    setSelectedConcept(null);
  }, []);

  /**
   * Opens the theory sidebar.
   */
  const handleOpenTheory = useCallback(() => {
    setTheoryOpen(true);
  }, []);

  return (
    <ToasterProvider>
    <div className="min-h-screen bg-ot-bg font-sans text-ot-text">
      <div
        className="sticky top-0 z-50 border-b border-ot-border backdrop-blur-sm"
        style={{ background: 'color-mix(in srgb, var(--ot-bg) 85%, transparent)' }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Navbar
            brand={
              <>
                <span className="grid h-8 w-8 place-items-center rounded-ot-sm bg-navy text-white">
                  <Shield size={18} />
                </span>
                <span>
                  <span className="block text-xl font-bold leading-none">VStack</span>
                  <span className="mt-0.5 block text-xs font-normal text-ot-muted">Visual ROP Chain Builder</span>
                </span>
              </>
            }
            links={[]}
            actions={
              <>
                <Button variant="secondary" size="sm" icon={<BookOpen size={16} />} onClick={handleOpenTheory}>
                  Theory
                </Button>
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="grid h-8 w-8 place-items-center rounded-ot-sm text-ot-muted transition-all hover:bg-ot-surface hover:text-ot-text active:scale-90"
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <span className="hidden items-center gap-2 text-xs text-ot-muted xl:flex">
                  <Terminal size={16} />
                  Educational Tool for Binary Exploitation
                </span>
              </>
            }
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
            <div className="lg:col-span-3 bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden">
              <GadgetLibrary />
            </div>

            <div className="lg:col-span-5 bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden">
              <StackCanvas
                items={stackItems}
                currentRsp={state.rsp}
                onRemoveItem={handleRemoveItem}
                onInsertValue={handleInsertValue}
                onClearAll={handleClearAll}
              />
            </div>

            <div className="lg:col-span-4 bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden">
              <CpuMonitor
                state={state}
                items={stackItems}
                onStep={handleStep}
                onReset={handleReset}
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
        onClose={handleCloseTheory}
        onConceptSelect={handleConceptClick}
      />

      {/* Concept Modal */}
      {selectedConcept && (
        <ConceptModal
          conceptId={selectedConcept}
          onClose={handleCloseConcept}
          onNavigate={handleConceptClick}
        />
      )}
    </div>
    </ToasterProvider>
  );
}

export default App;
