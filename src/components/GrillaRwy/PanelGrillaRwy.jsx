import React, { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getGrillaRwyEventoById } from '../../services/api';
import PciEventoDetalle from './PciEventoDetalle';

const formatDate = (fecha) => (fecha ? new Date(fecha).toLocaleString('es-ES') : 'Sin fecha');
const formatShortDate = (date) => (date ? date.toLocaleDateString('es-ES') : 'Sin fecha');
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const PCI_THRESHOLDS = [
  { pci: 55, label: 'Pobre', color: '#f97316' },
  { pci: 40, label: 'Malo', color: '#ef4444' },
  { pci: 25, label: 'Muy malo', color: '#b91c1c' },
  { pci: 10, label: 'Fallado', color: '#7f1d1d' },
];

const round2 = (value) => Math.round(value * 100) / 100;

const ChartLabel = ({ viewBox, value, fill = '#94a3b8', position = 'insideLeft' }) => {
  if (!value) return null;
  const { x = 0, y = 0 } = viewBox || {};
  if (position === 'top') {
    return (
      <text
        x={x}
        y={y - 4}
        fill={fill}
        fontSize={9}
        fontWeight={600}
        textAnchor="middle"
        style={{ pointerEvents: 'none' }}
      >
        {value}
      </text>
    );
  }
  return (
    <text
      x={x + 4}
      y={y - 4}
      fill={fill}
      fontSize={9}
      fontWeight={600}
      textAnchor="start"
      style={{ pointerEvents: 'none' }}
    >
      {value}
    </text>
  );
};

const estimateCurveValue = (fit, year) => fit.pci0 - fit.c * year ** fit.b;

const fitPciCurve = (points) => {
  if (points.length < 2) return null;

  const normalizedPoints = points.map((point) => ({ ...point, year: Math.max(0, point.year) }));
  let bestFit = null;

  for (let b = 0.2; b <= 5; b += 0.02) {
    const xValues = normalizedPoints.map((point) => point.year ** b);
    const xMean = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
    const yMean = normalizedPoints.reduce((sum, point) => sum + point.pci, 0) / normalizedPoints.length;
    const denominator = xValues.reduce((sum, value) => sum + (value - xMean) ** 2, 0);

    if (denominator === 0) continue;

    const slope = xValues.reduce((sum, value, index) => (
      sum + (value - xMean) * (normalizedPoints[index].pci - yMean)
    ), 0) / denominator;
    const pci0 = yMean - slope * xMean;
    const c = -slope;

    if (!Number.isFinite(pci0) || !Number.isFinite(c) || c <= 0) continue;

    const sse = normalizedPoints.reduce((sum, point) => {
      const predicted = estimateCurveValue({ pci0, c, b }, point.year);
      return sum + (point.pci - predicted) ** 2;
    }, 0);

    if (!bestFit || sse < bestFit.sse) {
      bestFit = { pci0, c, b, sse };
    }
  }

  return bestFit;
};

const estimateThresholdYear = (fit, pci) => {
  if (!fit || fit.c <= 0 || fit.pci0 <= pci) return null;
  const year = ((fit.pci0 - pci) / fit.c) ** (1 / fit.b);
  return Number.isFinite(year) && year >= 0 ? year : null;
};

const PanelGrillaRwy = ({ grilla, eventos = [], onReload, onNuevaMedicion }) => {
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const measurementPoints = [...eventos]
    .reverse()
    .map((evento) => ({
      id: evento.id,
      date: evento.fecha ? new Date(evento.fecha) : null,
      fecha: evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES') : 'Sin fecha',
      pci: Number(evento.pci),
    }))
    .filter((evento) => Number.isFinite(evento.pci) && evento.date && !Number.isNaN(evento.date.getTime()));

  const firstDate = measurementPoints[0]?.date ?? null;
  const chartPoints = measurementPoints.map((point) => ({
    ...point,
    year: round2((point.date - firstDate) / MS_PER_YEAR),
  }));
  const fit = fitPciCurve(chartPoints);
  const thresholdMarks = fit
    ? PCI_THRESHOLDS.map((threshold) => ({
      ...threshold,
      year: estimateThresholdYear(fit, threshold.pci),
    }))
      .filter((threshold) => threshold.year !== null)
      .map((threshold) => {
        const date = new Date(firstDate.getTime() + threshold.year * MS_PER_YEAR);
        return {
          ...threshold,
          date,
          time: date.getTime(),
          fecha: formatShortDate(date),
        };
      })
    : [];
  const maxMeasurementYear = Math.max(0, ...chartPoints.map((point) => point.year));
  const maxThresholdYear = Math.max(0, ...thresholdMarks.map((threshold) => threshold.year));
  const maxChartYear = Math.max(1, Math.ceil(Math.max(maxMeasurementYear, maxThresholdYear) + 1));
  const minChartTime = firstDate?.getTime() ?? Date.now();
  const maxChartTime = minChartTime + maxChartYear * MS_PER_YEAR;
  const curveData = fit
    ? Array.from({ length: 80 }, (_, index) => {
      const year = (maxChartYear * index) / 79;
      const date = new Date(minChartTime + year * MS_PER_YEAR);
      return {
        year: round2(year),
        time: date.getTime(),
        fecha: formatShortDate(date),
        tipo: 'Ajuste PCI',
        ajuste: round2(Math.max(0, Math.min(100, estimateCurveValue(fit, year)))),
      };
    })
    : [];
  const chartData = [
    ...curveData,
    ...chartPoints.map((point) => ({
      year: point.year,
      time: point.date.getTime(),
      pci: point.pci,
      fecha: point.fecha,
      tipo: 'PCI medido',
    })),
  ].sort((a, b) => a.time - b.time);

  const handleVerDetalle = async (id) => {
    setLoadingDetalle(true);
    try {
      const data = await getGrillaRwyEventoById(id);
      setDetalle(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>PCI - Grilla RWY</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Selecciona una celda en el mapa para ver su evolución o calcular un nuevo PCI.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap:'wrap', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onReload}>
            Recargar mapa
          </button>
          <button className="btn-primary" onClick={onNuevaMedicion} disabled={!grilla}>
            Nueva medicion
          </button>
        </div>
      </div>

      {!grilla ? (
        <div style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>
          
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            
            <div className="stat-card">
              <p className="stat-label">Unidad de muestra</p>
              <p className="stat-value">{grilla.umuestra ?? 'N/A'}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Sector</p>
              <p className="stat-value">{grilla.sector ?? 'N/A'}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Sección</p>
              <p className="stat-value">{grilla.seccion ?? 'N/A'}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Area</p>
              {/* <p className="stat-value">{grilla.area ?? 'N/A'} m2</p> */}
              <p className="stat-value">
  {typeof grilla.area === 'number' 
    ? grilla.area.toFixed(2) 
    : 'N/A'} m2
</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Ultimo PCI</p>
              {/* <p className="stat-value">{grilla.ultimo_valor.toFixed(2) ?? 'Sin datos'}</p> */}
              <p className="stat-value">
  {typeof grilla.ultimo_valor === 'number' 
    ? grilla.ultimo_valor.toFixed(2) 
    : 'Sin datos'} 
</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row',justifyContent:'space-between', gap: '0.75rem' }}>
           
            <h3 style={{ fontSize: '1rem' }}>Historial de mediciones PCI</h3>

            <h3 style={{ fontSize: '1rem' }}>Evolución PCI</h3>

          
             </div>
            {eventos.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No hay mediciones PCI para esta unidad.</div>
            ) : (
              <div className="pci-history-layout">
                <div className="pci-history-table">
                  <div className="pci-history-row pci-history-head">
                    <span>Fecha</span>
                    <span>PCI</span>
                    <span />
                  </div>
                  {eventos.map((evento) => (
                    <div className="pci-history-row" key={evento.id}>
                      <span>{formatDate(evento.fecha)}</span>
                      <strong>{Number(evento.pci).toFixed(2)}</strong>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => handleVerDetalle(evento.id)}
                        disabled={loadingDetalle}
                      >
                        Ver detalle
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                <div className="pci-history-chart" style={{ minWidth: 0, overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 14, right: 50, bottom: 24, left: 0 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[minChartTime, maxChartTime]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(value) => formatShortDate(new Date(value))}
                        tickCount={5}
                        angle={-30}
                        textAnchor="end"
                        height={44}
                      />
                      <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        formatter={(value, name, item) => [
                          `${Number(value).toFixed(2)} | ${item.payload?.fecha || 'Sin fecha'}`,
                          name === 'ajuste' ? 'Ajuste PCI' : 'PCI medido',
                        ]}
                        labelFormatter={(value) => `Fecha: ${formatShortDate(new Date(value))}`}
                      />
                      {thresholdMarks.map((threshold) => (
                        <ReferenceLine
                          key={`y-${threshold.pci}`}
                          y={threshold.pci}
                          stroke={threshold.color}
                          strokeDasharray="4 4"
                          label={(props) => (
                            <ChartLabel
                              {...props}
                              value={`${threshold.label} ${threshold.pci}`}
                              fill={threshold.color}
                            />
                          )}
                        />
                      ))}
                      {thresholdMarks.map((threshold) => (
                        <ReferenceLine
                          key={`x-${threshold.pci}`}
                          x={threshold.time}
                          stroke={threshold.color}
                          strokeDasharray="2 4"
                          label={(props) => (
                            <ChartLabel
                              {...props}
                              value={threshold.fecha}
                              fill={threshold.color}
                              position="top"
                            />
                          )}
                        />
                      ))}
                      {fit && (
                        <Line
                          type="monotone"
                          dataKey="ajuste"
                          stroke="#fbbf24"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                      )}
                      <Line type="monotone" dataKey="pci" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                      {thresholdMarks.map((threshold) => (
                        <ReferenceDot
                          key={`dot-${threshold.pci}`}
                          x={threshold.time}
                          y={threshold.pci}
                          r={4}
                          fill={threshold.color}
                          stroke="#f8fafc"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  {fit && (
                    <p className="pci-chart-note" style={{ marginTop: '0.5rem' }}>
                      PCI(t) = {round2(fit.pci0)} - {round2(fit.c)} * t^{round2(fit.b)}
                    </p>
                  )}
                </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {detalle && (
        <PciEventoDetalle
          evento={detalle}
          onClose={() => setDetalle(null)}
        />
      )}
    </div>
  );
};

export default PanelGrillaRwy;
