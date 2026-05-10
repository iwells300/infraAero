export const AER = {
  byYear: {
    2023: {
      total: 127922, pax: 9503700, aterrizajes: 63947, despegues: 63975,
      domestic: 99815, intl: 28107, nocturnal: 35820,
      hourly: [6062,4890,3928,2751,927,537,738,2363,2992,3489,4540,5035,7224,7543,7756,7573,7010,6528,6827,7258,7870,8094,8282,7705],
      monthly: {
        mov: [10262,9131,10829,10379,10876,10638,11218,10852,10464,11221,11088,10964],
        pax: [761631,687606,769823,745080,781100,781080,855514,821520,796890,850784,842596,810076],
      },
      airlines: [
        { name:"Aerolíneas Argentinas", short:"AR", mov:80041, pax:5748324, color:"#58a6ff" },
        { name:"Flybondi",              short:"FO", mov:15282, pax:1344978, color:"#e6b45a" },
        { name:"JetSmart",              short:"JA", mov:11823, pax:988528,  color:"#3fb950" },
        { name:"Gol",                   short:"G3", mov:2975,  pax:452492,  color:"#f85149" },
        { name:"LATAM Brasil",          short:"LB", mov:2796,  pax:424523,  color:"#d29922" },
        { name:"LATAM Group",           short:"LT", mov:906,   pax:135392,  color:"#8b949e" },
        { name:"Sky Airline",           short:"H2", mov:768,   pax:114851,  color:"#a371f7" },
        { name:"Otros",                 short:"--", mov:13331, pax:344612,  color:"#30363d" },
      ],
    },
    2024: {
      total: 122693, pax: 9356404, aterrizajes: 61341, despegues: 61352,
      domestic: 92035, intl: 30658, nocturnal: 32881,
      hourly: [5643,5565,4100,1990,639,529,690,2612,3408,3329,4394,5211,6955,7283,7431,7303,6659,6189,6573,7317,7606,7542,7432,6293],
      monthly: {
        mov: [10583,9800,10710,9438,8653,8936,10476,10461,9641,10600,11270,12125],
        pax: [815164,738126,783760,697620,653890,676090,812843,790586,741519,817138,898680,930988],
      },
      airlines: [
        { name:"Aerolíneas Argentinas", short:"AR", mov:78662, pax:5518059, color:"#58a6ff" },
        { name:"Flybondi",              short:"FO", mov:13686, pax:1184099, color:"#e6b45a" },
        { name:"JetSmart",              short:"JA", mov:11165, pax:958226,  color:"#3fb950" },
        { name:"Gol",                   short:"G3", mov:3122,  pax:483594,  color:"#f85149" },
        { name:"LATAM Brasil",          short:"LB", mov:2747,  pax:418322,  color:"#d29922" },
        { name:"LATAM Group",           short:"LT", mov:2055,  pax:301991,  color:"#8b949e" },
        { name:"Sky Airline",           short:"H2", mov:1005,  pax:145489,  color:"#a371f7" },
        { name:"Otros",                 short:"--", mov:10251, pax:346624,  color:"#30363d" },
      ],
    },
    2025: {
      total: 141447, pax: 11491175, aterrizajes: 70725, despegues: 70722,
      domestic: 100565, intl: 40882, nocturnal: 37915,
      hourly: [5524,5474,5625,3250,1297,661,1216,3437,5051,4293,5335,6011,7084,7714,8144,8064,8306,7500,7465,8266,8284,8578,7822,7046],
      monthly: {
        mov: [12028,10660,12442,11832,11551,11178,12489,12158,11722,11833,11531,12023],
        pax: [979347,883766,990166,950493,917889,882685,1016245,996176,945106,968493,966087,994723],
      },
      airlines: [
        { name:"Aerolíneas Argentinas", short:"AR", mov:80613, pax:5656663, color:"#58a6ff" },
        { name:"JetSmart",              short:"JA", mov:20543, pax:1983255, color:"#3fb950" },
        { name:"Flybondi",              short:"FO", mov:13851, pax:1183551, color:"#e6b45a" },
        { name:"Gol",                   short:"G3", mov:6149,  pax:910266,  color:"#f85149" },
        { name:"LATAM Brasil",          short:"LB", mov:3493,  pax:520077,  color:"#d29922" },
        { name:"LATAM Group",           short:"LT", mov:2862,  pax:415652,  color:"#8b949e" },
        { name:"Sky Airline",           short:"H2", mov:2020,  pax:280944,  color:"#a371f7" },
        { name:"Otros",                 short:"--", mov:11915, pax:540767,  color:"#30363d" },
      ],
    },
  },

  routes: [
    { code:"CBA",  name:"Córdoba",         type:"DOM",  mov23:9454,  mov25:10716 },
    { code:"SBGR", name:"São Paulo GRU",   type:"INTL", mov23:6822,  mov25:9628  },
    { code:"DOZ",  name:"Comodoro Rivad.", type:"DOM",  mov23:9699,  mov25:9532  },
    { code:"BAR",  name:"Bariloche",       type:"DOM",  mov23:8446,  mov25:8299  },
    { code:"SCEL", name:"Santiago Chile",  type:"INTL", mov23:5063,  mov25:7995  },
    { code:"IGU",  name:"Iguazú",          type:"DOM",  mov23:6547,  mov25:7764  },
    { code:"NEU",  name:"Neuquén",         type:"DOM",  mov23:5290,  mov25:6357  },
    { code:"SBGL", name:"Río de Janeiro",  type:"INTL", mov23:2885,  mov25:5798  },
    { code:"SAL",  name:"Salta",           type:"DOM",  mov23:5761,  mov25:5339  },
    { code:"TUC",  name:"Tucumán",         type:"DOM",  mov23:4809,  mov25:4719  },
    { code:"SPJC", name:"Lima",            type:"INTL", mov23:1441,  mov25:3425  },
    { code:"USU",  name:"Ushuaia",         type:"DOM",  mov23:3015,  mov25:3329  },
    { code:"CRV",  name:"Chapelco",        type:"DOM",  mov23:3671,  mov25:3775  },
    { code:"ECA",  name:"El Calafate",     type:"DOM",  mov23:2777,  mov25:2745  },
    { code:"SGAS", name:"Asunción",        type:"INTL", mov23:2466,  mov25:2739  },
  ],

  paxPerMov2025: [
    { name:"JetSmart Intl", pax_mov:156.5 },
    { name:"LATAM Brasil",  pax_mov:148.9 },
    { name:"Gol",           pax_mov:148.0 },
    { name:"LATAM Group",   pax_mov:145.2 },
    { name:"Sky Airline",   pax_mov:139.1 },
    { name:"JetSmart",      pax_mov:96.5  },
    { name:"Flybondi",      pax_mov:85.4  },
    { name:"Aerolineas AR", pax_mov:70.2  },
  ],

  months: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  YEARS: [2023, 2024, 2025],
};

export const ALERTS = [
  {
    level:"critical", icon:"⚠",
    title:"Vuelos internacionales crecieron 45% en 2 años",
    body:"De 28.107 (2023) a 40.882 (2025). Aeroparque no fue concebido como hub internacional. Plataformas, mangas y sistemas de rampa reciben una demanda que supera su dimensionamiento original. Revisar urgente el plan de mantenimiento de equipos de apoyo en tierra (GPU, escaleras, puentes).",
  },
  {
    level:"critical", icon:"⚠",
    title:"Ventana nocturna 03h–06h: única franja para mantenimiento mayor",
    body:"Con 37.915 operaciones nocturnas en 2025 (26.8% del total), la franja 22h–02h sigue saturada. Solo la franja 03h–06h tiene menos de 4.000 movimientos acumulados. Todo mantenimiento de pista, balizamiento y señalización horizontal debe concentrarse ahí.",
  },
  {
    level:"warning", icon:"▲",
    title:"JetSmart superó a Flybondi — más ciclos LCC en pista",
    body:"JetSmart creció 74% en movimientos (11.823 → 20.543). Las LCC operan con turnarounds de 25–35 min, generando ciclos frecuentes y cortos de rodaje. Esto acelera el desgaste de marcas horizontales (centerline, hold-short) y requiere revisión más frecuente del balizamiento de plataforma.",
  },
  {
    level:"warning", icon:"▲",
    title:"São Paulo +41%, Santiago +58%, Lima +138% — rampa internacional saturada",
    body:"Las tres rutas internacionales de mayor crecimiento concentran operaciones en ventanas horarias específicas, generando picos en posiciones de plataforma con puentes o escaleras. El plan de mantenimiento de equipos de rampa debe estar alineado con estos picos reales.",
  },
  {
    level:"info", icon:"i",
    title:"Aerolíneas AR opera con 70 pax/mov — mayor rotación, más ciclos",
    body:"Con 70.2 pax/movimiento vs 96–157 de las internacionales, AR genera más movimientos por pasajero. Más ciclos de rodaje implican más desgaste por unidad de tiempo en calles de rodaje y plataformas domésticas. En pavimentos, lo que importa es el número de ciclos, no solo el peso.",
  },
  {
    level:"ok", icon:"✓",
    title:"Flota 100% fuselaje estrecho — ACN bajo y estandarizable",
    body:"Prácticamente sin wide-body. La flota (EMB-190, B737, A320) tiene un ACN promedio de 30–45, muy inferior a EZE. Los pavimentos tienen menor tasa de degradación por pasada. El plan de mantenimiento puede estandarizarse con parámetros fijos para estos tres tipos.",
  },
];