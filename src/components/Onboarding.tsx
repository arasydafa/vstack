import { memo, useState } from 'react';
import { Modal, Button, Stepper } from '@omega-os/ui';
import { Rocket } from 'lucide-react';

const STEPS = [
  {
    id: 'goal',
    label: 'Goal',
    description: 'Spawn shell via execve',
    body: 'Pick a level (L0→L4). Goal banner shows checklist. L3 needs RAX=0x3b, RDI=/bin/sh, RSI=0, RDX=0, then SYSCALL.',
  },
  {
    id: 'build',
    label: 'Build',
    description: 'Drag or Add gadgets',
    body: 'Drag from Gadget Library to Stack Memory, or press Add (keyboard/mobile). Each POP needs 1 data slot after it. Watch address + ASCII per row.',
  },
  {
    id: 'run',
    label: 'Run',
    description: 'Step / Run / Back',
    body: 'Step once, or Run with speed slider. Green flash = register changed. Use Back to rewind. Red rows = layout issues from static validator.',
  },
];

export const Onboarding = memo(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState('goal');
  const current = STEPS.find((s) => s.id === step) ?? STEPS[0];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="VStack in 3 steps"
      icon={<Rocket size={16} aria-hidden className="text-navy-text" />}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Skip
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const idx = STEPS.findIndex((s) => s.id === step);
              if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
              else onClose();
            }}
          >
            {step === 'run' ? 'Start building' : 'Next'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Stepper steps={STEPS} current={step} onStep={setStep} label="Onboarding" />
        <p className="text-sm">{current.body}</p>
      </div>
    </Modal>
  );
});

Onboarding.displayName = 'Onboarding';
