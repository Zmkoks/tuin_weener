'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Plant } from './data/plantTypes';
import { leesMomenten } from './data/momenten';
import {
  FUNCTION_OPTIONS,
  PlantFormFields,
  blankForm,
  nextPlantNumber,
  splitList,
  toPayload,
  type Keuze,
  type PlantForm,
} from './components/plantFormulier';

type Props = { plants: Plant[]; onSaved: (plant: Plant) => void };

const AUTOMATION_PROMPT = String.raw`Je bent een zorgvuldige plantenredacteur voor de gezamenlijke tuin van Weener XL in Nederland. Maak volledige, praktische en veilige gegevens voor de pagina van één nieuwe plant op basis van mijn beschrijving. De lezers zijn volwassen medewerkers, begeleiders en deelnemers. Ook begeleiders gebruiken deze site zelf als praktische handleiding. Ga bij alle lezers uit van weinig tuinervaring.

DOELGROEP EN ZELFSTANDIG GEBRUIK
- Spreek de lezer rechtstreeks aan. De instructie moet ook bruikbaar zijn als de lezer zelf de begeleider is.
- Schrijf niet standaard "vraag de begeleider", "laat een begeleider dit doen" of "verwijder dit niet zelf". Dat vervangt geen uitleg over wat er moet gebeuren.
- Beschrijf wat iemand kan doen, op welk moment, met welk gereedschap en welke bescherming. Zet de handelingen in uitvoervolgorde. Leg noodzakelijke grenzen uit aan de hand van de plant en het werk.
- Een gevaarlijke plant vraagt om een concrete, onderbouwde veilige aanpak. Geef alleen een werkwijze die je betrouwbaar kunt onderbouwen, inclusief voorwaarden en beperkingen. Een waarschuwing alleen is geen werkwijze; verzin ook geen methode om toch volledig te lijken.
- Adviseer gespecialiseerde hulp alleen als het werk specifieke deskundigheid, middelen of omstandigheden vereist. Benoem dan welke deskundigheid nodig is, waarom, wanneer je niet zelf moet beginnen en wat je intussen wel kunt doen. Alleen begeleider zijn betekent niet dat iemand die deskundigheid heeft.

TAALNIVEAU EN TOON
- Schrijf op eenvoudig taalniveau A2/B1. De informatie moet ook duidelijk zijn voor iemand die weinig leest of Nederlands niet als eerste taal heeft.
- Gebruik gewone, concrete woorden. Schrijf bijvoorbeeld "knip de dode tak weg" en niet "verwijder afgestorven hout".
- Schrijf korte, actieve zinnen. Streef naar maximaal 12–15 woorden per zin. Splits een zin als er meer dan één handeling of voorwaarde in staat.
- Geef opdrachten rechtstreeks in de gebiedende wijs: "Voel aan de grond", "Knip boven een knop" en "Laat de hoofdstam staan".
- Noem steeds wat iemand kan zien, voelen of doen. Vermijd abstracte woorden, beeldspraak, vakjargon en lange bijzinnen.
- Is een vakwoord echt nodig, leg het meteen uit in gewone woorden. Schrijf bijvoorbeeld: "Een uitloper is een lange stengel die over de grond groeit."
- Gebruik steeds hetzelfde woord voor hetzelfde plantdeel. Wissel bijvoorbeeld niet zonder reden tussen "tak", "scheut" en "stengel".
- Gebruik geen afkortingen. Gebruik cijfers alleen waar ze het uitvoeren makkelijker maken, zoals "5 centimeter" of "2 tot 3 centimeter diep".
- Schrijf rustig en respectvol voor volwassenen. Gebruik geen kinderlijke toon, uitroeptekens of grapjes in verzorgingsinstructies.
- Maak waarschuwingen concreet. Schrijf wat niet mag én welk herkenbaar deel wel moet blijven.
- De botanische naam mag vaktaal bevatten, maar de overige tekst moet zonder plantenkennis begrijpelijk zijn.
- Houd tekstvelden beknopt. Geef meestal één tot drie korte zinnen per onderwerp. Geef extra zinnen alleen als iemand die nodig heeft om veilig te handelen.
- Vermijd onduidelijke verwijzingen zoals "dit" of "die" als er meerdere plantdelen zijn genoemd. Noem dan het plantdeel opnieuw.

WERKWIJZE
- Bepaal eerst om welke soort het gaat. Gebruik de meest gangbare Nederlandse naam en een correcte wetenschappelijke naam. Neem geen specifiek ras of cultivar aan als dat niet is genoemd.
- Werk met de opgegeven plantnaam. Vraag niet naar een beschrijving van blad, bloem, vrucht of groeivorm, de standplaats in onze tuin, bekende opbrengst, tuinbijzonderheden of afspraken over verwijderen. Zoek soortgegevens zelf op; gebruik tuinfeiten alleen als ik die uit mezelf geef. De enige toegestane vervolgvraag gaat bij echte twijfel over gewenst laten staan of onkruid, zoals beschreven bij FUNCTIES.
- Baseer verzorging, kalender en gebruik op betrouwbare botanische en tuinbouwkundige bronnen voor het Nederlandse klimaat. Controleer soortnaam, eetbaarheid en gevaar bij voorkeur bij een botanische tuin, tuinbouworganisatie of andere deskundige bron. Kun je bronnen niet raadplegen, beweer dan niet dat je ze hebt gecontroleerd. Verzin geen bron, eigenschap of precieze instructie bij twijfel.
- Is een plant lastig exact te determineren, kies dan de meest aannemelijke naam. Benoem alleen relevante onzekerheid kort in tuinOpmerking. Blokkeer gewone verzorging niet als nauw verwante soorten dezelfde praktische aanpak hebben.
- Vul bekende soortgegevens aan. Verzin geen feiten over het exemplaar in onze tuin, zoals leeftijd, standplaats, vruchtzetting of toestemming om het weg te halen.
- Ga bij ontbrekende standplaatsinformatie uit van een gevestigde plant in de volle grond. Beschrijf relevante verschillen voor een bak of pas geplante plant kort in waterInfo. Gebruik een genoemde standplaats of tuinbijzonderheid uit mijn beschrijving.
- Maak alle tekst specifiek voor deze plant. Vermijd nietszeggende tekst zoals "geef regelmatig water", "snoei indien nodig" of "houd de plant in de gaten".
- Beschrijf alleen eetbaarheid of oogst als normaal menselijk gebruik veilig en bekend is. Waarschuw duidelijk bij giftige of irriterende delen als verwarring mogelijk is.

WATER: KIES TWEE NIVEAUS
De getallen zijn GEEN liters, gietbeurten of aantal druppels. Ze beschrijven hoe vochtig de grond mag zijn op het moment van water geven, gemeten door 2–3 cm diep te voelen:
1 = alleen water bij lange of extreme droogte; de plant staat liever droog.
2 = water als de grond ook enkele centimeters diep helemaal droog aanvoelt.
3 = water als de bovenste laag droog is; dieper mag de grond nog licht vochtig zijn.
4 = water zodra de grond niet meer nat aanvoelt; laat hem niet uitdrogen.
5 = grond voortdurend nat of moerassig houden.

waterOndergrens is het droogste aanvaardbare niveau: het moment waarop uiterlijk water nodig is. waterBovengrens is het vochtigste niveau waarop al veilig water mag worden gegeven. Gebruik gehele getallen van 1 t/m 5 en zorg dat de ondergrens nooit hoger is dan de bovengrens. Kies een realistisch bereik, geen automatische standaard. Veel voorkomende bereiken zijn: 1–2 voor uitgesproken droogteminnende soorten; 1–3 voor droogtetolerante gevestigde vaste planten, struiken en bomen; 2–3 voor gemiddeld waterbehoevende soorten; 2–4 voor soorten die redelijk gelijkmatig vocht waarderen maar kort mogen opdrogen; 3–4 voor vochtminnende soorten. Gebruik niveau 5 alleen voor echte oever-, moeras- of waterplanten.

Laat waterInfo aansluiten op het gekozen bereik. Begin met voelen aan de grond, zeg wanneer wel en niet water te geven en vermeld relevante uitzonderingen zoals hitte, vruchtvorming, jonge aanplant of gevaar van natte wintergrond. Geef geen vast aantal liters of vaste weekfrequentie wanneer bakmaat, bodem, regen en temperatuur onbekend zijn. Beschrijf zo nodig wel de methode: rustig bij de voet, zodat de wortelzone vochtig wordt, zonder blijvende plas.

FUNCTIES: VERDEEL IN PRIMAIR EN SECUNDAIR
functies is een object met de arrays primair en secundair. Gebruik in beide arrays alleen passende waarden uit de onderstaande lijst en zet iedere functie maar één keer.

primair bevat de belangrijkste rol waaronder deze plant op de site wordt opgenomen. Dit hoeft geen reden te zijn om hem te planten of te behouden: herkennen en verwijderen is ook een hoofdrol. primair bevat ALTIJD één of twee verschillende functies en mag NOOIT [] zijn. Kies normaal precies één. Kies alleen twee als beide afzonderlijk zeer belangrijk en vrijwel gelijkwaardig zijn.

"Onkruid" is een beheerrol, geen uitspraak dat de plant geen ecologisch nut heeft. Het label kan primair of secundair zijn en geeft geen toestemming om de plant te verwijderen.

Kies in deze volgorde:
1. Noem ik uitdrukkelijk een gewenste toepassing in onze tuin, gebruik dan die bedoeling als hoofdrol. Alleen een soortnaam, soortbeschrijving of de vermelding dat insecten de bloemen bezoeken is geen uitdrukkelijke keuze om de plant als insectenplant te behouden.
2. Is de plant duidelijk sierlijk of een echte grote insectentrekker, kies dan "sier" en/of "insecten" primair. Staat de soort ook als spontane of ongewenste plant bekend, zet "onkruid" dan secundair.
3. Ziet de plant er vrij gewoon of rommelig uit en is insectenbezoek vooral een bijkomend voordeel, kies dan "onkruid" primair. Zet een aantoonbare insectenfunctie dan secundair. Knopherik is hiervan een voorbeeld.
4. Is het geen onkruid en ontbreekt een tuindoel, kies dan de duidelijk meest gebruikelijke hoofdtoepassing als redactioneel voorstel.
5. Blijft er echte twijfel tussen gewenste tuinplant en onkruid, stel dan eerst één korte vraag en wacht op mijn antwoord. Bijvoorbeeld: "Wil je deze plant vooral voor de bloemen laten staan, of behandelen we hem hier als onkruid?" Vraag alleen als het antwoord de hoofdrol wezenlijk verandert.

Een voordeel voor insecten of vogels sluit onkruid niet uit. Alleen bloemen hebben maakt "insecten" meestal secundair. Gebruik "insecten" primair als de plant werkelijk veel of bijzondere insecten aantrekt.

Vaste redactionele keuze voor deze tuin: bij Gevlekte scheerling (Conium maculatum) zonder uitdrukkelijk genoemde gewenste toepassing is primair altijd ["onkruid"]. Vraag voor deze standaardkeuze niets terug. Gebruik bijvoorbeeld functies: {"primair": ["onkruid"], "secundair": []}. Alleen als je een duidelijke insectenfunctie kunt onderbouwen, wordt secundair ["insecten"]. Primair ["insecten"] zonder "onkruid" is in dit geval fout. Alleen mijn uitdrukkelijke keuze om deze plant voor een ander doel te behouden kan de hoofdrol veranderen; leid die keuze niet zelf af uit insectenbezoek.

Giftigheid alleen maakt een plant niet tot onkruid; een bewust gewenste giftige sierplant kan primair "sier" hebben. Eetbaarheid alleen maakt fruit of kruid niet automatisch primair. De website gebruikt primaire fruit- en kruidfuncties voor oogsttaken; andere eetbaarheid kan onder Extra informatie staan.

secundair bevat alles wat de plant óók aantoonbaar is of doet, maar wat niet de hoofdreden voor zijn plek in de tuin is. Secundaire functies zijn dus echte eigenschappen of bijdragen, geen zwakke mogelijkheden. Een functie die al primair staat mag niet nogmaals secundair staan. Ken niet automatisch elke bloeiende plant "insecten" of elke aantrekkelijke plant "sier" toe.
- fruit: geeft voor mensen eetbare vruchten of bessen die daadwerkelijk geoogst kunnen worden.
- kruid: bladeren, jonge scheuten of bloemen worden normaal gebruikt in eten of thee. Gebruik dit niet alleen omdat de plant geneeskundig genoemd wordt.
- insecten: is een duidelijke voedselplant voor bijen, hommels, vlinders of andere nuttige insecten, bijvoorbeeld door betekenisvolle nectar, stuifmeel of waardplantfunctie.
- vogel: biedt duidelijk voedsel, nestgelegenheid of beschutting aan vogels.
- sier: staat er in belangrijke mate om opvallende bloemen, blad, vorm, geur of winterbeeld; niet als algemeen restlabel voor iedere mooie plant.
- boom: heeft een boomvorm of groeit uit tot een grote houtige structuur die schaduw of beschutting geeft. Een gewone kleine struik krijgt dit label niet.
- onkruid: een spontane plant die we herkennen of beheren. Zet dit secundair bij een duidelijke sier- of insectenplant. Zet het primair als de plant weinig andere hoofdwaarde heeft. Het label geeft geen toestemming om een plant te verwijderen.

BOOM OF HEESTER: TRUE OF FALSE
- boomHeester is een echte JSON-boolean: true of false, in kleine letters en zonder aanhalingstekens. Gebruik hier nooit "ja", "nee", "true", "false", TRUE of FALSE.
- true: een boom of grotere houtige struik die bij de boom- en heesterplekken van deze tuin hoort. Houtige takken blijven meerdere jaren aanwezig.
- false: een kruid, kruidachtige vaste plant, klimplant of kleine dwergstruik voor een plantvak.
- Beoordeel de gebruikelijke volwassen groeivorm. Een jonge boom is ook true. Hoogte alleen is onvoldoende: een hoge kruidachtige plant is nog geen boom of heester.
- Beoordeel dit veld los van functies. Een fruitboom kan bijvoorbeeld primair fruit hebben én boomHeester: true. Een heester hoeft niet de functie boom te krijgen.

EETBAARHEID, GEVAAR EN ONZE TUIN
- eetbaar: true als een herkenbaar deel van deze soort normaal en veilig door mensen gegeten wordt; false als er geen gangbaar veilig eetbaar deel is; null als je het niet betrouwbaar weet. Geneeskundig gebruik is geen bewijs van eetbaarheid.
- eetbaarInfo: benoem bij true precies welk deel eetbaar is en welke bereiding nodig is. Noem ook welke delen niet gegeten mogen worden als verwarring mogelijk is. Geef bij twijfel kort de beperking en geen uitnodiging om te proeven.
- gevaarlijk: true bij een bekend relevant risico op ernstige klachten door aanraken of eten, zoals giftige delen of brandwonden door sap. Gewone stekels of een mogelijke lichte individuele irritatie zijn op zichzelf geen reden voor true. Gebruik false als zo'n gevaar niet bekend is en null bij onvoldoende betrouwbare informatie; onzeker betekent niet veilig.
- gevaarlijkInfo: geef een korte, duidelijke waarschuwing. Zeg welk deel iemand niet mag eten of aanraken en noem alleen bescherming die echt nodig is. Een lijst met mogelijke klachten of medische details is niet nodig.
- eetbaar en gevaarlijk zijn onafhankelijke beoordelingen. Een soort kan een eetbaar deel én gevaarlijke andere delen hebben. Zorg dan dat beide uitlegvelden precies dezelfde grens aangeven.
- oogstbaarInTuin: altijd null. De beheerder beoordeelt of dit exemplaar hier werkelijk oogst geeft. Zet een uitdrukkelijk genoemde bijzonderheid over de opbrengst wel in tuinOpmerking.
- tuinOpmerking: alleen informatie uit mijn beschrijving over deze tuin, in één korte zin (hoogstens één regel). Bijvoorbeeld dat dit exemplaar geen vruchten draagt. Zonder zulke informatie: een lege tekenreeks.
- waaromLatenStaan: alleen bij onkruid én gevaarlijk: false. Noem een aantoonbaar nut en eventueel een voorwaarde waaronder de plant kan blijven. Verzin geen toestemming; bij ontbrekende tuinafspraken kan de beheerder beslissen. Bij gevaarlijk: true of null blijft dit veld leeg.

VELDREGELS
- intro: maximaal twee korte zinnen over waaraan je de plant herkent en waarom hij interessant is.
- weetje: één juist, begrijpelijk en verrassend feit; herhaal de intro niet. Houd het bij voorkeur rond 40 woorden of korter.
- plantnummer: altijd een lege tekenreeks; de website kent het nummer toe.
- zon: exact één waarde: "zon", "halfschaduw" of "schaduw". Kies de beste hoofdstandplaats; zet nuances in zonInfo.
- levensduur: exact één waarde: "Eenjarig", "Tweejarig" of "Meerjarig".
- oogstMomenten: een lijst met per oogstmoment een object { "maanden": [...], "wat": "..." }, net als snoeiMomenten. "wat" noemt het plantdeel, het herkenbare oogstmoment en hoe iemand veilig oogst. Een ander plantdeel of een aparte oogstperiode krijgt een eigen object. Vul alleen in bij eetbaar: true. Laat leeg ([]) bij eetbaar: false of null, en ook wanneer uit mijn beschrijving blijkt dat het exemplaar in onze tuin geen oogst geeft. Geef geen medicinaal gebruik of doseringen.
- snoeiMomenten: een lijst met per snoeimoment een object { "maanden": [...], "wat": "..." }. Neem alleen maanden waarin snoeien of terugknippen echt passend is. "wat" is één of twee korte zinnen over wat je op dát moment doet; de site toont die zin in die maanden als taak. Verschillend werk op verschillende momenten krijgt elk een eigen object, bijvoorbeeld [{ "maanden": ["Maart"], "wat": "Ruim dode bladeren op." }, { "maanden": ["Augustus"], "wat": "Knip oude bladeren en overtollige uitlopers weg." }]. Een maand hoort bij hoogstens één moment. snoeiMethode is de algemene werkwijze: gereedschap, waar je knipt en wat moet blijven; herhaal het moment niet. snoeiInformatie is alleen achtergrond over hoe de plant groeit en waarom je zo snoeit. Zet daar niets over eten (dat hoort in eetbaarInfo), gevaar (gevaarlijkInfo), verwijderen (woekerToestemming) of dit ene exemplaar (tuinOpmerking). Is snoei niet nodig, geef dan één moment met lege maanden en zeg in "wat" kort wat hoogstens mag worden opgeruimd.
- winterMomenten: alleen concrete voorbereidingen die vóór de winter echt nodig zijn. Ga uit van een gevestigde plant in de volle grond en het milde Nederlandse klimaat. Leg meer nadruk op natte grond en koude wind dan op automatisch inpakken. Noem afdekken alleen bij een kwetsbare soort en zeg wanneer het materiaal weer weg kan. Gebruik [] als de plant zonder extra werk buiten kan blijven.
- woekerToestemming: beschrijf concreet welke delen kunnen worden opgeruimd of verwijderd, wanneer en hoe. Geef geen algemene toestemming om hele gewenste planten of grote takken te verwijderen. Houd het liefst kort, maar duidelijkheid gaat vóór het aantal woorden.
- woekerVerbod: benoem bij gewone planten precies wat moet blijven. Bij onkruid verschijnt dit onder "Wanneer weghalen?": beschrijf dan de aanleiding om weg te halen en wat daarbij moet blijven. Houd het liefst kort, maar duidelijkheid gaat vóór het aantal woorden.
- groei: maanden met zichtbare nieuwe bladeren of stengels.
- bloei: maanden waarin de plant doorgaans bloeit.
- sterf: maanden waarin een kruidachtige plant bovengronds afsterft of duidelijk in rust gaat. Voor een bladverliezende houtige plant zijn dit de maanden van bladval/rust. Gebruik [] als er geen duidelijke zichtbare rust- of afsterfperiode is.
- commons: de directe Wikimedia Commons-categoriepagina voor precies deze soort, bij voorkeur in de vorm https://commons.wikimedia.org/wiki/Category:... Deze pagina wordt straks bij FOTO getoond als plek om een foto te zoeken en als mogelijke bron. Geef uitsluitend de kale URL als tekenreeks: geen Markdown, blokhaken, haakjes of linktekst. Gebruik https://commons.wikimedia.org/ als je de juiste categorie niet betrouwbaar weet. Kies geen specifieke foto, botanische illustratie of plattegrondsymbool.
- commonsIllustraties: zoek op Wikimedia Commons naar een bestaande categorie met botanische illustraties van precies deze soort. De naam is vaak "Category:Wetenschappelijke_naam_-_botanical_illustrations", bijvoorbeeld https://commons.wikimedia.org/wiki/Category:Rubus_caesius_-_botanical_illustrations. Controleer dat de categorie echt bestaat; maak de URL niet alleen op basis van dit patroon. Geef uitsluitend de kale URL zonder Markdown. Gebruik een lege tekenreeks als er geen passende categorie bestaat of als je het bestaan niet betrouwbaar kunt controleren.

KORT HOUDEN
- Gebruik meestal één tot drie korte zinnen per veld. waterInfo mag vier korte zinnen hebben als dat prettig leest.
- Houd "wat" bij een oogst-, snoei- of wintermoment praktisch en overzichtelijk.
- Woordaantallen zijn een richtlijn, geen afkeurgrens. Schrap herhaling, maar laat nuttige uitleg gewoon staan.

UITVOERREGELS
Controleer vóór het antwoorden stil ieder tekstveld: begrijpt iemand zonder tuinervaring direct wat er bedoeld wordt, zijn moeilijke woorden uitgelegd en kan iedere instructie maar op één manier worden uitgevoerd? Kan ook een begeleider die zelf deze pagina leest ermee verder, zonder naar zichzelf te worden verwezen? Vereenvoudig of concretiseer de tekst als dat niet zo is.

Controleer ook of eetbaarheid, waarschuwingen, oogst en verwijderregels elkaar niet tegenspreken. Bij twijfel over eetbaarheid blijven ook de extra oogstvelden leeg. Kopieer geen voorbeeldwaarde zonder de plant te beoordelen.
Controleer vóór het antwoorden de hoofdrol: is dit echt een sierlijke of sterke insectenplant, of vooral onkruid met een bijkomend voordeel? Voor Gevlekte scheerling zonder uitdrukkelijke gewenste toepassing blijft primair ["onkruid"]. Primair heeft één of twee verschillende waarden, secundair mag leeg zijn, en niets staat in beide lijsten.

Als de vraag uit stap 4 nodig is, geef dan eerst alleen die ene vraag, nog geen JSON. Wacht op mijn antwoord. Deze verduidelijkingsvraag is de enige uitzondering op de regel om uitsluitend JSON te geven.
Zodra de hoofdrol duidelijk is, geef uitsluitend één geldig JSON-object terug, zonder markdown, uitleg of codeblok. Gebruik exact de sleutels en volgorde uit het schema hieronder en voeg niets toe. Ook na een vervolgvraag geef je het volledige object, niet alleen de gewijzigde velden.
- Schrijf gewone tekst in de tekstvelden, zonder bronverwijzingen, voetnoten of Markdown-links. Gebruik bronnen wel bij het controleren, maar voeg ze niet als citaties aan het JSON-antwoord toe. Alleen commons en commonsIllustraties bevatten de gevraagde kale bron-URL's.
- Zet geen backslash voor underscores, haakjes of regeleinden om de tekst op te maken. Geef het object rechtstreeks, niet als één grote aangehaalde of ge-escape-te tekenreeks.
- boomHeester: uitsluitend true of false.
- eetbaar en gevaarlijk: true, false of null.
- oogstbaarInTuin: uitsluitend null.
- Deze booleans en null staan zonder aanhalingstekens. Null betekent onbekend, false betekent nee.
- functies: een object met primair en secundair als arrays van strings. primair bevat verplicht één of twee functies; [] is alleen toegestaan voor secundair.
- De maandvelden zijn arrays van strings. Gebruik uitsluitend volledige maandnamen, in kalender-volgorde: Januari, Februari, Maart, April, Mei, Juni, Juli, Augustus, September, Oktober, November, December.
- Alle overige velden zijn strings, inclusief waterOndergrens en waterBovengrens ("1" tot en met "5").
- Gebruik [] voor maanden die niet van toepassing zijn en "" voor lege tekstvelden. Laat geen sleutel weg.

{
  "naam": "Nederlandse naam",
  "botanischeNaam": "Wetenschappelijke naam",
  "functies": {
    "primair": ["kruid"],
    "secundair": ["insecten"]
  },
  "intro": "Korte introductie van maximaal twee zinnen.",
  "weetje": "Een interessant, begrijpelijk weetje.",
  "plantnummer": "",
  "waterOndergrens": "1",
  "waterBovengrens": "3",
  "waterInfo": "Wanneer en hoe geef je water?",
  "zon": "zon",
  "zonInfo": "Concrete uitleg over licht, beschutting en relevante bodem- of vochtomstandigheden.",
  "levensduur": "Meerjarig",
  "oogstMomenten": [],
  "snoeiMomenten": [],
  "winterMomenten": [],
  "snoeiMethode": "",
  "snoeiInformatie": "",
  "woekerToestemming": "Wat kun je verwijderen, wanneer en hoe doe je dat veilig?",
  "woekerVerbod": "Wat moet blijven of mag niet?",
  "groei": [],
  "bloei": [],
  "sterf": [],
  "boomHeester": false,
  "eetbaar": null,
  "eetbaarInfo": "",
  "oogstbaarInTuin": null,
  "tuinOpmerking": "",
  "gevaarlijk": null,
  "gevaarlijkInfo": "",
  "waaromLatenStaan": "",
  "commons": "https://commons.wikimedia.org/",
  "commonsIllustraties": ""
}

Mijn plantbeschrijving (een Nederlandse of botanische naam is voldoende):
Nederlandse naam:
Botanische naam:
`;

/** Hulpjes voor het antwoord van een taalmodel: dat levert lijsten en losse waarden door elkaar. */
function valueList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join(', ');
  return typeof value === 'string' ? value : '';
}

function valueText(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key]);
  return '';
}

/** Haal een kale URL uit bijvoorbeeld `[tekst](https://…)`, ook als een model Markdown gebruikte. */
function cleanUrl(value: string) {
  const source = value.trim().replace(/\\([_()[\]])/g, '$1');
  const markdown = /\]\(\s*(https?:\/\/)/.exec(source);
  if (markdown) {
    const start = markdown.index + markdown[0].length - markdown[1].length;
    let depth = 1;
    for (let i = start; i < source.length; i++) {
      if (source[i] === '(') depth++;
      if (source[i] === ')' && --depth === 0) return source.slice(start, i);
      if (/\s/.test(source[i])) return source.slice(start, i);
    }
  }
  // Een haakje kan bij de URL zelf horen, bijvoorbeeld Category:Soort_(illustrations).
  return /https?:\/\/[^\s<>"\]]+/.exec(source)?.[0] || '';
}

function functionLists(record: Record<string, unknown>) {
  const value = record.functies ?? record.functions;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const groups = value as Record<string, unknown>;
    const primary = (Array.isArray(groups.primair) ? groups.primair : Array.isArray(groups.primary) ? groups.primary : []).filter((item): item is string => typeof item === 'string');
    const secondary = (Array.isArray(groups.secundair) ? groups.secundair : Array.isArray(groups.secondary) ? groups.secondary : []).filter((item): item is string => typeof item === 'string');
    const unknown = [...primary, ...secondary].find((item) => !FUNCTION_OPTIONS.includes(item));
    if (unknown) throw new Error(`Onbekende functie: ${unknown}.`);
    if (primary.length < 1) throw new Error('Het antwoord mist een primaire functie. Laat het taalmodel bij functies.primair één hoofdrol invullen: fruit, kruid, insecten, vogel, sier, boom of onkruid. Plak daarna het volledige antwoord opnieuw.');
    if (primary.length > 2) throw new Error('Kies één of maximaal twee primaire functies.');
    const duplicate = secondary.find((item) => primary.includes(item));
    if (duplicate) throw new Error(`De functie ${duplicate} staat zowel primair als secundair.`);
    return { functiesPrimair: [...new Set(primary)].join(', '), functiesSecundair: [...new Set(secondary)].join(', ') };
  }
  const lijst = valueList(value).split(',').map(v => v.trim()).filter(Boolean);
  return { functiesPrimair: lijst.slice(0, 1).join(', '), functiesSecundair: lijst.slice(1).join(', ') };
}

/** JSON-booleans naar formulierkeuzes. Oudere antwoorden met ja/nee of Engelse tekst blijven leesbaar. */
function valueChoice(record: Record<string, unknown>, ...keys: string[]): Keuze {
  for (const key of keys) {
    const waarde = record[key];
    if (waarde === true || (typeof waarde === 'string' && /^(ja|yes|true)$/i.test(waarde.trim()))) return 'ja';
    if (waarde === false || (typeof waarde === 'string' && /^(nee|no|false)$/i.test(waarde.trim()))) return 'nee';
  }
  return '';
}

function normalizeParsed(value: unknown, plants: Plant[]): PlantForm {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const commons = cleanUrl(valueText(record, 'commons', 'sourceUrl'));
  const commonsIllustraties = cleanUrl(valueText(record, 'commonsIllustraties', 'illustrationCategoryUrl'));
  return {
    naam: valueText(record, 'naam', 'name'),
    botanischeNaam: valueText(record, 'botanischeNaam', 'botanicalName', 'wetenschappelijkeNaam'),
    plantnummer: valueText(record, 'plantnummer', 'plantNumber') || nextPlantNumber(plants),
    ...functionLists(record),
    intro: valueText(record, 'intro', 'description'),
    weetje: valueText(record, 'weetje', 'fact'),
    waterOndergrens: valueText(record, 'waterOndergrens', 'waterMin') || '1',
    waterBovengrens: valueText(record, 'waterBovengrens', 'waterMax') || '3',
    waterInfo: valueText(record, 'waterInfo', 'watering'),
    zon: valueText(record, 'zon', 'sun') || 'zon',
    zonInfo: valueText(record, 'zonInfo', 'sunInfo'),
    levensduur: valueText(record, 'levensduur', 'lifespan') || 'Meerjarig',
    // Oudere antwoorden hebben oogstTijd/oogstMethode (+ extra); die worden elk een moment.
    oogstMomenten: leesMomenten(record.oogstMomenten,
      [splitList(valueList(record.oogstTijd ?? record.harvestMonths)), valueText(record, 'oogstMethode', 'harvestMethod')],
      [splitList(valueList(record.extraOogstTijd ?? record.extraHarvestMonths)), valueText(record, 'extraOogstMethode', 'extraHarvestMethod')]),
    // Oudere antwoorden hebben snoeiTijd + snoeiTijdInfo; die worden samen één moment.
    snoeiMomenten: leesMomenten(record.snoeiMomenten, [splitList(valueList(record.snoeiTijd ?? record.pruneMonths)), valueText(record, 'snoeiTijdInfo', 'pruneTiming')]),
    winterMomenten: leesMomenten(record.winterMomenten),
    snoeiMethode: valueText(record, 'snoeiMethode', 'pruneMethod'),
    snoeiInformatie: valueText(record, 'snoeiInformatie', 'pruneInfo'),
    woekerToestemming: valueText(record, 'woekerToestemming', 'removalAllowed'),
    woekerVerbod: valueText(record, 'woekerVerbod', 'removalForbidden'),
    groei: valueList(record.groei ?? record.growthMonths),
    bloei: valueList(record.bloei ?? record.bloomMonths),
    sterf: valueList(record.sterf ?? record.dormantMonths),
    commons,
    commonsIllustraties,
    boomHeester: valueChoice(record, 'boomHeester', 'treeOrShrub') || 'nee',
    eetbaar: valueChoice(record, 'eetbaar', 'edible'),
    eetbaarInfo: valueText(record, 'eetbaarInfo', 'edibleInfo'),
    // Hangt af van het exemplaar hier; dat kan een model niet weten, dus altijd zelf invullen.
    oogstbaarInTuin: '',
    tuinOpmerking: valueText(record, 'tuinOpmerking', 'gardenNote'),
    gevaarlijk: valueChoice(record, 'gevaarlijk', 'dangerous'),
    gevaarlijkInfo: valueText(record, 'gevaarlijkInfo', 'dangerInfo'),
    waaromLatenStaan: valueText(record, 'waaromLatenStaan', 'whyKeep'),
    // Commons helpt bij het zoeken van de foto. De botanische illustratie krijgt een eigen bron.
    foto: { bestand: '', bron: commons, x: 50, y: 50, zoom: 1 },
    illustratie: { bestand: '', bron: '', x: 50, y: 50, zoom: 1 },
    symbolen: { bibliotheek: null, eigen: [], bron: '' },
  };
}

/** Herstel alleen bekende kopieeropmaak; geldige JSON-escapes en veldinhoud blijven intact. */
function herstelKopieerOpmaak(input: string) {
  let inString = false;
  let output = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (!inString) {
      const citation = char === '' ? /^cite[^]*/.exec(input.slice(i))?.[0] : undefined;
      if (citation) { i += citation.length - 1; continue; }
      // Rijke kopieertekst kan inspringing als HTML-spaties of vaste spaties bewaren.
      // Binnen tekstvelden blijven deze tekens letterlijk behouden.
      const space = char === '&' ? /^(?:&#(?:x0*(?:20|a0)|0*(?:32|160));|&nbsp;)/i.exec(input.slice(i))?.[0] : undefined;
      if (space) { output += ' '; i += space.length - 1; continue; }
      if (char === '\u00a0' || char === '\u202f') { output += ' '; continue; }
      if (char === '\\' && /[\r\n]/.test(input[i + 1] || '')) continue;
    } else if (char === '\\') {
      const next = input[i + 1];
      if (next) {
        // Bijvoorbeeld \_ of \( is Markdown-opmaak, geen geldige JSON-escape.
        output += '_[]()*#>!+-.'.includes(next) ? next : char + next;
        i++;
        continue;
      }
    }
    if (char === '"') inString = !inString;
    output += char;
  }
  return output;
}

function parseJsonAnswer(input: string): Record<string, unknown> {
  const trimmed = input.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  const candidates = [trimmed];
  if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));

  const readObject = (candidate: string): Record<string, unknown> => {
    let value: unknown = JSON.parse(candidate);
    // Sommige kopieerknoppen leveren het hele object als één JSON-string.
    if (typeof value === 'string') value = JSON.parse(value);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Geen object.');
    return value as Record<string, unknown>;
  };
  // Gewone JSON gaat altijd vóór herstel, zodat ook letterlijke backslashes blijven staan.
  for (const candidate of candidates) {
    try { return readObject(candidate); } catch { /* Probeer het volgende formaat. */ }
  }
  for (const candidate of candidates) {
    const repaired = herstelKopieerOpmaak(candidate);
    if (repaired === candidate) continue;
    try { return readObject(repaired); } catch { /* Echte syntaxisfouten blijven fouten. */ }
  }
  if (start < 0 || end <= start) throw new Error('Ik zie geen JSON-object in dit antwoord. Beantwoord een eventuele vraag eerst bij het taalmodel en plak daarna het volledige JSON-antwoord.');
  throw new Error('Het JSON-object is niet geldig. Kopieer het volledige object met de kopieerknop van het taalmodel, of vraag om geldige JSON zonder bronopmaak.');
}

export default function PlantCreator({ plants, onSaved }: Props) {
  const [mode, setMode] = useState<'manual' | 'automatic'>('manual');
  const [form, setForm] = useState<PlantForm>(() => blankForm(plants));
  const [automaticText, setAutomaticText] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [importError, setImportError] = useState<{ message: string } | null>(null);
  const importErrorRef = useRef<HTMLParagraphElement>(null);
  const importErrorId = useId();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!importError) return;
    importErrorRef.current?.focus({ preventScroll: true });
    importErrorRef.current?.scrollIntoView({ block: 'center' });
  }, [importError]);

  const parseAutomaticAnswer = () => {
    setError(''); setNotice(''); setImportError(null);
    try {
      const parsed = normalizeParsed(parseJsonAnswer(automaticText), plants);
      if (!parsed.naam) throw new Error('Vul eerst een plantbeschrijving in of controleer het LLM-antwoord.');
      setForm(parsed); setMode('manual'); setNotice('De gegevens zijn ingelezen. Controleer ze hieronder en sla daarna de plant op.');
    } catch (parseError) { setImportError({ message: parseError instanceof Error ? parseError.message : 'Dit antwoord kon niet worden gelezen.' }); }
  };

  const save = async () => {
    setError(''); setNotice('');
    if (!form.naam.trim() || !form.botanischeNaam.trim() || !form.intro.trim()) { setError('Vul minimaal de Nederlandse naam, botanische naam en korte introductie in.'); return; }
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/planten', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(toPayload(form)) });
      const data = await response.json() as { plant?: Plant; error?: string };
      if (!response.ok || !data.plant) throw new Error(data.error || 'Opslaan is niet gelukt.');
      onSaved(data.plant); setSaveStatus('saved'); setNotice(`Plant “${data.plant.naam}” is toegevoegd aan de plantenbibliotheek.`); setForm(blankForm([...plants, data.plant])); setAutomaticText('');
    } catch (saveError) { setSaveStatus('idle'); setError(saveError instanceof Error ? saveError.message : 'Opslaan is niet gelukt.'); }
  };

  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(AUTOMATION_PROMPT); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setError('Kopiëren lukt niet automatisch. Selecteer de prompt en kopieer hem handmatig.'); }
  };

  return <section className="plant-creator" aria-labelledby="plant-creator-title">
    <div className="plant-creator-intro"><span className="pill">NIEUWE PLANT</span><h2 id="plant-creator-title">Voeg een plant toe</h2><p>Kies zelf alle gegevens in te vullen, of laat een taalmodel een eerste versie maken die je daarna altijd kunt controleren en aanpassen.</p></div>
    <div className="creator-mode-switch" role="tablist" aria-label="Manier van toevoegen"><button type="button" role="tab" aria-selected={mode === 'manual'} className={mode === 'manual' ? 'active' : ''} onClick={() => { setMode('manual'); setError(''); setImportError(null); }}>Handmatig invullen</button><button type="button" role="tab" aria-selected={mode === 'automatic'} className={mode === 'automatic' ? 'active' : ''} onClick={() => { setMode('automatic'); setError(''); setImportError(null); }}>Met LLM-prompt</button></div>
    {error && <p className="creator-error" role="alert">{error}</p>}
    {notice && <p className="creator-notice" role="status">{notice}</p>}
    {mode === 'automatic' ? <>
      <details className="recognition-help">
        <summary><span>Vooraf</span> Hoe weet ik welke plant dit is?</summary>
        <div><p>Maak duidelijke foto’s van de hele plant, het blad en de bloem of vrucht. Laat een herkenningsdienst zoeken en vergelijk altijd meer dan één resultaat. Een app kan zich vergissen.</p><p><a href="https://lens.google/" target="_blank" rel="noreferrer">Google Lens</a> zoekt met een foto. <a href="https://identify.plantnet.org/" target="_blank" rel="noreferrer">Pl@ntNet</a> is speciaal gemaakt voor planten. Noteer bij voorkeur zowel de Nederlandse als de botanische naam. Bij twijfel kun je de foto en meerdere mogelijke namen ook aan het LLM geven.</p></div>
      </details>
      <div className="automatic-creator">
      <div className="prompt-card"><div className="prompt-card-head"><div><span className="number">STAP 1</span><h3>Kopieer deze prompt en zet de naam van de plant erbij</h3></div><button type="button" className="prompt-kopieer" onClick={copyPrompt}>{copied ? 'Gekopieerd ✓' : 'Prompt kopiëren'}</button></div><pre>{AUTOMATION_PROMPT}</pre><small>Werkt in ChatGPT, Claude, Gemini of een andere LLM. Zet onderaan de prompt de Nederlandse of botanische naam van de plant. Beide namen invullen mag ook.</small></div>
      <div className="prompt-card prompt-input-card"><span className="number">STAP 2</span><h3>Plak het antwoord hier</h3><p>Vraagt het taalmodel bij twijfel of de plant gewenst is of onkruid? Beantwoord die vraag daar. Plak hier daarna het volledige JSON-antwoord. Gekopieerde tijdmeldingen, stappenlijsten en codeblokken eromheen mogen blijven staan.</p><textarea aria-label="Antwoord van taalmodel" aria-invalid={!!importError} aria-describedby={importError ? importErrorId : undefined} value={automaticText} onChange={(event) => { setAutomaticText(event.target.value); setImportError(null); }} placeholder="Plak hier het antwoord van het taalmodel…" rows={12} />{importError && <p id={importErrorId} className="creator-error" role="alert" tabIndex={-1} ref={importErrorRef}>{importError.message}</p>}<button type="button" className="primary-action" onClick={parseAutomaticAnswer} disabled={!automaticText.trim()}>Antwoord controleren en invullen →</button></div>
    </div></> : <form className="plant-form" onSubmit={(event) => { event.preventDefault(); void save(); }}><PlantFormFields form={form} setForm={setForm} /><div className="plant-form-actions"><p>Na opslaan verschijnt de plant direct in de bibliotheek. Een foto kun je later toevoegen.</p><button type="submit" className="primary-action" disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Plant opslaan…' : 'Plant opslaan'}</button></div></form>}
  </section>;
}
