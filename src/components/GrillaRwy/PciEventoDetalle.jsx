import React from 'react';
import { createPortal } from 'react-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatNumber = (value, digits = 1) => (
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '0.0'
);

const toCurveData = (points = []) => points.map(([x, y]) => ({ x: Number(x), y: Number(y) }));

const CurveTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="pci-chart-tooltip">
      <strong>{formatNumber(label, 2)}%</strong>
      <span>{formatNumber(payload[0].value, 2)}</span>
    </div>
  );
};

const DefectCurveChart = ({ defecto }) => {
  const data = toCurveData(defecto.curve?.points);
  if (!data.length) return null;

  return (
    <article className="pci-chart-card">
      <div className="pci-chart-title">
        <strong>{defecto.defect}</strong>
        <span>{defecto.severity}</span>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 12, right: 18, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['dataMin', 'dataMax']} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['dataMin', 'dataMax']} />
          <Tooltip content={<CurveTooltip />} />
          <Line type="monotone" dataKey="y" stroke="#38bdf8" strokeWidth={2} dot={false} name="DV" />
          <ReferenceDot
            x={Number(defecto.density)}
            y={Number(defecto.deductValue)}
            r={5}
            fill="#f59e0b"
            stroke="#fff"
            ifOverflow="extendDomain"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="pci-chart-note">
        Densidad {formatNumber(defecto.density, 2)}% - DV {formatNumber(defecto.deductValue, 2)}
      </p>
    </article>
  );
};

const CorrectionCurveChart = ({ iteracion }) => {
  const curve = iteracion?.correctionCurve;
  if (!curve) return null;

  const exactData = toCurveData(curve.points);
  const lowerData = toCurveData(curve.lower?.points);
  const upperData = toCurveData(curve.upper?.points);
  const hasInterpolatedCurves = lowerData.length > 0 || upperData.length > 0;

  return (
    <article className="pci-chart-card pci-chart-card-wide">
      <div className="pci-chart-title">
        <strong>Valor deducido corregido</strong>
        <span>q = {iteracion.q}</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart margin={{ top: 12, right: 22, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            domain={['dataMin', 'dataMax']}
            allowDuplicatedCategory={false}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['dataMin', 'dataMax']} />
          <Tooltip content={<CurveTooltip />} />
          {exactData.length > 0 && (
            <Line data={exactData} type="monotone" dataKey="y" stroke="#22c55e" strokeWidth={2} dot={false} name={`Q${curve.q}`} />
          )}
          {hasInterpolatedCurves && (
            <>
              <Line data={lowerData} type="monotone" dataKey="y" stroke="#38bdf8" strokeWidth={2} dot={false} name={`Q${curve.lower?.q}`} />
              <Line data={upperData} type="monotone" dataKey="y" stroke="#a78bfa" strokeWidth={2} dot={false} name={`Q${curve.upper?.q}`} />
            </>
          )}
          <ReferenceDot
            x={Number(iteracion.total)}
            y={Number(iteracion.cdv)}
            r={6}
            fill="#f59e0b"
            stroke="#fff"
            ifOverflow="extendDomain"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="pci-chart-note">
        Total DV {formatNumber(iteracion.total, 2)} - CDV {formatNumber(iteracion.cdv, 2)}
      </p>
    </article>
  );
};

const PciEventoDetalle = ({ evento, onClose }) => {
  if (!evento) return null;

  const defectos = evento.defectos || [];
  const iteraciones = evento.iteraciones || [];
  const pci = evento.pci ?? evento.valor_interpolado;
  const maxIteration = iteraciones.reduce((best, current) => (
    !best || Number(current.cdv) > Number(best.cdv) ? current : best
  ), null);

  return createPortal(
    <div className="pci-modal-backdrop">
      <section className="glass-panel pci-shell" style={{ maxWidth: '980px' }}>
        <header className="pci-header">
          <div>
            <p className="pci-kicker">Detalle de medicion PCI</p>
            <h2>{evento.umuestra || `FID ${evento.grilla_fid}`}</h2>
            <p className="pci-subtitle">
              {evento.fecha ? new Date(evento.fecha).toLocaleString('es-ES') : 'Sin fecha'}
            </p>
          </div>
          <div className="pci-header-actions">
            <div className="pci-score">
              <span>PCI</span>
              <strong>{formatNumber(pci)}</strong>
            </div>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <aside className="pci-result">
          <div className="stat-card">
            <p className="stat-label">Area muestra</p>
            <p className="stat-value">{formatNumber(evento.sample_size ?? evento.area, 2)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total losas</p>
            <p className="stat-value">{formatNumber(evento.total_losas, 0)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Max CDV</p>
            <p className="stat-value">{formatNumber(evento.max_cdv)}</p>
          </div>
        </aside>

        <div className="pci-details">
          <h3 style={{ marginBottom: '0.9rem', fontSize: '1rem' }}>Defectos computados</h3>
          <table>
            <thead>
              <tr>
                <th>Defecto</th>
                <th>Grado</th>
                <th>Cantidad</th>
                <th>Densidad</th>
                <th>DV</th>
              </tr>
            </thead>
            <tbody>
              {defectos.map((defecto) => (
                <tr key={defecto.id}>
                  <td>{defecto.defect}</td>
                  <td>{defecto.severity}</td>
                  <td>{formatNumber(defecto.quantity, 2)}</td>
                  <td>{formatNumber(defecto.density, 2)}%</td>
                  <td>{formatNumber(defecto.deductValue, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {defectos.some((defecto) => defecto.curve?.points?.length) && (
          <div className="pci-details">
            <h3 style={{ marginBottom: '0.9rem', fontSize: '1rem' }}>Curvas utilizadas para DV</h3>
            <div className="pci-chart-grid">
              {defectos.map((defecto) => (
                <DefectCurveChart key={`${defecto.id}-curve`} defecto={defecto} />
              ))}
            </div>
          </div>
        )}

        <CorrectionCurveChart iteracion={maxIteration} />

        {iteraciones.length > 0 && (
          <details className="pci-details" open>
            <summary>Iteraciones CDV</summary>
            <table>
              <thead>
                <tr>
                  <th>Total DV</th>
                  <th>q</th>
                  <th>CDV</th>
                </tr>
              </thead>
              <tbody>
                {iteraciones.map((iteracion, index) => (
                  <tr key={`${iteracion.q}-${index}`}>
                    <td>{formatNumber(iteracion.total, 2)}</td>
                    <td>{iteracion.q}</td>
                    <td>{formatNumber(iteracion.cdv, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </section>
    </div>,
    document.body,
  );
};

export default PciEventoDetalle;
