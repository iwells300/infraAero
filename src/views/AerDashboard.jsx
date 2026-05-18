import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell, ComposedChart,
} from "recharts";
import { AER, ALERTS } from "../data/aerData";

const C = {
  bg:"#0a0e1400", surface:"rgba(30, 41, 59, 0.7)", card:"rgba(30, 41, 59, 0.7)", border:"#1c2a3a",
  borderHi:"#2a3f55", accent:"#38bdf8", accentDim:"#0c4a6e",
  gold:"#fbbf24", red:"#f87171", amber:"#fb923c", green:"#4ade80",
  purple:"#a78bfa", muted:"#64748b", textDim:"#94a3b8", text:"#e2e8f0",
  y2023:"#475569", y2024:"#38bdf8", y2025:"#fbbf24",
};

const ALERT_STYLE = {
  critical:{ bg:"#1a0808", border:"#f87171", icon:"#f87171", text:"#fca5a5" },
  warning: { bg:"#1a1008", border:"#fb923c", icon:"#fb923c", text:"#fed7aa" },
  info:    { bg:"#080f1a", border:"#38bdf8", icon:"#38bdf8", text:"#7dd3fc" },
  ok:      { bg:"#071510", border:"#4ade80", icon:"#4ade80", text:"#86efac" },
};

const fmt = (n) =>
  n >= 1_000_000 ? (n/1_000_000).toFixed(1)+"M"
  : n >= 1_000   ? (n/1_000).toFixed(1)+"k"
  : String(n);

const pct = (a, b) => (((b-a)/a)*100).toFixed(1);
const delta = (a, b) => ({ val:parseFloat(pct(a,b)), color: b>=a ? C.green : C.red });

const Tip = ({ active, payload, label, unit="" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color:C.muted, margin:"0 0 6px", fontFamily:"monospace" }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||C.text, margin:"2px 0", fontWeight:500 }}>
          {p.name}: {fmt(p.value)}{unit}
        </p>
      ))}
    </div>
  );
};

const KPI = ({ label, value, base, unit="", accent=C.accent, warn=false }) => {
  const d = base ? delta(base, typeof value==="number" ? value : parseFloat(String(value).replace(/[^0-9.]/g,""))) : null;
  return (
    <div style={{ background:C.card, borderRadius:12, padding:"16px 20px",
      border:`1px solid ${C.border}`, borderTop:`2px solid ${warn ? C.amber : accent}`,
      display:"flex", flexDirection:"column", gap:6 }}>
      <span style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>{label}</span>
      <span style={{ fontSize:26, fontWeight:700, color:C.text, fontFamily:"monospace", lineHeight:1 }}>
        {typeof value==="number" ? fmt(value) : value}
        {unit && <span style={{ fontSize:12, color:C.muted, marginLeft:5 }}>{unit}</span>}
      </span>
      {d && <span style={{ fontSize:11, color:d.color }}>{d.val>0?"▲":"▼"} {Math.abs(d.val)}% vs 2023</span>}
    </div>
  );
};

const Card = ({ title, sub, children, style={} }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 22px", overflow:"hidden", minWidth:0, ...style }}>
    {title && <div style={{ marginBottom:14 }}>
      <p style={{ color:C.textDim, fontSize:13, fontWeight:500, margin:0 }}>{title}</p>
      {sub && <p style={{ color:C.muted, fontSize:11, margin:"3px 0 0" }}>{sub}</p>}
    </div>}
    {children}
  </div>
);

const TabBtn = ({ id, active, onClick, children }) => (
  <button onClick={() => onClick(id)} style={{
    background:"transparent", border:"none", cursor:"pointer",
    color:active ? C.accent : C.muted,
    borderBottom:`2px solid ${active ? C.accent : "transparent"}`,
    padding:"10px 18px", fontSize:13, fontFamily:"inherit",
    fontWeight:active ? 600 : 400, marginBottom:-1, whiteSpace:"nowrap",
  }}>{children}</button>
);

export default function AerDashboard() {
  const [year, setYear] = useState(2025);
  const [tab,  setTab]  = useState("overview");

  const cur = AER.byYear[year];
  const ref = AER.byYear[2023];

  const hourlyData = Array.from({length:24},(_,h) => ({
    h:`${String(h).padStart(2,"0")}h`,
    "2023":AER.byYear[2023].hourly[h],
    "2024":AER.byYear[2024].hourly[h],
    "2025":AER.byYear[2025].hourly[h],
  }));

  const monthlyMovData = AER.months.map((m,i) => ({
    mes:m,
    "2023":AER.byYear[2023].monthly.mov[i],
    "2024":AER.byYear[2024].monthly.mov[i],
    "2025":AER.byYear[2025].monthly.mov[i],
  }));

  const monthlyPaxData = AER.months.map((m,i) => ({
    mes:m,
    "2023":AER.byYear[2023].monthly.pax[i],
    "2024":AER.byYear[2024].monthly.pax[i],
    "2025":AER.byYear[2025].monthly.pax[i],
  }));

  const intlDomData = AER.YEARS.map(y => ({
    año:String(y),
    Doméstico:AER.byYear[y].domestic,
    Internacional:AER.byYear[y].intl,
  }));

  const airlineData = cur.airlines.filter(a=>a.short!=="--").map(a=>({
    name:a.short, fullName:a.name, mov:a.mov, pax:a.pax, color:a.color,
  }));

  const routesOrdered = [...AER.routes].sort((a,b)=>b.mov25-a.mov25);
  const routeGrowth   = [...AER.routes]
    .map(r=>({...r, pct:parseFloat(pct(r.mov23,r.mov25))}))
    .sort((a,b)=>b.pct-a.pct);

  const noctData = AER.YEARS.map(y=>({
    año:String(y),
    Nocturnas:AER.byYear[y].nocturnal,
    pct_total:parseFloat(((AER.byYear[y].nocturnal/AER.byYear[y].total)*100).toFixed(1)),
  }));

  const tabs = [
    {id:"overview",      label:"Resumen"},
    {id:"trafico",       label:"Tráfico"},
    {id:"aerolineas",    label:"Aerolíneas"},
    {id:"rutas",         label:"Rutas"},
    {id:"mantenimiento", label:"Mantenimiento"},
  
  ];

  return (
    <div style={{ background:C.bg, color:C.text }}>

      {/* HEADER */}
      <div style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"18px 32px" }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
          
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            
            {AER.YEARS.map(y => (
              <button key={y} onClick={()=>setYear(y)} style={{
                background:year===y ? C.accent : "transparent",
                color:year===y ? "#000" : C.muted,
                border:`1px solid ${year===y ? C.accent : C.border}`,
                borderRadius:6, padding:"6px 14px", cursor:"pointer",
                fontSize:13, fontFamily:"inherit", fontWeight:year===y ? 700 : 400,
              }}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ padding:"16px 24px 0" }} className="kpi-grid-5">
        <KPI label="Movimientos totales"      value={cur.total}    base={ref.total} />
        <KPI label="Pasajeros"                value={cur.pax}      base={ref.pax} />
        <KPI label="Vuelos domésticos"        value={cur.domestic} base={ref.domestic} />
        <KPI label="Vuelos internacionales"   value={cur.intl}     base={ref.intl} accent={C.gold} warn />
        <KPI label="Ops. nocturnas"           value={cur.nocturnal} base={ref.nocturnal}
             unit={`(${((cur.nocturnal/cur.total)*100).toFixed(1)}%)`} accent={C.red} warn />
      </div>

      {/* TABS */}
      <div style={{ padding:"16px 32px 0", display:"flex", gap:2, borderBottom:`1px solid ${C.border}`, marginTop:16, overflowX:"auto" }}>
        {tabs.map(t=><TabBtn key={t.id} id={t.id} active={tab===t.id} onClick={setTab}>{t.label}</TabBtn>)}
      </div>

      <div style={{ padding:"16px 24px" }}>

        {/* ── RESUMEN ── */}
        {tab==="overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[
                {label:"Pax/mov (Aerolíneas AR)", value:"70.2",  note:"Baja densidad",         color:C.amber},
                {label:"Pax/mov (Internacionales)",value:"148+", note:"Alta densidad",          color:C.green},
                {label:"Wide-body en AER",          value:"~0",  note:"Flota 100% estrecha",    color:C.accent},
                {label:"Crecimiento intl 2023→2025",value:"+45%",note:"Mayor cambio estructural",color:C.red},
              ].map(s=>(
                <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
                  <p style={{ color:C.muted, fontSize:10, margin:"0 0 6px", textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</p>
                  <p style={{ color:s.color, fontSize:22, fontWeight:700, margin:"0 0 4px", fontFamily:"monospace" }}>{s.value}</p>
                  <p style={{ color:C.muted, fontSize:11, margin:0 }}>{s.note}</p>
                </div>
              ))}
            </div>

            <div className="chart-grid-1-2" style={{ gap:16 }}>
              <Card title="Movimientos mensuales — 2023 · 2024 · 2025">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyMovData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mes" tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }}  domain={['dataMin - 1000', 'auto']}/>
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize:11, color:C.muted }} />
                    <Line dataKey="2023" stroke={C.y2023} dot={false} strokeWidth={1.5} />
                    <Line dataKey="2024" stroke={C.y2024} dot={false} strokeWidth={1.5} />
                    <Line dataKey="2025" stroke={C.y2025} dot={false} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Dom. vs Internacional por año">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={intlDomData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="año" tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize:11, color:C.muted }} />
                    <Bar dataKey="Doméstico"     fill={C.accent} />
                    <Bar dataKey="Internacional" fill={C.gold}   radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card title={`Participación de mercado — movimientos ${year}`}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
                {cur.airlines.filter(a=>a.short!=="--").map(a=>{
                  const totalKnown=cur.airlines.filter(x=>x.short!=="--").reduce((s,x)=>s+x.mov,0);
                  const share=(a.mov/totalKnown*100).toFixed(1);
                  return (
                    <div key={a.short} style={{ background:`${a.color}18`, border:`1px solid ${a.color}50`,
                      borderRadius:8, padding:"10px 16px", textAlign:"center", minWidth:110 }}>
                      <p style={{ color:a.color, fontSize:20, fontWeight:700, margin:"0 0 2px", fontFamily:"monospace" }}>{share}%</p>
                      <p style={{ color:C.textDim, fontSize:11, margin:"0 0 1px" }}>{a.name}</p>
                      <p style={{ color:C.muted, fontSize:10, margin:0 }}>{fmt(a.mov)} mov</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ── TRÁFICO ── */}
        {tab==="trafico" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <Card title="Pasajeros mensuales acumulados">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyPaxData}>
                  <defs>
                    <linearGradient id="gPax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.gold} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.gold} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="mes" tick={{ fill:C.muted, fontSize:11 }} />
                  <YAxis tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize:11, color:C.muted }} />
                  <Area dataKey="2023" stroke={C.y2023} fill="transparent" strokeWidth={1.5} dot={false} />
                  <Area dataKey="2024" stroke={C.y2024} fill="transparent" strokeWidth={1.5} dot={false} />
                  <Area dataKey="2025" stroke={C.y2025} fill="url(#gPax)"  strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Mix doméstico / internacional por año">
              <div style={{ display:"flex", flexDirection:"column", gap:16, marginTop:6 }}>
                {AER.YEARS.map(y=>{
                  const d=AER.byYear[y];
                  const total=d.domestic+d.intl;
                  const intlPct=(d.intl/total*100).toFixed(1);
                  const yColor=y===2023?C.y2023:y===2024?C.y2024:C.y2025;
                  return (
                    <div key={y}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ color:yColor, fontSize:12, fontWeight:700 }}>{y}</span>
                        <span style={{ color:C.muted, fontSize:11 }}>Intl: {intlPct}%</span>
                      </div>
                      <div style={{ height:10, background:C.border, borderRadius:5, overflow:"hidden", display:"flex" }}>
                        <div style={{ width:`${100-parseFloat(intlPct)}%`, background:C.accent, borderRadius:"5px 0 0 5px" }} />
                        <div style={{ width:`${intlPct}%`, background:C.gold }} />
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                        <span style={{ color:C.muted, fontSize:10 }}>Dom: {fmt(d.domestic)}</span>
                        <span style={{ color:C.gold,  fontSize:10 }}>Intl: {fmt(d.intl)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:16, padding:"10px 12px", background:`${C.gold}15`, border:`1px solid ${C.gold}40`, borderRadius:8 }}>
                <p style={{ color:C.gold, fontSize:11, margin:0 }}>
                  Los vuelos internacionales pasaron del <strong>22.0%</strong> (2023) al <strong>28.9%</strong> (2025).
                  Un cambio estructural que impacta en infraestructura de plataforma y equipos de rampa.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── AEROLÍNEAS ── */}
        {tab==="aerolineas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div className="chart-grid-1-2" style={{ gap:16 }}>
              <Card title={`Movimientos por aerolínea — ${year}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={airlineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill:C.textDim, fontSize:12 }} width={30} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active||!payload?.length) return null;
                      const a=airlineData.find(x=>x.name===label);
                      return (
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
                          <p style={{ color:C.text, fontWeight:600, margin:"0 0 6px" }}>{a?.fullName||label}</p>
                          <p style={{ color:payload[0].fill, margin:"2px 0" }}>Mov: {fmt(payload[0].value)}</p>
                          {a&&<p style={{ color:C.muted, margin:"2px 0" }}>PAX: {fmt(a.pax)}</p>}
                        </div>
                      );
                    }} />
                    <Bar dataKey="mov" name="Movimientos" radius={[0,4,4,0]}>
                      {airlineData.map((a,i)=><Cell key={i} fill={a.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Pasajeros/movimiento 2025" sub="mayor = vuelos más llenos">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={AER.paxPerMov2025} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" tick={{ fill:C.muted, fontSize:11 }} domain={[0,180]} />
                    <YAxis type="category" dataKey="name" tick={{ fill:C.textDim, fontSize:10 }} width={95} />
                    <Tooltip content={<Tip unit=" pax/mov" />} />
                    <Bar dataKey="pax_mov" name="Pax/movimiento" radius={[0,4,4,0]}>
                      {AER.paxPerMov2025.map((a,i)=>(
                        <Cell key={i} fill={a.pax_mov>120?C.green:a.pax_mov>90?C.amber:C.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Evolución aerolíneas clave 2023–2025">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={AER.YEARS.map(y=>({
                  año:String(y),
                  "Aerolíneas AR": AER.byYear[y].airlines[0].mov,
                  "JetSmart":      AER.byYear[y].airlines.find(a=>a.short==="JA")?.mov||0,
                  "Flybondi":      AER.byYear[y].airlines.find(a=>a.short==="FO")?.mov||0,
                  "Gol":           AER.byYear[y].airlines.find(a=>a.short==="G3")?.mov||0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="año" tick={{ fill:C.muted, fontSize:11 }} />
                  <YAxis tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize:11, color:C.muted }} />
                  <Bar dataKey="Aerolíneas AR" fill="#58a6ff" radius={[2,2,0,0]} />
                  <Bar dataKey="JetSmart"      fill="#3fb950" radius={[2,2,0,0]} />
                  <Bar dataKey="Flybondi"      fill="#e6b45a" radius={[2,2,0,0]} />
                  <Bar dataKey="Gol"           fill="#f85149" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:12, padding:"10px 14px", background:`${C.green}12`, border:`1px solid ${C.green}30`, borderRadius:8 }}>
                <p style={{ color:C.green, fontSize:11, margin:0 }}>
                  JetSmart creció <strong>+74%</strong> en 2 años y en 2025 superó a Flybondi como segunda aerolínea en AER.
                  Más ciclos LCC = mayor desgaste en marcas horizontales y calles de rodaje.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── RUTAS ── */}
        {tab==="rutas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div className="chart-grid-1-2" style={{ gap:16 }}>
              <Card title="Top 15 rutas — movimientos 2025" sub="azul=doméstico · dorado=internacional">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={routesOrdered} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill:C.textDim, fontSize:11 }} width={115} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active||!payload?.length) return null;
                      const r=routesOrdered.find(x=>x.name===label);
                      return (
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
                          <p style={{ color:C.text, fontWeight:600, margin:"0 0 4px" }}>{label} <span style={{ color:C.muted }}>({r?.code})</span></p>
                          <p style={{ color:C.accent, margin:"2px 0" }}>2025: {fmt(r?.mov25||0)}</p>
                          <p style={{ color:C.muted,  margin:"2px 0" }}>2023: {fmt(r?.mov23||0)}</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="mov25" name="2025" radius={[0,4,4,0]}>
                      {routesOrdered.map((r,i)=><Cell key={i} fill={r.type==="INTL"?C.gold:C.accent} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Crecimiento de rutas 2023→2025 (%)">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={routeGrowth} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" unit="%" tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill:C.textDim, fontSize:11 }} width={115} />
                    <Tooltip content={<Tip unit="%" />} />
                    <Bar dataKey="pct" name="Crecimiento %" radius={[0,4,4,0]}>
                      {routeGrowth.map((r,i)=>(
                        <Cell key={i} fill={r.pct>80?C.red:r.pct>20?C.amber:r.pct>=0?C.green:C.muted} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card title="Tabla de rutas — detalle completo">
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>
                      {["Destino","Código","Tipo","Mov. 2023","Mov. 2025","Variación","Estado"].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"8px 10px", color:C.muted, borderBottom:`1px solid ${C.border}`, fontWeight:500, fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {routesOrdered.map((r,i)=>{
                      const g=parseFloat(pct(r.mov23,r.mov25));
                      const col=g>60?C.red:g>10?C.amber:g>=0?C.green:C.muted;
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${C.border}20` }}>
                          <td style={{ padding:"9px 10px", color:C.text, fontWeight:500 }}>{r.name}</td>
                          <td style={{ padding:"9px 10px", color:r.type==="INTL"?C.gold:C.accent, fontFamily:"monospace", fontWeight:700 }}>{r.code}</td>
                          <td style={{ padding:"9px 10px" }}>
                            <span style={{ background:r.type==="INTL"?`${C.gold}20`:`${C.accent}20`, color:r.type==="INTL"?C.gold:C.accent, padding:"2px 8px", borderRadius:4, fontSize:10 }}>{r.type}</span>
                          </td>
                          <td style={{ padding:"9px 10px", color:C.muted, fontFamily:"monospace" }}>{r.mov23.toLocaleString()}</td>
                          <td style={{ padding:"9px 10px", color:C.text, fontFamily:"monospace", fontWeight:600 }}>{r.mov25.toLocaleString()}</td>
                          <td style={{ padding:"9px 10px", color:col, fontFamily:"monospace" }}>{g>=0?"▲":"▼"} {Math.abs(g).toFixed(1)}%</td>
                          <td style={{ padding:"9px 10px" }}>
                            <span style={{ background:`${col}20`, color:col, padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700 }}>
                              {g>60?"ALTO IMPACTO":g>10?"CRECIMIENTO":g>=0?"ESTABLE":"CONTRACCIÓN"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── MANTENIMIENTO ── */}
        {tab==="mantenimiento" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            <div className="chart-grid-1-2" style={{ gap:16 }}>
              <Card title="Curva horaria — 2023 vs 2025" sub="referencias: ventana óptima (verde) y pico (rojo)">
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="gH25" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.gold} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="h" tick={{ fill:C.muted, fontSize:10 }} interval={1} />
                    <YAxis tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize:11, color:C.muted }} />
                    <ReferenceLine x="03h" stroke={C.green} strokeDasharray="4 2" label={{ value:"Inicio ventana", fill:C.green, fontSize:10, position:"top" }} />
                    <ReferenceLine x="06h" stroke={C.green} strokeDasharray="4 2" label={{ value:"Fin ventana", fill:C.green, fontSize:10, position:"top" }} />
                    <ReferenceLine x="14h" stroke={C.red}   strokeDasharray="4 2" label={{ value:"Pico máximo", fill:C.red, fontSize:10, position:"top" }} />
                    <Area dataKey="2023" stroke={C.y2023} fill="transparent" strokeWidth={1.5} dot={false} />
                    <Area dataKey="2025" stroke={C.y2025} fill="url(#gH25)"  strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Operaciones nocturnas por año">
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart data={noctData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="año" tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis yAxisId="left"  tickFormatter={fmt} tick={{ fill:C.muted, fontSize:11 }} />
                    <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fill:C.muted, fontSize:11 }} domain={[24,30]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize:11, color:C.muted }} />
                    <Bar  yAxisId="left"  dataKey="Nocturnas"  fill={C.red}   radius={[4,4,0,0]} />
                    <Line yAxisId="right" dataKey="pct_total" name="% del total" stroke={C.amber} dot strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { rango:"03h–06h", tipo:"Ventana óptima",  color:C.green,
                  mov: AER.byYear[2025].hourly.slice(3,7).reduce((s,v)=>s+v,0),
                  desc:"Volumen mínimo del día. Apta para repavimentación puntual, cambio de luces de pista, recarga de señalización horizontal y trabajos en plataforma." },
                { rango:"07h–11h", tipo:"Ventana parcial", color:C.amber,
                  mov: AER.byYear[2025].hourly.slice(7,12).reduce((s,v)=>s+v,0),
                  desc:"Tráfico creciente. Solo permite FOD inspection, verificación de luces de borde y tareas perimetrales sin afectar calles de rodaje." },
                { rango:"13h–22h", tipo:"Ventana nula",    color:C.red,
                  mov: AER.byYear[2025].hourly.slice(13,23).reduce((s,v)=>s+v,0),
                  desc:"Horario pico sostenido. Cualquier intervención en pista o plataforma genera conflicto operacional inmediato. Solo para emergencias." },
              ].map(w=>(
                <div key={w.rango} style={{ background:C.card, border:`1px solid ${w.color}40`, borderRadius:10, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <p style={{ color:w.color, fontSize:16, fontWeight:700, margin:0 }}>{w.rango}</p>
                      <p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>{w.tipo}</p>
                    </div>
                    <div style={{ background:`${w.color}20`, borderRadius:6, padding:"4px 8px", textAlign:"right" }}>
                      <p style={{ color:w.color, fontSize:13, fontWeight:700, margin:0 }}>{fmt(w.mov)}</p>
                      <p style={{ color:C.muted, fontSize:10, margin:0 }}>mov/año</p>
                    </div>
                  </div>
                  <p style={{ color:C.muted, fontSize:12, margin:0, lineHeight:1.6 }}>{w.desc}</p>
                </div>
              ))}
            </div>
            <Card title="Perfil de flota AER — impacto en pavimentos">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { tipo:"Boeing 737", pct:"39%", acn:"~35–45", peso:"79t",   color:C.accent, nota:"Familia más frecuente. ACN medio. Alta tasa de ciclos por turnaround corto de LCC y AR." },
                  { tipo:"EMB-ERJ190", pct:"23%", acn:"~22–28", peso:"51.8t", color:C.green,  nota:"Aeronave dominante en AER. Bajo ACN, menor impacto por pasada. Favorece la vida útil del pavimento." },
                  { tipo:"Airbus A320",pct:"8%",  acn:"~33–43", peso:"78t",   color:C.purple, nota:"Similar al 737 en impacto. Combinado con 737 representan ~47% de la flota operativa en AER." },
                ].map(a=>(
                  <div key={a.tipo} style={{ background:C.bg, border:`1px solid ${a.color}40`, borderRadius:8, padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <p style={{ color:a.color, fontSize:14, fontWeight:700, margin:0 }}>{a.tipo}</p>
                      <span style={{ background:`${a.color}20`, color:a.color, fontSize:11, padding:"2px 8px", borderRadius:4 }}>{a.pct} flota</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:10 }}>
                      <span style={{ fontSize:11, color:C.textDim }}>MTOW: <strong style={{ color:C.text }}>{a.peso}</strong></span>
                      <span style={{ fontSize:11, color:C.textDim }}>ACN típico: <strong style={{ color:a.color }}>{a.acn}</strong></span>
                    </div>
                    <p style={{ color:C.muted, fontSize:11, margin:0, lineHeight:1.5 }}>{a.nota}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

    

      </div>

      {/* FOOTER */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"14px 32px", display:"flex", justifyContent:"space-between" }}>
        <p style={{ color:C.muted, fontSize:10, margin:0 }}> </p>
        <p style={{ color:C.muted, fontSize:10, margin:0 }}> Fuente: Informes Ministerio de Transporte Argentina </p>
       
      </div>
    </div>
  );
}