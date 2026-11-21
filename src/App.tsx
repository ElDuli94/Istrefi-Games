import { useEffect } from 'react';
import { useRoute } from './router';
import { useStore } from './storage/store';
import { startMusic, stopMusic } from './audio/sound';
import { ProfileSelect } from './screens/ProfileSelect';
import { CreateProfile } from './screens/CreateProfile';
import { IslandMap } from './screens/IslandMap';
import { WorldScreen } from './screens/WorldScreen';
import { GameHost } from './screens/GameHost';
import { StickerBook } from './screens/StickerBook';
import { ParentArea } from './screens/ParentArea';
import { ByeScreen } from './screens/ByeScreen';
import { Shop } from './screens/Shop';
import { HouseScreen } from './screens/HouseScreen';

export default function App() {
  const [page, a, b] = useRoute();
  const lang = useStore((s) => s.settings.lang);
  const music = useStore((s) => s.settings.music);

  useEffect(() => {
    document.documentElement.lang = lang === 'no' ? 'no' : 'sq';
  }, [lang]);

  // Nettlesere tillater bare lyd etter at brukeren har trykket på skjermen.
  useEffect(() => {
    if (!music) return stopMusic();
    const start = () => startMusic();
    const onVisible = () => !document.hidden && startMusic();
    window.addEventListener('pointerdown', start);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pointerdown', start);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [music]);

  switch (page) {
    case 'new':
      return <CreateProfile />;
    case 'map':
      return <IslandMap />;
    case 'world':
      return <WorldScreen worldId={a ?? ''} />;
    case 'play':
      return <GameHost key={`${a}/${b}`} gameId={a ?? ''} worldId={b ?? ''} />;
    case 'stickers':
      return <StickerBook />;
    case 'parents':
      return <ParentArea initialTab={a} />;
    case 'bye':
      return <ByeScreen />;
    case 'shop':
      return <Shop />;
    case 'house':
      return <HouseScreen />;
    default:
      return <ProfileSelect />;
  }
}
