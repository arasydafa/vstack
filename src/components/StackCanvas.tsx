import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StackItem } from '../types';
import { VALUES } from '../data/gadgets';
import { StackRow } from './StackRow';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { Button, EmptyState } from '@omega-os/ui';

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
      <div className="p-4 border-b border-ot-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ot-text flex items-center gap-2">
            <Layers size={20} aria-hidden className="text-navy-text" />
            Stack Memory
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-ot-muted">RSP:</span>
            <span className="text-xs font-mono text-success">[{currentRsp}]</span>
            {items.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} aria-hidden />}
                onClick={onClearAll}
                className="ml-2 font-mono"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {VALUES.map((v) => (
            <Button
              key={v.value}
              variant="ghost"
              size="sm"
              icon={<Plus size={14} aria-hidden />}
              onClick={() => onInsertValue(v.value, v.label)}
              className="font-mono"
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-4 space-y-2 ot-transition ${
          isOver ? 'bg-navy-bg' : ''
        }`}
      >
        {items.length === 0 ? (
          <EmptyState
            icon={<Layers size={32} aria-hidden />}
            title="Empty stack"
            description="Drop gadgets here to build your ROP chain"
          />
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
