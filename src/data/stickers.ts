// Klistremerker som samles på tvers av alle spill.
// Legg gjerne til flere – rekkefølgen her er rekkefølgen i boka.
export const STICKERS: { id: string; emoji: string }[] = [
  '🌈', '⭐', '🚀', '🦋', '🌻', '🍦', '🎈', '🐳', '🦕', '🍓', '🎸', '🏰',
  '🌙', '🐞', '🍕', '🚂', '🦜', '🌋', '🎨', '🧁', '🐢', '🛸', '🏆', '🎁',
  '🦩', '🍉', '⚽', '🐝', '🌵', '🎠', '🦔', '🍩', '🚁', '🐬', '🌟', '👑'
].map((emoji, i) => ({ id: `s${i + 1}`, emoji }));

/** Finn et tilfeldig klistremerke barnet ikke har ennå (null hvis boka er full). */
export function pickNewSticker(owned: string[]): string | null {
  const free = STICKERS.filter((s) => !owned.includes(s.id));
  if (!free.length) return null;
  return free[Math.floor(Math.random() * free.length)].id;
}

export const stickerById = (id: string) => STICKERS.find((s) => s.id === id);
