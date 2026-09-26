/**
 * Static ROP chain validator (no execution).
 * Walks stack items symbolically to catch layout errors early.
 *
 * @module utils/validateChain
 */

import type { StackItem } from '../types';
import { GADGETS } from '../data/gadgets';

const gadgetByAddress = new Map(GADGETS.map((g) => [g.address.toLowerCase(), g]));
const gadgetById = new Map(GADGETS.map((g) => [g.id, g]));

export interface ChainIssue {
  index: number;
  message: string;
}

const findGadget = (item: StackItem) =>
  (item.gadgetId && gadgetById.get(item.gadgetId)) ||
  gadgetByAddress.get(item.value.toLowerCase());

/**
 * Validate stack layout without running the CPU.
 * Returns per-index issues for highlighting in StackCanvas.
 */
export const validateChain = (items: StackItem[]): ChainIssue[] => {
  const issues: ChainIssue[] = [];
  if (items.length > 0 && items[0].type === 'value') {
    issues.push({ index: 0, message: 'Chain must start with a gadget address, not a data value' });
  }

  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.type === 'value') {
      i += 1;
      continue;
    }
    const gadget = findGadget(item);
    if (!gadget) {
      issues.push({ index: i, message: `Unknown gadget ${item.value}` });
      i += 1;
      continue;
    }
    const popCount = gadget.instructions.filter((ins) =>
      ins.toUpperCase().startsWith('POP '),
    ).length;

    if (popCount > 0) {
      const missing: number[] = [];
      for (let k = 1; k <= popCount; k++) {
        if (i + k >= items.length) missing.push(k);
      }
      if (missing.length > 0) {
        issues.push({
          index: i,
          message: `${gadget.instructions.join('; ')} needs ${popCount} data slot(s) after it`,
        });
        break; // trailing missing, stop to avoid cascade
      }
      i += 1 + popCount;
      continue;
    }

    // No POP (RET / NOP / SYSCALL / bare): consumes only its own slot.
    // Trailing RET at end-of-chain is a valid chain end.
    i += 1;
  }

  return issues;
};
