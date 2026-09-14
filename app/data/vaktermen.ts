/* Gemaakt door maak_uitleg_web.py — niet met de hand aanpassen.
   De woorden en de uitleg komen uit maak_plantenboekje.py, de plekjes uit de
   tekeningen in vaktermen_pag1-3.pdf. Draai het script opnieuw na een wijziging. */

/** Waar het woord op de tekening staat, in procenten van het plaatje. */
export type Plek = { x: number; y: number; b: number; h: number };

/** `wijst`: waar het wijslijntje eindigt (alleen bij de hele plant); daar zoomt de site op in. */
export type Vakterm = { term: string; slug: string; uitleg: string; plek?: Plek; wijst?: { x: number; y: number } };

/** Eén losse tekening met zijn eigen woorden; `plek` is dan in procenten van dit plaatje. */
export type Vaktermstuk = { illustratie: string; breedte: number; hoogte: number; termen: Vakterm[] };

/**
 * `geheel`: één tekening om in te zoomen (de hele plant).
 * `los`: losse tekeningen, elk een eigen kaartje.
 */
export type Vaktermgroep = {
  id: string;
  titel: string;
  inleiding: string;
  /** Alle woorden van de groep, in de volgorde van het boekje. */
  termen: Vakterm[];
} & (
  | { soort: 'geheel'; illustratie: string; breedte: number; hoogte: number }
  | { soort: 'los'; stukken: Vaktermstuk[] }
);

export const vaktermgroepen: Vaktermgroep[] = [
  {
    "id": "delen",
    "titel": "Wat zit waar?",
    "inleiding": "De woorden voor de delen van een plant. Tik op de tekening of op een woord; ze lichten allebei op.",
    "soort": "geheel",
    "illustratie": "/vaktermen/delen.jpg",
    "breedte": 1782,
    "hoogte": 2429,
    "termen": [
      {
        "term": "Basis",
        "slug": "basis",
        "uitleg": "De plek vlak boven de grond waar stengels of takken beginnen.",
        "plek": {
          "x": 62.09,
          "y": 70.49,
          "b": 10.64,
          "h": 4.35
        },
        "wijst": {
          "x": 54.46,
          "y": 72.45
        }
      },
      {
        "term": "Top",
        "slug": "top",
        "uitleg": "Het bovenste uiteinde van een stengel of tak.",
        "plek": {
          "x": 29.53,
          "y": 5.34,
          "b": 8.07,
          "h": 4.35
        },
        "wijst": {
          "x": 54.46,
          "y": 9.49
        }
      },
      {
        "term": "Blad",
        "slug": "blad",
        "uitleg": "Het meestal groene, platte deel van de plant.",
        "plek": {
          "x": 85.68,
          "y": 49.87,
          "b": 9.64,
          "h": 4.35
        },
        "wijst": {
          "x": 81.66,
          "y": 56.57
        }
      },
      {
        "term": "Bloem",
        "slug": "bloem",
        "uitleg": "Het deel met bloemblaadjes; hieruit kan zaad of een vrucht ontstaan.",
        "plek": {
          "x": 84.06,
          "y": 13.5,
          "b": 12.05,
          "h": 4.35
        },
        "wijst": {
          "x": 77.68,
          "y": 20.13
        }
      },
      {
        "term": "Vrucht / fruit",
        "slug": "vrucht-fruit",
        "uitleg": "Het deel dat na de bloem groeit; vaak eetbaar.",
        "plek": {
          "x": 16.58,
          "y": 61.84,
          "b": 12.03,
          "h": 4.35
        },
        "wijst": {
          "x": 20.65,
          "y": 57.92
        }
      },
      {
        "term": "Wortel",
        "slug": "wortel",
        "uitleg": "Het deel onder de grond. Wortels houden de plant vast en nemen water op.",
        "plek": {
          "x": 17.47,
          "y": 84.72,
          "b": 11.7,
          "h": 4.35
        },
        "wijst": {
          "x": 49.28,
          "y": 76.24
        }
      },
      {
        "term": "Knol",
        "slug": "knol",
        "uitleg": "Een dik opslagdeel onder de grond.",
        "plek": {
          "x": 57.08,
          "y": 87.67,
          "b": 9.14,
          "h": 4.35
        },
        "wijst": {
          "x": 77.17,
          "y": 88.04
        }
      },
      {
        "term": "Stam",
        "slug": "stam",
        "uitleg": "De hoofdstengel van een struik of boom, waar de takken uit groeien.",
        "plek": {
          "x": 36.47,
          "y": 66.0,
          "b": 10.47,
          "h": 4.35
        },
        "wijst": {
          "x": 51.49,
          "y": 64.27
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
          "x": 31.4,
          "y": 48.15,
          "b": 15.39,
          "h": 4.35
        },
        "wijst": {
          "x": 45.06,
          "y": 45.74
        }
      },
      {
        "term": "Zijtak",
        "slug": "zijtak",
        "uitleg": "Een dunnere tak die uit een andere tak groeit.",
        "plek": {
          "x": 12.6,
          "y": 38.88,
          "b": 10.42,
          "h": 4.35
        },
        "wijst": {
          "x": 29.34,
          "y": 40.27
        }
      },
      {
        "term": "Kruisende takken",
        "slug": "kruisende-takken",
        "uitleg": "Takken die over elkaar groeien of tegen elkaar schuren.",
        "plek": {
          "x": 58.68,
          "y": 35.86,
          "b": 25.9,
          "h": 4.35
        },
        "wijst": {
          "x": 54.46,
          "y": 37.53
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
    "soort": "los",
    "termen": [
      {
        "term": "Knop",
        "slug": "knop",
        "uitleg": "Het gesloten begin van een blad, bloem of scheut."
      },
      {
        "term": "Oog",
        "slug": "oog",
        "uitleg": "Een klein punt op een tak waar een knop of scheut kan groeien."
      },
      {
        "term": "Scheut",
        "slug": "scheut",
        "uitleg": "Een nieuw stuk groei met een jonge stengel en bladeren."
      },
      {
        "term": "Oksel",
        "slug": "oksel",
        "uitleg": "De hoek waar een blad of zijtak aan de stengel vastzit."
      },
      {
        "term": "Bladrozet",
        "slug": "bladrozet",
        "uitleg": "Een kring bladeren die laag rond het midden groeit."
      },
      {
        "term": "Groen hart",
        "slug": "groen-hart",
        "uitleg": "Het midden van de aardbeiplant waar nieuwe bladeren groeien."
      },
      {
        "term": "Moederplant",
        "slug": "moederplant",
        "uitleg": "De oorspronkelijke plant waaruit een uitloper een nieuw plantje maakt."
      },
      {
        "term": "Uitloper",
        "slug": "uitloper",
        "uitleg": "Een lange stengel die verderop een nieuw plantje kan maken."
      },
      {
        "term": "Dochterplant",
        "slug": "dochterplant",
        "uitleg": "Het nieuwe plantje dat via een uitloper uit de moederplant ontstaat."
      }
    ],
    "stukken": [
      {
        "illustratie": "/vaktermen/groei-knop.jpg",
        "breedte": 784,
        "hoogte": 838,
        "termen": [
          {
            "term": "Knop",
            "slug": "knop",
            "uitleg": "Het gesloten begin van een blad, bloem of scheut.",
            "plek": {
              "x": 48.7,
              "y": 71.71,
              "b": 23.69,
              "h": 12.6
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/groei-oog.jpg",
        "breedte": 784,
        "hoogte": 838,
        "termen": [
          {
            "term": "Oog",
            "slug": "oog",
            "uitleg": "Een klein punt op een tak waar een knop of scheut kan groeien.",
            "plek": {
              "x": 21.45,
              "y": 42.28,
              "b": 19.86,
              "h": 12.6
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/groei-scheut.jpg",
        "breedte": 784,
        "hoogte": 838,
        "termen": [
          {
            "term": "Scheut",
            "slug": "scheut",
            "uitleg": "Een nieuw stuk groei met een jonge stengel en bladeren.",
            "plek": {
              "x": 18.74,
              "y": 58.57,
              "b": 27.63,
              "h": 12.6
            }
          },
          {
            "term": "Oksel",
            "slug": "oksel",
            "uitleg": "De hoek waar een blad of zijtak aan de stengel vastzit.",
            "plek": {
              "x": 35.42,
              "y": 77.74,
              "b": 23.31,
              "h": 12.6
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/groei-bladrozet.jpg",
        "breedte": 784,
        "hoogte": 838,
        "termen": [
          {
            "term": "Bladrozet",
            "slug": "bladrozet",
            "uitleg": "Een kring bladeren die laag rond het midden groeit.",
            "plek": {
              "x": 55.55,
              "y": 79.82,
              "b": 36.91,
              "h": 12.6
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/groei-groen-hart.jpg",
        "breedte": 784,
        "hoogte": 838,
        "termen": [
          {
            "term": "Groen hart",
            "slug": "groen-hart",
            "uitleg": "Het midden van de aardbeiplant waar nieuwe bladeren groeien.",
            "plek": {
              "x": 8.37,
              "y": 81.13,
              "b": 39.89,
              "h": 12.6
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/groei-moederplant.jpg",
        "breedte": 1612,
        "hoogte": 686,
        "termen": [
          {
            "term": "Moederplant",
            "slug": "moederplant",
            "uitleg": "De oorspronkelijke plant waaruit een uitloper een nieuw plantje maakt.",
            "plek": {
              "x": 8.33,
              "y": 76.84,
              "b": 23.19,
              "h": 15.41
            }
          },
          {
            "term": "Uitloper",
            "slug": "uitloper",
            "uitleg": "Een lange stengel die verderop een nieuw plantje kan maken.",
            "plek": {
              "x": 43.15,
              "y": 76.94,
              "b": 15.4,
              "h": 15.41
            }
          },
          {
            "term": "Dochterplant",
            "slug": "dochterplant",
            "uitleg": "Het nieuwe plantje dat via een uitloper uit de moederplant ontstaat.",
            "plek": {
              "x": 73.19,
              "y": 76.84,
              "b": 23.16,
              "h": 15.41
            }
          }
        ]
      }
    ]
  },
  {
    "id": "hout",
    "titel": "Jong hout, oud hout",
    "inleiding": "Deze woorden helpen je herkennen wat je moet snoeien of laten staan, en of een plant nog bloeit.",
    "soort": "los",
    "termen": [
      {
        "term": "Jonge tak",
        "slug": "jonge-tak",
        "uitleg": "Nieuwe, vaak lichte en buigzame tak."
      },
      {
        "term": "Oude tak",
        "slug": "oude-tak",
        "uitleg": "Dikkere, donkerdere en hardere tak."
      },
      {
        "term": "Jonge stengel",
        "slug": "jonge-stengel",
        "uitleg": "Een frisse stengel die nog geen vruchten droeg."
      },
      {
        "term": "Afgedragen stengel",
        "slug": "afgedragen-stengel",
        "uitleg": "Een frambozenstengel die al vruchten gaf."
      },
      {
        "term": "Groene groei",
        "slug": "groene-groei",
        "uitleg": "Het deel met groen, bladeren, knoppen of scheuten."
      },
      {
        "term": "Kaal hout",
        "slug": "kaal-hout",
        "uitleg": "Hout zonder bladeren of groene scheuten."
      },
      {
        "term": "Bloeiend",
        "slug": "bloeiend",
        "uitleg": "Er zitten open bloemen aan de plant."
      },
      {
        "term": "Uitgebloeid",
        "slug": "uitgebloeid",
        "uitleg": "De bloei is voorbij; blaadjes zijn droog of afgevallen."
      }
    ],
    "stukken": [
      {
        "illustratie": "/vaktermen/hout-jonge-tak.jpg",
        "breedte": 787,
        "hoogte": 1364,
        "termen": [
          {
            "term": "Jonge tak",
            "slug": "jonge-tak",
            "uitleg": "Nieuwe, vaak lichte en buigzame tak.",
            "plek": {
              "x": 10.67,
              "y": 88.54,
              "b": 36.25,
              "h": 7.74
            }
          },
          {
            "term": "Oude tak",
            "slug": "oude-tak",
            "uitleg": "Dikkere, donkerdere en hardere tak.",
            "plek": {
              "x": 54.64,
              "y": 88.64,
              "b": 33.16,
              "h": 7.74
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/hout-jonge-stengel.jpg",
        "breedte": 993,
        "hoogte": 1364,
        "termen": [
          {
            "term": "Jonge stengel",
            "slug": "jonge-stengel",
            "uitleg": "Een frisse stengel die nog geen vruchten droeg.",
            "plek": {
              "x": 16.03,
              "y": 84.73,
              "b": 23.89,
              "h": 11.43
            }
          },
          {
            "term": "Afgedragen stengel",
            "slug": "afgedragen-stengel",
            "uitleg": "Een frambozenstengel die al vruchten gaf.",
            "plek": {
              "x": 54.92,
              "y": 84.95,
              "b": 34.3,
              "h": 11.43
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/hout-groene-groei.jpg",
        "breedte": 891,
        "hoogte": 1132,
        "termen": [
          {
            "term": "Groene groei",
            "slug": "groene-groei",
            "uitleg": "Het deel met groen, bladeren, knoppen of scheuten.",
            "plek": {
              "x": 7.8,
              "y": 86.19,
              "b": 40.83,
              "h": 9.34
            }
          },
          {
            "term": "Kaal hout",
            "slug": "kaal-hout",
            "uitleg": "Hout zonder bladeren of groene scheuten.",
            "plek": {
              "x": 55.78,
              "y": 86.21,
              "b": 32.41,
              "h": 9.34
            }
          }
        ]
      },
      {
        "illustratie": "/vaktermen/hout-bloeiend.jpg",
        "breedte": 924,
        "hoogte": 1132,
        "termen": [
          {
            "term": "Bloeiend",
            "slug": "bloeiend",
            "uitleg": "Er zitten open bloemen aan de plant.",
            "plek": {
              "x": 13.15,
              "y": 86.21,
              "b": 29.4,
              "h": 9.34
            }
          },
          {
            "term": "Uitgebloeid",
            "slug": "uitgebloeid",
            "uitleg": "De bloei is voorbij; blaadjes zijn droog of afgevallen.",
            "plek": {
              "x": 53.69,
              "y": 86.02,
              "b": 36.2,
              "h": 9.34
            }
          }
        ]
      }
    ]
  }
];
