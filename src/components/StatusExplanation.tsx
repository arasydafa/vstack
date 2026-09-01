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
 * Determines icon, text color, background, and border color.
 */
const severityConfig = {
  error: { icon: AlertTriangle, color: 'text-cyber-red', bg: 'bg-cyber-red/10', border: 'border-cyber-red/30' },
  warning: { icon: AlertCircle, color: 'text-cyber-yellow', bg: 'bg-cyber-yellow/10', border: 'border-cyber-yellow/30' },
  info: { icon: Info, color: 'text-cyber-blue', bg: 'bg-cyber-blue/10', border: 'border-cyber-blue/30' },
  success: { icon: CheckCircle, color: 'text-cyber-green', bg: 'bg-cyber-green/10', border: 'border-cyber-green/30' },
};

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
    <div className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden`}>
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`font-medium text-sm ${config.color}`}>{explanation.title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-zinc-700/50">
          {/* What Happened */}
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">What Happened</h4>
            <p className="text-sm text-zinc-300">{explanation.whatHappened}</p>
          </div>

          {/* Why It Matters */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Why This Matters</h4>
            <p className="text-sm text-zinc-300">{explanation.whyItMatters}</p>
          </div>

          {/* How to Fix */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">How to Fix</h4>
            <ul className="text-sm text-zinc-300 space-y-1">
              {explanation.howToFix.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-500">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn More */}
          {explanation.relatedConcepts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Learn More</h4>
              <div className="flex flex-wrap gap-2">
                {explanation.relatedConcepts.map((conceptId) => (
                  <button
                    key={conceptId}
                    onClick={() => onConceptClick(conceptId)}
                    className="px-3 py-1 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded-full hover:border-cyber-blue hover:text-cyber-blue transition-colors"
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
