# Kaart en drukwerk aanpassen

De actuele plattegrond en het boekje worden op de site uit de tuinadministratie opgebouwd. De website-repository bevat de actuele code en vaste bestanden; de overige bestanden in de projecthoofdmap zijn verouderd, met één uitzondering: de aparte generator voor losse plantenkaarten.

## Plattegrond

- Live kaart: `/plattegrond`; afdrukbare kaart: `/drukwerk/plattegrond`.
- De getekende ondergrond staat in `public/plattegrond_ondergrond.svg`; dit is de actuele, versiebeheerde kaartbron.
- Actuele plekken, vormen en beplanting komen uit D1, niet uit een eerder gemaakte kaartafbeelding of oude bestanden in de projecthoofdmap.
- De kaartcomponent staat in `app/components/Plattegrond.tsx`; plantplaatsing in `app/lib/plattegrondPlaatsing.ts`; nummers en legenda in `app/components/kaartIndex.tsx`.
- De vaste symbolen staan in `public/symbolen/bibliotheek.svg`. Eigen symbolen worden via Beheren geüpload en in R2 bewaard.

Pas een bak, ovaal of beplanting aan via **Beheren** als het om de levende tuinindeling gaat. Bewerk de ondergrond alleen voor vaste terreinonderdelen, zoals paden, gebouw, deur of zitplek. Zo voorkom je dat een tekening en de echte plantgegevens uit elkaar lopen.

## Boekje

- Actuele route: `/drukwerk/boekje`; de afzonderlijke proefroute is `/drukwerk/boekje/proef`.
- De inhoud wordt opgebouwd in `app/lib/boekjeInhoud.ts` en `app/components/boekje/`; katernvolgorde staat in `app/lib/boekjeVellen.ts`.
- Vormgeving: `app/boekje.css` en `app/boekjeVoorwerk.css`. De benodigde vaste afbeeldingen staan onder `public/boekje/`.
- Bewerk de actuele gegevens via Beheren of een gerichte databasewijziging. Een eerder geëxporteerde PDF wordt niet vanzelf ververst vanuit D1; maak voor actuele inhoud een nieuwe afdruk vanuit de website.

## Losse plantenkaarten

Dit is de enige drukwerkworkflow die nog buiten de website staat. De bestaande generator is `../data_import.py` (vanuit `website/`); vanuit de projecthoofdmap maakt `py data_import.py --pdf` HTML-kaarten en PDF's in `kaarten_v21/`.

De generator leest `data_planten.txt.tsv`, foto's uit `fotos/`, symbolen uit `svg/`, lettertypes uit `fonts/` en uitsnede-instellingen uit `foto_instellingen.json`. Deze aparte invoer is verouderd en wordt niet met D1 gesynchroniseerd. Controleer en actualiseer de gegevens vanuit de huidige website voordat je nieuwe kaarten gebruikt. Voor PDF-uitvoer zijn Playwright en pypdf nodig.

## Afdrukken en controleren

- De plattegrond wordt op A4 staand afgedrukt.
- Het boekje heeft aparte afdrukstanden voor omslag en binnenwerk. De afdrukstand wordt automatisch gekozen; zet bij dubbelzijdig binnenwerk **omslaan over de lange zijde** aan.
- Controleer vóór verspreiding een schermweergave én een echte proefafdruk. Let op afgesneden inhoud, blanco pagina's, kaart/legenda en of alle afbeeldingen geladen zijn.
- Start lokaal vanuit `website/` met `npm run dev`; controleer wijzigingen ook met `npm run build`.

## Belangrijk vóór wijzigen

De projecthoofdmap is geen Git-repository en de inhoud ervan is verouderd, behalve de aparte plantenkaartengenerator en de bestanden die deze nodig heeft. Neem die workflow alleen mee als losse plantenkaarten nodig blijven; migreer de rest van het oude archief niet naar de nieuwe bronrepository. Zie [README-IT.md](README-IT.md) voor de omgeving- en back-upgaten.
