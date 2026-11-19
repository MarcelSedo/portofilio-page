"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { FolkId } from "@/content/folk";

/**
 * Which forest characters can't be shown in the forest right now
 * (cut off, or covered by a window). The forest scene measures it;
 * perches on the page show those characters instead.
 * null = not measured yet (server render, first paint).
 */
type FolkState = {
  offstage: Set<FolkId> | null;
  setOffstage: (ids: Set<FolkId>) => void;
};

const FolkContext = createContext<FolkState>({ offstage: null, setOffstage: () => {} });

export function FolkProvider({ children }: { children: React.ReactNode }) {
  const [offstage, setState] = useState<Set<FolkId> | null>(null);
  // only re-render when the set really changes (the forest measures on every resize)
  const setOffstage = useCallback((next: Set<FolkId>) => {
    setState((prev) => (prev && prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next));
  }, []);
  const value = useMemo(() => ({ offstage, setOffstage }), [offstage, setOffstage]);
  return <FolkContext.Provider value={value}>{children}</FolkContext.Provider>;
}

export const useFolk = () => useContext(FolkContext);
