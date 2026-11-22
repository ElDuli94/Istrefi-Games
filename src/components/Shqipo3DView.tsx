/** Liten 3D-Shqipo som jubler (brukes i feiringen). Faller tilbake til 2D. */
import { lazy, Suspense, type ReactNode } from 'react';
import { can3D } from '../three/support';

const View = lazy(() => import('../three/ShqipoCanvas'));

export function Shqipo3DView({ size, fallback }: { size: number; fallback: ReactNode }) {
  if (!can3D()) return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <View size={size} />
    </Suspense>
  );
}
