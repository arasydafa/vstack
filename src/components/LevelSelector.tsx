import { memo } from 'react';
import { LEVELS } from '../curriculum/levels';
import { Stepper } from '@omega-os/ui';

interface LevelSelectorProps {
  currentId: string;
  completed: Record<string, boolean>;
  onSelect: (id: string) => void;
}

export const LevelSelector = memo(({ currentId, completed, onSelect }: LevelSelectorProps) => {
  void completed;
  return (
    <div className="px-4 py-3 border-b border-ot-border bg-ot-surface">
      <Stepper
        steps={LEVELS.map((l) => ({ id: l.id, label: l.short, description: l.title }))}
        current={currentId}
        onStep={onSelect}
        label="Curriculum levels"
      />
    </div>
  );
});

LevelSelector.displayName = 'LevelSelector';
