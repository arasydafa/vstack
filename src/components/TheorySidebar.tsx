import { useEffect, useMemo, useCallback, memo } from 'react';
import { CONCEPTS } from '../data/concepts';
import { X, BookOpen, Code, Lock } from 'lucide-react';

/** Props for the TheorySidebar component. */
interface TheorySidebarProps {
  /** Whether the sidebar is currently visible. */
  isOpen: boolean;
  /** Callback to close the sidebar. */
  onClose: () => void;
  /** Callback when a concept is selected (opens ConceptModal). */
  onConceptSelect: (conceptId: string) => void;
}

/** Visual configuration for each concept category. */
const categoryConfig = {
  fundamentals: { icon: BookOpen, color: 'text-info', label: 'Fundamentals' },
  'rop-technique': { icon: Code, color: 'text-success', label: 'ROP Technique' },
  security: { icon: Lock, color: 'text-navy-text', label: 'Security' },
};

const categories = ['fundamentals', 'rop-technique', 'security'] as const;

/**
 * Slide-out sidebar from the right edge of the screen.
 *
 * Features:
 * - Backdrop overlay with solid color (no blur for performance)
 * - Three categories: Fundamentals, ROP Technique, Security
 * - Each concept shows title and summary
 * - Clicking a concept closes sidebar and opens ConceptModal
 * - Body scroll is locked when sidebar is open
 *
 * @param props - TheorySidebarProps with open state and callbacks.
 * @returns A slide-out sidebar with backdrop overlay.
 */
export const TheorySidebar = memo(({ isOpen, onClose, onConceptSelect }: TheorySidebarProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const conceptsByCategory = useMemo(() => {
    return categories.map(category => ({
      category,
      config: categoryConfig[category],
      concepts: CONCEPTS.filter(c => c.category === category),
    }));
  }, []);

  const handleConceptClick = useCallback((conceptId: string) => {
    onConceptSelect(conceptId);
    onClose();
  }, [onConceptSelect, onClose]);

  return (
    <>
      {/* Backdrop - solid color instead of blur for performance */}
      <div
        className={`fixed inset-0 bg-black/60 z-[90] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-ot-surface border-l border-ot-border z-[95] transform transition-transform duration-300 ease-in-out will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-ot-surface border-b border-ot-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-ot-sm bg-navy-bg border border-transparent">
              <BookOpen size={20} aria-hidden className="text-navy-text" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ot-text">Theory & Concepts</h2>
              <p className="text-xs text-ot-muted">Learn ROP fundamentals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close theory sidebar"
            className="grid h-8 w-8 place-items-center rounded-ot-sm text-ot-muted hover:bg-ot-surface-2 hover:text-ot-text transition-colors"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-72px)] space-y-6">
          {conceptsByCategory.map(({ category, config, concepts }) => {
            const Icon = config.icon;

            return (
              <div key={category}>
                <h3 className={`text-sm font-semibold ${config.color} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                  <Icon size={16} aria-hidden />
                  {config.label}
                </h3>
                <div className="space-y-2">
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      onClick={() => handleConceptClick(concept.id)}
                      className="w-full text-left p-3 rounded-ot-md bg-ot-bg border border-ot-border hover:border-navy transition-colors group"
                    >
                      <div className="font-medium text-ot-text group-hover:text-navy-text transition-colors">
                        {concept.title}
                      </div>
                      <div className="text-sm text-ot-muted mt-1">
                        {concept.summary}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});

TheorySidebar.displayName = 'TheorySidebar';
