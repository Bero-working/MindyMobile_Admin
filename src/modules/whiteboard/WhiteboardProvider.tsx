import { createContext, useContext, type PropsWithChildren } from 'react';
import type { WhiteboardService } from './service';
const Context = createContext<WhiteboardService | null>(null);
export function WhiteboardProvider({
  service,
  children,
}: PropsWithChildren<{ service: WhiteboardService }>) {
  return <Context.Provider value={service}>{children}</Context.Provider>;
}
export function useWhiteboardService() {
  const service = useContext(Context);
  if (!service) throw new Error('WhiteboardProvider required');
  return service;
}
