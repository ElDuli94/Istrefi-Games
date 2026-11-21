# 🦅 Istrefi Games

Trygge og morsomme nettspill for barn fra 2 til 15 år.
**Ingen reklame · ingen pålogging · ingen sporing · fungerer uten internett.**

Maskoten heter **Shqipo** – en liten ørneunge inspirert av ørnen i det albanske flagget.

## Hva finnes nå (v0.3)

| Del | Beskrivelse |
|---|---|
| 👥 Profiler | Barnet velger sitt dyr – ingen tekst eller passord. Flere barn per enhet. |
| 🏝️ Øykart | Fire verdener: Lekelandet (2–4), Eventyrskogen (5–7), Oppdagerfjellet (8–11), Stjernebyen (12–15). |
| 🃏 Dyre-memory | 3 nivåer per verden (Lett/Middels/Vanskelig) som låses opp ett etter ett – fra 2 til 15 par. De eldste kobler bilde med skrevet ord. |
| 🐮 Dyrelyder | Trykk på dyr og hør lyden og navnet (2–7 år). «Gjett dyret»-quiz for 5–7 år. Lydene lages i nettleseren. |
| 🎨 Tegnebrett | Tegn fritt med fingrene (flere samtidig), regnbuepensel, stempler, viskelær, angre og et lite galleri. Alle aldre. |
| 🔤 Bokstavlek | Dra eller trykk bokstaver til tavla og få ordet lest opp. Fri lek (med navnet ditt som hjelp) og ord-oppgaver der man staver dyr. Norsk og albansk alfabet. |
| 📒 Klistremerkebok | Et nytt klistremerke for hvert fullførte spill (36 totalt). |
| 🔒 For voksne | Foreldrelås med regnestykke. Statistikk, profiler, sikkerhetskopi, innstillinger og app-guide. |
| 🌍 Språk | Norsk og albansk (shqip). |
| 🔊 Lyd | Musikk, lydeffekter og opplesing – alt kan slås av/på. |
| 📲 App | Kan installeres på hjemskjermen (PWA) og spilles offline. |

## Kjøre lokalt

Krever [Node.js](https://nodejs.org) 20 eller nyere.

```bash
npm install      # første gang
npm run dev      # åpner utviklingsserver på http://localhost:5173
npm run build    # lager ferdig nettside i mappen dist/
```

## Publisere på GitHub Pages (gratis)

1. Slå sammen (merge) koden til `main`-branchen.
2. Gå til repoet på GitHub → **Settings** → **Pages**.
3. Under **Build and deployment → Source**, velg **GitHub Actions**.
4. Hver gang noe pushes til `main`, publiseres siden automatisk til
   `https://elduli94.github.io/Istrefi-Games/`.

Senere kan et eget domene (f.eks. `istrefigames.no`) kobles til under samme side.

## Slik legger du til et nytt spill

1. Lag en mappe `src/games/<spillnavn>/` med en komponent som tar imot `GameProps`
   (se `src/games/types.ts`). Spillet får `world` (aldersverden) og `api`
   (lyd, opplesing, oversettelse, lagring) og kaller `onFinish({ won, stars })` når runden er ferdig.
2. Legg til én oppføring i `src/games/registry.ts`.
   Trenger spillet nivåer? Bruk den ferdige `LevelPicker` fra `src/games/common/`.
3. Legg til spillnavnet i `src/i18n/no.ts` og `src/i18n/sq.ts`.

Plattformen tar seg av resten: spilletid, statistikk, stjerner, feiring og klistremerker.

## Mappestruktur

```
src/
  audio/        lydeffekter, musikk (Web Audio) og opplesing (Web Speech)
  components/   maskot og felles knapper
  data/         verdener, avatarer, klistremerker, dyr
  games/        alle spill + felles grensesnitt og register
  i18n/         oversettelser (no, sq)
  screens/      skjermer: profiler, kart, verden, spill, klistremerker, voksne
  storage/      lokal lagring av progresjon (localStorage, versjonert)
  styles/       design
```

## Personvern

All progresjon lagres kun i nettleseren på enheten. Ingenting sendes til noen server.
Fordi det ikke finnes kontoer, kan foreldre ta **sikkerhetskopi** (fil) under «For voksne»
for å flytte fremgang til en ny enhet.
