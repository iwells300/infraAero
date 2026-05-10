export const DATA = {
  byYear: {
    2023: {
      total: 557152, pax: 29225845, intl: 101837, domestic: 455315,
      nocturnal: 125498, wide: 6019, narrow: 264553, general_av: 199489,
      eze_total: 68055, eze_wide: 4718,
      hourly: [20624,16256,12503,9786,6158,4322,4081,6009,8241,11712,20136,28287,36098,37843,38102,38307,35104,33729,34572,35385,35914,32215,27662,24106],
      monthly: [43172,43515,50419,47482,46655,45833,46320,49024,44397,47628,46012,46695],
      top10: [["AER",127922],["EZE",68055],["FDO",55472],["MOR",33449],["CBA",28048],["DOZ",26064],["BAR",18788],["SAL",18082],["NEU",17524],["ROS",11629]],
    },
    2024: {
      total: 578602, pax: 29481340, intl: 111053, domestic: 467549,
      nocturnal: 120283, wide: 4350, narrow: 253703, general_av: 222143,
      eze_total: 72680, eze_wide: 4203,
      hourly: [20211,15627,11675,7900,5913,3940,4274,6466,8753,12379,20741,28371,37468,41251,41125,41176,37126,36009,37267,38184,38508,33495,27931,22812],
      monthly: [50136,46017,49794,43923,43566,43893,50714,48699,48750,49930,49959,53221],
      top10: [["AER",122693],["EZE",72680],["MOR",69312],["FDO",46777],["CBA",27224],["DOZ",24950],["SAL",21209],["BAR",17497],["NEU",16138],["ROS",11779]],
    },
    2025: {
      total: 597784, pax: 33386252, intl: 127747, domestic: 470037,
      nocturnal: 131033, wide: 4844, narrow: 254691, general_av: 202375,
      eze_total: 77545, eze_wide: 4498,
      hourly: [21213,16671,13658,10494,7229,5221,5527,7725,10379,13736,22764,29377,37082,40700,41698,40743,38705,36650,37575,38673,37802,33142,27449,23571],
      monthly: [49472,45539,51537,49756,46941,45695,52174,52116,50244,50901,50214,53195],
      top10: [["AER",141447],["EZE",77545],["MOR",58820],["FDO",42713],["CBA",29421],["DOZ",26481],["SAL",22901],["BAR",19260],["NEU",17343],["IGU",12923]],
    },
  },
  airportGrowth: [
    { code:"GPI", mov23:337,   mov25:1715,  pct:408.9 },
    { code:"MOR", mov23:33449, mov25:58820, pct:75.8  },
    { code:"CHP", mov23:2730,  mov25:4173,  pct:52.9  },
    { code:"SRA", mov23:6954,  mov25:10606, pct:52.5  },
    { code:"ESQ", mov23:1495,  mov25:2268,  pct:51.7  },
    { code:"TRH", mov23:268,   mov25:402,   pct:50.0  },
    { code:"PAL", mov23:2137,  mov25:3047,  pct:42.6  },
    { code:"RTA", mov23:2469,  mov25:3260,  pct:32.0  },
    { code:"SAL", mov23:18082, mov25:22901, pct:26.7  },
    { code:"ECA", mov23:7150,  mov25:8930,  pct:24.9  },
    { code:"DRY", mov23:2924,  mov25:3505,  pct:19.9  },
    { code:"SVO", mov23:3978,  mov25:4712,  pct:18.5  },
  ],
  months: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  YEARS: [2023, 2024, 2025],
};

export const AIRPORT_NAMES = {
  AER: "Aeroparque Jorge Newbery", EZE: "Ezeiza Ministro Pistarini",
  MOR: "Morón", FDO: "El Palomar", CBA: "Córdoba Ambrosio Taravella",
  DOZ: "Comodoro Rivadavia", SAL: "Salta Martín Güemes",
  BAR: "Bariloche Teniente Candelaria", NEU: "Neuquén Presidente Perón",
  ROS: "Rosario Islas Malvinas", IGU: "Iguazú Cataratas",
  GPI: "General Pico", CHP: "Chapelco", SRA: "Santa Rosa",
  ESQ: "Esquel", TRH: "Trelew", PAL: "Palermo", RTA: "Resistencia",
  ECA: "El Calafate", DRY: "Dolores", SVO: "Sauce Viejo",
};

export const ALERTS = [
  {
    level: "critical",
    title: "Saturación horaria pico",
    body: "Entre 12hs y 16hs se concentran >165.000 movimientos/año. La ventana para mantenimiento en ese horario es prácticamente nula en AER y EZE.",
    icon: "⚠",
  },
  {
    level: "critical",
    title: "Presión nocturna creciente",
    body: "Las operaciones nocturnas crecieron +4.4% desde 2023. AER+EZE concentran el 53% del total. Las únicas ventanas para mantenimiento mayor se comprimen.",
    icon: "⚠",
  },
  {
    level: "warning",
    title: "MOR creció 76% en 2 años",
    body: "Morón pasó de 33.449 a 58.820 movimientos. Infraestructura no dimensionada. Revisar desgaste de pavimentos y señalización horizontal.",
    icon: "▲",
  },
  {
    level: "warning",
    title: "Wide-body implica mayor desgaste",
    body: "Aeronaves de fuselaje ancho (A330, B767, B777) tienen peso por eje hasta 2.5x mayor. El crecimiento internacional acelera degradación de plataformas en EZE.",
    icon: "▲",
  },
  {
    level: "info",
    title: "Flota más estandarizada",
    body: "Tipos distintos de aeronave bajaron de 710 a 665. Favorece FOD checks, pero concentra desgaste en trenes B737/A320. Actualizar protocolos de pavimento.",
    icon: "i",
  },
  {
    level: "ok",
    title: "Estacionalidad plana",
    body: "Ratio verano/invierno llegó a 0.99 en 2025. Ya no hay temporada baja natural. Distribuir mantenimiento mayor a lo largo del año.",
    icon: "✓",
  },
];