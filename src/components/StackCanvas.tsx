import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StackItem } from '../types';
import { VALUES } from '../data/gadgets';
import { StackRow } from './StackRow';
import { Layers, Plus, Trash2 } from 'lucide-react';

/** Props for the StackCanvas component. */
interface StackCanvasProps {
  /** Array of stack items representing the current ROP chain. */
  items: StackItem[];
  /** Current stack pointer index (highlighted row). */
  currentRsp: number;
  /** Callback to remove an item at the given index. */
  onRemoveItem: (index: number) => void;
  /** Callback to insert a value with a label at the end of the stack. */
  onInsertValue: (value: string, label: string) => void;
  /** Callback to clear all items from the stack. */
  onClearAll: () => void;
}

/**
 * Central canvas displaying the visual stack memory.
 *
 * Features:
 * - Droppable zone for accepting dragged gadgets from GadgetLibrary
 * - Sortable list of StackRow items for reordering
 * - Quick-insert buttons for common values (0x7fff, 0x3b, etc.)
 * - RSP (Stack Pointer) indicator showing current position
 *
 * @param props - StackCanvasProps with items, RSP, and callbacks.
 * @returns A panel with value insertion buttons and sortable stack list.
 */
export const StackCanvas = ({ items, currentRsp, onRemoveItem, onInsertValue, onClearAll }: StackCanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'stack-canvas',
  });

  const itemIds = useMemo(() => items.map(item => item.id), [items]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyber-green" />
            Stack Memory
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">RSP:</span>
            <span className="text-xs font-mono text-cyber-green">[{currentRsp}]</span>
            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="ml-2 px-2 py-1 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded hover:border-cyber-red hover:text-cyber-red transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {VALUES.map((v) => (
            <button
              key={v.value}
              onClick={() => onInsertValue(v.value, v.label)}
              className="px-2 py-1 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded hover:border-cyber-yellow hover:text-cyber-yellow transition-colors"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-4 space-y-2 transition-colors ${
          isOver ? 'bg-cyber-green/5' : ''
        }`}
      >
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Drop gadgets here to build your ROP chain</p>
            </div>
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <StackRow
                key={item.id}
                item={item}
                index={index}
                isCurrentRsp={index === currentRsp}
                onRemove={onRemoveItem}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
