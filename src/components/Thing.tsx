/**
 * <Thing e="🐶" />: viser en ekte 3D-modell hvis det finnes en (og enheten klarer 3D),
 * ellers den vanlige 3D-emojien. Modellene lastes først når de trengs.
 */
import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { Emo } from './Emo';
import { modelFor } from '../three/models';
import { can3D } from '../three/support';
import { useStore } from '../storage/store';

const ModelView = lazy(() => import('../three/ModelView'));

class Catch extends Component<{ children: ReactNode; fallback: ReactNode }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() { return { bad: true }; }
  render() { return this.state.bad ? this.props.fallback : this.props.children; }
}

export function Thing({ e, play = 0, spin = true, className = '' }: { e: string; play?: number; spin?: boolean; className?: string }) {
  const map3d = useStore((s) => s.settings.map3d);
  const [failed, setFailed] = useState(false);
  const m = modelFor(e);
  const emoji = <Emo e={e} />;
  // Uten 3D: vanlig emoji som hopper når play øker
  if (!m || failed || !map3d || !can3D()) return <span key={play} className={`thing thing--emoji ${play ? 'thing--hop' : ''} ${className}`}>{emoji}</span>;
  return (
    <span className={`thing thing--3d ${className}`}>
      <Catch fallback={emoji}>
        <Suspense fallback={<span className="thing__wait">{emoji}</span>}>
          <ModelView model={m} play={play} spin={spin} onFail={() => setFailed(true)} />
        </Suspense>
      </Catch>
    </span>
  );
}
