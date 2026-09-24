import { useEffect, useMemo, useCallback, memo } from 'react';
import { CONCEPTS } from '../data/concepts';
import { X, BookOpen } from 'lucide-react';
import { CodeBlock } from '@omega-os/ui';

/** Props for the ConceptModal component. */
interface ConceptModalProps {
  /** ID of the concept to display. */
  conceptId: string;
  /** Callback to close the modal. */
  onClose: () => void;
  /** Callback to navigate to a different concept (for related concepts). */
  onNavigate: (conceptId: string) => void;
}

/** Pre-built map for O(1) concept lookups. */
const CONCEPTS_MAP = new Map(CONCEPTS.map(c => [c.id, c]));

/**
 * Full-screen modal for displaying detailed concept content.
 *
 * Content sections:
 * - Header with concept title and summary
 * - Main educational content (whitespace-preformatted)
 * - ASCII art diagrams in styled code blocks
 * - Key points as bullet list
 * - Code examples with syntax highlighting
 * - Related concepts as clickable navigation buttons
 *
 * Features:
 * - Closes on Escape key press
 * - Closes on backdrop click
 * - Related concepts navigate within the modal (no close/reopen)
 *
 * @param props - ConceptModalProps with conceptId, close and navigate callbacks.
 * @returns A full-screen modal overlay with scrollable concept content.
 */
export const ConceptModal = memo(({ conceptId, onClose, onNavigate }: ConceptModalProps) => {
  const concept = useMemo(() => CONCEPTS_MAP.get(conceptId), [conceptId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const relatedConcepts = useMemo(() => {
    if (!concept) return [];
    return concept.relatedConcepts
      .map(id => CONCEPTS_MAP.get(id))
      .filter(Boolean);
  }, [concept]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!concept) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop - solid color instead of blur for performance */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-ot-surface rounded-ot-lg border border-ot-border shadow-ot-lg overflow-hidden will-change-transform">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-ot-surface border-b border-ot-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ot-sm bg-navy-bg border border-transparent">
              <BookOpen size={20} aria-hidden className="text-navy-text" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ot-text">{concept.title}</h2>
              <p className="text-sm text-ot-muted">{concept.summary}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close concept"
            className="grid h-8 w-8 place-items-center rounded-ot-sm text-ot-muted hover:bg-ot-surface-2 hover:text-ot-text transition-colors"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          {/* Main Content */}
          <div className="text-ot-text whitespace-pre-wrap leading-relaxed">
            {concept.content}
          </div>

          {/* Diagrams */}
          {concept.diagrams.map((diagram, i) => (
            <CodeBlock key={i} language="diagram" code={diagram} />
          ))}

          {/* Key Points */}
          <div>
            <h3 className="text-lg font-semibold text-ot-text mb-3">Key Points</h3>
            <ul className="space-y-2">
              {concept.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-ot-text">
                  <span className="mt-1 w-2 h-2 rounded-full bg-success flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Examples */}
          {concept.examples.map((example, i) => (
            <div key={i}>
              <h3 className="text-lg font-semibold text-ot-text mb-3">{example.title}</h3>
              <CodeBlock language="asm" code={example.code} />
            </div>
          ))}

          {/* Related Concepts */}
          {relatedConcepts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-ot-text mb-3">Related Concepts</h3>
              <div className="flex flex-wrap gap-3">
                {relatedConcepts.map((related) => related && (
                  <button
                    key={related.id}
                    onClick={() => onNavigate(related.id)}
                    className="px-4 py-2 bg-ot-bg border border-ot-border rounded-ot-md hover:border-navy hover:text-navy-text transition-colors text-sm text-ot-text"
                  >
                    {related.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ConceptModal.displayName = 'ConceptModal';
