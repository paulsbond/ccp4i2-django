import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ParameterChangeIntent {
  jobId: number;
  parameterPath: string;
  reason: string;
  previousValue: any;
}

interface ParameterChangeIntentContextType {
  intent: ParameterChangeIntent | null;
  setIntent: (intent: ParameterChangeIntent) => void;
  clearIntent: () => void;
}

const ParameterChangeIntentContext = createContext<
  ParameterChangeIntentContextType | undefined
>(undefined);

export const ParameterChangeIntentProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [intent, setIntentState] = useState<ParameterChangeIntent | null>(null);

  const setIntent = (intent: ParameterChangeIntent) => setIntentState(intent);
  const clearIntent = () => setIntentState(null);

  return (
    <ParameterChangeIntentContext.Provider
      value={{ intent, setIntent, clearIntent }}
    >
      {children}
    </ParameterChangeIntentContext.Provider>
  );
};

export const useParameterChangeIntent = () => {
  const context = useContext(ParameterChangeIntentContext);
  if (!context) {
    return {
      intent: {},
      setIntent: (intent: ParameterChangeIntent) => {
        alert(
          `Attempt to set intent outside context ${JSON.stringify(intent)}`
        );
      },
      clearIntent: () => {},
    };
  }
  return context;
};
