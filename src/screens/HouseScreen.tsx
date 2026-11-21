/**
 * Mitt hus – barnets eget rom. Kjøp ting for mynter, dra dem rundt,
 * gjør dem større/mindre, snu dem, eller legg dem tilbake i kassen.
 */
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { actions, useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { HOUSE_CATS, HOUSE_ITEMS, DEFAULT_FLOOR, DEFAULT_WALL, houseItemById, defaultHouse, type House, type HouseCat, type HouseItem } from '../data/house';
import { LivelyAvatar } from '../components/LivelyAvatar';
import { BackButton, TopBar } from '../components/ui';
import { CoinChip } from './Shop';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

interface DragState { key: number | 'avatar'; startX: number; startY: number; ox: number; oy: number; moved: boolean }

export function HouseScreen() {
  const t = useT();
  const profile = useActiveProfile();
  const [house, setHouse] = useState<House>(() => profile?.house ?? defaultHouse());
  const [cat, setCat] = useState<HouseCat>('furniture');
  const [selected, setSelected] = useState<number | null>(null); // indeks i house.items
  const [pending, setPending] = useState<string | null>(null); // ting som venter på "trykk igjen for å kjøpe"
  const [bump, setBump] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  useEffect(() => {
    if (!profile) go('');
    else speak(t('houseHint'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!profile) return null;

  const owns = (id: string) => id === DEFAULT_WALL || id === DEFAULT_FLOOR || profile.owned.includes(id);
  const save = (h: House) => { setHouse(h); actions.setHouse(profile.id, h); };

  function tryBuy(it: HouseItem): boolean {
    if (owns(it.id)) return true;
    if (profile!.coins < it.price) {
      playSfx('nope');
      speak(t('notEnough', { n: it.price - profile!.coins }));
      return false;
    }
    if (pending !== it.id) {
      playSfx('tap');
      setPending(it.id);
      speak(t('tapToBuy'));
      return false;
    }
    if (!actions.buy(profile!.id, it.id, it.price)) return false;
    playSfx('sticker');
    setPending(null);
    setBump(true);
    setTimeout(() => setBump(false), 600);
    return true;
  }

  function tapDrawer(it: HouseItem) {
    if (it.cat === 'wall' || it.cat === 'floor') {
      if (!tryBuy(it)) return;
      playSfx('pop');
      save({ ...house, [it.cat]: it.id });
      return;
    }
    const placedIdx = house.items.findIndex((p) => p.id === it.id);
    if (placedIdx >= 0) {
      playSfx('tap');
      setSelected(placedIdx);
      return;
    }
    if (!tryBuy(it)) return;
    playSfx('pop');
    const items = [...house.items, { id: it.id, x: 30 + Math.random() * 40, y: 70 + Math.random() * 15, s: 1, f: false }];
    save({ ...house, items });
    setSelected(items.length - 1);
  }

  // --- Dra ting rundt i rommet ---
  function startDrag(e: RPointerEvent, key: number | 'avatar') {
    e.stopPropagation();
    e.preventDefault();
    const pos = key === 'avatar' ? house.avatar : house.items[key];
    drag.current = { key, startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function moveDrag(e: RPointerEvent) {
    const d = drag.current;
    const r = roomRef.current?.getBoundingClientRect();
    if (!d || !r) return;
    const dx = ((e.clientX - d.startX) / r.width) * 100;
    const dy = ((e.clientY - d.startY) / r.height) * 100;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
    d.moved = true;
    const x = Math.min(96, Math.max(4, d.ox + dx));
    const y = Math.min(98, Math.max(12, d.oy + dy));
    if (d.key === 'avatar') setHouse((h) => ({ ...h, avatar: { x, y } }));
    else {
      const k = d.key;
      setHouse((h) => ({ ...h, items: h.items.map((p, i) => (i === k ? { ...p, x, y } : p)) }));
    }
  }
  function endDrag() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      playSfx('pop');
      actions.setHouse(profile!.id, house);
    } else if (d.key !== 'avatar') {
      playSfx('tap');
      setSelected(d.key === selected ? null : d.key);
    } else {
      playSfx('pop');
    }
  }

  function changeSel(fn: (p: House['items'][number]) => House['items'][number] | null) {
    if (selected === null) return;
    playSfx('tap');
    const items = house.items.map((p, i) => (i === selected ? fn(p) : p)).filter(Boolean) as House['items'];
    save({ ...house, items });
    if (items.length !== house.items.length) setSelected(null);
  }

  const wall = houseItemById(house.wall)?.css ?? '#ffe5b4';
  const floor = houseItemById(house.floor)?.css ?? '#deb887';
  const sel = selected !== null ? house.items[selected] : null;
  // Tegn ting som står lengre ned (nærmere) foran ting lenger bak
  const order = house.items.map((p, i) => ({ p, i })).sort((a, b) => a.p.y - b.p.y);

  return (
    <div className="screen house-screen">
      <TopBar left={<BackButton to={() => go('map')} />} title={<h1>🏠 {t('myHouse')}</h1>} right={<CoinChip coins={profile.coins} bump={bump} />} />

      <div className="room-wrap">
        <div className="room" ref={roomRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerDown={() => setSelected(null)}>
          <div className="room__wall" style={{ background: wall }}>
            <div className="room__window"><span>☀️</span><span className="room__cloud">☁️</span></div>
          </div>
          <div className="room__floor" style={{ background: floor }} />
          {order.map(({ p, i }) => {
            const it = houseItemById(p.id);
            if (!it) return null;
            const depth = 0.75 + (p.y / 100) * 0.45; // ting nærmere er litt større
            return (
              <span
                key={`${p.id}-${i}`}
                className={`room__item ${selected === i ? 'is-selected' : ''}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: Math.round(p.y), fontSize: `calc(var(--room-w) * ${0.11 * p.s * depth})`, transform: `translate(-50%, -100%) scaleX(${p.f ? -1 : 1})` }}
                onPointerDown={(e) => startDrag(e, i)}
              >
                {it.emoji}
              </span>
            );
          })}
          <span
            className="room__avatar"
            style={{ left: `${house.avatar.x}%`, top: `${house.avatar.y}%`, zIndex: Math.round(house.avatar.y) }}
            onPointerDown={(e) => startDrag(e, 'avatar')}
          >
            <LivelyAvatar profile={profile} size={70} interactive={false} />
          </span>
        </div>
        {sel && (
          <div className="room-tools pop-in">
            <button onClick={() => changeSel((p) => ({ ...p, s: Math.max(0.5, +(p.s - 0.2).toFixed(1)) }))} aria-label="mindre">➖</button>
            <button onClick={() => changeSel((p) => ({ ...p, s: Math.min(2.2, +(p.s + 0.2).toFixed(1)) }))} aria-label="større">➕</button>
            <button onClick={() => changeSel((p) => ({ ...p, f: !p.f }))} aria-label="snu">↔️</button>
            <button onClick={() => changeSel(() => null)} aria-label="legg tilbake">📦</button>
          </div>
        )}
      </div>

      <nav className="shop-tabs house-tabs">
        {HOUSE_CATS.map((c) => (
          <button key={c.id} className={cat === c.id ? 'is-active' : ''} onClick={() => { playSfx('tap'); setCat(c.id); setPending(null); }} aria-label={t(c.nameKey)}>
            <span>{c.icon}</span><small>{t(c.nameKey)}</small>
          </button>
        ))}
      </nav>
      <div className="house-drawer">
        {HOUSE_ITEMS.filter((i) => i.cat === cat).map((it) => {
          const owned = owns(it.id);
          const placed = it.cat === 'wall' ? house.wall === it.id : it.cat === 'floor' ? house.floor === it.id : house.items.some((p) => p.id === it.id);
          return (
            <button
              key={it.id}
              className={`house-item ${placed ? 'is-placed' : ''} ${pending === it.id ? 'is-pending' : ''}`}
              onClick={() => tapDrawer(it)}
            >
              {it.css ? <span className="house-swatch" style={{ background: it.css }} /> : <span className="house-item__emoji">{it.emoji}</span>}
              <span className="house-item__price">{placed ? '✔' : owned ? '＋' : pending === it.id ? `${t('buy')}?` : `🪙 ${it.price}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
