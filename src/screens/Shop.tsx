import { useState } from 'react';
import { actions, useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { SHOP_ITEMS, SLOTS, STICKER_PACK_PRICE, rarityOf, type ShopItem, type Slot } from '../data/shop';
import { pickNewSticker, stickerById } from '../data/stickers';
import { AvatarView } from '../components/AvatarView';
import { BackButton, TopBar } from '../components/ui';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

type Tab = Slot | 'stickers';

export function CoinChip({ coins, bump }: { coins: number; bump?: boolean }) {
  return <span className={`coin-chip ${bump ? 'is-bump' : ''}`}>🪙 {coins}</span>;
}

function ItemSwatch({ item }: { item: ShopItem }) {
  if (item.slot === 'bg') return <span className="swatch-bg" style={{ background: item.css }} />;
  if (item.slot === 'frame')
    return (
      <span className="swatch-ring" style={{ background: item.css === 'rainbow' ? 'conic-gradient(#ff595e,#ffca3a,#8ac926,#1982c4,#6a4c93,#ff595e)' : item.css }}>
        <i />
      </span>
    );
  return <span className="shop-item__emoji">{item.emoji}</span>;
}

export function Shop() {
  const t = useT();
  const profile = useActiveProfile();
  const [tab, setTab] = useState<Tab>('hat');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [bump, setBump] = useState(false);
  const [newSticker, setNewSticker] = useState<string | null>(null);
  if (!profile) {
    go('');
    return null;
  }

  const owns = (id: string) => profile.owned.includes(id);
  const wearing = (it: ShopItem) => profile.equipped[it.slot] === it.id;

  function select(it: ShopItem) {
    playSfx('pop');
    setSelected(it);
    if (!owns(it.id) && profile!.coins < it.price) speak(t('notEnough', { n: it.price - profile!.coins }));
  }

  function action() {
    if (!selected || !profile) return;
    if (owns(selected.id)) {
      playSfx('tap');
      actions.equip(profile.id, selected.slot, wearing(selected) ? null : selected.id);
      return;
    }
    if (profile.coins < selected.price) {
      playSfx('nope');
      speak(t('notEnough', { n: selected.price - profile.coins }));
      return;
    }
    if (actions.buy(profile.id, selected.id, selected.price)) {
      actions.equip(profile.id, selected.slot, selected.id);
      playSfx('sticker');
      speak(t('bought'));
      setBump(true);
      setTimeout(() => setBump(false), 600);
    }
  }

  function buySticker() {
    if (!profile) return;
    const id = pickNewSticker(profile.stickers);
    if (!id) return speak(t('bookFull'));
    if (profile.coins < STICKER_PACK_PRICE) {
      playSfx('nope');
      speak(t('notEnough', { n: STICKER_PACK_PRICE - profile.coins }));
      return;
    }
    if (actions.buySticker(profile.id, id, STICKER_PACK_PRICE)) {
      playSfx('sticker');
      setNewSticker(id);
      setBump(true);
      setTimeout(() => setBump(false), 600);
    }
  }

  const items = SHOP_ITEMS.filter((i) => i.slot === tab);
  const ownedCount = profile.owned.filter((id) => SHOP_ITEMS.some((i) => i.id === id)).length;
  const preview = selected && !owns(selected.id) ? { slot: selected.slot, id: selected.id } : null;
  const canAfford = selected ? profile.coins >= selected.price : false;

  return (
    <div className="screen shop-screen">
      <TopBar left={<BackButton to={() => go('map')} />} title={<h1>🛍️ {t('shop')}</h1>} right={<CoinChip coins={profile.coins} bump={bump} />} />

      <div className="shop-hero">
        <div className="shop-hero__avatar">
          <AvatarView avatar={profile.avatar} equipped={profile.equipped} size={150} preview={preview} />
          <div className="collection">
            <span>🏅 {t('collection')}: {ownedCount} / {SHOP_ITEMS.length}</span>
            <span className="collection__bar"><i style={{ width: `${(ownedCount / SHOP_ITEMS.length) * 100}%` }} /></span>
          </div>
        </div>
        {tab !== 'stickers' && selected && (
          <button
            className={`big-btn shop-action ${owns(selected.id) ? '' : canAfford ? 'big-btn--go' : 'is-poor'}`}
            onClick={action}
          >
            {owns(selected.id) ? (wearing(selected) ? `✖ ${t('takeOff')}` : `✔ ${t('wear')}`) : `${t('buy')} 🪙 ${selected.price}`}
          </button>
        )}
      </div>

      <nav className="shop-tabs">
        {SLOTS.map((s) => (
          <button key={s.id} className={tab === s.id ? 'is-active' : ''} onClick={() => { playSfx('tap'); setTab(s.id); setSelected(null); }} aria-label={t(s.nameKey)}>
            <span>{s.icon}</span><small>{t(s.nameKey)}</small>
          </button>
        ))}
        <button className={tab === 'stickers' ? 'is-active' : ''} onClick={() => { playSfx('tap'); setTab('stickers'); setSelected(null); }} aria-label={t('slotStickers')}>
          <span>📒</span><small>{t('slotStickers')}</small>
        </button>
      </nav>

      {tab === 'stickers' ? (
        <div className="shop-stickers">
          <button className="shop-item shop-item--pack pop-in" onClick={buySticker}>
            <span className="shop-item__emoji">{newSticker ? <span className="sticker-reveal" style={{ animationDelay: '0s' }}>{stickerById(newSticker)?.emoji}</span> : '🎁'}</span>
            <span className="shop-item__label">{t('stickerPack')}</span>
            <span className="shop-item__price">🪙 {STICKER_PACK_PRICE}</span>
          </button>
          <button className="big-btn" onClick={() => go('stickers')}>📒 {t('stickerBookTitle')}</button>
        </div>
      ) : (
        <div className="shop-grid">
          {items.map((it, i) => (
            <button
              key={it.id}
              className={`shop-item shop-item--${rarityOf(it.price)} pop-in ${selected?.id === it.id ? 'is-selected' : ''} ${owns(it.id) ? 'is-owned' : ''}`}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => select(it)}
            >
              <ItemSwatch item={it} />
              <span className={`rarity rarity--${rarityOf(it.price)}`}>{t(`rarity_${rarityOf(it.price)}`)}</span>
              <span className="shop-item__price">
                {wearing(it) ? '✔' : owns(it.id) ? '👜' : `🪙 ${it.price}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
