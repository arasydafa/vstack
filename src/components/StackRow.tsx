import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StackItem } from '../types';
import { GripVertical, X, Cpu, Hash } from 'lucide-react';

/** Props for the StackRow component. */
interface StackRowProps {
  /** The stack item data to display. */
  item: StackItem;
  /** Index of this item in the stack array. */
  index: number;
  /** Whether this row corresponds to the current RSP position. */
  isCurrentRsp: boolean;
  /** Callback to remove this item from the stack. */
  onRemove: (index: number) => void;
}

/**
 * A single sortable stack row with drag handle, value display, and remove button.
 *
 * Visual indicators:
 * - Green highlight when `isCurrentRsp` is true (current stack pointer)
 * - CPU icon for gadget items, Hash icon for data values
 * - Grip handle for drag-and-drop reordering
 * - X button to remove from stack
 *
 * @param props - StackRowProps with item data and callbacks.
 * @returns A sortable row element with interactive controls.
 */
export const StackRow = memo(({ item, index, isCurrentRsp, onRemove }: StackRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGadget = item.type === 'gadget';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border will-change-transform ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${
        isCurrentRsp
          ? 'border-cyber-green bg-cyber-green/10 shadow-lg shadow-cyber-green/30'
          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-mono text-zinc-500 w-8">[{index}]</span>
        {isGadget ? (
          <Cpu className="w-4 h-4 text-cyber-blue flex-shrink-0" />
        ) : (
          <Hash className="w-4 h-4 text-cyber-yellow flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-sm font-medium ${
            isCurrentRsp ? 'text-cyber-green' : 'text-zinc-200'
          }`}>
            {item.value}
          </span>
          {item.label && (
            <span className="ml-2 text-xs text-zinc-500">({item.label})</span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(index);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="text-zinc-500 hover:text-cyber-red transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

StackRow.displayName = 'StackRow';
