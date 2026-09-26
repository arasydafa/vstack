/**
 * React hook for managing simulated CPU state with useReducer.
 * Provides step/reset/stack manipulation actions for the ROP chain builder.
 *
 * @module hooks/useCpu
 */

import { useReducer, useCallback } from 'react';
import { CpuState, StackItem } from '../types';
import { executeStep, getInitialCpuState } from '../engine/CpuEngine';
import { getGadgetMap } from '../data/gadgets';

const gadgetMap = getGadgetMap();

/** Extended state that includes both CPU state and UI stack items. */
interface CpuReducerState {
  cpu: CpuState;
  stackItems: StackItem[];
  /** Bounded execution history for UNDO/BACK (Fase 2). */
  history: CpuReducerState[];
}

/** Actions for the CPU reducer. */
type CpuReducerAction =
  | { type: 'STEP' }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'SET_STACK_ITEMS'; payload: StackItem[] }
  | { type: 'SET_STACK_ITEMS_UPDATER'; payload: (prev: StackItem[]) => StackItem[] }
  | { type: 'INSERT_ITEM'; payload: { item: StackItem; index: number } }
  | { type: 'REMOVE_ITEM'; payload: { index: number } }
  | { type: 'REORDER_STACK'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'CLEAR_STACK' }
  | { type: 'SET_STATUS'; payload: CpuState['status'] };

const HISTORY_LIMIT = 100;

const snapshot = (s: CpuReducerState): CpuReducerState => ({
  cpu: { ...s.cpu, registers: { ...s.cpu.registers }, stack: [...s.cpu.stack], stackItems: [...s.cpu.stackItems] },
  stackItems: [...s.stackItems],
  history: [],
});

const pushHistory = (prev: CpuReducerState, next: Omit<CpuReducerState, 'history'>): CpuReducerState => ({
  ...next,
  history: [...prev.history, snapshot(prev)].slice(-HISTORY_LIMIT),
});

/**
 * Reducer that handles all CPU and stack state transitions.
 */
const cpuReducer = (state: CpuReducerState, action: CpuReducerAction): CpuReducerState => {
  switch (action.type) {
    case 'STEP': {
      const newCpu = executeStep(state.cpu, gadgetMap);
      // No state change (already terminal) → don't pollute history
      if (newCpu === state.cpu) return state;
      return pushHistory(state, { cpu: newCpu, stackItems: state.stackItems });
    }

    case 'RESET': {
      const newCpu = getInitialCpuState(state.cpu.stack, state.stackItems);
      return { cpu: newCpu, stackItems: state.stackItems, history: [] };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        cpu: prev.cpu,
        stackItems: prev.stackItems,
        history: state.history.slice(0, -1),
      };
    }

    case 'SET_STACK_ITEMS': {
      const newStack = action.payload.map(item => item.value);
      const newCpu = getInitialCpuState(newStack, action.payload);
      return { cpu: newCpu, stackItems: action.payload, history: [] };
    }

    case 'SET_STACK_ITEMS_UPDATER': {
      const newStackItems = action.payload(state.stackItems);
      const newStack = newStackItems.map(item => item.value);
      const newCpu = getInitialCpuState(newStack, newStackItems);
      return { cpu: newCpu, stackItems: newStackItems, history: [] };
    }

    case 'INSERT_ITEM': {
      const newStackItems = [...state.stackItems];
      newStackItems.splice(action.payload.index, 0, action.payload.item);
      const newStack = newStackItems.map(item => item.value);
      const newRsp = state.cpu.rsp >= action.payload.index ? state.cpu.rsp + 1 : state.cpu.rsp;
      return {
        stackItems: newStackItems,
        history: [],
        cpu: {
          ...state.cpu,
          stack: newStack,
          rsp: newRsp,
        },
      };
    }

    case 'REMOVE_ITEM': {
      const newStackItems = [...state.stackItems];
      newStackItems.splice(action.payload.index, 1);
      const newStack = newStackItems.map(item => item.value);
      const newRsp = state.cpu.rsp > action.payload.index
        ? state.cpu.rsp - 1
        : state.cpu.rsp === action.payload.index && state.cpu.rsp >= newStack.length
          ? newStack.length
          : state.cpu.rsp;
      return {
        stackItems: newStackItems,
        history: [],
        cpu: {
          ...state.cpu,
          stack: newStack,
          rsp: newRsp,
        },
      };
    }

    case 'REORDER_STACK': {
      const newStackItems = [...state.stackItems];
      const [removed] = newStackItems.splice(action.payload.fromIndex, 1);
      newStackItems.splice(action.payload.toIndex, 0, removed);
      const newStack = newStackItems.map(item => item.value);
      return {
        stackItems: newStackItems,
        history: [],
        cpu: {
          ...state.cpu,
          stack: newStack,
        },
      };
    }

    case 'SET_STATUS': {
      return {
        ...state,
        cpu: { ...state.cpu, status: action.payload },
      };
    }

    case 'CLEAR_STACK': {
      const newCpu = getInitialCpuState([]);
      return { cpu: newCpu, stackItems: [], history: [] };
    }

    default:
      return state;
  }
};

/**
 * Custom hook that provides CPU simulation state and control actions.
 *
 * @returns An object containing:
 *   - `state`: Current CpuState with registers, stack, and status
 *   - `stackItems`: Current stack items for UI display
 *   - `step()`: Execute one CPU instruction
 *   - `reset()`: Reset CPU state while preserving the stack
 *   - `setStackItems(items)`: Replace the entire stack from StackItem array
 *   - `insertItem(item, index)`: Insert a StackItem at a specific index
 *   - `removeItem(index)`: Remove the item at a specific index
 *   - `reorderStack(from, to)`: Move an item from one index to another
 */
export const useCpu = () => {
  const initialState: CpuReducerState = {
    cpu: getInitialCpuState([]),
    stackItems: [],
    history: [],
  };
  const [reducerState, dispatch] = useReducer(cpuReducer, initialState);

  const step = useCallback(() => dispatch({ type: 'STEP' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const setStackItems = useCallback((itemsOrUpdater: StackItem[] | ((prev: StackItem[]) => StackItem[])) => {
    if (typeof itemsOrUpdater === 'function') {
      // We need to get the current items to pass to the updater
      // This is a limitation of useReducer - we'll use a ref pattern
      dispatch({ type: 'SET_STACK_ITEMS_UPDATER', payload: itemsOrUpdater });
    } else {
      dispatch({ type: 'SET_STACK_ITEMS', payload: itemsOrUpdater });
    }
  }, []);
  const insertItem = useCallback((item: StackItem, index: number) =>
    dispatch({ type: 'INSERT_ITEM', payload: { item, index } }), []);
  const removeItem = useCallback((index: number) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { index } }), []);
  const reorderStack = useCallback((fromIndex: number, toIndex: number) =>
    dispatch({ type: 'REORDER_STACK', payload: { fromIndex, toIndex } }), []);
  const clearStack = useCallback(() => dispatch({ type: 'CLEAR_STACK' }), []);

  return {
    state: reducerState.cpu,
    stackItems: reducerState.stackItems,
    canUndo: reducerState.history.length > 0,
    stepsTaken: reducerState.history.length,
    step,
    reset,
    undo,
    setStackItems,
    insertItem,
    removeItem,
    reorderStack,
    clearStack,
  };
};
