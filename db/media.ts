import { env } from 'cloudflare:workers';

/**
 * Foto's en illustraties die via de site zijn geüpload. Ze gaan naar de bestandsopslag
 * (R2, binding `FILES`) en niet naar `public/`: dat is een map in de code, die kan een
 * draaiende site niet beschrijven. De vaste foto's uit `public/fotos` blijven staan waar
 * ze staan; per plant bepaalt `plant.foto.bestand` welke van de twee geldt.
 */

/** Wat we accepteren, en onder welke extensie we het bewaren. */
export const TOEGESTAAN: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Een kaartsymbool is een tekening, geen foto: die komt als SVG binnen. */
export const SYMBOOL_TYPE = 'image/svg+xml';

/**
 * Een SVG is tekst die van alles kan bevatten, ook script. We weigeren wat niet in een
 * tekening thuishoort in plaats van het stilletjes weg te poetsen: dan weet degene die
 * uploadt dat het bestand niet klopt, in plaats van dat er later iets ontbreekt.
 */
export function keurSymbool(tekst: string): string | null {
  if (!/<svg[\s>]/i.test(tekst)) return 'Dit is geen SVG-bestand.';
  if (/<script/i.test(tekst)) return 'Er zit een script in dit bestand. Exporteer de tekening opnieuw zonder script.';
  if (/\son\w+\s*=/i.test(tekst)) return 'Er zitten gebeurtenissen (onclick en dergelijke) in dit bestand.';
  if (/<foreignObject/i.test(tekst)) return 'Dit bestand bevat een foreignObject; dat kan een kaartsymbool niet zijn.';
  if (/(?:href|src)\s*=\s*["']?\s*(?:https?:|\/\/)/i.test(tekst)) return 'Dit bestand verwijst naar iets buiten zichzelf. Een symbool moet op zichzelf staan.';
  if (!/viewBox\s*=/i.test(tekst)) return 'De tekening heeft geen viewBox, dus de kaart weet niet hoe groot hij is.';
  return null;
}

/** Ruim boven een telefoonfoto, ruim onder wat een verzoek aankan. */
export const MAXIMALE_GROOTTE = 8 * 1024 * 1024;

function opslag() {
  const bestanden = env.FILES;
  if (!bestanden) throw new Error('De bestandsopslag is niet beschikbaar.');
  return bestanden;
}

/** Een nieuwe sleutel, met de slug erin zodat je in de opslag ziet waar iets bij hoort. */
export function nieuweSleutel(soort: string, slug: string, extensie: string) {
  const toeval = Math.random().toString(36).slice(2, 8);
  return `${soort}/${slug}-${Date.now().toString(36)}${toeval}.${extensie}`;
}

export async function bewaarBestand(sleutel: string, inhoud: ArrayBuffer, type: string) {
  await opslag().put(sleutel, inhoud, { httpMetadata: { contentType: type } });
  return sleutel;
}

export async function leesBestand(sleutel: string) {
  return opslag().get(sleutel);
}
