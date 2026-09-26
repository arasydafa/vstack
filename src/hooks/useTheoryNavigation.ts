import { useState, useCallback } from 'react';

export const useTheoryNavigation = () => {
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const openTheory = useCallback(() => setTheoryOpen(true), []);
  const closeTheory = useCallback(() => setTheoryOpen(false), []);
  const openConcept = useCallback((id: string) => setSelectedConcept(id), []);
  const closeConcept = useCallback(() => setSelectedConcept(null), []);

  return {
    theoryOpen,
    selectedConcept,
    openTheory,
    closeTheory,
    openConcept,
    closeConcept,
  };
};
