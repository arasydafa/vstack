/**
 * React hook for managing simulated CPU state with useReducer.
 * Provides step/reset/stack manipulation actions for the ROP chain builder.
 *
 * @module hooks/useCpu
 */

import { useReducer, useCallback } from 'react';
import { CpuState, CpuAction, StackItem } from '../types';
import { executeStep, getInitialCpuState } from '../engine/CpuEngine';
import { getGadgetMap } from '../data/gadgets';

const gadgetMap = getGadgetMap();

/**
 * Reducer that handles all CPU state transitions.
 *
 * @param state - Current CPU state.
 * @param action - Discriminated union action to apply.
 * @returns New CPU state after applying the action.
 */
const cpuReducer = (state: CpuState, action: CpuAction): CpuState => {
  switch (action.type) {
    case 'STEP':
      return executeStep(state, gadgetMap);

    case 'RESET':
      return getInitialCpuState(state.stack);

    case 'SET_STACK':
      return getInitialCpuState(action.payload.map(item => item.value));

    case 'INSERT_ITEM': {
      const newStack = [...state.stack];
      newStack.splice(action.payload.index, 0, action.payload.item.value);
      return {
        ...state,
        stack: newStack,
        rsp: state.rsp >= action.payload.index ? state.rsp + 1 : state.rsp,
      };
    }

    case 'REMOVE_ITEM': {
      const newStack = [...state.stack];
      newStack.splice(action.payload.index, 1);
      return {
        ...state,
        stack: newStack,
        rsp: state.rsp > action.payload.index
          ? state.rsp - 1
          : state.rsp === action.payload.index && state.rsp >= newStack.length
            ? newStack.length
            : state.rsp,
      };
    }

    case 'REORDER_STACK': {
      const newStack = [...state.stack];
      const [removed] = newStack.splice(action.payload.fromIndex, 1);
      newStack.splice(action.payload.toIndex, 0, removed);
      return {
        ...state,
        stack: newStack,
      };
    }

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    default:
      return state;
  }
};

/**
 * Custom hook that provides CPU simulation state and control actions.
 *
 * @returns An object containing:
 *   - `state`: Current CpuState with registers, stack, and status
 *   - `step()`: Execute one CPU instruction
 *   - `reset()`: Reset CPU state while preserving the stack
 *   - `setStack(items)`: Replace the entire stack from StackItem array
 *   - `insertItem(item, index)`: Insert a StackItem at a specific index
 *   - `removeItem(index)`: Remove the item at a specific index
 *   - `reorderStack(from, to)`: Move an item from one index to another
 *
 * @example
 * ```tsx
 * const { state, step, reset } = useCpu();
 *
 * // Execute one instruction
 * step();
 *
 * // Reset CPU (keeps stack intact)
 * reset();
 *
 * console.log(state.registers.rax); // '0x3b'
 * console.log(state.status);        // 'RUNNING'
 * ```
 */
export const useCpu = () => {
  const initialState = getInitialCpuState([]);
  const [state, dispatch] = useReducer(cpuReducer, initialState);

  const step = useCallback(() => dispatch({ type: 'STEP' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setStack = useCallback((items: StackItem[]) => dispatch({ type: 'SET_STACK', payload: items }), []);
  const insertItem = useCallback((item: StackItem, index: number) =>
    dispatch({ type: 'INSERT_ITEM', payload: { item, index } }), []);
  const removeItem = useCallback((index: number) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { index } }), []);
  const reorderStack = useCallback((fromIndex: number, toIndex: number) =>
    dispatch({ type: 'REORDER_STACK', payload: { fromIndex, toIndex } }), []);

  return {
    state,
    step,
    reset,
    setStack,
    insertItem,
    removeItem,
    reorderStack,
  };
};
