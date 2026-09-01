import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Gadget } from '../types';
import { GADGETS } from '../data/gadgets';
import { Cpu, GripVertical } from 'lucide-react';

/** Props for the DraggableGadget component. */
interface DraggableGadgetProps {
  /** The gadget data to display and make draggable. */
  gadget: Gadget;
}

/**
 * A single draggable gadget card showing its address, instructions, and description.
 * When dragged onto the StackCanvas, it creates a new StackItem.
 *
 * @param props - DraggableGadgetProps containing the gadget data.
 * @returns A draggable card element with visual feedback during drag.
 */
const DraggableGadget = memo(({ gadget }: DraggableGadgetProps) => {
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
      className={`p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-grab active:cursor-grabbing transition-colors duration-150 hover:border-cyber-blue hover:bg-zinc-800 will-change-transform ${
        isDragging ? 'opacity-50 z-50 shadow-lg shadow-cyber-blue/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-zinc-500" />
          <Cpu className="w-4 h-4 text-cyber-blue" />
        </div>
        <span className="font-mono text-xs text-cyber-blue">{gadget.address}</span>
      </div>
      <div className="mt-2 ml-6">
        <div className="font-mono text-sm font-medium text-zinc-200">
          {gadget.instructions.join('; ')}
        </div>
        <div className="text-xs text-zinc-500 mt-1">{gadget.description}</div>
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
export const GadgetLibrary = memo(() => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyber-blue" />
          Gadget Library
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Drag gadgets to the stack</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {GADGETS.map((gadget) => (
          <DraggableGadget key={gadget.id} gadget={gadget} />
        ))}
      </div>
    </div>
  );
});

GadgetLibrary.displayName = 'GadgetLibrary';
