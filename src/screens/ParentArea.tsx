import { useRef, useState, type ChangeEvent } from 'react';
import { actions, useStore, type Profile } from '../storage/store';
import { LANGUAGES, useT, type Lang } from '../i18n';
import { back, go } from '../router';
import { GAMES } from '../games/registry';
import { WORLDS, type WorldId } from '../data/worlds';
import { AVATARS, AVATAR_KEYS } from '../data/avatars';
import { AvatarView } from '../components/AvatarView';
import { STICKERS } from '../data/stickers';
import { Avatar, BackButton, Stars, TopBar } from '../components/ui';
import { InstallGuide } from './InstallGuide';
import { startMusic, stopMusic } from '../audio/sound';

// ---------- Foreldrelås: et regnestykke små barn ikke klarer ----------
function ParentGate({ onPass }: { onPass: () => void }) {
  const t = useT();
  const [q] = useState(() => ({ a: 3 + Math.floor(Math.random() * 7), b: 3 + Math.floor(Math.random() * 7) }));
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  function press(k: string) {
    setWrong(false);
    if (k === '⌫') return setInput((s) => s.slice(0, -1));
    if (k === 'OK') {
      if (Number(input) === q.a * q.b) onPass();
      else { setWrong(true); setInput(''); }
      return;
    }
    setInput((s) => (s + k).slice(0, 3));
  }

  return (
    <div className="screen parent-gate">
      <TopBar left={<BackButton />} />
      <div className="gate-card">
        <h1>🔒 {t('parentGateTitle')}</h1>
        <p className="gate-q">{t('parentGateQuestion', { a: q.a, b: q.b })}</p>
        <div className={`gate-input ${wrong ? 'is-wrong' : ''}`}>{input || ' '}</div>
        {wrong && <p className="gate-wrong">{t('parentGateWrong')}</p>}
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
            <button key={k} onClick={() => press(k)} className={k === 'OK' ? 'is-ok' : ''}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const fmtDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} t ${m} min` : `${m} min`;
};

function StatsTab({ profiles }: { profiles: Profile[] }) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  if (!profiles.length) return <p>{t('noStats')}</p>;
  return (
    <div className="stats">
      {profiles.map((p) => {
        const entries = Object.entries(p.games);
        const total = entries.reduce((s, [, g]) => s + g.totalSeconds, 0);
        const plays = entries.reduce((s, [, g]) => s + g.plays, 0);
        return (
          <section key={p.id} className="panel">
            <h3><Avatar avatar={p.avatar} size={40} /> {p.name || '—'}</h3>
            <div className="stat-row">
              <div><b>{fmtDuration(total)}</b><span>{t('totalPlayTime')}</span></div>
              <div><b>{plays}</b><span>{t('gamesPlayed')}</span></div>
              <div><b>{p.stickers.length}/{STICKERS.length}</b><span>{t('stickers')}</span></div>
              <div><b>🪙 {p.coins}</b><span>{t('coins')}</span></div>
            </div>
            {entries.length === 0 ? <p className="muted">{t('noStats')}</p> : (
              <table className="stat-table">
                <tbody>
                  {entries.sort((a, b) => b[1].lastPlayed - a[1].lastPlayed).map(([key, g]) => {
                    const [gameId, worldId] = key.split(':');
                    const game = GAMES.find((x) => x.id === gameId);
                    const w = WORLDS.find((x) => x.id === worldId);
                    return (
                      <tr key={key}>
                        <td>{game?.icon} {game ? t(game.titleKey) : gameId} {w && <small>{w.icon} {t(w.ageKey)}</small>}</td>
                        <td>{g.plays} {t('timesPlayed')}</td>
                        <td>{fmtDuration(g.totalSeconds)}</td>
                        <td><Stars count={g.bestStars} /></td>
                        <td className="muted">{new Date(g.lastPlayed).toLocaleDateString(lang === 'no' ? 'nb-NO' : 'sq-AL')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ProfilesTab({ profiles }: { profiles: Profile[] }) {
  const t = useT();
  const [picking, setPicking] = useState<string | null>(null); // profil-id som velger nytt dyr
  const [deleting, setDeleting] = useState<string | null>(null); // profil-id som venter på bekreftelse
  if (!profiles.length) return <p className="panel">{t('noStats')}</p>;
  return (
    <div className="profiles-admin">
      {profiles.map((p) => (
        <section key={p.id} className="panel profile-admin">
          <div className="profile-admin__row">
            <button className="profile-admin__avatar" onClick={() => setPicking(picking === p.id ? null : p.id)} aria-label={t('chooseAnimal')}>
              <AvatarView avatar={p.avatar} equipped={p.equipped} size={64} />
              <span className="profile-admin__edit">✏️</span>
            </button>
            <input
              className="text-input"
              value={p.name}
              placeholder={t('nameOptional')}
              maxLength={16}
              onChange={(e) => actions.editProfile(p.id, { name: e.target.value })}
            />
            <label>
              {t('age')}{' '}
              <select value={p.world} onChange={(e) => actions.editProfile(p.id, { world: e.target.value as WorldId })}>
                {WORLDS.map((w) => <option key={w.id} value={w.id}>{w.icon} {t(w.ageKey)}</option>)}
              </select>
            </label>
            <button className="danger-btn" onClick={() => setDeleting(p.id)}>🗑️ {t('deleteProfile')}</button>
          </div>

          {picking === p.id && (
            <div className="profile-admin__picker pop-in">
              {AVATAR_KEYS.map((k) => (
                <button
                  key={k}
                  className={`avatar-option ${p.avatar === k ? 'is-selected' : ''}`}
                  onClick={() => { actions.editProfile(p.id, { avatar: k }); setPicking(null); }}
                  aria-label={k}
                >
                  <Avatar avatar={k} size={52} />
                </button>
              ))}
            </div>
          )}

          {deleting === p.id && (
            <div className="confirm-box pop-in" role="alertdialog">
              <p>{t('confirmDelete', { name: p.name || AVATARS[p.avatar]?.emoji || '' })}</p>
              <div className="btn-row">
                <button className="danger-btn danger-btn--solid" onClick={() => { actions.deleteProfile(p.id); setDeleting(null); }}>🗑️ {t('deleteYes')}</button>
                <button className="big-btn" onClick={() => setDeleting(null)}>{t('cancel')}</button>
              </div>
            </div>
          )}
        </section>
      ))}
      <button className="big-btn big-btn--go" onClick={() => go('new')}>＋ {t('newPlayer')}</button>
    </div>
  );
}

function BackupTab() {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function download() {
    const blob = new Blob([actions.exportBackup()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `istrefi-games-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !confirm(t('confirmImport'))) return;
    const ok = actions.importBackup(await f.text());
    setMsg({ ok, text: ok ? t('importOk') : t('importFail') });
  }

  return (
    <div className="panel">
      <p>{t('backupInfo')}</p>
      <div className="btn-row">
        <button className="big-btn big-btn--go" onClick={download}>💾 {t('exportBtn')}</button>
        <button className="big-btn" onClick={() => fileRef.current?.click()}>📂 {t('importBtn')}</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </div>
      {msg && <p className={`notice ${msg.ok ? 'notice--ok' : 'notice--err'}`}>{msg.text}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <label className="toggle">
      <span>{label}</span>
      <button className={`switch ${value ? 'is-on' : ''}`} onClick={() => onChange(!value)} role="switch" aria-checked={value}>
        {value ? t('on') : t('off')}
      </button>
    </label>
  );
}

function SettingsTab() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  return (
    <div className="panel settings">
      <div className="toggle">
        <span>{t('language')}</span>
        <div className="lang-pick">
          {(Object.keys(LANGUAGES) as Lang[]).map((l) => (
            <button key={l} className={settings.lang === l ? 'is-on' : ''} onClick={() => actions.updateSettings({ lang: l })}>
              {LANGUAGES[l].flag} {LANGUAGES[l].label}
            </button>
          ))}
        </div>
      </div>
      <Toggle label={`🎵 ${t('music')}`} value={settings.music} onChange={(v) => { actions.updateSettings({ music: v }); v ? startMusic() : stopMusic(); }} />
      <Toggle label={`🔊 ${t('sounds')}`} value={settings.sfx} onChange={(v) => actions.updateSettings({ sfx: v })} />
      <Toggle label={`🗣️ ${t('voice')}`} value={settings.voice} onChange={(v) => actions.updateSettings({ voice: v })} />
      <h3>🛡️ {t('privacyTitle')}</h3>
      <p>{t('privacyText')}</p>
      <p className="muted">Istrefi Games v{__APP_VERSION__}</p>
    </div>
  );
}

type Tab = 'stats' | 'profiles' | 'backup' | 'settings' | 'install';

export function ParentArea({ initialTab = 'stats' }: { initialTab?: string }) {
  const t = useT();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>((['stats', 'profiles', 'backup', 'settings', 'install'].includes(initialTab) ? initialTab : 'stats') as Tab);
  const profiles = useStore((s) => s.profiles);

  if (!unlocked) return <ParentGate onPass={() => setUnlocked(true)} />;

  const tabs: [Tab, string][] = [
    ['stats', `📊 ${t('tabStats')}`],
    ['profiles', `👥 ${t('tabProfiles')}`],
    ['backup', `💾 ${t('tabBackup')}`],
    ['settings', `⚙️ ${t('tabSettings')}`],
    ['install', `📲 ${t('tabInstall')}`]
  ];

  return (
    <div className="screen parent-area">
      <TopBar left={<BackButton to={() => back('')} />} title={<h1>{t('parentAreaTitle')}</h1>} />
      <nav className="tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      <div className="parent-content">
        {tab === 'stats' && <StatsTab profiles={profiles} />}
        {tab === 'profiles' && <ProfilesTab profiles={profiles} />}
        {tab === 'backup' && <BackupTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'install' && <InstallGuide />}
      </div>
    </div>
  );
}
