/**
 * Expandable explanation panel for CPU execution status.
 * Shows what happened, why it matters, and how to fix errors.
 *
 * @module components/StatusExplanation
 */

import { useState } from 'react';
import { StatusExplanation as StatusExplanationType } from '../types';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

/** Props for the StatusExplanation component. */
interface StatusExplanationProps {
  /** The explanation data to display. */
  explanation: StatusExplanationType;
  /** Callback when a related concept is clicked. */
  onConceptClick: (conceptId: string) => void;
}

/**
 * Visual configuration for each severity level.
 * Maps to OmegaOS status tones (explicit classes for Tailwind).
 */
const severityConfig = {
  error: { icon: AlertTriangle, tone: 'text-danger', bg: 'bg-danger-bg' },
  warning: { icon: AlertCircle, tone: 'text-warning', bg: 'bg-warning-bg' },
  info: { icon: Info, tone: 'text-info', bg: 'bg-info-bg' },
  success: { icon: CheckCircle, tone: 'text-success', bg: 'bg-success-bg' },
} as const;

/**
 * Expandable panel that displays educational feedback for CPU execution states.
 *
 * Collapsed state: Shows title with severity icon and expand/collapse chevron.
 * Expanded state: Shows four sections:
 *   - What Happened: Description of the error/success
 *   - Why This Matters: Relevance to binary exploitation
 *   - How to Fix: Step-by-step remediation
 *   - Learn More: Links to related educational concepts
 *
 * @param props - StatusExplanationProps with explanation data and concept click handler.
 * @returns An expandable explanation panel with severity-based styling.
 */
export const StatusExplanation = ({ explanation, onConceptClick }: StatusExplanationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[explanation.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-ot-md border border-transparent ${config.bg} overflow-hidden`}>
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className={`w-full flex items-center justify-between p-3 transition-colors ${config.tone}`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} aria-hidden />
          <span className="font-medium text-sm">{explanation.title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} aria-hidden className="text-ot-muted" />
        ) : (
          <ChevronDown size={16} aria-hidden className="text-ot-muted" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-ot-border">
          {/* What Happened */}
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-ot-muted uppercase tracking-wider mb-1">What Happened</h4>
            <p className="text-sm text-ot-text">{explanation.whatHappened}</p>
          </div>

          {/* Why It Matters */}
          <div>
            <h4 className="text-xs font-semibold text-ot-muted uppercase tracking-wider mb-1">Why This Matters</h4>
            <p className="text-sm text-ot-text">{explanation.whyItMatters}</p>
          </div>

          {/* How to Fix */}
          <div>
            <h4 className="text-xs font-semibold text-ot-muted uppercase tracking-wider mb-1">How to Fix</h4>
            <ul className="text-sm text-ot-text space-y-1">
              {explanation.howToFix.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-ot-muted">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn More */}
          {explanation.relatedConcepts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ot-muted uppercase tracking-wider mb-2">Learn More</h4>
              <div className="flex flex-wrap gap-2">
                {explanation.relatedConcepts.map((conceptId) => (
                  <button
                    key={conceptId}
                    onClick={() => onConceptClick(conceptId)}
                    className="px-3 py-1 text-xs font-mono bg-ot-bg border border-ot-border rounded-full text-ot-muted hover:border-navy hover:text-navy-text transition-colors"
                  >
                    {conceptId.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
