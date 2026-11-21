import type { Lang } from '../i18n';

// Land til flaggquizen. Gruppe 1 = nærmeste (Norden og Balkan), 2 = Europa, 3 = verden.
// Flagget lages fra landkoden (to bokstaver) som emoji.
export interface Country { code: string; group: 1 | 2 | 3; name: Record<Lang, string> }

const c = (code: string, group: 1 | 2 | 3, no: string, sq: string): Country => ({ code, group, name: { no, sq } });

export const COUNTRIES: Country[] = [
  c('NO', 1, 'Norge', 'Norvegjia'), c('SE', 1, 'Sverige', 'Suedia'), c('DK', 1, 'Danmark', 'Danimarka'), c('FI', 1, 'Finland', 'Finlanda'),
  c('IS', 1, 'Island', 'Islanda'), c('AL', 1, 'Albania', 'Shqipëria'), c('XK', 1, 'Kosovo', 'Kosova'), c('MK', 1, 'Nord-Makedonia', 'Maqedonia e Veriut'),
  c('ME', 1, 'Montenegro', 'Mali i Zi'), c('GR', 1, 'Hellas', 'Greqia'), c('IT', 1, 'Italia', 'Italia'), c('DE', 1, 'Tyskland', 'Gjermania'),
  c('GB', 1, 'Storbritannia', 'Mbretëria e Bashkuar'), c('FR', 1, 'Frankrike', 'Franca'), c('ES', 1, 'Spania', 'Spanja'),
  c('PT', 2, 'Portugal', 'Portugalia'), c('IE', 2, 'Irland', 'Irlanda'), c('NL', 2, 'Nederland', 'Holanda'), c('BE', 2, 'Belgia', 'Belgjika'),
  c('CH', 2, 'Sveits', 'Zvicra'), c('AT', 2, 'Østerrike', 'Austria'), c('PL', 2, 'Polen', 'Polonia'), c('HR', 2, 'Kroatia', 'Kroacia'),
  c('RS', 2, 'Serbia', 'Serbia'), c('BA', 2, 'Bosnia-Hercegovina', 'Bosnja dhe Hercegovina'), c('SI', 2, 'Slovenia', 'Sllovenia'),
  c('TR', 2, 'Tyrkia', 'Turqia'), c('UA', 2, 'Ukraina', 'Ukraina'), c('RO', 2, 'Romania', 'Rumania'), c('BG', 2, 'Bulgaria', 'Bullgaria'),
  c('HU', 2, 'Ungarn', 'Hungaria'), c('CZ', 2, 'Tsjekkia', 'Çekia'), c('EE', 2, 'Estland', 'Estonia'), c('LT', 2, 'Litauen', 'Lituania'),
  c('US', 3, 'USA', 'SHBA'), c('CA', 3, 'Canada', 'Kanadaja'), c('MX', 3, 'Mexico', 'Meksika'), c('BR', 3, 'Brasil', 'Brazili'),
  c('AR', 3, 'Argentina', 'Argjentina'), c('CN', 3, 'Kina', 'Kina'), c('JP', 3, 'Japan', 'Japonia'), c('IN', 3, 'India', 'India'),
  c('AU', 3, 'Australia', 'Australia'), c('EG', 3, 'Egypt', 'Egjipti'), c('ZA', 3, 'Sør-Afrika', 'Afrika e Jugut'), c('KR', 3, 'Sør-Korea', 'Koreja e Jugut'),
  c('MA', 3, 'Marokko', 'Maroku'), c('NG', 3, 'Nigeria', 'Nigeria'), c('KE', 3, 'Kenya', 'Kenia'), c('TH', 3, 'Thailand', 'Tajlanda'),
  c('NZ', 3, 'New Zealand', 'Zelanda e Re'), c('CL', 3, 'Chile', 'Kili'), c('CO', 3, 'Colombia', 'Kolumbia'), c('JM', 3, 'Jamaica', 'Xhamajka')
];

/** "NO" -> 🇳🇴 */
export const flagOf = (code: string) => String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
