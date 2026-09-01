/**
 * Hover tooltip that shows a concept preview with a "Learn more" link.
 * Wraps children elements to add tooltip on hover.
 *
 * @module components/ConceptTooltip
 */

import { useState } from 'react';
import { CONCEPTS } from '../data/concepts';
import { BookOpen } from 'lucide-react';

/** Props for the ConceptTooltip component. */
interface ConceptTooltipProps {
  /** ID of the concept to show in the tooltip. */
  conceptId: string;
  /** The element to wrap with the tooltip trigger. */
  children: React.ReactNode;
  /** Callback when "Click to learn more" is clicked. */
  onConceptClick: (conceptId: string) => void;
}

/**
 * Hover tooltip that displays a concept preview above the wrapped element.
 *
 * Shows a floating card with:
 * - Concept title and icon
 * - Short summary text
 * - "Click to learn more" link that opens the ConceptModal
 *
 * The tooltip appears on mouse enter and disappears on mouse leave.
 * If the concept ID is not found, renders children without the tooltip.
 *
 * @param props - ConceptTooltipProps with conceptId, children, and click handler.
 * @returns The wrapped children with a hover tooltip overlay.
 */
export const ConceptTooltip = ({ conceptId, children, onConceptClick }: ConceptTooltipProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const concept = CONCEPTS.find(c => c.id === conceptId);

  if (!concept) return <>{children}</>;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-cyber-blue" />
            <span className="font-medium text-zinc-200 text-sm">{concept.title}</span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">{concept.summary}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConceptClick(conceptId);
            }}
            className="text-xs text-cyber-blue hover:underline pointer-events-auto"
          >
            Click to learn more
          </button>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
};
