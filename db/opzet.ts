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
  {
    // De webfoto's zijn horizontaal gespiegeld ten opzichte van het oude drukwerk. De
    // bijbehorende x-waarden zijn daarom vaste waarden en geen berekening: deze migratie
    // mag nooit bij een volgende run opnieuw spiegelen. Eigen uploads blijven ongemoeid.
    naam: '0002_spiegel_foto_x',
    stappen: [
      `UPDATE planten SET foto_x = CASE slug
        WHEN 'aardbei' THEN 73
        WHEN 'azarooldoorn' THEN 54
        WHEN 'bieslook' THEN 48
        WHEN 'bosbes' THEN 9
        WHEN 'citroenmelisse' THEN 22
        WHEN 'dragon' THEN 71
        WHEN 'edel-duizendblad' THEN 69
        WHEN 'framboos' THEN 81
        WHEN 'kardinaalmuts' THEN 42
        WHEN 'kiwi' THEN 37
        WHEN 'knopherik' THEN 92
        WHEN 'lavendel' THEN 61
        WHEN 'marjolein' THEN 100
        WHEN 'meidoorn' THEN 50
        WHEN 'munt' THEN 57
        WHEN 'rode-bes' THEN 49
        WHEN 'rozemarijn' THEN 50
        WHEN 'salie' THEN 32
        WHEN 'spaanse-aak' THEN 100
        WHEN 'teunisbloem' THEN 0
        WHEN 'tijm' THEN 50
        WHEN 'venkel' THEN 31
        WHEN 'wegedoorn' THEN 2
        WHEN 'witte-moerbei' THEN 50
        WHEN 'zwarte-bes' THEN 50
      END
      WHERE foto_bestand = '' AND slug IN (
        'aardbei', 'azarooldoorn', 'bieslook', 'bosbes', 'citroenmelisse', 'dragon',
        'edel-duizendblad', 'framboos', 'kardinaalmuts', 'kiwi', 'knopherik', 'lavendel',
        'marjolein', 'meidoorn', 'munt', 'rode-bes', 'rozemarijn', 'salie', 'spaanse-aak',
        'teunisbloem', 'tijm', 'venkel', 'wegedoorn', 'witte-moerbei', 'zwarte-bes'
      )`,
    ],
  },
  {
    // Eetbaarheid en gevaar zijn inhoudelijke beoordelingen, los van de functielabels.
    // NULL betekent dat een bestaande plant nog moet worden gecontroleerd; 0 en 1 zijn
    // bewuste antwoorden. De oude extra-oogstkolommen blijven tijdens de overgang bestaan.
    naam: '0003_eetbaarheid_gevaar_en_onkruid',
    stappen: [
      `ALTER TABLE planten ADD COLUMN eetbaar INTEGER`,
      `ALTER TABLE planten ADD COLUMN eetbaar_info TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE planten ADD COLUMN gevaarlijk INTEGER`,
      `ALTER TABLE planten ADD COLUMN gevaarlijk_info TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE planten ADD COLUMN waarom_laten_staan TEXT NOT NULL DEFAULT ''`,
      `UPDATE planten
       SET eetbaar = 1
       WHERE oogst_tijd <> '' OR extra_oogst_tijd <> ''`,
      // In de huidige gegevens hebben kiwi en azarooldoorn alleen een extra oogst. Kopieer
      // die alvast naar de blijvende oogstvelden, maar wis de oude velden nog niet.
      `UPDATE planten
       SET oogst_tijd = extra_oogst_tijd,
           oogst_methode = extra_oogst_methode
       WHERE oogst_tijd = '' AND extra_oogst_tijd <> ''`,
    ],
  },
  {
    // Eerste inhoudelijke beoordeling van de 25 bestaande planten. Migratie 0005 splitst
    // botanische eetbaarheid daarna van de werkelijke oogstbaarheid van het tuinexemplaar.
    naam: '0004_beoordeel_bestaande_planten',
    stappen: [
      `UPDATE planten SET
        eetbaar = CASE slug
          WHEN 'aardbei' THEN 1 WHEN 'bosbes' THEN 1 WHEN 'bieslook' THEN 1
          WHEN 'kiwi' THEN 0 WHEN 'citroenmelisse' THEN 1 WHEN 'dragon' THEN 1
          WHEN 'edel-duizendblad' THEN 0 WHEN 'framboos' THEN 1 WHEN 'knopherik' THEN 0
          WHEN 'lavendel' THEN 1 WHEN 'marjolein' THEN 1 WHEN 'munt' THEN 1
          WHEN 'rode-bes' THEN 1 WHEN 'rozemarijn' THEN 1 WHEN 'salie' THEN 1
          WHEN 'teunisbloem' THEN 0 WHEN 'tijm' THEN 1 WHEN 'venkel' THEN 1
          WHEN 'zwarte-bes' THEN 1 WHEN 'spaanse-aak' THEN 0 WHEN 'wegedoorn' THEN 0
          WHEN 'kardinaalmuts' THEN 0 WHEN 'witte-moerbei' THEN 0 WHEN 'meidoorn' THEN 0
          WHEN 'azarooldoorn' THEN 1 ELSE eetbaar END,
        gevaarlijk = CASE slug
          WHEN 'wegedoorn' THEN 1 WHEN 'kardinaalmuts' THEN 1 ELSE 0 END,
        eetbaar_info = CASE slug
          WHEN 'aardbei' THEN 'De rijpe rode vruchten zijn eetbaar.'
          WHEN 'bosbes' THEN 'De rijpe donkerblauwe bessen zijn eetbaar.'
          WHEN 'bieslook' THEN 'De groene sprieten en bloemen zijn eetbaar.'
          WHEN 'citroenmelisse' THEN 'De jonge bladeren zijn bruikbaar in eten en thee.'
          WHEN 'dragon' THEN 'De jonge bladeren en zachte toppen zijn bruikbaar als keukenkruid.'
          WHEN 'framboos' THEN 'De rijpe frambozen zijn eetbaar.'
          WHEN 'lavendel' THEN 'De bloemen zijn in kleine hoeveelheden bruikbaar als smaakmaker.'
          WHEN 'marjolein' THEN 'De bladeren en jonge toppen zijn bruikbaar als keukenkruid.'
          WHEN 'munt' THEN 'De bladeren zijn bruikbaar in eten en thee.'
          WHEN 'rode-bes' THEN 'De rijpe rode bessen zijn eetbaar.'
          WHEN 'rozemarijn' THEN 'De jonge takjes en bladeren zijn bruikbaar als keukenkruid.'
          WHEN 'salie' THEN 'De bladeren zijn in kleine hoeveelheden bruikbaar als keukenkruid.'
          WHEN 'tijm' THEN 'De bladeren en jonge toppen zijn bruikbaar als keukenkruid.'
          WHEN 'venkel' THEN 'De bladeren, bloemen en rijpe zaden zijn eetbaar.'
          WHEN 'zwarte-bes' THEN 'De rijpe zwarte bessen zijn eetbaar.'
          WHEN 'azarooldoorn' THEN 'De rijpe vruchten zijn eetbaar. Verwijder de pitten voor gebruik.'
          ELSE '' END,
        gevaarlijk_info = CASE slug
          WHEN 'wegedoorn' THEN 'Eet geen delen van deze plant. Vooral de zwarte vruchten kunnen klachten veroorzaken.'
          WHEN 'kardinaalmuts' THEN 'Eet geen delen van deze plant. Ook de opvallende vruchten zijn niet eetbaar.'
          ELSE '' END,
        waarom_laten_staan = CASE slug
          WHEN 'edel-duizendblad' THEN 'De bloemen geven voedsel aan insecten en zorgen voor kleur in de tuin.'
          WHEN 'knopherik' THEN 'De bloemen geven voedsel aan bijen en zweefvliegen.'
          WHEN 'teunisbloem' THEN 'De bloemen geven kleur en voedsel aan insecten en de zaden zijn voedsel voor vogels.'
          ELSE '' END
       WHERE slug IN (
         'aardbei','bosbes','bieslook','kiwi','citroenmelisse','dragon','edel-duizendblad',
         'framboos','knopherik','lavendel','marjolein','munt','rode-bes','rozemarijn','salie',
         'teunisbloem','tijm','venkel','zwarte-bes','spaanse-aak','wegedoorn','kardinaalmuts',
         'witte-moerbei','meidoorn','azarooldoorn'
       )`,
      `UPDATE planten
       SET functies_primair = 'kruid,insecten', functies_secundair = ''
       WHERE slug = 'venkel'`,
      `UPDATE planten
       SET oogst_tijd = extra_oogst_tijd, oogst_methode = extra_oogst_methode,
           extra_oogst_tijd = '', extra_oogst_methode = ''
       WHERE slug = 'azarooldoorn' AND extra_oogst_tijd <> ''`,
    ],
  },
  {
    // Botanische eetbaarheid en daadwerkelijke oogst in deze tuin zijn verschillende
    // gegevens. Een vrije tuinopmerking legt plaatselijke afwijkingen en onzekerheid uit.
    naam: '0005_oogstbaar_in_tuin',
    stappen: [
      `ALTER TABLE planten ADD COLUMN oogstbaar_in_tuin INTEGER`,
      `ALTER TABLE planten ADD COLUMN tuin_opmerking TEXT NOT NULL DEFAULT ''`,
      `UPDATE planten SET oogstbaar_in_tuin = CASE WHEN eetbaar = 1 THEN 1 ELSE 0 END`,
      `UPDATE planten SET
         eetbaar = 1,
         eetbaar_info = 'De vruchten van deze soort zijn eetbaar.',
         oogstbaar_in_tuin = 0,
         tuin_opmerking = 'Deze kiwi draagt in onze tuin geen vruchten.'
       WHERE slug = 'kiwi'`,
      `UPDATE planten SET
         eetbaar = 1,
         eetbaar_info = 'De rijpe vruchten van deze soort zijn eetbaar.',
         oogstbaar_in_tuin = 0,
         tuin_opmerking = 'Deze witte moerbei draagt in onze tuin geen vruchten.'
       WHERE slug = 'witte-moerbei'`,
      `UPDATE planten SET
         eetbaar = 1,
         eetbaar_info = 'Jonge delen van de soort worden soms gegeten.',
         oogstbaar_in_tuin = 1
       WHERE slug = 'knopherik'`,
      `UPDATE planten SET
         eetbaar = 1,
         eetbaar_info = 'Rijpe meidoornvruchten zijn eetbaar na verwijdering van de pitten.',
         oogstbaar_in_tuin = 1
       WHERE slug = 'meidoorn'`,
      `UPDATE planten SET
         tuin_opmerking = 'De precieze soort is onzeker. Dit kan gewone rozemarijn, Salvia rosmarinus, zijn.'
       WHERE slug = 'rozemarijn'`,
    ],
  },
  {
    // Eén simpele ja/nee-waarde die aansluit op de bestaande boom- en heesterplekken van
    // de plattegrond. Dit staat los van het functielabel `boom`.
    naam: '0006_boom_heester',
    stappen: [
      `ALTER TABLE planten ADD COLUMN boom_heester INTEGER NOT NULL DEFAULT 0`,
      `UPDATE planten SET boom_heester = CASE WHEN slug IN (
         'spaanse-aak','wegedoorn','kardinaalmuts','witte-moerbei','meidoorn','azarooldoorn'
      ) THEN 1 ELSE 0 END`,
    ],
  },
  {
    // Voorbeeld van de nieuwe redactionele logica: gevaarlijk onkruid dat uit de tuin weg
    // moet. INSERT OR IGNORE houdt een eventueel al handmatig toegevoegd exemplaar intact.
    naam: '0007_reuzenberenklauw',
    stappen: [
      `INSERT OR IGNORE INTO planten (
         slug, naam, plantnummer, botanische_naam, zon, zon_info,
         water_ondergrens, water_bovengrens, water_info,
         functies_primair, functies_secundair,
         eetbaar, eetbaar_info, oogstbaar_in_tuin, tuin_opmerking, boom_heester,
         gevaarlijk, gevaarlijk_info, waarom_laten_staan,
         oogst_tijd, oogst_methode, extra_oogst_tijd, extra_oogst_methode,
         snoei_tijd, snoei_tijd_info, snoei_methode, snoei_informatie,
         woeker_toestemming, woeker_verbod, levensduur, groei, bloei, sterf,
         commons, commons_illustraties, intro, weetje, aangemaakt_op, gewijzigd_op
       ) VALUES (
         'reuzenberenklauw', 'reuzenberenklauw', '26',
         'Heracleum mantegazzianum Sommier & Levier', 'halfschaduw',
         'Reuzenberenklauw groeit op zonnige en halfbeschaduwde plekken. Hij groeit vaak op vochtige, voedselrijke grond.',
         '1', '3', 'Deze plant hoeft geen water. Geef geen water en kom niet onnodig dichtbij.',
         'onkruid', '',
         0, '', 0, 'Haal deze plant weg. Voorkom in ieder geval dat hij rijpe zaden maakt.', 0,
         1, 'Het sap kan samen met zonlicht ernstige huidbeschadiging veroorzaken. Bescherm huid en ogen.', '',
         '', '', '', '',
         'Maart,April,Mei,Juni,Juli,Augustus',
         'Begin in het vroege voorjaar. Controleer de plek in de zomer opnieuw. Voorkom altijd dat de plant rijpe zaden maakt.',
         'Draag volledig bedekkende kleding, stevige handschoenen en oogbescherming. Steek de wortel in het voorjaar minstens 15 centimeter onder de grond af. Herhaal dit als de plant terugkomt.',
         'Het sap kan samen met zonlicht ernstige huidbeschadiging veroorzaken. Bescherm huid en ogen. Voer verwijderde delen af met het groenafval en laat ze niet in de tuin liggen.',
         'Haal de plant weg voordat hij zaad maakt. Werk alleen met volledig bedekte huid, stevige handschoenen en oogbescherming.',
         'Raak de plant niet met blote huid aan. Maai of knip hem niet zonder beschermende kleding. Laat geen bloemen met rijpe zaden staan.',
         'Meerjarig', 'Maart,April,Mei,Juni,Juli,Augustus,September,Oktober',
         'Juni,Juli,Augustus', 'November,December,Januari,Februari',
         'https://commons.wikimedia.org/wiki/Category:Heracleum_mantegazzianum',
         'https://commons.wikimedia.org/wiki/Category:Heracleum_mantegazzianum_(illustrations)',
         'Reuzenberenklauw is een zeer grote plant met witte bloemschermen. Het sap kan de huid ernstig beschadigen in zonlicht.',
         'De plant kan meer dan drie meter hoog worden en maakt zeer veel zaden.',
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
    ],
  },
  {
    // Oude bijgemaakte plekken kregen nog geen kaartnummer en plaatsten hun badge in het
    // midden. Geef ze bij de eerstvolgende aanvraag dezelfde notatie als nieuwe plekken.
    naam: '0008_nummer_bijgemaakte_plekken',
    stappen: [
      `UPDATE plekken
       SET label = CAST(
         COALESCE((SELECT MAX(CAST(label AS INTEGER)) FROM plekken WHERE label GLOB '[0-9]*'), 0)
         + (SELECT COUNT(*) FROM plekken eerder
            WHERE eerder.vast = 0 AND eerder.label = '' AND eerder.id <= plekken.id)
         AS TEXT)
       WHERE vast = 0 AND label = ''`,
      `UPDATE plekken
       SET badge_x = CASE vorm_type
         WHEN 'rect' THEN COALESCE(x, 0) + COALESCE(b, 0) / 2
         WHEN 'ellipse' THEN COALESCE(cx, 0)
         ELSE COALESCE(x, 0) END,
           badge_y = CASE vorm_type
         WHEN 'rect' THEN COALESCE(y, 0) + COALESCE(h, 0) - MIN(3.2, MAX(1, COALESCE(h, 0) / 4))
         WHEN 'ellipse' THEN COALESCE(cy, 0) + COALESCE(ry, 0) - MIN(3.2, MAX(1, COALESCE(ry, 0) / 4))
         ELSE COALESCE(y, 0) END
       WHERE vast = 0`,
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
