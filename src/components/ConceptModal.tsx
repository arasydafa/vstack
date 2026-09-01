/**
 * Full-screen modal displaying detailed educational concept content.
 * Shows diagrams, key points, code examples, and related concepts.
 *
 * @module components/ConceptModal
 */

import { useEffect } from 'react';
import { CONCEPTS } from '../data/concepts';
import { X, BookOpen } from 'lucide-react';

/** Props for the ConceptModal component. */
interface ConceptModalProps {
  /** ID of the concept to display. */
  conceptId: string;
  /** Callback to close the modal. */
  onClose: () => void;
  /** Callback to navigate to a different concept (for related concepts). */
  onNavigate: (conceptId: string) => void;
}

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
export const ConceptModal = ({ conceptId, onClose, onNavigate }: ConceptModalProps) => {
  const concept = CONCEPTS.find(c => c.id === conceptId);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!concept) return null;

  const relatedConcepts = concept.relatedConcepts
    .map(id => CONCEPTS.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
              <BookOpen className="w-5 h-5 text-cyber-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{concept.title}</h2>
              <p className="text-sm text-zinc-500">{concept.summary}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          {/* Main Content */}
          <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {concept.content}
          </div>

          {/* Diagrams */}
          {concept.diagrams.map((diagram, i) => (
            <div key={i} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <pre className="font-mono text-sm text-cyber-green whitespace-pre overflow-x-auto">
                {diagram}
              </pre>
            </div>
          ))}

          {/* Key Points */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-3">Key Points</h3>
            <ul className="space-y-2">
              {concept.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-zinc-300">
                  <span className="mt-1 w-2 h-2 rounded-full bg-cyber-green flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Examples */}
          {concept.examples.map((example, i) => (
            <div key={i}>
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">{example.title}</h3>
              <pre className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 font-mono text-sm text-cyber-blue overflow-x-auto">
                {example.code}
              </pre>
            </div>
          ))}

          {/* Related Concepts */}
          {relatedConcepts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">Related Concepts</h3>
              <div className="flex flex-wrap gap-3">
                {relatedConcepts.map((related) => related && (
                  <button
                    key={related.id}
                    onClick={() => onNavigate(related.id)}
                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-cyber-blue hover:text-cyber-blue transition-colors text-sm"
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
};
