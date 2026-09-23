import Link from '@/app/components/NativeLink';
import type { ReactNode } from 'react';
import { vaktermgroepen } from './vaktermen';
import { vaktermAliassen } from './vaktermAliassen';

/**
 * Tuinwoorden in een lopende tekst zelf aanklikbaar maken.
 *
 * Onder Snoeien stond eerst één losse link ("Woord niet bekend? Wijs het aan"). Dat vraagt
 * van de lezer dat hij eerst weet dát hij iets niet weet. Nu is het woord zelf de link:
 * wie "kruisende takken" leest en het niet kent, klikt erop en komt op de tekening uit
 * (`/uitleg/vaktermen#term-<slug>`), waar het woord én het plekje op de tekening oplichten.
 *
 * De woorden komen uit `vaktermen.ts`, dus uit het boekje — boekje en site blijven gelijk.
 */

/**
 * Vormen van het zelfstandig naamwoord: het kernwoord van een term, dus het laatste woord.
 * "Tak" moet ook "takken" en "takjes" vangen, want zo staat het in een snoeitekst.
 */
function naamwoordVormen(woord: string): string[] {
  const lijst = [woord, `${woord}en`];
  // tak → takken, knop → knoppen, pol → pollen: één klinker tussen twee medeklinkers,
  // dan verdubbelt de laatste medeklinker voor de uitgang.
  const verdubbelt = /[bcdfghjklmnpqrstvwxz][aeiou][bdfgklmnprstm]$/i.test(woord);
  if (verdubbelt) lijst.push(`${woord}${woord.slice(-1)}en`);
  // wortel → wortels, uitloper → uitlopers. Alleen bij deze uitgangen, anders zou "pol"
  // ook "pols" opeisen.
  if (/(el|er|e)$/i.test(woord)) lijst.push(`${woord}s`);
  // tak → takje(s), zijtak → zijtakje(s), stengel → stengeltje(s). Verkleinwoorden staan
  // volop in de snoeiteksten ("korte zijtakjes", "dode takjes").
  const klein = /[aeiou lnr]$/i.test(woord) ? 'tje' : 'je';
  lijst.push(`${woord}${klein}`, `${woord}${klein}s`);
  return lijst;
}

/**
 * Vormen van het bijvoeglijk naamwoord: het woord vóór de kern, en losse termen die zelf
 * een bijvoeglijk naamwoord zijn ("Bloeiend", "Uitgebloeid").
 *
 * Dit was de oorzaak van een gemiste link: de vakterm heet "Groen hart", maar in de tekst
 * staat "het gróéne hart". Zonder deze vormen bleef juist het gewone geval onaangeklikt.
 */
function bijvoeglijkVormen(woord: string): string[] {
  const lijst = [woord];
  if (woord.endsWith('e')) {
    lijst.push(`${woord}r`, `${woord}re`); // jonge → jongere, oude → oudere
  } else {
    lijst.push(`${woord}e`);
    // kaal → kale, groot → grote: een dubbele klinker wordt enkel voor de uitgang.
    // Let op dat dit alleen bij écht dubbele klinkers gebeurt; "groen" heeft "oe" en
    // blijft dus gewoon "groene".
    const korter = woord.replace(/(a|e|o|u)\1([bcdfgklmnprstvz])$/i, '$1$2');
    if (korter !== woord) lijst.push(`${korter}e`);
  }
  return lijst;
}

/** Is dit losse woord zelf een bijvoeglijk naamwoord? "Bloeiend", "Uitgebloeid". */
function isBijvoeglijk(woord: string) {
  return /(end|eid|aad)$/i.test(woord);
}

/** Alle schrijfwijzen waarin een term in een lopende tekst kan staan. */
function vormen(term: string): string[] {
  const woorden = term.trim().split(/\s+/);
  if (woorden.length === 1) {
    const enkel = woorden[0];
    return isBijvoeglijk(enkel)
      ? [...new Set([...naamwoordVormen(enkel), ...bijvoeglijkVormen(enkel)])]
      : naamwoordVormen(enkel);
  }

  // Meerdere woorden: het laatste is de kern, wat ervoor staat beschrijft hem. Beide
  // kunnen verbuigen, dus alle combinaties: "groen hart", "groene hart", "groene harten".
  const kern = naamwoordVormen(woorden[woorden.length - 1]);
  const kop = bijvoeglijkVormen(woorden[0]);
  const midden = woorden.slice(1, -1);
  const uit: string[] = [];
  for (const voor of kop) for (const achter of kern) uit.push([voor, ...midden, achter].join(' '));
  return [...new Set(uit)];
}

function ontsnap(woord: string) {
  return woord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Alle vormen, van lang naar kort. De volgorde is wezenlijk: staat "tak" vóór
 * "kruisende takken", dan pakt de korte term de match af en verwijst de link naar het
 * verkeerde woord.
 */
const woordenboek = (() => {
  const paren: { vorm: string; slug: string }[] = [];
  for (const groep of vaktermgroepen) {
    for (const term of groep.termen) {
      // "Vrucht / fruit" zijn twee woorden voor hetzelfde plekje op de tekening.
      for (const woord of term.term.split(' / ')) {
        for (const vorm of vormen(woord.trim())) paren.push({ vorm, slug: term.slug });
      }
    }
  }
  // Gewone formuleringen hoeven niet letterlijk de titel van een vakterm te herhalen.
  // Aliassen staan centraal per vakterm, zodat ze overal automatisch worden herkend.
  for (const [slug, aliassen] of Object.entries(vaktermAliassen)) {
    for (const alias of aliassen) {
      const genormaliseerd = alias.trim().split(/[\s,;:]+/).join(' ');
      for (const vorm of vormen(genormaliseerd)) paren.push({ vorm, slug });
    }
  }
  paren.sort((links, rechts) => rechts.vorm.length - links.vorm.length);
  return paren;
})();

const slugPerVorm = new Map(woordenboek.map(({ vorm, slug }) => [vorm.toLowerCase(), slug]));
const patroonVoorVorm = (vorm: string) => vorm.split(' ').map(ontsnap).join('[\\s,;:]+');

/* De lookarounds houden hele woorden vast: zonder die van achteren zou "tak" ook in
   "taks" of "taktiek" oplichten. */
const zoeker = new RegExp(
  `(?<![a-zà-ÿ])(${woordenboek.map((paar) => patroonVoorVorm(paar.vorm)).join('|')})(?![a-zà-ÿ])`,
  'gi',
);

/**
 * Zet een tekst om in stukken tekst met daartussen links op de tuinwoorden. Geeft gewoon
 * de tekst terug wanneer er geen woord in staat.
 */
export function metVaktermen(tekst: string | undefined): ReactNode {
  if (!tekst) return tekst;

  const stukken: ReactNode[] = [];
  let vanaf = 0;
  let gevonden = 0;

  for (const match of tekst.matchAll(zoeker)) {
    const vorm = match[0].toLowerCase().replace(/[\s,;:]+/g, ' ');
    const slug = slugPerVorm.get(vorm);
    if (slug === undefined || match.index === undefined) continue;
    if (match.index > vanaf) stukken.push(tekst.slice(vanaf, match.index));
    stukken.push(
      <Link className="vakterm-woord" key={`${slug}-${match.index}`} href={`/uitleg/vaktermen#term-${slug}`}>
        {match[0]}
      </Link>,
    );
    vanaf = match.index + match[0].length;
    gevonden += 1;
  }

  if (gevonden === 0) return tekst;
  if (vanaf < tekst.length) stukken.push(tekst.slice(vanaf));
  return stukken;
}
