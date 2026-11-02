import { createContext, useContext, type PropsWithChildren } from 'react';
import type { ReportsService } from './service';

const Context = createContext<ReportsService | null>(null);
/** Report data stays in screen state: names and figures are never persisted. */
export function ReportsProvider({
  service,
  children,
}: PropsWithChildren<{ service: ReportsService }>) {
  return <Context.Provider value={service}>{children}</Context.Provider>;
}
export function useReports() {
  const service = useContext(Context);
  if (!service) throw new Error('ReportsProvider required');
  return service;
}
