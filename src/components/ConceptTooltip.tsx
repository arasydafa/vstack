import { useState, useRef, useMemo, useCallback, memo } from 'react';
import { CONCEPTS } from '../data/concepts';
import { BookOpen } from 'lucide-react';

interface ConceptTooltipProps {
  conceptId: string;
  children: React.ReactNode;
  onConceptClick: (conceptId: string) => void;
}

/** Pre-built map for O(1) concept lookups. */
const CONCEPTS_MAP = new Map(CONCEPTS.map(c => [c.id, c]));

export const ConceptTooltip = memo(({ conceptId, children, onConceptClick }: ConceptTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const concept = useMemo(() => CONCEPTS_MAP.get(conceptId), [conceptId]);

  const open = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptClick(conceptId);
  }, [onConceptClick, conceptId]);

  if (!concept) return <>{children}</>;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <span
        tabIndex={0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Learn about ${concept.title}`}
        onClick={toggle}
        onFocus={open}
        onBlur={scheduleClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
        className="cursor-help border-b border-dashed border-ot-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-sm"
      >
        {children}
      </span>

      {isOpen && (
        <div
          className="absolute z-[200] top-full left-0 mt-2 w-64 p-3 bg-ot-surface border border-ot-border rounded-ot-md shadow-ot-md"
          onMouseEnter={open}
          onMouseLeave={scheduleClose}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} aria-hidden className="text-navy-text" />
            <span className="font-medium text-ot-text text-sm">{concept.title}</span>
          </div>
          <p className="text-xs text-ot-muted mb-2">{concept.summary}</p>
          <button
            onClick={handleClick}
            className="text-xs text-navy-text hover:underline"
          >
            Click to learn more
          </button>
          {/* Arrow */}
          <div className="absolute bottom-full left-4 -mb-1">
            <div className="w-2 h-2 bg-ot-surface border-l border-t border-ot-border transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
});

ConceptTooltip.displayName = 'ConceptTooltip';
