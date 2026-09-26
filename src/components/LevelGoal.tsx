import { memo } from 'react';
import type { LevelDef, CheckResult } from '../curriculum/levels';
import { Alert, Progress, Badge, Button, Accordion } from '@omega-os/ui';
import { Target, Check, Circle, Lightbulb, Upload } from 'lucide-react';

interface LevelGoalProps {
  level: LevelDef;
  checks: CheckResult[];
  overallDone: number;
  overallTotal: number;
  onLoadExample: () => void;
  onConceptClick: (id: string) => void;
}

export const LevelGoal = memo(({ level, checks, overallDone, overallTotal, onLoadExample, onConceptClick }: LevelGoalProps) => {
  const doneCount = checks.filter((c) => c.done).length;
  const complete = checks.length > 0 && doneCount === checks.length;

  return (
    <div className="px-4 py-3 space-y-3 border-b border-ot-border bg-ot-bg">
      <Alert tone={complete ? 'success' : 'info'} title={level.title}>
        {level.description}
      </Alert>

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {checks.map((c) => (
          <Badge key={c.id} tone={c.done ? 'success' : 'grey'}>
            {c.done ? <Check size={12} aria-hidden /> : <Circle size={12} aria-hidden />}
            {c.label}
          </Badge>
        ))}
      </div>

      <Progress value={overallDone} max={overallTotal} tone={complete ? 'success' : 'navy'} label={`Curriculum progress (${overallDone}/${overallTotal})`} />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={<Upload size={14} aria-hidden />} onClick={onLoadExample}>
          Load example
        </Button>
        {level.relatedConcepts.map((cid) => (
          <Button key={cid} size="sm" variant="solid" onClick={() => onConceptClick(cid)}>
            {cid.replace(/-/g, ' ')}
          </Button>
        ))}
      </div>

      <Accordion
        items={[
          {
            id: `${level.id}-hints`,
            title: (
              <span className="inline-flex items-center gap-2">
                <Lightbulb size={14} aria-hidden /> Hints (3 levels)
              </span>
            ),
            content: (
              <ol className="list-decimal ml-4 space-y-1">
                {level.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            ),
          },
        ]}
      />

      <div className="flex items-center gap-2 text-xs text-ot-muted">
        <Target size={12} aria-hidden />
        <span>
          {doneCount}/{checks.length} checks · Allowed gadgets:{' '}
          {level.allowedGadgetIds.length === 0 ? 'all' : level.allowedGadgetIds.length + ' restricted'}
        </span>
      </div>
    </div>
  );
});

LevelGoal.displayName = 'LevelGoal';
