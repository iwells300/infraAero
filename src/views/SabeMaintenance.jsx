import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { SABE_API_URL, getSabeBootstrap, getSabeScenario, getSabeWindows } from '../services/sabeApi';
import './SabeMaintenance.css';

const DURATIONS = [15, 30, 60, 120, 180];
const PERIODS = ['Madrugada', 'Manana', 'Tarde', 'Noche'];
const PERIOD_LABEL = {
  Madrugada: '00-06',
  Manana: '06-12',
  Tarde: '12-18',
  Noche: '18-24',
};
const PLAYBACK_SPEED = 25;
const LOOP_PAD_SEC = 120;

function secToClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600) % 24;
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseClock(value) {
  const [h, m] = value.split(':').map(Number);
  return h * 3600 + m * 60;
}

function assetUrl(base, filename) {
  if (!filename) return '';
  const safeBase = base?.startsWith('http') ? base : `${SABE_API_URL}${base || '/assets/'}`;
  return `${safeBase}${encodeURIComponent(filename)}`;
}

function pointDistance(a, b) {
  const lat = ((a[0] + b[0]) / 2) * (Math.PI / 180);
  const latMeters = (b[0] - a[0]) * 111320;
  const lngMeters = (b[1] - a[1]) * 111320 * Math.cos(lat);
  return Math.hypot(latMeters, lngMeters);
}

function routeMetrics(route) {
  const cumulative = [0];
  for (let i = 1; i < route.length; i += 1) {
    cumulative.push(cumulative[i - 1] + pointDistance(route[i - 1], route[i]));
  }
  return { cumulative, total: cumulative[cumulative.length - 1] || 1 };
}

function interpRoute(route, t) {
  if (!route || route.length < 2) return null;
  const clamped = Math.max(0, Math.min(1, t));
  const { cumulative, total } = routeMetrics(route);
  const target = total * clamped;
  let idx = 0;
  while (idx < cumulative.length - 2 && cumulative[idx + 1] < target) idx += 1;
  const a = route[idx];
  const b = route[idx + 1];
  const segment = Math.max(0.000001, cumulative[idx + 1] - cumulative[idx]);
  const frac = (target - cumulative[idx]) / segment;
  const lat = a[0] + (b[0] - a[0]) * frac;
  const lng = a[1] + (b[1] - a[1]) * frac;
  const angle = (Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180) / Math.PI;
  return { lat, lng, angle };
}

function eventClass(event, parked = false) {
  if (parked) return 'parked';
  const opClass = event.type === 'ARR' ? 'arrival' : 'departure';
  if (event.status === 'held') return `${opClass} held`;
  if (event.status === 'rerouted') return `${opClass} rerouted`;
  if (event.status === 'queued') return `${opClass} queued`;
  if (event.status === 'airhold') return `${opClass} airhold`;
  if (event.status === 'runway31') return `${opClass} runway31`;
  return opClass;
}

const TYPE_LABEL = {
  ARR: 'Arribo',
  DEP: 'Partida',
};

const STATUS_LABEL = {
  normal: 'Normal',
  held: 'En espera',
  rerouted: 'Desviado',
  queued: 'En cola',
  airhold: 'Espera en aire',
  runway31: 'Pista 31',
  cancelled: 'Cancelado',
};

function aircraftIcon(event, aircraftBase, angle, parked = false) {
  const src = assetUrl(aircraftBase, event.image);
  const label = `${event.aircraft} - ${event.reg || event.flight}`;
  const statusClass = eventClass(event, parked);
  return L.divIcon({
    className: 'aircraft-marker',
    html: `<div class="aircraft-wrap ${statusClass}">
      <img src="${src}" style="transform: rotate(${angle}deg)" />
      <span>${label}</span>
    </div>`,
    iconSize: [92, 72],
    iconAnchor: [46, 36],
  });
}

function visibleTraffic(events, simTime) {
  const moving = [];
  const parkedByPsn = new Map();
  for (const event of events || []) {
    if (simTime >= event.start_sec && simTime <= event.end_sec) {
      moving.push({ event, parked: false });
      continue;
    }
    if (event.type === 'ARR' && simTime > event.end_sec && simTime <= (event.park_end_sec ?? 24 * 3600)) {
      const previous = parkedByPsn.get(event.psn);
      if (!previous || event.end_sec > previous.event.end_sec) {
        parkedByPsn.set(event.psn, { event, parked: true });
      }
    }
  }
  const movingPsns = new Set(moving.map(({ event }) => event.psn));
  const parked = [...parkedByPsn.values()].filter(({ event }) => !movingPsns.has(event.psn));
  return [...moving, ...parked];
}

function routeProgress(event, simTime, parked) {
  if (parked) return 1;
  const holdStart = event.hold_start_sec;
  const holdEnd = event.hold_end_sec;
  const holdT = event.hold_t ?? 0;
  if (holdStart && holdEnd && holdEnd > holdStart) {
    if (simTime >= holdStart && simTime <= holdEnd) return holdT;
    if (simTime > holdEnd) {
      const movingBeforeHold = Math.max(1, holdStart - event.start_sec);
      const movingAfterHold = Math.max(1, event.end_sec - holdEnd);
      const afterHoldT = Math.min(1, (simTime - holdEnd) / movingAfterHold);
      return holdT + afterHoldT * (1 - holdT);
    }
    return Math.max(0, Math.min(holdT, ((simTime - event.start_sec) / Math.max(1, holdStart - event.start_sec)) * holdT));
  }
  const denom = Math.max(1, event.end_sec - event.start_sec);
  return (simTime - event.start_sec) / denom;
}

function eventPosition(event, simTime, parked) {
  const holdStart = event.hold_start_sec;
  const holdEnd = event.hold_end_sec;
  if (!parked && event.hold_point && holdStart && holdEnd && simTime >= holdStart && simTime <= holdEnd) {
    const beforeHold = interpRoute(event.route, Math.max(0, (event.hold_t ?? 0) - 0.001));
    const angle = beforeHold?.angle ?? 0;
    return { lat: event.hold_point[0], lng: event.hold_point[1], angle };
  }
  return interpRoute(event.route, routeProgress(event, simTime, parked));
}

function MaintenanceGrid({ windows, onSelect, selected }) {
  if (!windows) return <div className="empty-panel">Seleccione una unidad de mantenimiento.</div>;
  return (
    <div className="maintenance-grid-wrap">
      <div className="grid-title">
        <strong>{windows.unit_id}</strong>
        <span>Mejores ventanas por franja y duracion</span>
      </div>
      <table className="maintenance-grid">
        <thead>
          <tr>
            <th>Franja</th>
            {DURATIONS.map((d) => <th key={d}>{d < 60 ? `${d} min` : `${d / 60} h`}</th>)}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period}>
              <th>{period}<span>{PERIOD_LABEL[period]}</span></th>
              {DURATIONS.map((duration) => (
                <td key={duration}>
                  {(windows.grid?.[period]?.[String(duration)] || []).map((item) => {
                    const active = selected && selected.start === item.start && selected.end === item.end && selected.duration_min === item.duration_min;
                    return (
                      <button
                        key={`${item.start}-${item.duration_min}`}
                        className={`suggestion ${active ? 'active' : ''}`}
                        onClick={() => onSelect(item)}
                      >
                        <b>#{item.daily_rank}</b>
                        <span>{item.start}-{item.end}</span>
                        <small>F#{item.period_rank ?? '-'} - +{item.incremental_delay_min} min - ops {item.ops_in_window ?? 0} - desv {item.route_changes ?? 0}</small>
                      </button>
                    );
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timetable({ flights, assetBase, simTime }) {
  const windowStart = Math.max(0, simTime - 30 * 60);
  const windowEnd = Math.min(24 * 3600, simTime + 90 * 60);
  const visibleRows = (rows) => {
    const nearby = rows.filter((f) => f.time_sec >= windowStart && f.time_sec <= windowEnd);
    if (nearby.length) return nearby;
    return rows.filter((f) => f.time_sec >= simTime).slice(0, 24);
  };
  const arrivals = visibleRows(flights.filter((f) => f.type === 'ARR'));
  const departures = visibleRows(flights.filter((f) => f.type === 'DEP'));
  const block = (title, rows) => (
    <section className="timetable-block">
      <h3>{title}<span>{secToClock(windowStart)}-{secToClock(windowEnd)}</span></h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th></th><th>Aerolinea</th><th>Hora</th><th>{title === 'Arribos' ? 'Origen' : 'Destino'}</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.logo && <img className="logo" src={assetUrl(assetBase, row.logo)} />}</td>
                <td><b>{row.flight}</b><span>{row.aircraft} - {row.reg || 'sin reg'}</span></td>
                <td>{row.time}</td>
                <td>{row.airport}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
  return <aside className="timetable">{block('Arribos', arrivals)}{block('Partidas', departures)}</aside>;
}

function Consequences({ selected, consequences }) {
  return (
    <section className="consequences">
      <div className="section-head">
        <div>
          <h3>Consecuencias</h3>
          <p>{selected ? `${selected.start}-${selected.end} - ${selected.duration_min} min` : 'Seleccione una sugerencia para ver detalle.'}</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Vuelo</th><th>Tipo</th><th>Aeronave</th><th>Reg</th><th>OD</th><th>Estado</th><th>Demora</th></tr>
          </thead>
          <tbody>
            {(consequences || []).map((c) => (
              <tr key={c.op_id}>
                <td>{c.flight}</td>
                <td>{TYPE_LABEL[c.type] || c.type}</td>
                <td>{c.aircraft}</td>
                <td>{c.reg || '-'}</td>
                <td>{c.type === 'ARR' ? c.origin : c.destination}</td>
                <td><span className={`pill ${c.status}`}>{STATUS_LABEL[c.status] || c.status}</span></td>
                <td>{c.delay_min ?? 'cancelado'} min</td>
              </tr>
            ))}
            {(!consequences || consequences.length === 0) && <tr><td colSpan="7">Sin vuelos afectados para la seleccion.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlaybackControls({ playing, setPlaying, simTime, setSimTime, mode, setMode }) {
  return (
    <>
      <button onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
      <button onClick={() => setSimTime(0)}><RotateCcw size={18} /></button>
      <button onClick={() => setPlaying(false)}><Square size={18} /></button>
      <strong>{secToClock(simTime)}</strong>
      <input type="range" min="0" max={24 * 3600} step="60" value={simTime} onChange={(e) => setSimTime(Number(e.target.value))} />
      <div className="mode-toggle">
        <button className={mode === 'baseline' ? 'active' : ''} onClick={() => setMode('baseline')}>Sin mantenimiento</button>
        <button className={mode === 'maintenance' ? 'active' : ''} onClick={() => setMode('maintenance')}>Con mantenimiento</button>
      </div>
    </>
  );
}

function MapPanel({
  data,
  selectedUnit,
  scenario,
  mode,
  setMode,
  simTime,
  setSimTime,
  playing,
  setPlaying,
  showPsn,
  setShowPsn,
  showMaintenance,
  setShowMaintenance,
  onSelectUnit,
}) {
  const shellRef = useRef(null);
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const markersRef = useRef(new Map());

  useEffect(() => {
    if (!data || mapRef.current || !mapNodeRef.current) return undefined;
    const map = L.map(mapNodeRef.current, { zoomControl: false }).setView([-34.5596, -58.4153], 15);
    mapRef.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 21,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    layersRef.current.traffic = L.geoJSON(data.layers.traffic, { style: { color: '#415a77', weight: 2, opacity: 0.45 } }).addTo(map);
    layersRef.current.graph = L.geoJSON(data.layers.graph, {
      style: (f) => ({ color: f.properties.StructureT === 'RWY' ? '#111827' : '#2563eb', weight: f.properties.StructureT === 'RWY' ? 4 : 2, opacity: 0.6 }),
    }).addTo(map);
    layersRef.current.psn = L.geoJSON(data.layers.psn, {
      pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 4, color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.85, weight: 1 }),
      onEachFeature: (f, layer) => layer.bindTooltip(f.properties.IDPSN || f.properties.Nombre),
    }).addTo(map);
    layersRef.current.maintenance = L.geoJSON(data.layers.maintenance, {
      style: (f) => ({
        color: f.properties.unit_id === selectedUnit ? '#dc2626' : '#f59e0b',
        fillColor: f.properties.unit_id === selectedUnit ? '#dc2626' : '#f59e0b',
        weight: f.properties.unit_id === selectedUnit ? 3 : 1,
        fillOpacity: f.properties.unit_id === selectedUnit ? 0.28 : 0.08,
      }),
      onEachFeature: (f, layer) => {
        layer.bindTooltip(f.properties.label || f.properties.unit_id);
        layer.on('click', () => onSelectUnit(f.properties.unit_id));
      },
    }).addTo(map);

    const bounds = layersRef.current.graph.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.25));

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersRef.current.psn) return;
    if (showPsn) layersRef.current.psn.addTo(map); else layersRef.current.psn.remove();
  }, [showPsn]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersRef.current.maintenance) return;
    if (showMaintenance) layersRef.current.maintenance.addTo(map); else layersRef.current.maintenance.remove();
  }, [showMaintenance]);

  useEffect(() => {
    const layer = layersRef.current.maintenance;
    if (!layer) return;
    layer.setStyle((f) => ({
      color: f.properties.unit_id === selectedUnit ? '#dc2626' : '#f59e0b',
      fillColor: f.properties.unit_id === selectedUnit ? '#dc2626' : '#f59e0b',
      weight: f.properties.unit_id === selectedUnit ? 3 : 1,
      fillOpacity: f.properties.unit_id === selectedUnit ? 0.28 : 0.08,
    }));
  }, [selectedUnit]);

  useEffect(() => {
    const psnLayer = layersRef.current.psn;
    if (!psnLayer || !scenario) return;
    const occupied = new Set(visibleTraffic(scenario.events, simTime).map(({ event }) => event.psn));
    psnLayer.eachLayer((layer) => {
      const psn = layer.feature?.properties?.IDPSN;
      const isOccupied = occupied.has(psn);
      layer.setStyle({
        radius: isOccupied ? 5 : 4,
        color: '#0f766e',
        fillColor: '#14b8a6',
        fillOpacity: isOccupied ? 0.25 : 0.75,
        weight: isOccupied ? 2 : 1,
        dashArray: isOccupied ? '3 3' : null,
      });
      layer.setTooltipContent(`${psn || 'PSN'} - ${isOccupied ? 'ocupado' : 'libre'}`);
    });
  }, [scenario, simTime]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !scenario) return;
    const visible = visibleTraffic(scenario.events, simTime);
    const keep = new Set(visible.map(({ event }) => event.id));
    for (const [id, marker] of markersRef.current.entries()) {
      if (!keep.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    for (const { event, parked } of visible) {
      const pos = eventPosition(event, simTime, parked);
      if (!pos) continue;
      const icon = aircraftIcon(event, data.assets.aircraftBase, pos.angle, parked);
      let marker = markersRef.current.get(event.id);
      if (!marker) {
        marker = L.marker([pos.lat, pos.lng], { icon }).addTo(map);
        marker.bindTooltip(`${event.flight} - ${event.aircraft}<br>${event.type === 'ARR' ? event.origin : event.destination}`);
        markersRef.current.set(event.id, marker);
      } else {
        marker.setLatLng([pos.lat, pos.lng]);
        const wrap = marker.getElement()?.querySelector('.aircraft-wrap');
        if (wrap) wrap.className = `aircraft-wrap ${eventClass(event, parked)}`;
        const img = marker.getElement()?.querySelector('img');
        if (img) img.style.transform = `rotate(${pos.angle}deg)`;
      }
    }
  }, [scenario, simTime, data]);

  const openFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      shellRef.current?.requestFullscreen?.();
    }
    setTimeout(() => mapRef.current?.invalidateSize(), 250);
  };

  return (
    <div className="map-shell" ref={shellRef}>
      <div className="map-toggles">
        <label><input type="checkbox" checked={showPsn} onChange={(e) => setShowPsn(e.target.checked)} /> PSN</label>
        <label><input type="checkbox" checked={showMaintenance} onChange={(e) => setShowMaintenance(e.target.checked)} /> Mantenimiento</label>
        <button className="icon-action" onClick={openFullscreen} title="Pantalla completa"><Maximize2 size={16} /></button>
        <span className={`mode-chip ${mode}`}>{mode === 'maintenance' ? 'Con mantenimiento' : 'Sin mantenimiento'}</span>
      </div>
      <div className="sabe-map" ref={mapNodeRef} />
      <div className="map-fullscreen-controls">
        <PlaybackControls
          playing={playing}
          setPlaying={setPlaying}
          simTime={simTime}
          setSimTime={setSimTime}
          mode={mode}
          setMode={setMode}
        />
      </div>
    </div>
  );
}

function SabeMaintenance() {
  const [data, setData] = useState(null);
  const [windows, setWindows] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [mode, setMode] = useState('maintenance');
  const [playing, setPlaying] = useState(false);
  const [simTime, setSimTime] = useState(9 * 3600);
  const simTimeRef = useRef(simTime);
  const [showPsn, setShowPsn] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [loading, setLoading] = useState(false);
  const scenarioRequestRef = useRef(0);

  const chooseUnit = (unitId) => {
    scenarioRequestRef.current += 1;
    setSelectedUnit(unitId);
    setSelectedWindow(null);
    setWindows(null);
    setScenario((current) => ({ events: current?.events || data?.events || [], consequences: [] }));
  };

  const chooseWindow = (windowItem) => {
    scenarioRequestRef.current += 1;
    setSelectedWindow(windowItem);
    setScenario({ events: data?.events || scenario?.events || [], consequences: [] });
  };

  useEffect(() => {
    setLoading(true);
    getSabeBootstrap('may14')
      .then((payload) => {
        setData(payload);
        setScenario({ events: payload.events, consequences: [] });
        setSelectedUnit(payload.units?.[0]?.unit_id || '');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUnit) return;
    setLoading(true);
    getSabeWindows({ timetable: 'may14', unitId: selectedUnit, durations: '15,30,60,120,180', step: 15 })
      .then(setWindows)
      .finally(() => setLoading(false));
  }, [selectedUnit]);

  useEffect(() => {
    if (!selectedWindow || !selectedUnit) return;
    const requestId = scenarioRequestRef.current + 1;
    scenarioRequestRef.current = requestId;
    const controller = new AbortController();
    setScenario({ events: data?.events || scenario?.events || [], consequences: [] });
    setLoading(true);
    getSabeScenario({
      timetable: 'may14',
      unitId: selectedUnit,
      start: selectedWindow.start,
      end: selectedWindow.end,
      mode,
      signal: controller.signal,
    })
      .then((payload) => {
        if (requestId !== scenarioRequestRef.current) return;
        setScenario(payload);
        const startSec = Math.max(0, parseClock(selectedWindow.start) - LOOP_PAD_SEC);
        setSimTime(startSec);
        setPlaying(true);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (requestId === scenarioRequestRef.current) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedWindow, selectedUnit, mode]);

  useEffect(() => {
    simTimeRef.current = simTime;
  }, [simTime]);

  useEffect(() => {
    if (!playing) return undefined;
    let frameId;
    let lastFrame = performance.now();
    const tick = (now) => {
      const elapsed = Math.max(0, (now - lastFrame) / 1000);
      lastFrame = now;
      const loopStart = selectedWindow ? Math.max(0, parseClock(selectedWindow.start) - LOOP_PAD_SEC) : 0;
      const loopEnd = selectedWindow ? parseClock(selectedWindow.end) + LOOP_PAD_SEC : 24 * 3600;
      let next = simTimeRef.current + elapsed * PLAYBACK_SPEED;
      if (next > loopEnd) next = loopStart;
      simTimeRef.current = next;
      setSimTime(next);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [playing, selectedWindow]);

  const selectedUnitLabel = data?.units?.find((u) => u.unit_id === selectedUnit)?.label || selectedUnit;
  const logoBase = data?.assets?.logoBase || '/assets/Logos/';

  if (!data) return <div className="sabe-maintenance-view"><div className="loading">Cargando modelo SABE...</div></div>;

  return (
    <main className="sabe-maintenance-view app">
      <header className="topbar">
        <div>
          <h1>
          Timetable 14 de mayo - unidad: {selectedUnitLabel || 'seleccione en el mapa'}
         </h1>
        </div>
      </header>
      {loading && <div className="loading-overlay"><span className="spinner" />Cargando datos...</div>}

      <section className="timeline">
        <PlaybackControls
          playing={playing}
          setPlaying={setPlaying}
          simTime={simTime}
          setSimTime={setSimTime}
          mode={mode}
          setMode={setMode}
        />
      </section>

      <div className="main-grid">
        <MapPanel
          data={data}
          selectedUnit={selectedUnit}
          scenario={scenario}
          mode={mode}
          setMode={setMode}
          simTime={simTime}
          setSimTime={setSimTime}
          playing={playing}
          setPlaying={setPlaying}
          showPsn={showPsn}
          setShowPsn={setShowPsn}
          showMaintenance={showMaintenance}
          setShowMaintenance={setShowMaintenance}
          onSelectUnit={chooseUnit}
        />
        <Timetable flights={data.flights} assetBase={logoBase} simTime={simTime} />
      </div>

      <MaintenanceGrid windows={windows} selected={selectedWindow} onSelect={chooseWindow} />
      <Consequences selected={selectedWindow} consequences={scenario?.consequences || []} />
    </main>
  );
}

export default SabeMaintenance;
