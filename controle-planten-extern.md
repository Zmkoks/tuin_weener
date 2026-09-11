# Externe controle van de huidige planten

Datum controle: 10 september 2026.

## Betekenis van de uitkomsten

- **Onkruid** is voor deze site uiteindelijk een tuinbesluit: komt de plant hier spontaan op en mag hij worden verwijderd? Externe bronnen kunnen wel aantonen dat een soort een bekend akkeronkruid, een sterke uitzaaier of een schadelijke invasieve exoot is.
- **Eetbaar: ja** betekent dat normaal menselijk voedselgebruik van de genoemde soort bekend is. Of het aanwezige exemplaar werkelijk oogst geeft, staat los daarvan in `oogstbaarInTuin`.
- **Gevaarlijk: ja** is gereserveerd voor een relevante waarschuwing op de pagina. Gewone voedselallergieën, doorns en risico's van geconcentreerde etherische olie staan als aandachtspunt vermeld, maar maken een plant niet automatisch `gevaarlijk`.
- Geen van de oorspronkelijke 25 soorten staat op de EU-Unielijst van invasieve exoten. Trosbosbes staat wel in het NVWA-overzicht van invasieve landplanten waarvoor verspreiding naar de natuur moet worden voorkomen. De later toegevoegde reuzenberenklauw staat wél op de Unielijst.

## Controlelijst

| Plant | Onkruid extern | Eetbaar | Gevaarlijk | Voorstel voor de database / controle |
|---|---|---|---|---|
| aardbei (*Fragaria × ananassa*) | Nee; geteeld gewas | Ja, gewone oogst | Nee | `eetbaar: true`; huidige primaire functie `fruit` behouden. |
| bosbes (*Vaccinium corymbosum*) | Geen gewoon tuinonkruid; wel invasierisico buiten de tuin | Ja, gewone oogst | Nee | `eetbaar: true`; niet als onkruid tonen, maar verspreiding naar natuurgebieden voorkomen. |
| bieslook (*Allium schoenoprasum*) | Nee; kan zich uitzaaien | Ja, gewone oogst | Nee voor normaal menselijk gebruik | `eetbaar: true`; blad en bloemen. Giftigheid voor huisdieren niet als algemene plantenwaarschuwing tonen. |
| kiwi (*Actinidia chinensis*) | Nee | Ja | Nee; kiwi kan wel allergische reacties geven | `eetbaar: true`, `oogstbaarInTuin: false`. Tuinopmerking: deze kiwi draagt in onze tuin geen vruchten. |
| citroenmelisse (*Melissa officinalis*) | Nee; kan uitzaaien | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; primaire functie `kruid` behouden. |
| dragon (*Artemisia dracunculus*) | Nee | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; geen advies over etherische olie of grote medicinale hoeveelheden. |
| edel duizendblad (*Achillea nobilis*) | Geen algemeen schadelijk onkruid; tuincontext bepaalt label | Niet voldoende onderbouwd als voedselplant | Geen algemene waarschuwing; mogelijke Asteraceae-contactallergie | Niet behandelen alsof dit gewoon duizendblad (*A. millefolium*) is. `eetbaar` voorlopig onbeoordeeld/nee en lokaal vaststellen waarom `onkruid` is toegekend. |
| framboos (*Rubus idaeus*) | Nee; maakt wel uitlopers | Ja, gewone oogst | Nee; stekels zijn een praktisch aandachtspunt | `eetbaar: true`; primaire functie `fruit` behouden. |
| knopherik (*Raphanus raphanistrum*) | Ja, bekend akkeronkruid; niet verplicht verwijderen | Traditioneel eetbare jonge delen, maar geen gewoon voedselgewas | Geen algemene waarschuwing voor tuincontact | `onkruid` behouden. Eetbaarheid alleen als extra informatie opnemen als de soort ter plekke zeker is; geen oogsttaak. |
| lavendel (*Lavandula angustifolia*) | Nee | Ja, kleine hoeveelheden bloemen als keukenkruid | Nee; geurstoffen kunnen bij gevoelige mensen irriteren | `eetbaar: true`; met `kruid` secundair verschijnt dit onder Extra informatie. |
| marjolein (*Origanum majorana*) | Nee | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; primaire functie `kruid` behouden. |
| munt (*Mentha spicata*) | Geen schadelijk onkruid; kan sterk uitbreiden | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; verspreiding via wortelstokken blijft in de verwijderregels. |
| rode bes (*Ribes rubrum*) | Nee | Ja, gewone oogst | Nee | `eetbaar: true`; primaire functie `fruit` behouden. |
| rozemarijn (*Salvia jordanii*) | Nee | Ja, behandelen als de rozemarijn die in de tuin wordt gebruikt | Nee bij normaal keukengebruik | De automatische determinatie blijft onzeker, maar hoeft de site niet te blokkeren. Behoud het bestaande oogstadvies; pas de botanische naam alleen aan als daar later betere zekerheid over komt. |
| salie (*Salvia officinalis*) | Nee | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; waarschuw niet op plantniveau voor normaal culinair gebruik. Geen gebruik van geconcentreerde olie adviseren. |
| teunisbloem (*Oenothera parviflora*) | Verwilderde uitzaaier; tuincontext bepaalt `onkruid` | Traditioneel gebruik wordt genoemd, maar onvoldoende voor praktisch oogstadvies | Geen relevante algemene waarschuwing gevonden | `onkruid` mag blijven als lokaal label. Eetbaarheid voorlopig onbeoordeeld/nee; bronnen over *O. biennis* niet overnemen. |
| tijm (*Thymus vulgaris*) | Nee | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; primaire functie `kruid` behouden. |
| venkel (*Foeniculum vulgare*) | Geen schadelijk onkruid; zaait zich gemakkelijk uit | Ja, gewone oogst | Nee bij normaal keukengebruik | `eetbaar: true`; verplaats `kruid` naar primair. `insecten` kan daarnaast primair blijven of secundair worden. Hierdoor verschijnt venkel bij de gewone oogst. |
| zwarte bes (*Ribes nigrum*) | Nee | Ja, gewone oogst | Nee | `eetbaar: true`; primaire functie `fruit` behouden. |
| Spaanse aak (*Acer campestre*) | Nee | Geen praktisch voedselgewas | Nee | `eetbaar: false`; geen oogstinformatie. |
| wegedoorn (*Rhamnus cathartica*) | Nee in Nederlandse/Europese context; invasief in delen van Noord-Amerika | Nee | Ja: schadelijk bij eten, vooral de vruchten | `gevaarlijk: true`; waarschuwing dat delen niet gegeten mogen worden. Geen verwijderplicht op basis van Nederlandse status. |
| kardinaalsmuts (*Euonymus latifolius*) | Nee | Nee | Ja: *Euonymus* is schadelijk/giftig bij eten | `gevaarlijk: true`; vooral expliciet maken dat de opvallende vruchten niet eetbaar zijn. |
| witte moerbei (*Morus alba*) | Nee; geen Nederlandse verwijderplicht gevonden | Ja | Nee bij gebruik van rijpe vruchten | `eetbaar: true`, `oogstbaarInTuin: false`. Tuinopmerking: deze boom draagt in onze tuin geen vruchten. |
| meidoorn (*Crataegus rhipidophylla*) | Nee | Vruchten gelden als eetbaar, maar soortcontrole is verstandig | Nee als giftige plant; scherpe doorns zijn praktisch risico | Controleer de determinatie van deze minder gebruikelijke meidoornsoort. Bij bevestiging `eetbaar: true`, als Extra informatie. |
| azarooldoorn (*Crataegus azarolus*) | Nee | Ja, rijpe vruchten; extra informatie | Nee als giftige plant; scherpe doorns zijn praktisch risico | `eetbaar: true`; bestaande extra-oogstgegevens staan na migratie in de gewone oogstvelden, maar verschijnen door de primaire functies alleen onder Extra informatie. |
| reuzenberenklauw (*Heracleum mantegazzianum*) | Ja, invasieve exoot op de EU-Unielijst | Nee | Ja: het sap kan met zonlicht ernstige huidbeschadiging veroorzaken | Proefgeval `onkruid + gevaarlijk`: weghalen en zaadvorming voorkomen. De NVWA zegt dat hij in een tuin mag blijven als zaadvorming wordt voorkomen, maar noemt verwijderen de effectiefste maatregel tegen verspreiding en gezondheidsschade. |

## Planten die eerst aandacht vragen

1. **Wegedoorn en kardinaalsmuts:** als gevaarlijk markeren en duidelijke niet-eetbaartekst schrijven.
2. **Bosbes:** eetbaar houden, maar beoordelen of een korte waarschuwing over verspreiding naar natuurgebied nodig is.
3. **Edel duizendblad en teunisbloem:** lokale onkruidstatus mag blijven, maar geen eetbaarheid afleiden van een verwante soort.
4. **Knopherik:** onkruidstatus klopt; eetbaarheid niet als maandtaak presenteren.
5. **Venkel:** `kruid` primair maken zodat de bestaande oogst een gewone tuintaak blijft.

## Belangrijkste geraadpleegde bronnen

- [NVWA — overzicht invasieve landplanten](https://www.nvwa.nl/onderwerpen/plant/invasieve-exoten/invasieve-planten/invasieve-landplanten/overzicht-soorten-invasieve-landplanten)
- [NVWA — Unielijst invasieve exoten](https://www.nvwa.nl/onderwerpen/plant/invasieve-exoten/unielijst-invasieve-exoten)
- [NVWA — factsheet reuzenberenklauw](https://www.nvwa.nl/documenten/planten-in-de-natuur/exoten/risicobeoordelingen/factsheet-reuzenberenklauw)
- [Flora van Nederland — Knopherik](https://www.floravannederland.nl/planten/knopherik)
- [RHS — potentieel schadelijke tuinplanten](https://www.rhs.org.uk/prevention-protection/potentially-harmful-garden-plants)
- [RHS — wegedoorn](https://www.rhs.org.uk/plants/14452/rhamnus-cathartica/details)
- [RHS — aardbei](https://www.rhs.org.uk/plants/106127/fragaria-%C3%97-ananassa-f/details)
- [RHS — bosbes](https://www.rhs.org.uk/plants/18670/vaccinium-corymbosum-f/details)
- [RHS — bieslook](https://www.rhs.org.uk/plants/859/allium-schoenoprasum/details)
- [RHS — venkel](https://www.rhs.org.uk/herbs/fennel/grow-your-own)
- [RHS — witte moerbei](https://www.rhs.org.uk/plants/11216/morus-alba/details)
- [Kew — culinaire rozemarijn](https://www.kew.org/plants/rosemary)
- [Kew — *Salvia jordanii*](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A77161673-1/general-information)
- [Kew — kiwi](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A60458895-2/general-information)

## Grenzen van deze controle

Deze controle beoordeelt de soortnamen die nu in de database staan. Zij bevestigt niet dat de levende plant in de tuin correct is gedetermineerd. Bij meidoorn, teunisbloem en duizendblad verdient determinatie vóór nieuw eetadvies extra aandacht. Voor rozemarijn blijft het bestaande praktische gebruik leidend ondanks de onzekere soortherkenning. Een plant die extern geen bekend onkruid is, kan binnen deze tuin nog steeds als onkruid gelden omdat hij spontaan op een ongewenste plek verschijnt.
