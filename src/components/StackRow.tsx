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
      className={`flex items-center gap-2 p-2 rounded-ot-md border will-change-transform ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${
        isCurrentRsp
          ? 'border-navy bg-navy-bg shadow-ot-md'
          : 'border-ot-border bg-ot-surface hover:border-ot-muted'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag stack item ${index}`}
        className="cursor-grab active:cursor-grabbing text-ot-muted hover:text-ot-text"
      >
        <GripVertical size={16} aria-hidden />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-mono text-ot-muted w-8">[{index}]</span>
        {isGadget ? (
          <Cpu size={16} aria-hidden className="text-info flex-shrink-0" />
        ) : (
          <Hash size={16} aria-hidden className="text-warning flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-sm font-medium ${
            isCurrentRsp ? 'text-success' : 'text-ot-text'
          }`}>
            {item.value}
          </span>
          {item.label && (
            <span className="ml-2 text-xs text-ot-muted">({item.label})</span>
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
        aria-label={`Remove stack item ${index}`}
        className="grid h-8 w-8 place-items-center rounded-ot-sm text-ot-muted hover:text-danger transition-colors"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
});

StackRow.displayName = 'StackRow';
