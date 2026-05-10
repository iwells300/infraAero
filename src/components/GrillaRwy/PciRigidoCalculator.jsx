import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createGrillaRwyEvento, getCurvas } from '../../services/api';

const severityLabels = {
  Low: 'Bajo',
  Medium: 'Medio',
  High: 'Alto',
};

const unitOptions = [
  { value: 'slabs', label: 'Losas' },
  { value: 'm', label: 'Metros lineales' },
  { value: 'm2', label: 'Metros cuadrados' },
  { value: 'unit', label: 'Unidades' },
];

function normalizeCurves(rows) {
  return rows.map((row) => {
    const points = typeof row.puntos === 'string' ? JSON.parse(row.puntos) : row.puntos;

    return {
      id: Number(row.id),
      name: row.nombre,
      defect: row.defecto,
      severity: row.grado,
      points: points.map(([x, y]) => [Number(x), Number(y)]),
    };
  });
}

function interpolate(points, x) {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);

  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];

  for (let index = 1; index < sorted.length; index += 1) {
    const [x2, y2] = sorted[index];
    const [x1, y1] = sorted[index - 1];

    if (x <= x2) {
      const ratio = (x - x1) / (x2 - x1);
      return y1 + ratio * (y2 - y1);
    }
  }

  return 0;
}

function getCorrectionCurve(curves, q) {
  const correctionCurves = curves
    .filter((curve) => curve.defect === 'Corrected')
    .map((curve) => ({
      q: Number(curve.name.replace('Q', '')),
      points: curve.points,
    }))
    .sort((a, b) => a.q - b.q);

  const exact = correctionCurves.find((curve) => curve.q === q);
  if (exact) return exact;

  const lower = [...correctionCurves].reverse().find((curve) => curve.q < q);
  const upper = correctionCurves.find((curve) => curve.q > q);

  if (!lower) return upper;
  if (!upper) return lower;

  return { lower, upper, ratio: (q - lower.q) / (upper.q - lower.q) };
}

function getCorrectedDeductValue(curves, totalDeductValue, q) {
  const correction = getCorrectionCurve(curves, q);
  if (!correction) return totalDeductValue;

  if (correction.points) {
    return interpolate(correction.points, totalDeductValue);
  }

  const lowerValue = interpolate(correction.lower.points, totalDeductValue);
  const upperValue = interpolate(correction.upper.points, totalDeductValue);
  return lowerValue + correction.ratio * (upperValue - lowerValue);
}

function round2(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : value;
}

function serializePoints(points) {
  return points.map(([x, y]) => [round2(x), round2(y)]);
}

function serializeCorrectionCurve(curves, q) {
  const correction = getCorrectionCurve(curves, q);
  if (!correction) return null;

  if (correction.points) {
    return {
      type: 'exact',
      q: correction.q,
      points: serializePoints(correction.points),
    };
  }

  return {
    type: 'interpolated',
    q,
    ratio: round2(correction.ratio),
    lower: {
      q: correction.lower.q,
      points: serializePoints(correction.lower.points),
    },
    upper: {
      q: correction.upper.q,
      points: serializePoints(correction.upper.points),
    },
  };
}

function calculatePci(curves, rows) {
  const defects = rows
    .map((row) => {
      const quantity = Number(row.quantity);
      const base = 22;
      const density = base > 0 ? (quantity / base) * 100 : 0;
      const curve = curves.find(
        (item) => item.defect === row.defect && item.severity === row.severity,
      );

      return {
        ...row,
        quantity,
        density,
        deductValue: curve ? interpolate(curve.points, density) : 0,
      };
    })
    .filter((row) => row.defect && row.severity && row.quantity > 0);

  const deductValues = defects
    .map((row) => row.deductValue)
    .filter((value) => value > 0)
    .sort((a, b) => b - a);

  if (deductValues.length === 0) {
    return { pci: 100, maxCdv: 0, defects, iterations: [] };
  }

  const valuesAboveFive = deductValues.filter((value) => value > 5);

  if (valuesAboveFive.length <= 1) {
    const total = deductValues.reduce((sum, value) => sum + value, 0);
    return {
      pci: Math.max(0, 100 - total),
      maxCdv: total,
      defects,
      iterations: [{ values: deductValues, total, q: valuesAboveFive.length, cdv: total }],
    };
  }

  const highestDeductValue = deductValues[0];
  const maxAllowableDeducts = Math.min(10, 1 + (9 / 95) * (100 - highestDeductValue));
  const wholeDeducts = Math.floor(maxAllowableDeducts);
  const fractionalPart = maxAllowableDeducts - wholeDeducts;
  const adjustedValues = deductValues.slice(0, Math.ceil(maxAllowableDeducts));

  if (fractionalPart > 0 && adjustedValues.length > wholeDeducts) {
    adjustedValues[wholeDeducts] *= fractionalPart;
  }

  const iterations = [];
  let currentValues = adjustedValues;

  while (currentValues.filter((value) => value > 5).length >= 1) {
    const q = currentValues.filter((value) => value > 5).length;
    const total = currentValues.reduce((sum, value) => sum + value, 0);
    const cdv = q === 1 ? total : getCorrectedDeductValue(curves, total, q);
    iterations.push({ values: currentValues, total, q, cdv });

    if (q === 1) break;

    const nextValues = [...currentValues];
    const smallestAboveFiveIndex = nextValues.reduce((bestIndex, value, index) => {
      if (value <= 5) return bestIndex;
      if (bestIndex === -1 || value < nextValues[bestIndex]) return index;
      return bestIndex;
    }, -1);

    nextValues[smallestAboveFiveIndex] = 5;
    currentValues = nextValues.sort((a, b) => b - a);
  }

  const maxCdv = Math.max(...iterations.map((iteration) => iteration.cdv));

  return {
    pci: Math.max(0, Math.min(100, 100 - maxCdv)),
    maxCdv,
    defects,
    iterations,
    maxAllowableDeducts,
  };
}

function formatNumber(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

export default function PciRigidoCalculator({ grilla, onClose, onSuccess }) {
  const [curves, setCurves] = useState([]);
  const [loadingCurves, setLoadingCurves] = useState(true);
  const [curvesError, setCurvesError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const sampleSize = Number(grilla?.area) || 0;
  const defectNames = useMemo(
    () => [...new Set(curves.filter((curve) => curve.defect !== 'Corrected').map((curve) => curve.defect))].sort(),
    [curves],
  );
  const [rows, setRows] = useState([
    {
      id: crypto.randomUUID(),
      defect: '',
      severity: 'Low',
      quantity: '',
      unit: 'slabs',
    },
  ]);

  const result = useMemo(() => calculatePci(curves, rows), [curves, rows]);

  useEffect(() => {
    setLoadingCurves(true);
    getCurvas()
      .then((data) => {
        setCurves(normalizeCurves(data));
        setCurvesError(null);
      })
      .catch((error) => {
        console.error(error);
        setCurvesError('No se pudieron cargar las curvas desde la base de datos.');
      })
      .finally(() => {
        setLoadingCurves(false);
      });
  }, []);

  useEffect(() => {
    if (!defectNames.length) return;

    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        defect: row.defect || defectNames[0],
      })),
    );
  }, [defectNames]);

  function updateRow(id, field, value) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: crypto.randomUUID(),
        defect: defectNames[0] ?? '',
        severity: 'Low',
        quantity: '',
        unit: 'slabs',
      },
    ]);
  }

  function removeRow(id) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  }

  async function handleSave() {
    if (!result.defects.length) {
      setSaveError('Agrega al menos un defecto con cantidad para guardar la medicion.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const persistedDefects = result.defects.map((defect) => {
        const curve = curves.find(
          (item) => item.defect === defect.defect && item.severity === defect.severity,
        );

        return {
          ...defect,
          quantity: round2(defect.quantity),
          density: round2(defect.density),
          deductValue: round2(defect.deductValue),
          curve: curve
            ? {
                name: curve.name,
                defect: curve.defect,
                severity: curve.severity,
                points: serializePoints(curve.points),
              }
            : null,
        };
      });
      const persistedIterations = result.iterations.map((iteration) => ({
        ...iteration,
        values: iteration.values.map(round2),
        total: round2(iteration.total),
        cdv: round2(iteration.cdv),
        correctionCurve: serializeCorrectionCurve(curves, iteration.q),
      }));

      await createGrillaRwyEvento({
        grilla_fid: grilla.fid,
        umuestra: grilla.umuestra,
        sector: grilla.sector,
        seccion: grilla.seccion,
        area: grilla.area,
        fecha: new Date().toISOString(),
        mediciones: rows,
        pci: round2(result.pci),
        valor_interpolado: round2(result.pci),
        sample_size: round2(sampleSize),
        total_losas: 22,
        max_cdv: round2(result.maxCdv),
        max_allowable_deducts: result.maxAllowableDeducts ? round2(result.maxAllowableDeducts) : null,
        defectos: persistedDefects,
        iteraciones: persistedIterations,
        resultado: {
          pci: round2(result.pci),
          maxCdv: round2(result.maxCdv),
          maxAllowableDeducts: result.maxAllowableDeducts ? round2(result.maxAllowableDeducts) : null,
          defectCount: result.defects.length,
        },
      });

      onSuccess?.();
    } catch (error) {
      console.error(error);
      setSaveError(error.message || 'No se pudo guardar la medicion PCI.');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="pci-modal-backdrop">
      <section className="glass-panel pci-shell">
        <header className="pci-header">
          <div>
            <p className="pci-kicker">ASTM D5340-98 - Pavimento rigido</p>
            <h2>Nueva medicion PCI</h2>
            <p className="pci-subtitle">{grilla?.umuestra ? `Celda ${grilla.umuestra}` : 'Muestra seleccionada'}</p>
          </div>
          <div className="pci-header-actions">
            <div className="pci-score" aria-label={`PCI calculado ${formatNumber(result.pci)}`}>
              <span>PCI</span>
              <strong>{formatNumber(result.pci)}</strong>
            </div>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <div className="pci-sample">
          <label className="form-field pci-sample-field">
            <span>Tamano de muestra en m2</span>
            <input
              className="search-input"
              min="0"
              step="0.01"
              type="number"
              value={sampleSize}
              readOnly
            />
          </label>
         
        </div>

        {curvesError && (
          <div className="badge badge-danger" style={{ justifyContent: 'center', padding: '0.75rem 1rem' }}>
            {curvesError}
          </div>
        )}

        {saveError && (
          <div className="badge badge-danger" style={{ justifyContent: 'center', padding: '0.75rem 1rem' }}>
            {saveError}
          </div>
        )}

        <div className="pci-table" role="table" aria-label="Defectos relevados">
          <div className="pci-row pci-row-head" role="row">
            <span>Defecto</span>
            <span>Grado</span>
            <span>Cantidad</span>
            <span>Unidad</span>
            <span>Total Losas</span>
            <span>DV</span>
            <span />
          </div>

          {rows.map((row) => {
            const calculated = result.defects.find((defect) => defect.id === row.id);

            return (
              <div className="pci-row" role="row" key={row.id}>
                <select className="search-input" value={row.defect} onChange={(event) => updateRow(row.id, 'defect', event.target.value)} disabled={loadingCurves}>
                  {defectNames.map((defect) => (
                    <option key={defect} value={defect}>
                      {defect}
                    </option>
                  ))}
                </select>

                <select className="search-input" value={row.severity} onChange={(event) => updateRow(row.id, 'severity', event.target.value)}>
                  {Object.entries(severityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  className="search-input"
                  min="0"
                  step="0.01"
                  type="number"
                  value={row.quantity}
                  onChange={(event) => updateRow(row.id, 'quantity', event.target.value)}
                />

                <select className="search-input" value={row.unit} onChange={(event) => updateRow(row.id, 'unit', event.target.value)}>
                  {unitOptions.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>

                <output className="pci-output">22</output>

                <output className="pci-output">
                  {calculated
                    ? `${formatNumber(calculated.deductValue)} - ${formatNumber(calculated.density)}%`
                    : '0.0'}
                </output>

                <button type="button" className="pci-icon-button" onClick={() => removeRow(row.id)} aria-label="Quitar fila">
                  x
                </button>
              </div>
            );
          })}
        </div>

        <div className="pci-toolbar">
          <button type="button" className="btn-secondary" onClick={addRow}>
            Agregar defecto
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || loadingCurves || !result.defects.length}>
            {saving ? 'Guardando...' : 'Guardar medicion'}
          </button>
        </div>

        <aside className="pci-result">
          <div className="stat-card">
            <p className="stat-label">Valor deducido corregido maximo</p>
            <p className="stat-value">{formatNumber(result.maxCdv)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Defectos computados</p>
            <p className="stat-value">{result.defects.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">m permitido</p>
            <p className="stat-value">{result.maxAllowableDeducts ? formatNumber(result.maxAllowableDeducts, 2) : '--'}</p>
          </div>
        </aside>

        {result.iterations.length > 0 && (
          <details className="pci-details">
            <summary>Ver iteraciones CDV</summary>
            <table>
              <thead>
                <tr>
                  <th>Total DV</th>
                  <th>q</th>
                  <th>CDV</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations.map((iteration, index) => (
                  <tr key={`${iteration.q}-${index}`}>
                    <td>{formatNumber(iteration.total)}</td>
                    <td>{iteration.q}</td>
                    <td>{formatNumber(iteration.cdv)}</td>
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
}
