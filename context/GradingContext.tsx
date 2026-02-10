"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type GradingDecision = {
  answerId: string;
  questionRef: string;
  isCorrect: boolean;
  marksAwarded: number;
};

type GradingContextType = {
  decisions: Map<string, GradingDecision>;
  setDecision: (decision: GradingDecision) => void;
  getDecision: (answerId: string) => GradingDecision | undefined;
  clearDecisions: () => void;
  getAllDecisions: () => GradingDecision[];
};

const GradingContext = createContext<GradingContextType | undefined>(undefined);

export function GradingProvider({ children }: { children: ReactNode }) {
  const [decisions, setDecisions] = useState<Map<string, GradingDecision>>(
    new Map(),
  );

  const setDecision = (decision: GradingDecision) => {
    setDecisions((prev) => {
      const newMap = new Map(prev);
      newMap.set(decision.answerId, decision);
      return newMap;
    });
  };

  const getDecision = (answerId: string) => {
    return decisions.get(answerId);
  };

  const clearDecisions = () => {
    setDecisions(new Map());
  };

  const getAllDecisions = () => {
    return Array.from(decisions.values());
  };

  return (
    <GradingContext.Provider
      value={{
        decisions,
        setDecision,
        getDecision,
        clearDecisions,
        getAllDecisions,
      }}
    >
      {children}
    </GradingContext.Provider>
  );
}

export function useGrading() {
  const context = useContext(GradingContext);
  if (!context) {
    throw new Error("useGrading must be used within GradingProvider");
  }
  return context;
}
