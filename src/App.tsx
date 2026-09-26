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

import { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { StackItem, Gadget } from './types';
import { GadgetLibrary } from './components/GadgetLibrary';
import { StackCanvas } from './components/StackCanvas';
import { CpuMonitor } from './components/CpuMonitor';
import { TheorySidebar } from './components/TheorySidebar';
import { ConceptModal } from './components/ConceptModal';
import { LevelSelector } from './components/LevelSelector';
import { LevelGoal } from './components/LevelGoal';
import { Onboarding } from './components/Onboarding';
import { useCpu } from './hooks/useCpu';
import { LEVELS, getLevel, evalLevelChecks, isLevelComplete, loadProgress, saveLevelComplete } from './curriculum/levels';
import { Shield, Terminal, BookOpen, Sun, Moon, HelpCircle } from 'lucide-react';
import { Navbar, Button, ToasterProvider, toggleThemeReveal, useToast } from '@omega-os/ui';

/** Auto-incrementing ID generator for unique stack item IDs. */
let nextId = 1;
const generateId = () => `item-${nextId++}-${Math.random().toString(36).slice(2, 7)}`;

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
function AppInner() {
  const { state, stackItems, step, reset, undo, canUndo, stepsTaken, setStackItems, insertItem, removeItem, clearStack } = useCpu();
  const [activeItem, setActiveItem] = useState<StackItem | Gadget | null>(null);
  const toast = useToast();

  // Curriculum level state
  const [levelId, setLevelId] = useState(() => localStorage.getItem('vstack-level-v1') ?? LEVELS[0].id);
  const [progress, setProgress] = useState<Record<string, boolean>>(() => loadProgress());
  const level = useMemo(() => getLevel(levelId), [levelId]);
  const checks = useMemo(
    () => evalLevelChecks(level, { status: state.status, registers: state.registers, items: stackItems }),
    [level, state.status, state.registers, stackItems],
  );
  const levelDone = isLevelComplete(checks);
  const overallDone = LEVELS.filter((l) => progress[l.id]).length;

  useEffect(() => {
    localStorage.setItem('vstack-level-v1', levelId);
  }, [levelId]);

  useEffect(() => {
    if (levelDone && !progress[level.id]) {
      saveLevelComplete(level.id);
      setProgress((p) => ({ ...p, [level.id]: true }));
      toast.show('success', `Level complete: ${level.short}`);
    }
  }, [levelDone, level.id, progress, toast, level.short]);

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

  // Configure sensors: pointer + touch + keyboard (a11y/mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Onboarding state (omega-os Modal+Stepper inside Onboarding component)
  const [onboardingOpen, setOnboardingOpen] = useState(
    () => typeof localStorage !== 'undefined' && !localStorage.getItem('vstack-onboarded-v1'),
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

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

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

  const handleSelectLevel = useCallback((id: string) => {
    setLevelId(id);
  }, []);

  const handleLoadExample = useCallback(() => {
    const chain: StackItem[] = level.exampleChain.map((e) => ({
      id: generateId(),
      type: e.type,
      value: e.value,
      gadgetId: e.gadgetId,
      label: e.label,
    }));
    setStackItems(chain);
  }, [level, setStackItems]);

  const handleAddGadget = useCallback((gadget: Gadget) => {
    const newItem: StackItem = {
      id: generateId(),
      type: 'gadget',
      value: gadget.address,
      gadgetId: gadget.id,
      label: gadget.instructions.join('; '),
    };
    insertItem(newItem, stackItems.length);
  }, [insertItem, stackItems.length]);

  const handleCloseOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    try { localStorage.setItem('vstack-onboarded-v1', '1'); } catch { /* ignore */ }
  }, []);

  const handleReplayOnboarding = useCallback(() => {
    setOnboardingOpen(true);
  }, []);

  return (
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
                <Button variant="secondary" size="sm" icon={<HelpCircle size={16} />} onClick={handleReplayOnboarding}>
                  Guide
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
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden">
            <LevelSelector currentId={level.id} completed={progress} onSelect={handleSelectLevel} />
            <LevelGoal
              level={level}
              checks={checks}
              overallDone={overallDone}
              overallTotal={LEVELS.length}
              onLoadExample={handleLoadExample}
              onConceptClick={handleConceptClick}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-120px)]">
            <div className="lg:col-span-3 bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden min-h-[320px] lg:min-h-0">
              <GadgetLibrary allowedGadgetIds={level.allowedGadgetIds} onAdd={handleAddGadget} onConceptClick={handleConceptClick} />
            </div>

            <div className="lg:col-span-5 bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden min-h-[360px] lg:min-h-0">
              <StackCanvas
                items={stackItems}
                currentRsp={state.rsp}
                onRemoveItem={handleRemoveItem}
                onInsertValue={handleInsertValue}
                onClearAll={handleClearAll}
              />
            </div>

            <div className="lg:col-span-4 bg-ot-surface rounded-ot-lg border border-ot-border overflow-hidden min-h-[360px] lg:min-h-0">
              <CpuMonitor
                state={state}
                items={stackItems}
                onStep={handleStep}
                onReset={handleReset}
                onUndo={handleUndo}
                canUndo={canUndo}
                stepsTaken={stepsTaken}
                onConceptClick={handleConceptClick}
              />
            </div>
          </div>
        </main>

        <DragOverlay>
          {activeItem && 'instructions' in activeItem && (
            <div className="p-3 rounded-ot-md border border-navy bg-ot-surface shadow-ot-md w-64">
              <div className="font-mono text-sm text-navy-text">
                {(activeItem as Gadget).instructions.join('; ')}
              </div>
              <div className="text-xs text-ot-muted mt-1">
                {(activeItem as Gadget).address}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Onboarding open={onboardingOpen} onClose={handleCloseOnboarding} />

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
  );
}

function App() {
  return (
    <ToasterProvider>
      <AppInner />
    </ToasterProvider>
  );
}

export default App;
