'use client';
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  ReactNode,
} from 'react';
import type { Provider } from '@/types/interview';

const KEY = 'resuvibe:provider';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

function getSnapshot(): Provider {
  try {
    return localStorage.getItem(KEY) === 'gemini' ? 'gemini' : 'groq';
  } catch {
    return 'groq';
  }
}

const getServerSnapshot = (): Provider => 'groq';

interface ModelContextValue {
  provider: Provider;
  setProvider: (p: Provider) => void;
}

const ModelContext = createContext<ModelContextValue>({
  provider: 'groq',
  setProvider: () => {},
});

export function ModelProvider({ children }: { children: ReactNode }) {
  const provider = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setProvider = useCallback((p: Provider) => {
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* storage unavailable */
    }
    listeners.forEach((l) => l());
  }, []);

  return (
    <ModelContext.Provider value={{ provider, setProvider }}>
      {children}
    </ModelContext.Provider>
  );
}

export const useProvider = () => useContext(ModelContext);
