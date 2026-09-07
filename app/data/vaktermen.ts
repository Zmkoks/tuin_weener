/* Gemaakt door maak_uitleg_web.py — niet met de hand aanpassen.
   De woorden en de uitleg komen uit maak_plantenboekje.py, de plekjes uit de
   illustratiepagina's van het boekje. Draai het script opnieuw na een wijziging. */

/** Waar het woord op de tekening staat, in procenten van het plaatje. */
export type Plek = { x: number; y: number; b: number; h: number };

export type Vakterm = { term: string; slug: string; uitleg: string; plek?: Plek };

export type Vaktermgroep = {
  id: string;
  titel: string;
  inleiding: string;
  illustratie: string;
  breedte: number;
  hoogte: number;
  termen: Vakterm[];
};

export const vaktermgroepen: Vaktermgroep[] = [
  {
    "id": "delen",
    "titel": "Wat zit waar?",
    "inleiding": "De woorden voor de delen van een plant. Tik op de tekening of op een woord; ze lichten allebei op.",
    "illustratie": "/vaktermen/delen.jpg",
    "breedte": 1046,
    "hoogte": 1516,
    "termen": [
      {
        "term": "Basis",
        "slug": "basis",
        "uitleg": "De plek vlak boven de grond waar stengels of takken beginnen.",
        "plek": {
          "x": 61.66,
          "y": 70.75,
          "b": 10.76,
          "h": 4.12
        }
      },
      {
        "term": "Top",
        "slug": "top",
        "uitleg": "Het bovenste uiteinde van een stengel of tak.",
        "plek": {
          "x": 26.74,
          "y": 5.64,
          "b": 8.22,
          "h": 4.12
        }
      },
      {
        "term": "Blad",
        "slug": "blad",
        "uitleg": "Het meestal groene, platte deel van de plant.",
        "plek": {
          "x": 89.25,
          "y": 51.63,
          "b": 10.31,
          "h": 4.36
        }
      },
      {
        "term": "Bloem",
        "slug": "bloem",
        "uitleg": "Het deel met bloemblaadjes; hieruit kan zaad of een vrucht ontstaan.",
        "plek": {
          "x": 85.84,
          "y": 15.2,
          "b": 12.9,
          "h": 4.36
        }
      },
      {
        "term": "Vrucht / fruit",
        "slug": "vrucht-fruit",
        "uitleg": "Het deel dat na de bloem groeit; vaak eetbaar.",
        "plek": {
          "x": 12.75,
          "y": 61.94,
          "b": 13.05,
          "h": 4.36
        }
      },
      {
        "term": "Wortel",
        "slug": "wortel",
        "uitleg": "Het deel onder de grond. Wortels houden de plant vast en nemen water op.",
        "plek": {
          "x": 13.7,
          "y": 84.87,
          "b": 12.65,
          "h": 4.36
        }
      },
      {
        "term": "Knol",
        "slug": "knol",
        "uitleg": "Een dik opslagdeel onder de grond.",
        "plek": {
          "x": 57.62,
          "y": 93.89,
          "b": 9.89,
          "h": 4.36
        }
      },
      {
        "term": "Stam",
        "slug": "stam",
        "uitleg": "De hoofdstengel van een struik of boom, waar de takken uit groeien.",
        "plek": {
          "x": 33.92,
          "y": 66.15,
          "b": 11.26,
          "h": 4.36
        }
      },
      {
        "term": "Stengel",
        "slug": "stengel",
        "uitleg": "Een meestal groene, buigzame steel."
      },
      {
        "term": "Tak",
        "slug": "tak",
        "uitleg": "Een stevig, vaak houtig deel van een struik of boom."
      },
      {
        "term": "Hoofdtak",
        "slug": "hoofdtak",
        "uitleg": "Een dikke tak die rechtstreeks uit de stam of basis groeit.",
        "plek": {
          "x": 31.21,
          "y": 51.6,
          "b": 15.45,
          "h": 4.12
        }
      },
      {
        "term": "Zijtak",
        "slug": "zijtak",
        "uitleg": "Een dunnere tak die uit een andere tak groeit.",
        "plek": {
          "x": 12.21,
          "y": 35.7,
          "b": 10.67,
          "h": 4.12
        }
      },
      {
        "term": "Kruisende takken",
        "slug": "kruisende-takken",
        "uitleg": "Takken die over elkaar groeien of tegen elkaar schuren.",
        "plek": {
          "x": 57.59,
          "y": 36.74,
          "b": 25.86,
          "h": 4.12
        }
      },
      {
        "term": "Pol",
        "slug": "pol",
        "uitleg": "Een groep stengels of sprieten uit dezelfde basis."
      },
      {
        "term": "Wortelblok",
        "slug": "wortelblok",
        "uitleg": "Alle wortels en het onderste deel van de plant samen."
      }
    ]
  },
  {
    "id": "groei",
    "titel": "Waar groeit de plant verder?",
    "inleiding": "Deze woorden gaan over knoppen, scheuten en uitlopers: de plekken waar een plant nieuwe groei maakt.",
    "illustratie": "/vaktermen/groei.jpg",
    "breedte": 1046,
    "hoogte": 1516,
    "termen": [
      {
        "term": "Knop",
        "slug": "knop",
        "uitleg": "Het gesloten begin van een blad, bloem of scheut.",
        "plek": {
          "x": 9.88,
          "y": 33.64,
          "b": 10.35,
          "h": 4.12
        }
      },
      {
        "term": "Oog",
        "slug": "oog",
        "uitleg": "Een klein punt op een tak waar een knop of scheut kan groeien.",
        "plek": {
          "x": 31.65,
          "y": 18.35,
          "b": 8.84,
          "h": 4.12
        }
      },
      {
        "term": "Scheut",
        "slug": "scheut",
        "uitleg": "Een nieuw stuk groei met een jonge stengel en bladeren.",
        "plek": {
          "x": 57.12,
          "y": 21.01,
          "b": 12.62,
          "h": 4.12
        }
      },
      {
        "term": "Oksel",
        "slug": "oksel",
        "uitleg": "De hoek waar een blad of zijtak aan de stengel vastzit.",
        "plek": {
          "x": 71.19,
          "y": 30.72,
          "b": 10.6,
          "h": 4.12
        }
      },
      {
        "term": "Bladrozet",
        "slug": "bladrozet",
        "uitleg": "Een kring bladeren die laag rond het midden groeit.",
        "plek": {
          "x": 21.47,
          "y": 67.15,
          "b": 16.02,
          "h": 4.12
        }
      },
      {
        "term": "Groen hart",
        "slug": "groen-hart",
        "uitleg": "Het midden van de aardbeiplant waar nieuwe bladeren groeien.",
        "plek": {
          "x": 61.49,
          "y": 66.97,
          "b": 17.33,
          "h": 4.12
        }
      },
      {
        "term": "Moederplant",
        "slug": "moederplant",
        "uitleg": "De oorspronkelijke plant waaruit een uitloper een nieuw plantje maakt.",
        "plek": {
          "x": 14.33,
          "y": 92.15,
          "b": 20.61,
          "h": 4.12
        }
      },
      {
        "term": "Uitloper",
        "slug": "uitloper",
        "uitleg": "Een lange stengel die verderop een nieuw plantje kan maken.",
        "plek": {
          "x": 50.32,
          "y": 91.89,
          "b": 13.79,
          "h": 4.12
        }
      },
      {
        "term": "Dochterplant",
        "slug": "dochterplant",
        "uitleg": "Het nieuwe plantje dat via een uitloper uit de moederplant ontstaat.",
        "plek": {
          "x": 73.17,
          "y": 91.72,
          "b": 20.57,
          "h": 4.12
        }
      }
    ]
  },
  {
    "id": "hout",
    "titel": "Jong hout, oud hout",
    "inleiding": "Deze woorden helpen je herkennen wat je moet snoeien of laten staan, en of een plant nog bloeit.",
    "illustratie": "/vaktermen/hout.jpg",
    "breedte": 1046,
    "hoogte": 1516,
    "termen": [
      {
        "term": "Jonge tak",
        "slug": "jonge-tak",
        "uitleg": "Nieuwe, vaak lichte en buigzame tak.",
        "plek": {
          "x": 6.55,
          "y": 49.05,
          "b": 17.0,
          "h": 4.36
        }
      },
      {
        "term": "Oude tak",
        "slug": "oude-tak",
        "uitleg": "Dikkere, donkerdere en hardere tak.",
        "plek": {
          "x": 28.45,
          "y": 49.05,
          "b": 16.24,
          "h": 4.36
        }
      },
      {
        "term": "Jonge stengel",
        "slug": "jonge-stengel",
        "uitleg": "Een frisse stengel die nog geen vruchten droeg.",
        "plek": {
          "x": 48.95,
          "y": 49.24,
          "b": 20.27,
          "h": 4.0
        }
      },
      {
        "term": "Afgedragen stengel",
        "slug": "afgedragen-stengel",
        "uitleg": "Een frambozenstengel die al vruchten gaf.",
        "plek": {
          "x": 71.58,
          "y": 49.24,
          "b": 27.74,
          "h": 4.0
        }
      },
      {
        "term": "Groene groei",
        "slug": "groene-groei",
        "uitleg": "Het deel met groen, bladeren, knoppen of scheuten.",
        "plek": {
          "x": 12.01,
          "y": 91.76,
          "b": 19.27,
          "h": 4.0
        }
      },
      {
        "term": "Kaal hout",
        "slug": "kaal-hout",
        "uitleg": "Hout zonder bladeren of groene scheuten.",
        "plek": {
          "x": 33.5,
          "y": 91.76,
          "b": 15.33,
          "h": 4.0
        }
      },
      {
        "term": "Bloeiend",
        "slug": "bloeiend",
        "uitleg": "Er zitten open bloemen aan de plant.",
        "plek": {
          "x": 57.1,
          "y": 91.75,
          "b": 16.14,
          "h": 4.36
        }
      },
      {
        "term": "Uitgebloeid",
        "slug": "uitgebloeid",
        "uitleg": "De bloei is voorbij; blaadjes zijn droog of afgevallen.",
        "plek": {
          "x": 76.9,
          "y": 91.58,
          "b": 19.82,
          "h": 4.36
        }
      }
    ]
  }
];
