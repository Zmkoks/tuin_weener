import { env } from 'cloudflare:workers';

/**
 * Het schema van de tuindatabase, en de enige plek waar het staat.
 *
 * Hiervoor stond het op vijf plekken: `schema.ts` (twee tabellen), losse `CREATE TABLE`-tekst
 * in `plants.ts`, `zones.ts` en `garden.ts` (drie tabellen, waarvan er één nergens beschreven
 * stond), en `drizzle/*.sql` dat nooit werd uitgevoerd. Elke tabel werd aangemaakt door de
 * eerste functie die hem toevallig nodig had.
 *
 * Nu is er één lijst met migraties, in volgorde, en een tabel die bijhoudt welke er al
 * gedraaid hebben. Een migratie draait dus precies één keer, ook als de site opnieuw start.
 *
 * **Waarom in de code en niet met `wrangler d1 migrations apply`?** Deze site draait op de
 * hosting van het bouwplatform en er is geen wrangler-configuratie waar een migratiemap in
 * staat; de opdrachtregel is er bij het publiceren niet. Daarom past de site zijn eigen
 * schema toe. Het verschil met vroeger is de volgorde en de registratie: geen vier losse
 * `ensureXTable()`-functies meer die elkaar niet kennen.
 */

type Migratie = { naam: string; stappen: string[] };

export const MIGRATIES: Migratie[] = [
  {
    // Vier tabellen, en per veld een kolom met een naam. De maandlijsten en de functies
    // staan als komma-lijst in een kolom: er wordt in de praktijk alleen op naam gezocht,
    // dus een eigen tabel per lijst zou werk zijn zonder opbrengst. Wordt er later toch in
    // de database gefilterd, dan is dat een migratie erbij en geen verbouwing.
    naam: '0001_tuin',
    stappen: [
      `CREATE TABLE IF NOT EXISTS planten (
        slug TEXT PRIMARY KEY,
        naam TEXT NOT NULL,
        plantnummer TEXT NOT NULL DEFAULT '',
        botanische_naam TEXT NOT NULL DEFAULT '',
        zon TEXT NOT NULL DEFAULT '',
        zon_info TEXT NOT NULL DEFAULT '',
        water_ondergrens TEXT NOT NULL DEFAULT '',
        water_bovengrens TEXT NOT NULL DEFAULT '',
        water_info TEXT NOT NULL DEFAULT '',
        functies_primair TEXT NOT NULL DEFAULT '',
        functies_secundair TEXT NOT NULL DEFAULT '',
        oogst_tijd TEXT NOT NULL DEFAULT '',
        oogst_methode TEXT NOT NULL DEFAULT '',
        extra_oogst_tijd TEXT NOT NULL DEFAULT '',
        extra_oogst_methode TEXT NOT NULL DEFAULT '',
        snoei_tijd TEXT NOT NULL DEFAULT '',
        snoei_tijd_info TEXT NOT NULL DEFAULT '',
        snoei_methode TEXT NOT NULL DEFAULT '',
        snoei_informatie TEXT NOT NULL DEFAULT '',
        woeker_toestemming TEXT NOT NULL DEFAULT '',
        woeker_verbod TEXT NOT NULL DEFAULT '',
        levensduur TEXT NOT NULL DEFAULT '',
        groei TEXT NOT NULL DEFAULT '',
        bloei TEXT NOT NULL DEFAULT '',
        sterf TEXT NOT NULL DEFAULT '',
        commons TEXT NOT NULL DEFAULT '',
        commons_illustraties TEXT NOT NULL DEFAULT '',
        intro TEXT NOT NULL DEFAULT '',
        weetje TEXT NOT NULL DEFAULT '',
        foto_ingesteld INTEGER NOT NULL DEFAULT 0,
        foto_bestand TEXT NOT NULL DEFAULT '',
        foto_bron TEXT NOT NULL DEFAULT '',
        foto_x REAL NOT NULL DEFAULT 50,
        foto_y REAL NOT NULL DEFAULT 50,
        foto_zoom REAL NOT NULL DEFAULT 1,
        illustratie_ingesteld INTEGER NOT NULL DEFAULT 0,
        illustratie_bestand TEXT NOT NULL DEFAULT '',
        illustratie_bron TEXT NOT NULL DEFAULT '',
        illustratie_x REAL NOT NULL DEFAULT 50,
        illustratie_y REAL NOT NULL DEFAULT 50,
        illustratie_zoom REAL NOT NULL DEFAULT 1,
        symbolen_bibliotheek TEXT,
        aangemaakt_op TEXT NOT NULL,
        gewijzigd_op TEXT NOT NULL
      )`,
      // `vast` is 1 voor de plekken die uit tuin.json komen. Die blijven staan, want het
      // drukwerk tekent ermee; alleen bijgemaakte plekken mogen weer weg.
      `CREATE TABLE IF NOT EXISTS plekken (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL DEFAULT '',
        soort TEXT NOT NULL DEFAULT '',
        svg_label TEXT NOT NULL DEFAULT '',
        badge_x REAL NOT NULL DEFAULT 0,
        badge_y REAL NOT NULL DEFAULT 0,
        vorm_type TEXT NOT NULL,
        x REAL, y REAL, b REAL, h REAL,
        cx REAL, cy REAL, rx REAL, ry REAL,
        vast INTEGER NOT NULL DEFAULT 0,
        volgorde INTEGER NOT NULL DEFAULT 0,
        aangemaakt_op TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS beplanting (
        plek_id TEXT NOT NULL,
        plant_slug TEXT NOT NULL,
        gewijzigd_op TEXT NOT NULL,
        PRIMARY KEY (plek_id, plant_slug)
      )`,
      // De geüploade tekeningen zijn een groeiende lijst van bestand-plus-bron, met per
      // regel een echt bestand in de opslag. Dat is het enige lijstveld dat een eigen tabel
      // verdient; de aangevinkte bibliotheeknamen passen in een kolom.
      `CREATE TABLE IF NOT EXISTS plant_symbolen (
        plant_slug TEXT NOT NULL,
        volgorde INTEGER NOT NULL,
        bestand TEXT NOT NULL,
        bron TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (plant_slug, volgorde)
      )`,
    ],
  },
];

let gedaan: Promise<void> | null = null;

/**
 * Zorg dat het schema klopt. Iedere lees- of schrijffunctie begint hiermee.
 *
 * De belofte wordt bewaard en niet het resultaat: twee verzoeken die tegelijk binnenkomen
 * wachten dan op dezelfde migratie in plaats van hem allebei te draaien. Gaat het mis, dan
 * wordt de belofte losgelaten zodat een volgend verzoek het opnieuw probeert.
 */
export function zorgVoorDatabase(): Promise<void> {
  gedaan ??= draaiMigraties().catch((fout) => {
    gedaan = null;
    throw fout;
  });
  return gedaan;
}
async function draaiMigraties() {
  const db = env.DB;
  if (!db) throw new Error('De tuinopslag is niet beschikbaar.');

  await db.prepare(`CREATE TABLE IF NOT EXISTS migraties (
    naam TEXT PRIMARY KEY,
    gedraaid_op TEXT NOT NULL
  )`).run();

  const gedraaid = await db.prepare('SELECT naam FROM migraties').all<{ naam: string }>();
  const klaar = new Set(gedraaid.results.map((regel) => regel.naam));

  for (const migratie of MIGRATIES) {
    if (klaar.has(migratie.naam)) continue;
    for (const stap of migratie.stappen) await db.prepare(stap).run();
    await db.prepare('INSERT OR IGNORE INTO migraties (naam, gedraaid_op) VALUES (?, ?)')
      .bind(migratie.naam, new Date().toISOString())
      .run();
  }
}
