import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const bronpad = new URL('../sept_data.json', import.meta.url);
const doelpad = new URL('./app/data/planten.json', import.meta.url);
const bron = JSON.parse(fs.readFileSync(bronpad, 'utf8')).planten;
const huidig = JSON.parse(fs.readFileSync(doelpad, 'utf8'));
const perId = new Map(bron.map(p => [p.id, p]));
// Bewaar tekst én links uit de oorspronkelijke credits, zonder uitvoerbare HTML.
function credit(value = '') {
  return value.replace(/<a\b[^>]*href="(https?:\/\/[^\"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}
const resultaat = huidig.map(p => {
  const b = perId.get(p.slug);
  if (!b) throw new Error(`Geen bron voor bestaande slug ${p.slug}`);
  return {
    ...p,
    naam: b.naam, plantnummer: b.plantnummer, botanischeNaam: b.botanischeNaam,
    waterOndergrens: String(b.water.ondergrens), waterBovengrens: String(b.water.bovengrens), waterInfo: b.water.info,
    zon: b.standplaats.code, zonInfo: b.standplaats.info,
    functies: { primair: b.functies.primair, secundair: b.functies.secundair },
    oogstTijd: b.oogst.tijd, oogstMethode: b.oogst.methode, extraOogstTijd: b.oogst.extraTijd, extraOogstMethode: b.oogst.extraMethode,
    snoeiTijd: b.snoei.tijd, snoeiTijdInfo: b.snoei.tijdInfo, snoeiMethode: b.snoei.methode, snoeiInformatie: b.snoei.informatie,
    woekerToestemming: b.woeker.toegestaan, woekerVerbod: b.woeker.verbod,
    levensduur: b.levensduur, groei: b.groei, bloei: b.bloei, sterf: b.sterf, intro: b.intro, weetje: b.weetje,
    commons: b.bronnen.commons,
    foto: p.foto?.bestand ? p.foto : { bestand: '', x: b.assets.foto?.x ?? 50, y: b.assets.foto?.y ?? 50, zoom: b.assets.foto?.zoom ?? 1, ...p.foto, bron: p.foto?.bron || credit(b.bronnen.foto) },
    illustratie: p.illustratie?.bestand ? p.illustratie : { bestand: '', x: 50, y: 50, zoom: 1, ...p.illustratie, bron: p.illustratie?.bron || credit(b.bronnen.plaatje) },
  };
});
if (bron.length !== huidig.length) throw new Error('Controleer nieuwe/verwijderde planten voordat je importeert.');
fs.writeFileSync(doelpad, JSON.stringify(resultaat, null, 1) + '\n');
console.log(`${resultaat.length} planten bijgewerkt in ${fileURLToPath(doelpad)}; slugs behouden. De database is niet gewijzigd.`);
