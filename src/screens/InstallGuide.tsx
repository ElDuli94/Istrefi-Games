import { useT } from '../i18n';
import type { DictKey } from '../i18n/no';
import { isStandalone, platform, promptInstall, useCanInstall } from '../pwa';

export function InstallGuide() {
  const t = useT();
  const canInstall = useCanInstall();
  const current = platform();
  const sections: { id: ReturnType<typeof platform>; title: DictKey; steps: DictKey; icon: string }[] = [
    { id: 'ios', title: 'installIos', steps: 'installIosSteps', icon: '🍎' },
    { id: 'android', title: 'installAndroid', steps: 'installAndroidSteps', icon: '🤖' },
    { id: 'desktop', title: 'installDesktop', steps: 'installDesktopSteps', icon: '💻' }
  ];
  sections.sort((a, b) => (a.id === current ? -1 : b.id === current ? 1 : 0));

  return (
    <div className="install-guide">
      <h2>📲 {t('installTitle')}</h2>
      <p>{t('installIntro')}</p>
      {isStandalone() ? (
        <p className="notice notice--ok">{t('installed')}</p>
      ) : (
        canInstall && <button className="big-btn big-btn--go" onClick={promptInstall}>⬇️ {t('installNow')}</button>
      )}
      <details className="install-step install-step--lock" open={current === 'ios'}>
        <summary>🔐 {t('lockTitle')}</summary>
        <p>{t('lockIntro')}</p>
        <ol>
          {t('lockSteps').split('|').map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </details>
      {sections.map((s) => (
        <details key={s.id} open={s.id === current} className="install-step">
          <summary>{s.icon} {t(s.title)}</summary>
          <ol>
            {t(s.steps).split('|').map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </details>
      ))}
    </div>
  );
}
