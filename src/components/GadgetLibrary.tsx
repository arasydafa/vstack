import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Gadget } from '../types';
import { GADGETS } from '../data/gadgets';
import { Cpu, GripVertical, Plus, HelpCircle } from 'lucide-react';
import { Badge, Button } from '@omega-os/ui';

const gadgetEffect = (g: Gadget): string => {
  const ins = g.instructions.join('; ').toUpperCase();
  if (ins.includes('SYSCALL')) return 'will syscall';
  if (ins === 'RET') return 'RSP += 8 (align)';
  if (ins.includes('NOP')) return 'no-op';
  const pops = [...ins.matchAll(/POP\s+(RAX|RDI|RSI|RDX)/g)].map((m) => m[1]);
  return pops.length > 0 ? `will set ${pops.join('+')}` : 'chain';
};

const gadgetConcept = (g: Gadget): string => {
  const ins = g.instructions.join('; ').toUpperCase();
  if (ins.includes('SYSCALL')) return 'execve';
  if (ins === 'RET' || ins.includes('NOP')) return 'stack-alignment';
  if (ins.includes('POP RAX')) return 'execve';
  if (ins.includes('POP RDI') && ins.includes('POP RSI')) return 'reading-gadgets';
  if (ins.includes('POP')) return 'calling-convention';
  return 'gadgets';
};

/** Props for the DraggableGadget component. */
interface DraggableGadgetProps {
  /** The gadget data to display and make draggable. */
  gadget: Gadget;
  onAdd?: (gadget: Gadget) => void;
  onConceptClick?: (conceptId: string) => void;
}

/**
 * A single draggable gadget card showing its address, instructions, and description.
 * When dragged onto the StackCanvas, it creates a new StackItem.
 *
 * @param props - DraggableGadgetProps containing the gadget data.
 * @returns A draggable card element with visual feedback during drag.
 */
const DraggableGadget = memo(({ gadget, onAdd, onConceptClick }: DraggableGadgetProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gadget-${gadget.id}`,
    data: {
      type: 'gadget',
      gadget,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-ot-md border border-ot-border bg-ot-surface p-3 cursor-grab active:cursor-grabbing ot-transition hover:border-navy will-change-transform ${
        isDragging ? 'opacity-50 shadow-ot-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical size={16} aria-hidden className="text-ot-muted" />
          <Cpu size={16} aria-hidden className="text-navy-text" />
        </div>
        <span className="font-mono text-xs text-navy-text">{gadget.address}</span>
      </div>
      <div className="mt-2 ml-6">
        <div className="font-mono text-sm font-medium text-ot-text">
          {gadget.instructions.join('; ')}
        </div>
        <div className="text-xs text-ot-muted mt-1">{gadget.description}</div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="info">{gadgetEffect(gadget)}</Badge>
          {onAdd && (
            <Button size="sm" variant="solid" icon={<Plus size={12} aria-hidden />} onClick={(e) => { e.stopPropagation(); onAdd(gadget); }} aria-label={`Add ${gadget.instructions.join('; ')} to stack`}>
              Add
            </Button>
          )}
          {onConceptClick && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onConceptClick(gadgetConcept(gadget)); }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={`Learn about ${gadget.instructions.join('; ')}`}
              className="grid h-7 w-7 place-items-center rounded-ot-sm text-ot-muted hover:bg-ot-surface-2 hover:text-ot-text"
            >
              <HelpCircle size={14} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

DraggableGadget.displayName = 'DraggableGadget';

/**
 * Sidebar panel displaying all available ROP gadgets.
 * Users can drag gadgets from this panel onto the StackCanvas.
 *
 * Renders a scrollable list of DraggableGadget cards, one for each
 * gadget in the GADGETS array.
 *
 * @returns A panel with header and scrollable gadget list.
 */
export const GadgetLibrary = memo(({ allowedGadgetIds, onAdd, onConceptClick }: { allowedGadgetIds?: string[]; onAdd?: (gadget: Gadget) => void; onConceptClick?: (id: string) => void } = {}) => {
  const visible = !allowedGadgetIds || allowedGadgetIds.length === 0
    ? GADGETS
    : GADGETS.filter((g) => allowedGadgetIds.includes(g.id));
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ot-border">
        <h2 className="text-lg font-semibold text-ot-text flex items-center gap-2">
          <Cpu size={20} aria-hidden className="text-navy-text" />
          Gadget Library
        </h2>
        <p className="text-sm text-ot-muted mt-1">Drag or Add gadgets to the stack</p>
        {allowedGadgetIds && allowedGadgetIds.length > 0 && (
          <p className="text-xs text-ot-muted mt-1">Restricted: {visible.length}/{GADGETS.length} gadgets for this level</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {visible.map((gadget) => (
          <DraggableGadget key={gadget.id} gadget={gadget} onAdd={onAdd} onConceptClick={onConceptClick} />
        ))}
      </div>
    </div>
  );
});

GadgetLibrary.displayName = 'GadgetLibrary';
