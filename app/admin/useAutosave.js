'use client';
import { useRef, useState, useCallback } from 'react';

// Guarda con retardo: la interfaz reacciona al instante y la base se
// actualiza al dejar de escribir (~500ms). Así no se siente lento.
export function useFlash() {
  const [msg, setMsg] = useState('');
  const t = useRef(null);
  const flash = useCallback((m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(''), 1500);
  }, []);
  return [msg, flash];
}

export function useDebouncedSave(saveFn, delay = 500) {
  const timers = useRef({});
  return useCallback((key, run) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => { run(); }, delay);
  }, [saveFn, delay]);
}
