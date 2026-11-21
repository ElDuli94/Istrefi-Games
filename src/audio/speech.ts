/**
 * Opplesing med nettleserens innebygde tale (Web Speech API).
 * Norsk finnes på de fleste enheter. Albansk stemme finnes ikke alltid –
 * da leses ingenting opp (bedre enn feil uttale). Senere kan vi legge inn
 * egne innspilte lydfiler for de viktigste ordene.
 */
import { getState } from '../storage/store';
import { LANGUAGES } from '../i18n';

function findVoice(): SpeechSynthesisVoice | null {
  const lang = LANGUAGES[getState().settings.lang];
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const prefixes = [lang.speechLang.toLowerCase(), ...lang.speechFallback];
  for (const p of prefixes) {
    const v = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(p));
    if (v) return v;
  }
  return null;
}

export function canSpeak(): boolean {
  return 'speechSynthesis' in window && findVoice() !== null;
}

export function speak(text: string) {
  if (!getState().settings.voice || !('speechSynthesis' in window)) return;
  const voice = findVoice();
  if (!voice) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.9;
  u.pitch = 1.15;
  window.speechSynthesis.speak(u);
}

// Noen nettlesere laster stemmene asynkront.
window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});
