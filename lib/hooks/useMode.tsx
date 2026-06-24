'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Mode = 'fishes' | 'plants';

type ModeContextType = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('fishes');

  // Load mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('neoblue-mode') as Mode;
    if (savedMode === 'fishes' || savedMode === 'plants') {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('neoblue-mode', newMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
