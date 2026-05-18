import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts';
import { getFaarfieldHeavyAeronaves } from '../../services/api';

const materialColors = {
  superficie: '#64748b',
  'base estabilizada': '#f59e0b',
  'base granular': '#c084fc',
  'subbase granular': '#38bdf8',
  rasante: '#22c55e',
};

const aircraftColors = ['#38bdf8', '#f59e0b', '#22c55e', '#c084fc', '#f87171', '#a3e635', '#fb7185', '#60a5fa'];
const totalColor = '#ffffff';

const formatNumber = (value, digits = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) : 'N/A';
};

const formatCompact = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('es-AR', { maximumFractionDigits: 0 }) : 'N/A';
};

const formatScientific = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toExponential(2) : 'N/A';
};

const getLayerColor = (layerRole = '') => {
  const role = layerRole.toLowerCase();
  return materialColors[role] || '#94a3b8';
};

const getAircraftLabel = (row, duplicateCounts) => {
  const name = row.aircraft_name || 'Aeronave';
  return duplicateCounts.get(name) > 1 ? `${name} - Orden ${row.aircraft_order}` : name;
};

const chartPanelStyle = {
  border: '1px solid var(--glass-border)',
  borderRadius: '0.75rem',
  padding: '1rem',
  background: 'rgba(15, 23, 42, 0.24)',
};

const tableInputStyle = {
  width: '100%',
  minWidth: 92,
  border: '1px solid var(--glass-border)',
  borderRadius: 6,
  background: 'rgba(15, 23, 42, 0.58)',
  color: 'var(--text-primary)',
  padding: '0.42rem 0.5rem',
};

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getAircraftGroupLabel = (aircraft = {}) => (
  aircraft.name_unique || aircraft.aircraft_name || aircraft.name_original || 'Aeronave'
).replace(/\s+Belly(?=__\d+$|$)/i, '');

const isBellyAircraft = (aircraft = {}) => /\bBelly\b/i.test(
  aircraft.name_unique || aircraft.aircraft_name || aircraft.name_original || '',
);

const getBaseAircraftName = (name = '') => String(name)
  .replace(/__\d+$/i, '')
  .trim();

const getAircraftPairKey = (name = '') => getBaseAircraftName(name)
  .replace(/\s+Belly$/i, '')
  .trim();

const getSectionPcrValue = (section = {}, fallback) => {
  const name = String(section.label || section.id || '');
  if (/APN MILITAR/i.test(name)) return 565;
  const match = name.match(/PCR\s+(\d+(?:[.,]\d+)?)/i);
  return toFiniteNumber(match?.[1]?.replace(',', '.'), toFiniteNumber(fallback, NaN));
};

const getWeightLabel = (weightPct) => `${formatNumber(weightPct, 0)}% MTOW`;

const isAllowedWeightPct = (weightPct) => {
  const value = Number(weightPct);
  return Number.isFinite(value) && value >= 60 && value <= 100;
};

const normalizeWheelCoordinates = (coordinates = []) => (
  Array.isArray(coordinates) ? coordinates.map((point) => ({
    x: { si: toFiniteNumber(point?.x_si ?? point?.x?.si ?? point?.x ?? 0) },
    y: { si: toFiniteNumber(point?.y_si ?? point?.y?.si ?? point?.y ?? 0) },
  })) : []
);

const getInterpolatedWeightStatus = (interpolatedWeight, selectedWeight) => {
  if (!Number.isFinite(interpolatedWeight) || !Number.isFinite(selectedWeight) || selectedWeight <= 0) {
    return { label: 'Sin dato', color: 'var(--text-secondary)', background: 'rgba(148, 163, 184, 0.12)' };
  }
  if (interpolatedWeight >= selectedWeight) {
    return { label: 'OK', color: '#86efac', background: 'rgba(34, 197, 94, 0.16)' };
  }
  if (interpolatedWeight >= selectedWeight * 0.9) {
    return { label: 'Margen 10%', color: '#fde68a', background: 'rgba(245, 158, 11, 0.16)' };
  }
  return { label: 'Bajo', color: '#fca5a5', background: 'rgba(248, 113, 113, 0.16)' };
};

const linearRegression = (points) => {
  const valid = points
    .map((point) => ({ x: toFiniteNumber(point.x, NaN), y: toFiniteNumber(point.y, NaN) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (valid.length < 2) return null;
  const n = valid.length;
  const sumX = valid.reduce((sum, point) => sum + point.x, 0);
  const sumY = valid.reduce((sum, point) => sum + point.y, 0);
  const sumXY = valid.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = valid.reduce((sum, point) => sum + point.x * point.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-9) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const DataTable = ({ columns, rows, emptyText }) => (
  <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.65rem' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: '0.82rem' }}>
      <thead>
        <tr style={{ background: 'rgba(148, 163, 184, 0.12)' }}>
          {columns.map((column) => (
            <th key={column.key} style={{ padding: '0.65rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
              {emptyText}
            </td>
          </tr>
        ) : rows.map((row, index) => (
          <tr key={`${row.aircraft_name || row.aeronave || row.name}-${index}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {columns.map((column) => (
              <td key={column.key} style={{ padding: '0.62rem', color: 'var(--text-primary)' }}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TreemapContent = ({ x, y, width, height, name, annual_departures, annual_growth_pct, index }) => {
  if (width < 44 || height < 34) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={aircraftColors[index % aircraftColors.length]} stroke="rgba(15,23,42,0.78)" />
      <text x={x + 8} y={y + 18} fill="#0f172a" fontSize={11} fontWeight={800}>
        {name}
      </text>
      {height > 58 && (
        <text x={x + 8} y={y + 36} fill="#0f172a" fontSize={10} fontWeight={700}>
          {formatCompact(annual_departures)} salidas
        </text>
      )}
      {height > 78 && (
        <text x={x + 8} y={y + 52} fill="#0f172a" fontSize={10} fontWeight={700}>
          Crec. {formatNumber(annual_growth_pct, 1)}%
        </text>
      )}
    </g>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload || {};
  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.7rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
      <strong>{label || item.name || item.aeronave || item.aircraft_name}</strong>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} style={{ margin: '0.25rem 0 0', color: entry.color || 'var(--text-secondary)' }}>
          {entry.name || entry.dataKey}: {Math.abs(Number(entry.value)) > 0 && Math.abs(Number(entry.value)) < 0.001 ? formatScientific(entry.value) : formatNumber(entry.value, 2)}
        </p>
      ))}
    </div>
  );
};

const VerificarAeronaveModal = ({ catalog, loading, error, initialSelection, sections, zona, onClose, onSubmit }) => {
  const aircraftOptions = useMemo(() => {
    const byPair = new Map();
    (catalog?.aeronaves || []).forEach((aircraft) => {
      const pairKey = getAircraftGroupLabel(aircraft);
      if (!byPair.has(pairKey)) byPair.set(pairKey, []);
      byPair.get(pairKey).push(aircraft);
    });

    return (catalog?.aeronaves || []).map((aircraft) => {
      const pairKey = getAircraftGroupLabel(aircraft);
      const pairRows = byPair.get(pairKey) || [aircraft];
      const maxAcrB = Math.max(...pairRows.map((item) => toFiniteNumber(item.acr_b, 0)));
      const hasBellyPair = pairRows.some(isBellyAircraft);
      return {
        ...aircraft,
        acr_b: maxAcrB,
        aircraft_ids: pairRows.map((item) => item.aircraft_id),
        aircraft_group_id: aircraft.aircraft_id,
        aircraft_pair_key: pairKey,
        display_name: aircraft.name_unique,
        has_belly: hasBellyPair,
      };
    }).sort((a, b) => a.name_unique.localeCompare(b.name_unique));
  }, [catalog]);

  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [trendAircraftId, setTrendAircraftId] = useState('');
  const [rows, setRows] = useState(() => {
    const selected = new Map(initialSelection.map((item) => [item.aircraft_group_id || item.aircraft_id, item]));
    return aircraftOptions
      .filter((aircraft) => selected.has(aircraft.aircraft_group_id))
      .map((aircraft) => {
        const existing = selected.get(aircraft.aircraft_group_id);
        return {
          ...aircraft,
          annual_departures_input: existing?.annual_departures ?? aircraft.annual_departures ?? 1,
          acr_b_input: existing?.acr_b ?? aircraft.acr_b ?? 0,
          weight_pct_input: existing?.weight_pct ?? 100,
        };
      });
  });

  const acrWeightRows = useMemo(() => (catalog?.acrWeights || []).map((item) => ({
    ...item,
    aircraft_pair_key: getAircraftPairKey(item.aircraft_name),
  })), [catalog]);

  const getWeightRowsForAircraft = useCallback((aircraft) => acrWeightRows.filter(
    (item) => item.aircraft_pair_key === aircraft.aircraft_pair_key,
  ), [acrWeightRows]);

  const getWeightOptionsForAircraft = useCallback((aircraft) => Array.from(new Set(
    getWeightRowsForAircraft(aircraft)
      .map((item) => toFiniteNumber(item.weight_pct, NaN))
      .filter(isAllowedWeightPct),
  )).sort((a, b) => b - a), [getWeightRowsForAircraft]);

  const getWeightSummary = useCallback((aircraft, weightPct) => {
    const weightRows = getWeightRowsForAircraft(aircraft).filter((item) => Number(item.weight_pct) === Number(weightPct));
    if (!weightRows.length) return null;
    const primary = weightRows.find((item) => !item.is_belly) || weightRows[0];
    return {
      ...primary,
      gross_weight_lb: Math.max(...weightRows.map((item) => toFiniteNumber(item.gross_weight_lb, 0))),
      acr_b: Math.max(...weightRows.map((item) => toFiniteNumber(item.acr_b, 0))),
      wheel_coordinates_json: weightRows.flatMap((item) => normalizeWheelCoordinates(item.wheel_coordinates)),
    };
  }, [getWeightRowsForAircraft]);

  const applyWeightToRow = useCallback((row, weightPct) => {
    const weightSummary = getWeightSummary(row, weightPct);
    if (!weightSummary) return { ...row, weight_pct_input: weightPct };
    return {
      ...row,
      weight_pct_input: weightPct,
      gross_weight_lb: weightSummary.gross_weight_lb,
      acr_b_input: weightSummary.acr_b,
      tire_pressure_psi: weightSummary.tire_pressure_psi,
      tire_area_mm2: weightSummary.tire_area_mm2,
      tire_length_mm: weightSummary.tire_length_mm,
      tire_width_mm: weightSummary.tire_width_mm,
      selected_weight_wheels: weightSummary.wheel_coordinates_json,
    };
  }, [getWeightSummary]);

  const availableAircraft = aircraftOptions.filter(
    (aircraft) => !rows.some((row) => row.aircraft_pair_key === aircraft.aircraft_pair_key),
  );

  const addAircraft = () => {
    const aircraft = aircraftOptions.find((item) => item.aircraft_group_id === selectedAircraftId) || availableAircraft[0];
    if (!aircraft) return;
    const weightOptions = getWeightOptionsForAircraft(aircraft);
    const defaultWeight = weightOptions.includes(100) ? 100 : weightOptions[weightOptions.length - 1] ?? 100;
    setRows((current) => [
      ...current,
      applyWeightToRow({
        ...aircraft,
        annual_departures_input: aircraft.annual_departures ?? 1,
        acr_b_input: aircraft.acr_b ?? 0,
      }, defaultWeight),
    ]);
    setTrendAircraftId((current) => current || aircraft.aircraft_group_id);
    setSelectedAircraftId('');
  };

  const updateRow = (aircraftId, patch) => {
    setRows((current) => current.map((row) => (
      row.aircraft_group_id === aircraftId ? (
        Object.prototype.hasOwnProperty.call(patch, 'weight_pct_input')
          ? applyWeightToRow(row, patch.weight_pct_input)
          : { ...row, ...patch }
      ) : row
    )));
  };

  const removeRow = (aircraftId) => {
    setRows((current) => current.filter((row) => row.aircraft_group_id !== aircraftId));
    if (trendAircraftId === aircraftId) setTrendAircraftId('');
  };

  const trendRow = rows.find((row) => row.aircraft_group_id === (trendAircraftId || rows[0]?.aircraft_group_id)) || rows[0];

  const runwayPcrElements = useMemo(() => {
    const byName = new Map();
    (catalog?.acrWeights || []).forEach((item) => {
      const name = item.structure_name;
      if (!name || byName.has(name)) return;
      const pcr = getSectionPcrValue({ label: name }, item.section_pcr_new_pcn);
      byName.set(name, {
        id: name,
        label: name,
        index: item.structure_index,
        pcr,
      });
    });

    (sections || []).forEach((section) => {
      const name = section.label || section.id;
      if (!name || byName.has(name)) return;
      byName.set(name, {
        ...section,
        pcr: getSectionPcrValue(section, zona?.valorpcr ?? zona?.valorPcr),
      });
    });

    return Array.from(byName.values())
      .filter((item) => Number.isFinite(item.pcr))
      .sort((a, b) => Number(a.index ?? 9999) - Number(b.index ?? 9999) || String(a.label).localeCompare(String(b.label)));
  }, [catalog, sections, zona]);

  const weightChangeData = useMemo(() => {
    if (!trendRow) return { chartData: [], pcrRows: [], selectedWeight: NaN, yAxisMax: 1, hasData: false };
    const summaries = getWeightOptionsForAircraft(trendRow)
      .map((weightPct) => getWeightSummary(trendRow, weightPct))
      .filter(Boolean)
      .map((item) => ({
        x: toFiniteNumber(item.gross_weight_lb, NaN),
        y: toFiniteNumber(item.acr_b, NaN),
        peso: toFiniteNumber(item.gross_weight_lb, NaN),
        acr_b: toFiniteNumber(item.acr_b, NaN),
        weight_pct: item.weight_pct,
      }))
      .filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y))
      .sort((a, b) => a.x - b.x);
    const regression = linearRegression(summaries);
    const chartData = summaries.map((item) => ({
      ...item,
      tendencia: regression ? regression.slope * item.x + regression.intercept : null,
    }));
    const selectedWeight = toFiniteNumber(trendRow.gross_weight_lb, NaN);
    const pcrRows = runwayPcrElements
      .map((element) => {
        const pcr = element.pcr;
        const interpolatedWeight = regression && Math.abs(regression.slope) > 1e-9
          ? (pcr - regression.intercept) / regression.slope
          : NaN;
        return {
          element: element.label || element.id,
          pcr,
          interpolatedWeight,
          status: getInterpolatedWeightStatus(interpolatedWeight, selectedWeight),
        };
      })
      .filter((item) => Number.isFinite(item.pcr));
    const maxChartValue = Math.max(
      0,
      ...chartData.flatMap((item) => [item.acr_b, item.tendencia]).filter(Number.isFinite),
      ...pcrRows.map((item) => item.pcr).filter(Number.isFinite),
    );
    const yAxisMax = maxChartValue > 0 ? Math.ceil((maxChartValue * 1.08) / 10) * 10 : 1;
    return { chartData, pcrRows, selectedWeight, yAxisMax, hasData: summaries.length > 0 };
  }, [getWeightOptionsForAircraft, getWeightSummary, runwayPcrElements, trendRow]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const selectedRows = rows.map((row) => ({
      aircraft_id: row.aircraft_id,
      aircraft_group_id: row.aircraft_group_id,
      aircraft_ids: row.aircraft_ids,
      aircraft_order: row.aircraft_order,
      aircraft_name: row.name_unique,
      name_unique: row.name_unique,
      manufacturer: row.manufacturer,
      gear: row.gear,
      gross_weight_lb: row.gross_weight_lb,
      annual_departures: Math.max(0, toFiniteNumber(row.annual_departures_input, 0)),
      annual_growth_pct: row.annual_growth_pct,
      total_departures: Math.max(0, toFiniteNumber(row.annual_departures_input, 0)),
      acr_b: Math.max(0, toFiniteNumber(row.acr_b_input, 0)),
      tire_pressure_psi: row.tire_pressure_psi,
      tire_area_mm2: row.tire_area_mm2,
      tire_length_mm: row.tire_length_mm,
      tire_width_mm: row.tire_width_mm,
      weight_pct: toFiniteNumber(row.weight_pct_input, 100),
      selected_weight_wheels: row.selected_weight_wheels,
    }));

    onSubmit(selectedRows);
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: 'min(1120px, 96vw)', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Verificar aeronave</h2>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                Comprueba la operacion de aeronaves segun ACR - PCR
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ border: '1px solid var(--glass-border)', background: 'rgba(15, 23, 42, 0.36)', color: 'var(--text-primary)', borderRadius: 8, padding: '0.45rem 0.7rem', cursor: 'pointer', fontWeight: 800 }}>
            Cerrar
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando aeronaves...</p>}
        {error && <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>}

        {!loading && !error && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) auto', gap: '0.6rem', alignItems: 'end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700 }}>
                Aeronave
                <select
                  className="search-input"
                  value={selectedAircraftId}
                  onChange={(event) => setSelectedAircraftId(event.target.value)}
                  disabled={!availableAircraft.length}
                >
                  {availableAircraft.map((aircraft) => (
                    <option key={aircraft.aircraft_group_id} value={aircraft.aircraft_group_id}>
                      {aircraft.display_name}{aircraft.has_belly && !isBellyAircraft(aircraft) ? ' (incluye Belly)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn-secondary" onClick={addAircraft} disabled={!availableAircraft.length}>
                Agregar aeronave
              </button>
            </div>

            <div style={{ overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.65rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040, fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(148, 163, 184, 0.12)' }}>
                    {['Aeronave', 'Fabricante', 'Tren', 'Peso', 'Peso lb', 'Salidas anuales', 'ACR B', ''].map((label) => (
                      <th key={label} style={{ padding: '0.65rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
                        Agrega una aeronave para verificar la seccion.
                      </td>
                    </tr>
                  ) : rows.map((row) => (
                    <tr key={row.aircraft_group_id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '0.55rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                        {row.display_name || row.name_unique}{row.has_belly && !isBellyAircraft(row) ? ' (incluye Belly)' : ''}
                      </td>
                      <td style={{ padding: '0.55rem', color: 'var(--text-secondary)' }}>{row.manufacturer || 'N/A'}</td>
                      <td style={{ padding: '0.55rem', color: 'var(--text-secondary)' }}>{row.gear || 'N/A'}</td>
                      <td style={{ padding: '0.55rem' }}>
                        <select
                          value={row.weight_pct_input ?? 100}
                          onChange={(event) => updateRow(row.aircraft_group_id, { weight_pct_input: Number(event.target.value) })}
                          style={tableInputStyle}
                        >
                          {(getWeightOptionsForAircraft(row).length ? getWeightOptionsForAircraft(row) : [row.weight_pct_input ?? 100]).map((weightPct) => (
                            <option key={weightPct} value={weightPct}>{getWeightLabel(weightPct)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.55rem', color: 'var(--text-primary)' }}>{formatCompact(row.gross_weight_lb)}</td>
                      <td style={{ padding: '0.55rem' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.annual_departures_input}
                          onChange={(event) => updateRow(row.aircraft_group_id, { annual_departures_input: event.target.value })}
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: '0.55rem' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.acr_b_input}
                          onChange={(event) => updateRow(row.aircraft_group_id, { acr_b_input: event.target.value })}
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: '0.55rem', textAlign: 'right' }}>
                        <button type="button" onClick={() => removeRow(row.aircraft_group_id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 800 }}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > 0 && (
              <details open style={{ border: '1px solid var(--glass-border)', borderRadius: '0.75rem', background: 'rgba(15, 23, 42, 0.2)', padding: '0.85rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Cambio de peso
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) minmax(440px, 0.85fr)', gap: '1rem', marginTop: '0.85rem', alignItems: 'start' }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      Aeronave
                      <select
                        className="search-input"
                        value={trendRow?.aircraft_group_id || ''}
                        onChange={(event) => setTrendAircraftId(event.target.value)}
                      >
                        {rows.map((row) => (
                          <option key={row.aircraft_group_id} value={row.aircraft_group_id}>
                            {row.display_name || row.name_unique}
                          </option>
                        ))}
                      </select>
                    </label>
                    {weightChangeData.hasData ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={weightChangeData.chartData} margin={{ top: 22, right: 24, bottom: 8, left: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.16)" />
                          <XAxis
                            type="number"
                            dataKey="peso"
                            name="Peso"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            tickFormatter={formatCompact}
                            domain={['dataMin', 'dataMax']}
                          />
                          <YAxis
                            name="ACR B"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            tickFormatter={(value) => formatNumber(value, 0)}
                            domain={[0, weightChangeData.yAxisMax]}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 11 }} />
                          {weightChangeData.pcrRows.map((row, index) => (
                            <ReferenceLine
                              key={`${row.element}-${index}`}
                              y={row.pcr}
                              stroke={aircraftColors[index % aircraftColors.length]}
                              strokeDasharray="4 4"
                              label={{ value: `PCR ${formatNumber(row.pcr, 0)}`, fill: 'var(--text-secondary)', fontSize: 10 }}
                            />
                          ))}
                          <Line type="monotone" dataKey="acr_b" name="ACR B" stroke="#38bdf8" strokeWidth={2} dot />
                          <Line type="monotone" dataKey="tendencia" name="Tendencia" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay curva ACR por peso para esta aeronave.</p>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.55rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>
                      Peso seleccionado: {formatCompact(weightChangeData.selectedWeight)} lb
                    </p>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.65rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420, fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(148, 163, 184, 0.12)' }}>
                            {['Elemento', 'PCR', 'Peso interpolado lb', 'Estado'].map((label) => (
                              <th key={label} style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {weightChangeData.pcrRows.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ padding: '0.8rem', color: 'var(--text-secondary)' }}>
                                No hay PCR de segmentos para interpolar.
                              </td>
                            </tr>
                          ) : weightChangeData.pcrRows.map((row, index) => (
                            <tr key={`${row.element}-${index}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: row.status.background }}>
                              <td style={{ padding: '0.58rem', color: 'var(--text-primary)', fontWeight: 800 }}>{row.element}</td>
                              <td style={{ padding: '0.58rem', color: 'var(--text-primary)' }}>{formatNumber(row.pcr, 0)}</td>
                              <td style={{ padding: '0.58rem', color: row.status.color, fontWeight: 800 }}>{formatCompact(row.interpolatedWeight)}</td>
                              <td style={{ padding: '0.58rem', color: row.status.color, fontWeight: 800 }}>{row.status.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </details>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button type="button" onClick={onClose} style={{ border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', borderRadius: 8, padding: '0.65rem 0.9rem', cursor: 'pointer', fontWeight: 800 }}>
            Cancelar
          </button>
          <button className="btn-primary" type="submit" disabled={loading || Boolean(error)}>
            Verificar
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

const PanelZona = ({ zona, verificationAircraft = [], onVerificarAeronave, onCdfVerificationChange }) => {
  const [activeTab, setActiveTab] = useState('estructura');
  const [activeSection, setActiveSection] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [heavyCatalog, setHeavyCatalog] = useState(null);
  const [heavyLoading, setHeavyLoading] = useState(false);
  const [heavyError, setHeavyError] = useState('');
  const estructura = useMemo(() => zona?.estructura || [], [zona?.estructura]);
  const aviones = useMemo(() => zona?.aviones || [], [zona?.aviones]);
  const cdfTransversal = useMemo(() => zona?.cdfTransversal || [], [zona?.cdfTransversal]);
  const capasConEspesor = estructura.filter((capa) => Number(capa.espesor_cm) > 0);
  const espesorTotal = capasConEspesor.reduce((sum, capa) => sum + Number(capa.espesor_cm), 0);

  const sections = useMemo(() => {
    const byName = new Map();
    aviones.forEach((avion) => {
      if (!byName.has(avion.section_name)) {
        byName.set(avion.section_name, {
          id: avion.section_name,
          label: avion.section_name,
          index: avion.section_index,
        });
      }
    });
    return Array.from(byName.values()).sort((a, b) => Number(a.index) - Number(b.index));
  }, [aviones]);

  const effectiveSection = sections.some((section) => section.id === activeSection)
    ? activeSection
    : sections[0]?.id || '';

  const heavyWheelsByAircraft = useMemo(() => {
    const byAircraft = new Map();
    (heavyCatalog?.ruedas || []).forEach((wheel) => {
      if (!byAircraft.has(wheel.aircraft_id)) byAircraft.set(wheel.aircraft_id, []);
      byAircraft.get(wheel.aircraft_id).push({
        x: { si: toFiniteNumber(wheel.x_mm, toFiniteNumber(wheel.x_m) * 1000) },
        y: { si: toFiniteNumber(wheel.y_mm, toFiniteNumber(wheel.y_m) * 1000) },
      });
    });
    return byAircraft;
  }, [heavyCatalog]);

  const heavyCdfBySectionAircraft = useMemo(() => {
    const byKey = new Map();
    (heavyCatalog?.cdfTransversal || []).forEach((point) => {
      const key = `${point.section_name}||${point.aircraft_id}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(point);
    });
    return byKey;
  }, [heavyCatalog]);

  const heavyCdfCurveBySectionAircraftWeightPoint = useMemo(() => {
    const byKey = new Map();
    (heavyCatalog?.cdfCurves || []).forEach((point) => {
      const key = [
        point.structure_name,
        getBaseAircraftName(point.aircraft_name),
        toFiniteNumber(point.weight_pct, 100),
        toFiniteNumber(point.point_index, 0),
      ].join('||');
      byKey.set(key, point);
    });
    return byKey;
  }, [heavyCatalog]);

  const getAircraftIds = useCallback((aircraft) => (
    Array.isArray(aircraft.aircraft_ids) && aircraft.aircraft_ids.length
      ? aircraft.aircraft_ids
      : [aircraft.aircraft_id]
  ), []);

  const getAircraftBaseAnnualDepartures = useCallback((aircraft) => {
    const catalogAircraft = heavyCatalog?.aeronaves?.find((item) => item.aircraft_id === aircraft.aircraft_id);
    return Math.max(1, toFiniteNumber(catalogAircraft?.annual_departures, 1));
  }, [heavyCatalog]);

  const getGroupedCdfPoints = useCallback((sectionId, aircraft) => getAircraftIds(aircraft).flatMap(
    (aircraftId) => {
      const basePoints = heavyCdfBySectionAircraft.get(`${sectionId}||${aircraftId}`) || [];
      if (!Number.isFinite(Number(aircraft.weight_pct))) return basePoints;
      return basePoints.map((point) => {
        const curveKey = [
          point.section_name,
          getBaseAircraftName(point.aircraft_name_unique),
          toFiniteNumber(aircraft.weight_pct, 100),
          toFiniteNumber(point.point_order, 0),
        ].join('||');
        const curvePoint = heavyCdfCurveBySectionAircraftWeightPoint.get(curveKey);
        return curvePoint ? {
          ...point,
          cdf_y: curvePoint.cdf,
          gross_weight_lb: curvePoint.gross_weight_lb,
          cdf_aircraft_max: curvePoint.cdf_aircraft_max,
        } : point;
      });
    },
  ), [getAircraftIds, heavyCdfBySectionAircraft, heavyCdfCurveBySectionAircraftWeightPoint]);

  const getGroupedWheels = useCallback((aircraft) => (
    Array.isArray(aircraft.selected_weight_wheels) && aircraft.selected_weight_wheels.length
      ? aircraft.selected_weight_wheels
      : getAircraftIds(aircraft).flatMap((aircraftId) => heavyWheelsByAircraft.get(aircraftId) || [])
  ), [getAircraftIds, heavyWheelsByAircraft]);

  const openVerificationModal = () => {
    setShowVerificationModal(true);
    if (heavyCatalog || heavyLoading) return;
    setHeavyLoading(true);
    setHeavyError('');
    getFaarfieldHeavyAeronaves()
      .then(setHeavyCatalog)
      .catch((error) => {
        console.error(error);
        setHeavyError('No se pudieron cargar las aeronaves FAARFIELD heavy.');
      })
      .finally(() => setHeavyLoading(false));
  };

  const handleVerificationSubmit = (selectedRows) => {
    const additions = [];
    selectedRows.forEach((aircraft) => {
      const baseAnnualDepartures = getAircraftBaseAnnualDepartures(aircraft);
      const scale = toFiniteNumber(aircraft.annual_departures) / baseAnnualDepartures;

      sections.forEach((section) => {
        const cdfPoints = getGroupedCdfPoints(section.id, aircraft);
        cdfPoints.forEach((point) => {
          additions.push({
            aircraft_id: aircraft.aircraft_group_id || aircraft.aircraft_id,
            section_name: section.id,
            x_m: toFiniteNumber(point.x_m),
            cdf: toFiniteNumber(point.cdf_y) * scale,
          });
        });
      });
    });

    onVerificarAeronave?.(selectedRows);
    onCdfVerificationChange?.(additions);
    setShowVerificationModal(false);
    if (selectedRows.length > 0) setActiveTab('cdf');
  };

  const addedAircraftRows = useMemo(() => {
    if (!verificationAircraft.length || !sections.length) return [];
    return sections.flatMap((section) => verificationAircraft.map((aircraft, index) => {
      const cdfPoints = getGroupedCdfPoints(section.id, aircraft);
      const baseAnnualDepartures = getAircraftBaseAnnualDepartures(aircraft);
      const maxCdf = cdfPoints.reduce((max, point) => {
        const scaled = (toFiniteNumber(point.cdf_y) / baseAnnualDepartures) * toFiniteNumber(aircraft.annual_departures);
        return Math.max(max, scaled);
      }, 0);

      return {
        ...aircraft,
        zona_nombre: zona?.nombre,
        section_index: section.index,
        section_name: section.id,
        aircraft_order: 9000 + index,
        aircraft_name: aircraft.name_unique || aircraft.aircraft_name,
        cdf_aircraft_max: maxCdf,
        wheel_coordinates_json: getGroupedWheels(aircraft),
        isVerificationAircraft: true,
      };
    }));
  }, [getAircraftBaseAnnualDepartures, getGroupedCdfPoints, getGroupedWheels, sections, verificationAircraft, zona?.nombre]);

  const displayAircraft = useMemo(
    () => [...aviones, ...addedAircraftRows],
    [aviones, addedAircraftRows]
  );

  const selectedAircraftWithVerification = useMemo(
    () => displayAircraft.filter((avion) => !effectiveSection || avion.section_name === effectiveSection),
    [displayAircraft, effectiveSection]
  );

  const selectedCdfTransversal = useMemo(() => {
    const basePoints = cdfTransversal.filter((point) => !effectiveSection || point.section_name === effectiveSection);
    if (!verificationAircraft.length || !heavyCatalog) return basePoints;

    const additionBySectionX = new Map();
    const addedPoints = [];

    verificationAircraft.forEach((aircraft, aircraftIndex) => {
      const baseAnnualDepartures = getAircraftBaseAnnualDepartures(aircraft);
      const scale = toFiniteNumber(aircraft.annual_departures) / baseAnnualDepartures;

      sections.forEach((section) => {
        if (effectiveSection && section.id !== effectiveSection) return;
        const cdfPoints = getGroupedCdfPoints(section.id, aircraft);
        cdfPoints.forEach((point) => {
          const scaledCdf = toFiniteNumber(point.cdf_y) * scale;
          const x = toFiniteNumber(point.x_m);
          const xKey = x.toFixed(3);
          const totalKey = `${section.id}||${xKey}`;
          additionBySectionX.set(totalKey, (additionBySectionX.get(totalKey) || 0) + scaledCdf);
          addedPoints.push({
            zona_nombre: zona?.nombre,
            section_index: section.index,
            section_name: section.id,
            analysed_life_years: point.analysed_life_years,
            series_type: 'aircraft',
            aircraft_order: 9000 + aircraftIndex,
            aircraft_name: aircraft.name_unique || aircraft.aircraft_name,
            cdf_raw_index: point.point_order,
            side: point.side,
            x_m: x,
            cdf_y: scaledCdf,
            isVerificationAircraft: true,
          });
        });
      });
    });

    const seenTotals = new Set();
    const adjustedBasePoints = basePoints.map((point) => {
      if (point.series_type !== 'section_total') return point;
      const x = toFiniteNumber(point.x_m);
      const totalKey = `${point.section_name}||${x.toFixed(3)}`;
      seenTotals.add(totalKey);
      return {
        ...point,
        cdf_y: toFiniteNumber(point.cdf_y) + (additionBySectionX.get(totalKey) || 0),
      };
    });

    const missingTotalPoints = Array.from(additionBySectionX.entries())
      .filter(([key]) => !seenTotals.has(key))
      .map(([key, cdf]) => {
        const [sectionName, xKey] = key.split('||');
        const section = sections.find((item) => item.id === sectionName);
        return {
          zona_nombre: zona?.nombre,
          section_index: section?.index,
          section_name: sectionName,
          series_type: 'section_total',
          aircraft_order: null,
          aircraft_name: 'Total',
          cdf_raw_index: null,
          side: null,
          x_m: Number(xKey),
          cdf_y: cdf,
        };
      });

    return [...adjustedBasePoints, ...addedPoints, ...missingTotalPoints];
  }, [cdfTransversal, effectiveSection, getAircraftBaseAnnualDepartures, getGroupedCdfPoints, heavyCatalog, sections, verificationAircraft, zona?.nombre]);

  const aircraftDuplicateCounts = useMemo(() => {
    const counts = new Map();
    selectedAircraftWithVerification.forEach((avion) => {
      counts.set(avion.aircraft_name, (counts.get(avion.aircraft_name) || 0) + 1);
    });
    return counts;
  }, [selectedAircraftWithVerification]);

  const aircraftRows = useMemo(
    () => selectedAircraftWithVerification.map((avion) => ({
      ...avion,
      aircraft_label: getAircraftLabel(avion, aircraftDuplicateCounts),
    })),
    [selectedAircraftWithVerification, aircraftDuplicateCounts]
  );

  const aircraftLabelByOrder = useMemo(() => {
    const labels = new Map();
    aircraftRows.forEach((avion) => {
      labels.set(Number(avion.aircraft_order), avion.aircraft_label);
    });
    return labels;
  }, [aircraftRows]);

  const analysedLifeYears = aircraftRows.find((avion) => Number.isFinite(Number(avion.analysed_life_years)))?.analysed_life_years
    ?? selectedCdfTransversal.find((point) => Number.isFinite(Number(point.analysed_life_years)))?.analysed_life_years;

  const treemapData = aircraftRows.map((avion) => ({
    ...avion,
    name: avion.aircraft_label,
    size: Number(avion.annual_departures) || 1,
  }));

  const cdfSeries = useMemo(() => {
    const names = [];
    selectedCdfTransversal.forEach((point) => {
      const name = point.series_type === 'section_total'
        ? 'Total'
        : aircraftLabelByOrder.get(Number(point.aircraft_order)) || point.aircraft_name;
      if (name && !names.includes(name)) names.push(name);
    });
    return names;
  }, [selectedCdfTransversal, aircraftLabelByOrder]);

  const cdfLineData = useMemo(() => {
    const byX = new Map();
    selectedCdfTransversal.forEach((point) => {
      const x = Number(point.x_m);
      const y = Number(point.cdf_y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      const key = x.toFixed(3);
      const serie = point.series_type === 'section_total'
        ? 'Total'
        : aircraftLabelByOrder.get(Number(point.aircraft_order)) || point.aircraft_name;
      if (!byX.has(key)) byX.set(key, { x_m: x });
      byX.get(key)[serie] = y;
    });
    return Array.from(byX.values()).sort((a, b) => a.x_m - b.x_m);
  }, [selectedCdfTransversal, aircraftLabelByOrder]);

  const cdfMaxByAircraft = useMemo(() => {
    const maxByAircraft = new Map();
    selectedCdfTransversal.forEach((point) => {
      if (point.series_type !== 'aircraft' || !point.aircraft_name) return;
      const value = Number(point.cdf_y);
      if (!Number.isFinite(value)) return;
      const label = aircraftLabelByOrder.get(Number(point.aircraft_order)) || point.aircraft_name;
      const current = maxByAircraft.get(label) || 0;
      if (value > current) maxByAircraft.set(label, value);
    });
    return maxByAircraft;
  }, [selectedCdfTransversal, aircraftLabelByOrder]);

  const radarData = aircraftRows.map((avion) => ({
    aeronave: avion.aircraft_label,
    cdf_aircraft_max: Number(avion.cdf_aircraft_max) || cdfMaxByAircraft.get(avion.aircraft_label) || 0,
  }));

  const wheelData = aircraftRows.flatMap((avion, aircraftIndex) => {
    const coords = Array.isArray(avion.wheel_coordinates_json) ? avion.wheel_coordinates_json : [];
    return coords.map((point, wheelIndex) => ({
      aeronave: avion.aircraft_label,
      rueda: wheelIndex + 1,
      x: (Number(point?.x?.si ?? point?.x ?? 0) || 0) / 1000,
      y: (Number(point?.y?.si ?? point?.y ?? 0) || 0) / 1000,
      fill: aircraftColors[aircraftIndex % aircraftColors.length],
    }));
  });
  const maxWheelX = Math.max(1, ...wheelData.map((point) => Math.abs(point.x)));
  const maxWheelY = Math.max(maxWheelX * 0.35, ...wheelData.map((point) => Math.abs(point.y)), 1);

  const detailTabs = [
    { id: 'estructura', label: 'Estructura' },
    { id: 'trafico', label: 'Trafico y ACR' },
    { id: 'cdf', label: 'CDF' },
    { id: 'ruedas', label: 'Ruedas' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          {/* <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{zona ? zona.nombre : 'Selecciona una zona del mapa para ver su estructura.'}</h2> */}
          {/* <h1 style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {zona ? zona.nombre : 'Selecciona una zona del mapa para ver su estructura.'}
          </h1> */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>PCR - Integridad estructural</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {zona ? zona.nombre : 'Selecciona una zona del mapa para ver su estructura.'}
          </p>
        </div>
        <button className="btn-primary" onClick={openVerificationModal} disabled={!zona}>
          Verificar aeronave
        </button>
      </div>

      {showVerificationModal && (
        <VerificarAeronaveModal
          key={heavyCatalog ? `heavy-${heavyCatalog.aeronaves?.length || 0}` : 'heavy-loading'}
          catalog={heavyCatalog}
          loading={heavyLoading}
          error={heavyError}
          initialSelection={verificationAircraft}
          sections={sections}
          zona={zona}
          onClose={() => setShowVerificationModal(false)}
          onSubmit={handleVerificationSubmit}
        />
      )}

      {zona && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="stat-card">
              <p className="stat-label">Area</p>
              <p className="stat-value">{formatNumber(zona.area, 0)} m2</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">PCR</p>
              <p className="stat-value">{zona.pcr || 'N/A'}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Años de vida</p>
              <p className="stat-value">{formatNumber(analysedLifeYears, 1)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Espesor total</p>
              <p className="stat-value">{formatNumber(espesorTotal)} cm</p>
            </div>
          </div>

          {sections.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    border: `1px solid ${effectiveSection === section.id ? '#38bdf8' : 'var(--glass-border)'}`,
                    background: effectiveSection === section.id ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.22)',
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    padding: '0.55rem 0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--glass-border)' }}>
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 0,
                  borderBottom: `2px solid ${activeTab === tab.id ? '#38bdf8' : 'transparent'}`,
                  background: 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '0.65rem 0.9rem',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'estructura' && (
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(320px, 1.2fr)', gap: '1rem', alignItems: 'stretch' }}>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Composicion estructural</h3>

                {estructura.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay capas cargadas para esta zona.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.18)' }}>
                    {estructura.map((capa) => {
                      const espesor = Number(capa.espesor_cm);
                      const height = espesor > 0
                        ? Math.max(34, (espesor / Math.max(espesorTotal, 1)) * 260)
                        : 30;

                      return (
                        <div
                          key={capa.zona_estructura_id}
                          style={{
                            minHeight: `${height}px`,
                            background: getLayerColor(capa.layer_role),
                            color: '#0f172a',
                            borderBottom: '1px solid rgba(15, 23, 42, 0.22)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            padding: '0.45rem 0.7rem',
                            fontWeight: 700
                          }}
                          title={`${capa.layer_role} | ${capa.faarfield_material}`}
                        >
                          <span>{capa.layer_role}</span>
                          <span>{espesor > 0 ? `${formatNumber(espesor)} cm` : 'Rasante'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Tabla de composicion</h3>
                <DataTable
                  columns={[
                    { key: 'material', label: 'Material', render: (capa) => <strong>{capa.faarfield_material || capa.layer_role}</strong> },
                    { key: 'rol', label: 'Rol', render: (capa) => capa.layer_role },
                    { key: 'espesor', label: 'Espesor', render: (capa) => `${formatNumber(capa.espesor_cm)} cm` },
                    { key: 'modulo', label: 'Modulo', render: (capa) => `${formatNumber(capa.modulus_mpa, 0)} MPa` },
                    { key: 'cbr', label: 'CBR', render: (capa) => formatNumber(capa.cbr_rasante) },
                  ]}
                  rows={estructura}
                  emptyText="No hay capas cargadas para esta zona."
                />
              </div>
            </section>
          )}

          {activeTab === 'trafico' && (
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1fr)', gap: '1rem' }}>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Salidas anuales por aeronave</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <Treemap data={treemapData} dataKey="size" nameKey="name" content={<TreemapContent />} isAnimationActive={false}>
                    <Tooltip content={<ChartTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Valores de trafico y ACR</h3>
                <DataTable
                  columns={[
                    { key: 'aircraft_label', label: 'Aeronave', render: (row) => <strong>{row.aircraft_label}</strong> },
                    { key: 'gross_weight_lb', label: 'Peso bruto lb', render: (row) => formatCompact(row.gross_weight_lb) },
                    { key: 'annual_departures', label: 'Salidas anuales', render: (row) => formatCompact(row.annual_departures) },
                    { key: 'annual_growth_pct', label: 'Crecimiento anual', render: (row) => `${formatNumber(row.annual_growth_pct, 1)}%` },
                    { key: 'total_departures', label: 'Salidas totales', render: (row) => formatCompact(row.total_departures) },
                    { key: 'acr_b', label: 'ACR B', render: (row) => formatNumber(row.acr_b, 1) },
                  ]}
                  rows={aircraftRows}
                  emptyText="No hay aeronaves cargadas para esta seccion."
                />
              </div>
            </section>
          )}

          {activeTab === 'cdf' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>CDF maximo por aeronave</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.18)" />
                    <PolarAngleAxis dataKey="aeronave" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickFormatter={formatScientific} domain={[0, 1]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Radar name="CDF maximo" dataKey="cdf_aircraft_max" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.28} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>CDF transversal por aeronave</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={cdfLineData} margin={{ top: 8, right: 24, bottom: 8, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.16)" />
                    <XAxis
                      type="number"
                      dataKey="x_m"
                      name="x"
                      unit=" m"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    />
                    <YAxis
                      name="CDF"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      tickFormatter={formatScientific}
                      domain={[0, 'dataMax']}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 11 }} />
                    {cdfSeries.map((serie, index) => (
                      <Line
                        key={serie}
                        type="monotone"
                        dataKey={serie}
                        name={serie}
                        dot={false}
                        connectNulls
                        stroke={serie === 'Total' ? totalColor : aircraftColors[index % aircraftColors.length]}
                        strokeWidth={serie === 'Total' ? 3 : 1.5}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {activeTab === 'ruedas' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Coordenadas de ruedas</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.16)" />
                    <XAxis type="number" dataKey="x" name="X" unit=" m" domain={[-maxWheelX, maxWheelX]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(value) => formatNumber(value, 2)} />
                    <YAxis type="number" dataKey="y" name="Y" unit=" m" domain={[-maxWheelY, maxWheelY]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(value) => formatNumber(value, 2)} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={0} stroke="#e2e8f0" strokeWidth={1.5} />
                    <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
                    <Scatter name="Ruedas" data={wheelData} fill="#38bdf8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={chartPanelStyle}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Dimensiones y presion de neumaticos</h3>
                <DataTable
                  columns={[
                    { key: 'aircraft_label', label: 'Aeronave', render: (row) => <strong>{row.aircraft_label}</strong> },
                    { key: 'tire_pressure_psi', label: 'Presion psi', render: (row) => formatNumber(row.tire_pressure_psi, 1) },
                    { key: 'tire_area_mm2', label: 'Area mm2', render: (row) => formatCompact(row.tire_area_mm2) },
                    { key: 'tire_length_mm', label: 'Largo mm', render: (row) => formatNumber(row.tire_length_mm, 1) },
                    { key: 'tire_width_mm', label: 'Ancho mm', render: (row) => formatNumber(row.tire_width_mm, 1) },
                  ]}
                  rows={aircraftRows}
                  emptyText="No hay datos de neumaticos cargados para esta seccion."
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default PanelZona;
