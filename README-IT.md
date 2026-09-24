# IT-overdracht — Tuin Weener XL

Bijgewerkt op 24 september 2026. Dit document beschrijft de huidige situatie en een veilige route naar beheer door de organisatie. Het is nadrukkelijk geen bewijs dat de verhuizing al is uitgevoerd.

## In één oogopslag

De website bevat de actuele applicatie en alles wat nodig is voor de huidige website. De zwakke schakel is het eigenaarschap eromheen: productie, bronrepository, database en uploads zijn nog gekoppeld aan de huidige ChatGPT/Sites-omgeving. De losse projecthoofdmap buiten `website/` is verouderd; de enige uitzondering is de aparte workflow voor het maken van losse plantenkaarten.

| Onderdeel | Huidige situatie | Gevolg voor overdracht |
|---|---|---|
| Webapp | `website/`: TypeScript, React en Vinext; gebouwd met Node.js en npm | De applicatiecode is overdraagbaar, maar moet in de doelomgeving opnieuw worden gebouwd en ingericht. |
| Productie | Openbare Sites-publicatie op Cloudflare; versie 27 gebruikt commit `a92a392` | Een GitHub-push is geen productiepublicatie. Eigenaarschap en migratie van de Site moeten apart worden geregeld. |
| Git | Alleen `website/` is een Git-repository. `origin` is de Sites-bronrepo; `github` is `Zmkoks/tuin_weener`. | De lokale `main` staat op `a92a392`; de lokaal bekende `github/main` staat vijf commits achter. De GitHub-remote is voor deze inventaris niet opgehaald, dus controleer opnieuw vóór synchronisatie. |
| Bestanden buiten `website/` | Verouderde versies, hulpmiddelen en uitvoer; geen bron voor de huidige website. | Alleen de losse-plantenkaartenworkflow valt buiten de website. |
| Tuingegevens en media | Cloudflare D1-binding `DB`; R2-binding `FILES` | Records en uploads zitten niet in de broncode. Een codekopie neemt die niet mee. |
| Geheimen | Productiegeheimen staan in Sites; lokaal gebruikt de app `.env.local` | Geheimen moeten via een beveiligd kanaal opnieuw worden ingesteld; ze staan niet in Git. |

## Bronnenkaart: waar staat de actuele waarheid?

Uitgangspunt voor deze overdracht: voor de huidige website is `website/` compleet. De overige bestanden in de projecthoofdmap zijn verouderd en hoeven niet mee. Alleen de aparte workflow om losse plantenkaarten te maken staat daar nog buiten. Dit zegt niets over de live D1/R2-data of accountinstellingen: die staan buiten Git en zijn niet geëxporteerd of gecontroleerd.

| Onderwerp | Actuele bron voor de website | Kopie, invoer of afgeleide uitvoer | Status / aandachtspunt |
|---|---|---|---|
| Code, interface, kaart en boekje | De actuele app, vaste afbeeldingen en vormgeving staan in deze repo: `app/`, `db/` en `public/`. De kaart en het boekje gebruiken de actuele D1-data. | De JSON in `app/data/` is waar nodig startvulling/terugval. Oude Python-generators, exports en gelijknamige bestanden buiten `website/` zijn oudere versies. | Voor bouwen, beheren en publiceren van de huidige website is de projecthoofdmap niet nodig. |
| Live tuinrecords | Cloudflare D1 (`DB`); migraties staan in `db/opzet.ts` en Beheren schrijft naar D1. | `app/data/planten.json` en `app/data/tuin.json` zijn startvulling/terugval, geen export van de live tuin. | De actuele D1-inhoud moet bij een echte platformmigratie apart worden geëxporteerd en hersteld. Dat is runtime-data, geen ontbrekend bronbestand in de projecthoofdmap. |
| Live uploads | Cloudflare R2 (`FILES`); onder meer eigen foto's en symbolen worden daar opgeslagen. | Vaste afbeeldingen en de symbolenbibliotheek staan in `public/`. | R2-inhoud moet bij een echte platformmigratie apart worden veiliggesteld; een Git-kloon bevat die uploads niet. |
| Losse plantenkaarten — enige uitzondering | De bestaande kaartgenerator staat buiten de website in `../data_import.py`; die maakt HTML en optioneel PDF naar `../kaarten_v21/`. | De generator leest `../data_planten.txt.tsv`, `../fotos/`, `../svg/`, `../fonts/` en `../foto_instellingen.json`. | Dit is een aparte, oudere workflow en geen onderdeel van de site. De generator haalt niets uit D1; controleer/ververs de gegevens vanuit de huidige website voordat je nieuwe kaarten verspreidt. PDF-uitvoer vereist Playwright en pypdf. |
| Overige projectbestanden | Geen: de huidige website is compleet zonder de losse bestanden in de projecthoofdmap. | `../overdracht.md`, `../docs/`, oude PDF/HTML-uitvoer, eerdere kaart-/boekjeversies en Python-hulpmiddelen zijn verouderd. | Niet opnemen in de nieuwe bronrepository en niet als actuele inhoudsbron gebruiken. Bewaar ze desgewenst als archief; opruimen is een aparte keuze. |

### Nog te regelen voor een echte IT-overdracht

- Welke eigenaar beheert het Sites-project, de gekoppelde D1- en R2-resources, het domein en de toegang? Dat is niet uit de lokale code af te leiden.
- Maak een export van live D1 én R2 en test herstel in een aparte omgeving. Deze inventaris bevat geen bewezen back-up.
- Haal de Git-remotes opnieuw op en vergelijk de actuele branches voordat een synchronisatie of verhuizing wordt gepland.
- Als de losse plantenkaarten behouden blijven: spreek af hoe hun invoer actueel wordt gemaakt vanuit de website; de huidige generator leest een aparte TSV en synchroniseert niet met D1.

## Wat de applicatie nodig heeft

- Node.js 22.13 of nieuwer en npm; `package-lock.json` is de lockfile.
- Cloudflare-compatibele Worker-hosting voor de huidige Vinext-build.
- Een D1-database en R2-bucket, gekoppeld als `DB` en `FILES` in `.openai/hosting.json`.
- De productie-instellingen `BEHEER_CODE` en `BEHEER_SESSION_SECRET`, opnieuw veilig ingesteld in de doelomgeving.

De schema- en gegevensmigraties staan in `db/opzet.ts`. Ze draaien automatisch bij het eerste verzoek na een publicatie. `app/data/planten.json` en `app/data/tuin.json` vullen een lege database of dienen als terugval; ze zijn geen export van de actuele D1-gegevens. R2-media moeten afzonderlijk worden veiliggesteld en overgezet.

De oude aantekening `../overdracht.md` staat buiten deze Git-repository en is verouderd; gebruik de README's in `website/` als huidige werkinformatie.

## Belangrijkste gaten vóór een echte overdracht

1. **Doeleigenaarschap is nog niet vastgesteld.** Bepaal welke organisatie accounts, GitHub-organisatie, Cloudflare/Sites-project, domein/DNS en beheertoegang gaat bezitten.
2. **Losse plantenkaarten zijn de enige functionele uitzondering.** De huidige generator en invoer staan buiten Git en de invoer loopt niet automatisch gelijk met de website. Besluit of deze kaartenworkflow nodig blijft en neem alleen die gerichte workflow mee; migreer de rest van de verouderde projecthoofdmap niet mee.
3. **GitHub loopt achter.** Vergelijk en synchroniseer eerst de nieuwste Site-bron met de gekozen organisatie-repository. Gebruik GitHub op dit moment niet als enige herstelkopie.
4. **Back-up en herstel zijn niet beproefd.** Maak een herstelbare export van D1 en R2 en voer een herstelproef uit; alleen de migratiecode bewaren is niet genoeg.
5. **Productie-instellingen zijn platformgebonden.** Leg vast hoe geheimen, bindings, openbare toegang en de beheercode in de doelomgeving opnieuw worden ingericht. Kopieer nooit `.env.local` naar productie.

## Voorgestelde volgorde voor de IT-overdracht

1. Kies met de organisatie de blijvende eigenaar en doelomgeving; behoud de huidige openbare site totdat de vervanger is geaccepteerd.
2. Maak een inventaris van de Git-bron, live D1-tabellen, R2-bestanden, secrets, domein en toegangsbeleid. Neem geen oude projectbestanden mee, behalve als de organisatie de plantenkaartenworkflow expliciet wil behouden.
3. Maak een organisatiebeheerde repository en synchroniseer gecontroleerd de nieuwste websitecode. Houd geheimen en gebruikersuploads buiten de code-repository; neem voor plantenkaarten alleen de benodigde generator en een actuele invoer mee als die workflow blijft.
4. Maak en test exports/herstel van D1 en R2; documenteer hoe migraties en uploads worden overgezet.
5. Richt een niet-openbare testomgeving in met dezelfde bindings en instellingen. Bouw de Worker, voer migraties uit en controleer beheer, kaart, boekje en terugzetten.
6. Plan pas daarna een cut-over met eigenaar, terugvalplan en controle van domein, publieke toegang en beheercode.

Deze stappen zijn een voorstel, geen uitgevoerde migratie of goedgekeurde keuze voor een hostingprovider.

## Lokaal controleren

Voer vanuit `website/` uit:

```powershell
npm ci
npm run dev
```

Voor een controle van de productiebuild:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Gebruik `.env.example` als namenlijst voor lokale instellingen. Vul geen echte geheimen in dit document of in Git in. Zie [README-ONDERHOUD.md](README-ONDERHOUD.md) voor wijzigingen in de applicatie.
