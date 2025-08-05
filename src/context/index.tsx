'use client';

import React, { createContext, useState, ReactNode } from 'react';

interface GlobalContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const GlobalContext = createContext<GlobalContextType>({
  isLoading: true,
  setIsLoading: () => {},
});

interface ContextProviderProps {
  children: ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <GlobalContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </GlobalContext.Provider>
  );
};
