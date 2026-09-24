# Overige wijzigingen en onderhoud

## Plantgegevens

- Gebruik **Beheren** voor bestaande planten, plekken, beplanting, foto's en symbolen.
- De live gegevens staan in Cloudflare D1. `app/data/planten.json` en `app/data/tuin.json` zijn startgegevens en terugval; aanpassen daarvan wijzigt bestaande live records niet.
- Als bestaande records in bulk of volgens een nieuw schema moeten veranderen, maak dan een gerichte migratie in `db/opzet.ts`. Die draait na publicatie automatisch bij het eerste verzoek. Maak vóór een risicovolle wijziging een controleerbare back-up.
- Afbeeldingen die via Beheren worden toegevoegd staan in R2. Vervangen media worden op dit moment niet automatisch verwijderd; ruim ze niet handmatig op zonder een bewaarbeleid en back-up.

## Waar codewijzigingen meestal horen

| Onderwerp | Begin hier |
|---|---|
| Beheerpagina's en formulier | `app/beheren/`, `app/components/plantFormulier.tsx` |
| Plantgegevens en beoordeling | `app/data/plantTypes.ts`, `app/data/plantBeoordelingen.ts`, `db/` |
| Snoei- en oogstmomenten | `app/data/momenten.ts`, plantformulier en database |
| Foto's en illustraties | `app/data/afbeeldingen.ts`, `app/data/fotos.ts`, `app/data/illustraties.ts` |
| Tuinwoorden/vaktermen | `app/data/vaktermen.ts` en `app/data/vaktermLinks.tsx` |
| Alternatieve vaktermformuleringen | `app/data/vaktermAliassen.ts` |
| Uitlegpagina's | `app/uitleg/` en `app/uitleg.css` |
| Plattegrond en boekje | Zie [README-KAART-EN-DRUKWERK.md](README-KAART-EN-DRUKWERK.md) |

`app/data/vaktermen.ts` is gegenereerd door een hulpmiddel in de projecthoofdmap. Bewerk dat bestand niet als enige bron: pas de vaktermenbron aan en genereer opnieuw. Ook die generator en bijbehorende PDF-bronnen staan buiten de Git-repository; zie [README-IT.md](README-IT.md).

## Lokaal werken en controleren

Vereist: Node.js 22.13 of nieuwer. Vanuit `website/`:

```powershell
npm ci
npm run dev
```

Voor een productiecontrole:

```powershell
node test-plantgegevens.mjs
node test-plant-verwijderen.mjs
npx tsc --noEmit
npm run lint
npm run build
```

De verwachting in `test-plantgegevens.mjs` kan achterlopen op de huidige eetbaarheidsgegevens; stem die test eerst af op de afgesproken inhoud voordat je hem als releasevoorwaarde gebruikt.

Voer alleen de tests uit die bij de wijziging passen. Een geslaagde build bewijst niet dat inhoud, live D1-gegevens of drukwerk visueel juist zijn; controleer die waar nodig apart.

## Geheimen en publiceren

`.env.local` is lokaal en hoort niet in Git. Productiegeheimen worden via Sites beheerd. Een codepush naar GitHub verandert de openbare site niet; publiceer alleen via de afgesproken Sites-workflow en behoud de bestaande publieke toegang. Zie [README-IT.md](README-IT.md) voor de actuele bron- en hostingstatus.
