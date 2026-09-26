import { memo, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StackItem } from '../types';
import { GripVertical, X, Cpu, Hash, AlertTriangle, Check } from 'lucide-react';

/** Props for the StackRow component. */
interface StackRowProps {
  /** The stack item data to display. */
  item: StackItem;
  /** Index of this item in the stack array. */
  index: number;
  /** Realistic memory address string for this slot. */
  address: string;
  /** ASCII preview for this slot. */
  ascii: string;
  /** Whether this row corresponds to the current RSP position. */
  isCurrentRsp: boolean;
  /** Whether this row was already executed (index < rsp). */
  isExecuted: boolean;
  /** Static validation error for this row, if any. */
  validationError?: string;
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
export const StackRow = memo(({ item, index, address, ascii, isCurrentRsp, isExecuted, validationError, onRemove }: StackRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isCurrentRsp) {
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isCurrentRsp]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGadget = item.type === 'gadget';

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    (rowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      ref={setRefs}
      style={style}
      aria-current={isCurrentRsp || undefined}
      className={`flex items-center gap-2 p-2 rounded-ot-md border will-change-transform ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${
        validationError
          ? 'border-danger bg-danger-bg'
          : isCurrentRsp
            ? 'border-navy bg-navy-bg shadow-ot-md'
            : isExecuted
              ? 'border-ot-border bg-ot-surface opacity-60'
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
        <span className="hidden text-[10px] font-mono text-ot-muted xl:block w-28 truncate" title={address}>
          {address}
        </span>
        {isExecuted ? (
          <Check size={14} aria-hidden className="text-success flex-shrink-0" />
        ) : isGadget ? (
          <Cpu size={16} aria-hidden className="text-info flex-shrink-0" />
        ) : (
          <Hash size={16} aria-hidden className="text-warning flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-sm font-medium ${
            validationError ? 'text-danger' : isCurrentRsp ? 'text-success' : isExecuted ? 'text-ot-muted line-through' : 'text-ot-text'
          }`}>
            {item.value}
          </span>
          {item.label && (
            <span className="ml-2 text-xs text-ot-muted">({item.label})</span>
          )}
          <span className="ml-2 font-mono text-[10px] text-ot-muted" title="ASCII preview">
            {ascii}
          </span>
          {isCurrentRsp && (
            <span className="ml-2 text-[10px] font-mono text-success">← next (RSP)</span>
          )}
          {validationError && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-danger">
              <AlertTriangle size={10} aria-hidden /> {validationError}
            </span>
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
