import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { DATA, AIRPORT_NAMES, ALERTS } from "../data/airportData";

const C = {
  bg:       "#0f172a00",
  surface:  "rgba(30, 41, 59, 0.7)",
  border:   "#21262d",
  accent:   "#e6b45a",
  accentDim:"#9b7a2e",
  red:      "#f85149",
  amber:    "#d29922",
  green:    "#3fb950",
  blue:     "#58a6ff",
  muted:    "#8b949e",
  text:     "#e6edf3",
  textDim:  "#c9d1d9",
  y2023:    "#8b949e",
  y2024:    "#58a6ff",
  y2025:    "#e6b45a",
};

const fmt = (n) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
  : n >= 1_000   ? (n / 1_000).toFixed(0) + "k"
  : String(n);

const pct = (a, b) => (((b - a) / a) * 100).toFixed(1);

const ALERT_COLORS = {
  critical: { bg: "#1a0a0a", border: "#f85149", badge: "#f85149", text: "#ffa198" },
  warning:  { bg: "#1a1200", border: "#d29922", badge: "#d29922", text: "#f0c050" },
  info:     { bg: "#0a1020", border: "#58a6ff", badge: "#58a6ff", text: "#a5c8ff" },
  ok:       { bg: "#0a1a0a", border: "#3fb950", badge: "#3fb950", text: "#7ee787" },
};

const DarkTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ color: C.muted, margin: "0 0 6px", fontFamily: "monospace" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 500 }}>
          {p.name}: {formatter ? formatter(p.value, p.name) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ label, value, delta, unit = "", warn = false }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "18px 20px",
    borderTop: `2px solid ${warn ? C.amber : C.accent}`,
  }}>
    <p style={{ color: C.muted, fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
    <p style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px", fontFamily: "monospace" }}>
      {value}<span style={{ fontSize: 14, color: C.muted, fontWeight: 400, marginLeft: 4 }}>{unit}</span>
    </p>
    {delta !== undefined && (
      <p style={{ margin: 0, fontSize: 12, color: parseFloat(delta) > 0 ? C.green : C.red }}>
        {parseFloat(delta) > 0 ? "▲" : "▼"} {Math.abs(delta)}% vs 2023
      </p>
    )}
  </div>
);

const ChartCard = ({ title, children, style = {} }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "20px 24px", ...style,
  }}>
    {title && <p style={{ color: C.textDim, fontSize: 13, fontWeight: 500, margin: "0 0 16px" }}>{title}</p>}
    {children}
  </div>
);

export default function AirsideDashboard() {
  const [activeYear, setActiveYear] = useState(2025);
  const [activeTab, setActiveTab] = useState("operaciones");

  const d = DATA.byYear;
  const cur = d[activeYear];
  const ref23 = d[2023];

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2, "0")}h`,
    "2023": d[2023].hourly[h],
    "2024": d[2024].hourly[h],
    "2025": d[2025].hourly[h],
  }));

  const monthlyData = DATA.months.map((m, i) => ({
    mes: m,
    "2023": d[2023].monthly[i],
    "2024": d[2024].monthly[i],
    "2025": d[2025].monthly[i],
  }));

  const fleetData = DATA.YEARS.map((y) => ({
    año: String(y),
    "Fuselaje ancho": d[y].wide,
    "Fuselaje estrecho": d[y].narrow,
    "Aviación general": d[y].general_av,
  }));

  const ezeWideData = DATA.YEARS.map((y) => ({
    año: String(y),
    "Wide-body (EZE)": d[y].eze_wide,
    "% del total": parseFloat(((d[y].eze_wide / d[y].eze_total) * 100).toFixed(1)),
  }));

  const intlData = DATA.YEARS.map((y) => ({
    año: String(y),
    "Internacionales": d[y].intl,
    "Domésticos": d[y].domestic,
  }));

  const nocturnalData = DATA.YEARS.map((y) => ({
    año: String(y),
    "Nocturnas (22–06h)": d[y].nocturnal,
    "% del total": parseFloat(((d[y].nocturnal / d[y].total) * 100).toFixed(1)),
  }));

  const topAirports = cur.top10.map(([code, mov]) => ({
    code, mov,
    growth: d[2023].top10.find(([c]) => c === code)
      ? parseFloat(pct(d[2023].top10.find(([c]) => c === code)[1], mov))
      : null,
  }));

  const growthData = DATA.airportGrowth.map((r) => ({
    code: r.code,
    pct: r.pct,
    fill: r.pct > 100 ? C.red : r.pct > 40 ? C.amber : C.green,
  }));

  const tabs = [
    { id: "operaciones", label: "Operaciones" },
    { id: "flota",       label: "Flota & Wide-body" },
    { id: "horario",     label: "Ventanas Mant." },
    { id: "aeropuertos", label: "Aeropuertos" },   
  ];

  return (
    <div style={{ background: C.bg, color: C.text }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      
         
        <div style={{ display: "flex", gap: 6 }}>
          {DATA.YEARS.map((y) => (
            <button key={y} onClick={() => setActiveYear(y)} style={{
              background: activeYear === y ? C.accent : "transparent",
              color: activeYear === y ? C.surface : C.muted,
              border: `1px solid ${activeYear === y ? C.accent : C.border}`,
              borderRadius: 6, padding: "6px 14px", cursor: "pointer",
              fontSize: 13, fontFamily: "inherit", fontWeight: activeYear === y ? 700 : 400,
            }}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ padding: "20px 24px 0" }} className="kpi-grid-4">
        <KpiCard label="Movimientos totales" value={fmt(cur.total)} delta={pct(ref23.total, cur.total)} />
        <KpiCard label="Pasajeros" value={fmt(cur.pax)} delta={pct(ref23.pax, cur.pax)} />
        <KpiCard label="Vuelos internacionales" value={fmt(cur.intl)} delta={pct(ref23.intl, cur.intl)} />
        <KpiCard label="Operaciones nocturnas" value={fmt(cur.nocturnal)} warn
          delta={pct(ref23.nocturnal, cur.nocturnal)}
          unit={`(${((cur.nocturnal / cur.total) * 100).toFixed(1)}%)`}
        />
      </div>

      {/* Tabs */}
      <div style={{ padding: "20px 32px 0", display: "flex", gap: 2, borderBottom: `1px solid ${C.border}`, marginTop: 20 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: activeTab === t.id ? C.accent : C.muted,
            borderBottom: `2px solid ${activeTab === t.id ? C.accent : "transparent"}`,
            padding: "10px 18px", fontSize: 13, fontFamily: "inherit",
            fontWeight: activeTab === t.id ? 600 : 400, marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px" }}>

        {/* ── OPERACIONES ── */}
        {activeTab === "operaciones" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
              <ChartCard title="Movimientos mensuales — comparativo 2023 · 2024 · 2025">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} domain={['dataMin - 1000', 'auto']}/>
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                    <Line dataKey="2023" stroke={C.y2023} dot={false} strokeWidth={1.5} />
                    <Line dataKey="2024" stroke={C.y2024} dot={false} strokeWidth={1.5} />
                    <Line dataKey="2025" stroke={C.y2025} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <div className="chart-grid-2" style={{ gap: 20 }}>
              <ChartCard title="Vuelos domésticos vs internacionales por año">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={intlData} >
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="año" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                    <Bar dataKey="Domésticos" fill={C.blue}  />
                    <Bar dataKey="Internacionales" fill={C.accent} radius={[3,3,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
           

            <ChartCard title="Operaciones nocturnas (22hs–06hs) — ventanas críticas de mantenimiento">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={nocturnalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="año" tick={{ fill: C.muted, fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} domain={['dataMin - 5000', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fill: C.muted, fontSize: 11 }} domain={[15,25]} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                  <Bar yAxisId="left" dataKey="Nocturnas (22–06h)" fill={C.red} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="% del total" stroke={C.amber} dot strokeWidth={2}  />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 10, lineHeight: 1.6 }}>
                Las operaciones nocturnas son la única ventana viable para mantenimiento mayor de pista y balizamiento.
                AER y EZE concentran el 53% del total nocturno en 2025.
              </p>
            </ChartCard>
            </div>
          </div>
        )}

        {/* ── FLOTA & WIDE-BODY ── */}
        {activeTab === "flota" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}`, borderRadius: 10, padding: "14px 18px" }}>
              <p style={{ color: C.amber, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>⚠ Implicancia para mantenimiento</p>
              <p style={{ color: C.textDim, fontSize: 12, margin: 0, lineHeight: 1.7 }}>
                Los aviones de <strong style={{ color: C.text }}>fuselaje ancho</strong> (A330, B767, B777, B787) ejercen hasta{" "}
                <strong style={{ color: C.text }}>2.5x más presión por eje</strong> sobre el pavimento que un B737.
                El crecimiento internacional en EZE significa mayor fatiga acumulada en plataformas y calles de rodaje,
                requiriendo <strong style={{ color: C.text }}>revisiones de PCN/ACN más frecuentes</strong> y adelantar ciclos de repavimentación.
              </p>
            </div>

            <div className="chart-grid-2" style={{ gap: 20 }}>
              <ChartCard title="Composición de flota por tipo — todos los aeropuertos">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={fleetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="año" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                    <Bar dataKey="Fuselaje estrecho" stackId="a" fill={C.blue} />
                    <Bar dataKey="Fuselaje ancho" stackId="a" fill={C.red} />
                    <Bar dataKey="Aviación general" stackId="a" fill={C.muted} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Wide-body en EZE — operaciones de fuselaje ancho">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ezeWideData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="año" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fill: C.muted, fontSize: 11 }} domain={[0,10]} />
                    <Tooltip content={<DarkTooltip formatter={(v, name) => name.includes('%') ? v + '%' : String(v)} />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                    <Bar yAxisId="left" dataKey="Wide-body (EZE)" fill={C.accent} radius={[3,3,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="% del total" stroke={C.red} dot strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Datos de carga por tipo de aeronave — referencia para cálculo PCN/ACN">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 4 }}>
                {[
                  { tipo:"B737-800",  categoria:"Fuselaje estrecho", mtow:"79.015 kg",  presion:"~1.4 MPa", acn:"~35–45", color: C.blue  },
                  { tipo:"A320-232",  categoria:"Fuselaje estrecho", mtow:"78.000 kg",  presion:"~1.4 MPa", acn:"~33–43", color: C.blue  },
                  { tipo:"B767-300",  categoria:"Fuselaje ancho",    mtow:"187.000 kg", presion:"~1.5 MPa", acn:"~55–70", color: C.amber },
                  { tipo:"A330-200",  categoria:"Fuselaje ancho",    mtow:"242.000 kg", presion:"~1.5 MPa", acn:"~65–80", color: C.amber },
                  { tipo:"B777-300",  categoria:"Fuselaje ancho",    mtow:"352.400 kg", presion:"~1.6 MPa", acn:"~90–115",color: C.red   },
                  { tipo:"EMB-190",   categoria:"Regional",          mtow:"51.800 kg",  presion:"~1.3 MPa", acn:"~18–28", color: C.green },
                ].map((a) => (
                  <div key={a.tipo} style={{ background: C.bg, border: `1px solid ${a.color}40`, borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ color: a.color, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{a.tipo}</p>
                    <p style={{ color: C.muted, fontSize: 11, margin: "0 0 8px" }}>{a.categoria}</p>
                    <span style={{ display:"block", fontSize: 11, color: C.textDim }}>MTOW: <strong style={{ color: C.text }}>{a.mtow}</strong></span>
                    <span style={{ display:"block", fontSize: 11, color: C.textDim }}>Presión rueda: <strong style={{ color: C.text }}>{a.presion}</strong></span>
                    <span style={{ display:"block", fontSize: 11, color: C.textDim }}>ACN típico: <strong style={{ color: a.color }}>{a.acn}</strong></span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {/* ── VENTANAS DE MANTENIMIENTO ── */}
        {activeTab === "horario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ChartCard title="Curva horaria de operaciones — 2023 vs 2025 (movimientos por hora, acumulado anual)">
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="g25" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="hora" tick={{ fill: C.muted, fontSize: 11 }} interval={1} />
                  <YAxis tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} domain={[0, 45000]} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                  <ReferenceLine x="12h" stroke={C.red}   strokeDasharray="4 2" label={{ value:"Inicio pico",    fill: C.red,   fontSize: 11 }} />
                  <ReferenceLine x="16h" stroke={C.red}   strokeDasharray="4 2" label={{ value:"Fin pico",       fill: C.red,   fontSize: 11 }} />
                  <ReferenceLine x="03h" stroke={C.green} strokeDasharray="4 2" label={{ value:"Ventana mant.",  fill: C.green, fontSize: 11 }} />
                  <ReferenceLine x="07h" stroke={C.green} strokeDasharray="4 2" label={{ value:"Ventana mant.",  fill: C.green, fontSize: 11 }} />
                  <Area dataKey="2023" stroke={C.y2023} fill="transparent"   strokeWidth={1.5} dot={false} />
                  <Area dataKey="2025" stroke={C.y2025} fill="url(#g25)"    strokeWidth={2}   dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { rango:"03h – 07h", tipo:"Ventana óptima",  color: C.green, desc:"Mínimo tráfico. Apta para trabajos mayores: repavimentación, cambio de luces de pista, señalización horizontal.", mov: hourlyData.slice(0,7).reduce((s,r)=>s+r["2025"],0) },
                { rango:"07h – 11h", tipo:"Ventana parcial", color: C.amber, desc:"Tráfico creciente. Solo permite tareas menores. FOD inspection, verificación de balizamiento perimetral.", mov: hourlyData.slice(6,11).reduce((s,r)=>s+r["2025"],0) },
                { rango:"12h – 16h", tipo:"Ventana nula",    color: C.red,   desc:"Hora pico máxima. Ninguna intervención de pista posible. Cualquier cierre genera efecto cascada en la red.", mov: hourlyData.slice(12,17).reduce((s,r)=>s+r["2025"],0) },
              ].map((w) => (
                <div key={w.rango} style={{ background: C.surface, border: `1px solid ${w.color}50`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ color: w.color, fontSize: 16, fontWeight: 700, margin: 0 }}>{w.rango}</p>
                      <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{w.tipo}</p>
                    </div>
                    <div style={{ background:`${w.color}20`, borderRadius: 6, padding:"4px 8px", textAlign:"right" }}>
                      <p style={{ color: w.color, fontSize: 13, fontWeight: 700, margin: 0 }}>{fmt(w.mov)}</p>
                      <p style={{ color: C.muted, fontSize: 10, margin: 0 }}>mov/año</p>
                    </div>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{w.desc}</p>
                </div>
              ))}
            </div>

            <ChartCard title="Estacionalidad mensual — distribución de carga a lo largo del año">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }} />
                  <YAxis tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} domain={[35000, 'auto']} 
    allowDataOverflow={true} 
    type="number" />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
                  <Bar dataKey="2023" fill={C.y2023} radius={[2,2,0,0]} />
                  <Bar dataKey="2025" fill={C.y2025} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>
                Ratio verano/invierno 2025: 0.99 — prácticamente plano. Ya no existe una temporada baja utilizable para programar mantenimiento mayor concentrado.
              </p>
            </ChartCard>
          </div>
        )}

        {/* ── AEROPUERTOS ── */}
        {activeTab === "aeropuertos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="chart-grid-2" style={{ gap: 20 }}>
              <ChartCard title={`Top 10 aeropuertos por movimientos — ${activeYear}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topAirports} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis type="category" dataKey="code" tick={{ fill: C.textDim, fontSize: 12 }} width={36} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="mov" name="Movimientos" radius={[0,4,4,0]}>
                      {topAirports.map((entry, i) => (
                        <Cell key={i} fill={entry.code==="MOR" ? C.red : entry.code==="EZE" ? C.accent : C.blue} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Crecimiento de movimientos 2023 → 2025 (%)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={growthData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" unit="%" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis type="category" dataKey="code" tick={{ fill: C.textDim, fontSize: 12 }} width={36} />
                    <Tooltip content={<DarkTooltip formatter={(v) => v + "%"} />} />
                    <Bar dataKey="pct" name="Crecimiento %" radius={[0,4,4,0]}>
                      {growthData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Tabla comparativa de aeropuertos principales">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Código","Aeropuerto","Mov. 2023","Mov. 2024","Mov. 2025","Var. 23→25","Riesgo"].map((h) => (
                        <th key={h} style={{ textAlign:"left", padding:"8px 12px", color: C.muted, borderBottom:`1px solid ${C.border}`, fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cur.top10.map(([code, mov25]) => {
                      const r23 = d[2023].top10.find(([c]) => c === code);
                      const r24 = d[2024].top10.find(([c]) => c === code);
                      const r25 = d[2025].top10.find(([c]) => c === code);
                      const mov23 = r23 ? r23[1] : null;
                      const mov24 = r24 ? r24[1] : null;
                      const mov25b = r25 ? r25[1] : null;
                     
                      
                      const growth = mov23 ? parseFloat(pct(mov23, mov25)) : null;
                      const risk = growth > 60 ? { label:"CRÍTICO", color: C.red }
                        : growth > 20          ? { label:"ELEVADO", color: C.amber }
                        :                        { label:"NORMAL",  color: C.green };
                      return (
                        <tr key={code} style={{ borderBottom:`1px solid ${C.border}20` }}>
                          <td style={{ padding:"10px 12px", color: C.accent, fontWeight: 700 }}>{code}</td>
                          <td style={{ padding:"10px 12px", color: C.textDim }}>{AIRPORT_NAMES[code] || code}</td>
                          <td style={{ padding:"10px 12px", color: C.muted }}>{mov23 ? mov23.toLocaleString() : "—"}</td>
                          <td style={{ padding:"10px 12px", color: C.muted }}>{mov24 ? mov24.toLocaleString() : "—"}</td>
                          <td style={{ padding:"10px 12px", color: C.muted }}>{mov25b ? mov25b.toLocaleString() : "—"}</td>
                          <td style={{ padding:"10px 12px", color: C.text, fontWeight: 600 }}>{mov25.toLocaleString()}</td>
                          <td style={{ padding:"10px 12px", color: growth > 0 ? C.green : C.red }}>
                            {growth !== null ? `${growth > 0 ? "▲" : "▼"} ${Math.abs(growth)}%` : "—"}
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <span style={{ background:`${risk.color}20`, color: risk.color, padding:"2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              {risk.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        

      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 24px", display:"flex", justifyContent:"flex-end", alignItems:"center" }}>
        <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Fuente: Informes Ministerio de Transporte Argentina</p>
      </div>
    </div>
  );
}