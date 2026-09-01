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
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const concept = useMemo(() => CONCEPTS_MAP.get(conceptId), [conceptId]);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptClick(conceptId);
  }, [onConceptClick, conceptId]);

  if (!concept) return <>{children}</>;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isHovered && (
        <div 
          className="absolute z-[200] top-full left-0 mt-2 w-64 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-cyber-blue" />
            <span className="font-medium text-zinc-200 text-sm">{concept.title}</span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">{concept.summary}</p>
          <button
            onClick={handleClick}
            className="text-xs text-cyber-blue hover:underline"
          >
            Click to learn more
          </button>
          {/* Arrow */}
          <div className="absolute bottom-full left-4 -mb-1">
            <div className="w-2 h-2 bg-zinc-800 border-l border-t border-zinc-700 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
});

ConceptTooltip.displayName = 'ConceptTooltip';
