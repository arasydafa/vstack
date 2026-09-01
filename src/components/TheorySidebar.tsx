/**
 * Slide-out sidebar listing all educational concepts by category.
 * Provides navigation to ConceptModal for detailed content.
 *
 * @module components/TheorySidebar
 */

import { useEffect } from 'react';
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

/**
 * Visual configuration for each concept category.
 * Determines icon, text color, and label.
 */
const categoryConfig = {
  fundamentals: { icon: BookOpen, color: 'text-cyber-blue', label: 'Fundamentals' },
  'rop-technique': { icon: Code, color: 'text-cyber-green', label: 'ROP Technique' },
  security: { icon: Lock, color: 'text-cyber-purple', label: 'Security' },
};

/**
 * Slide-out sidebar from the right edge of the screen.
 *
 * Features:
 * - Backdrop overlay with blur effect
 * - Three categories: Fundamentals, ROP Technique, Security
 * - Each concept shows title and summary
 * - Clicking a concept closes sidebar and opens ConceptModal
 * - Body scroll is locked when sidebar is open
 *
 * @param props - TheorySidebarProps with open state and callbacks.
 * @returns A slide-out sidebar with backdrop overlay.
 */
export const TheorySidebar = ({ isOpen, onClose, onConceptSelect }: TheorySidebarProps) => {
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

  const categories = ['fundamentals', 'rop-technique', 'security'] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-[95] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-green/10 border border-cyber-green/30">
              <BookOpen className="w-5 h-5 text-cyber-green" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Theory & Concepts</h2>
              <p className="text-xs text-zinc-500">Learn ROP fundamentals</p>
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
        <div className="p-4 overflow-y-auto h-[calc(100vh-72px)] space-y-6">
          {categories.map((category) => {
            const config = categoryConfig[category];
            const Icon = config.icon;
            const concepts = CONCEPTS.filter(c => c.category === category);

            return (
              <div key={category}>
                <h3 className={`text-sm font-semibold ${config.color} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                  <Icon className="w-4 h-4" />
                  {config.label}
                </h3>
                <div className="space-y-2">
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      onClick={() => {
                        onConceptSelect(concept.id);
                        onClose();
                      }}
                      className="w-full text-left p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-cyber-blue hover:bg-zinc-800 transition-all group"
                    >
                      <div className="font-medium text-zinc-200 group-hover:text-cyber-blue transition-colors">
                        {concept.title}
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">
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
};
