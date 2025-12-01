import { useState, useCallback, useRef } from 'react';

export function useUndo<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  
  // We need to expose a way to reset history (e.g. after loading initial data)
  const resetHistory = useCallback((newState: T) => {
    setState(newState);
    setPast([]);
    setFuture([]);
  }, []);

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const calculatedState = typeof newState === 'function' ? (newState as Function)(currentState) : newState;
      
      // Optional: Deep equality check to prevent history spam? 
      // For now, assume caller only calls set when things change.
      
      setPast((prev) => {
        // Limit history size? 50 steps seems generous and fine for memory.
        const newPast = [...prev, currentState];
        if (newPast.length > 50) newPast.shift();
        return newPast;
      });
      setFuture([]); // clear future on new change
      
      return calculatedState;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const newPast = [...prev];
      const previousState = newPast.pop();
      
      setState((current) => {
        setFuture((f) => [current, ...f]);
        return previousState as T;
      });
      
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const newFuture = [...prev];
      const nextState = newFuture.shift();
      
      setState((current) => {
        setPast((p) => [...p, current]);
        return nextState as T;
      });
      
      return newFuture;
    });
  }, []);

  return { 
    state, 
    set, 
    undo, 
    redo, 
    canUndo: past.length > 0, 
    canRedo: future.length > 0,
    resetHistory
  };
}
