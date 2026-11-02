import { createContext, useContext, type PropsWithChildren } from 'react';
import type { MaterialService } from './service';
const Context = createContext<MaterialService | null>(null);
export function MaterialProvider({
  children,
  service,
}: PropsWithChildren<{ service: MaterialService }>) {
  return <Context.Provider value={service}>{children}</Context.Provider>;
}
export function useMaterials() {
  const service = useContext(Context);
  if (!service) throw new Error('MaterialProvider required');
  return service;
}
export type MaterialStackParams = {
  MentorMaterials:
    | { classId?: string; classTitle?: string; unitId?: string }
    | undefined;
  MaterialEditor: {
    classId: string;
    classUnitId: string;
    courseUnitId: string;
    unitTitle?: string;
    materialId?: string;
  };
  MentorMaterialDetail: {
    classId: string;
    materialId: string;
    classTitle?: string;
  };
  MaterialReviewQueue: undefined;
  MaterialReviewDetail: { materialId: string };
  MaterialPreview: {
    materialId: string;
    revision: number;
    classId?: string;
    fileId?: string;
    title: string;
  };
};
