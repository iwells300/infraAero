import React, { useState, useEffect, useMemo } from 'react';
import { createGrillaRwyEvento, getCurvas } from '../../services/api';

const FormularioMedicionGrilla = ({ grilla, onClose, onSuccess }) => {
  const [curvas, setCurvas] = useState([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    observaciones: '',
    dropdownSeleccion: 'Opcion A',
  });

  const [mediciones, setMediciones] = useState([]);
  const [currentMedicion, setCurrentMedicion] = useState({ valor: '', curvaId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCurvas()
      .then((data) => {
        setCurvas(data);
        if (data.length > 0) {
          setCurrentMedicion((prev) => ({ ...prev, curvaId: data[0].id.toString() }));
        }
      })
      .catch((err) => console.error('Error al obtener curvas:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCurrentMedicionChange = (e) => {
    setCurrentMedicion({ ...currentMedicion, [e.target.name]: e.target.value });
  };

  const calcularInterpolacion = (valorX, puntos) => {
    const sorted = [...puntos].sort((a, b) => a[0] - b[0]);
    if (valorX < sorted[0][0] || valorX > sorted[sorted.length - 1][0]) {
      throw new Error(`El valor ${valorX} esta fuera del rango (${sorted[0][0]} a ${sorted[sorted.length - 1][0]}).`);
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (valorX >= p1[0] && valorX <= p2[0]) {
        if (p2[0] === p1[0]) return Math.round(p1[1] * 100) / 100;
        const valorY = p1[1] + ((valorX - p1[0]) * (p2[1] - p1[1])) / (p2[0] - p1[0]);
        return Math.round(valorY * 100) / 100;
      }
    }
    throw new Error('No se pudo calcular la interpolacion');
  };

  const agregarMedicion = () => {
    setError(null);
    if (!currentMedicion.valor || !currentMedicion.curvaId) {
      setError('Debe ingresar un valor y seleccionar una curva.');
      return;
    }

    const curva = curvas.find((c) => c.id.toString() === currentMedicion.curvaId);
    if (!curva) return;

    try {
      const x = Number(currentMedicion.valor);
      const resultado = calcularInterpolacion(x, curva.puntos);

      setMediciones([
        ...mediciones,
        {
          id: Date.now(),
          valorOriginal: x,
          curvaNombre: curva.nombre,
          curvaId: curva.id,
          valorInterpolado: resultado,
        },
      ]);
      setCurrentMedicion({ ...currentMedicion, valor: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const quitarMedicion = (idToRemove) => {
    setMediciones(mediciones.filter((m) => m.id !== idToRemove));
  };

  const promedio = useMemo(() => {
    if (mediciones.length === 0) return null;
    const sum = mediciones.reduce((acc, m) => acc + m.valorInterpolado, 0);
    return Math.round((sum / mediciones.length) * 100) / 100;
  }, [mediciones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediciones.length === 0) {
      setError('Debe agregar al menos una medicion para calcular el promedio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createGrillaRwyEvento({
        grilla_fid: grilla.fid,
        umuestra: grilla.umuestra,
        sector: grilla.sector,
        seccion: grilla.seccion,
        area: grilla.area,
        ...formData,
        mediciones,
        valor_interpolado: promedio,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Nueva Medicion - {grilla.umuestra || grilla.fid}</h2>

        {error && <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fecha y Hora</label>
              <input type="datetime-local" name="fecha" value={formData.fecha} onChange={handleChange} required className="search-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tipo de Muestra</label>
              <select name="dropdownSeleccion" value={formData.dropdownSeleccion} onChange={handleChange} className="search-input" style={{ width: '100%' }}>
                <option value="Opcion A">Superficie</option>
                <option value="Opcion B">Profunda</option>
                <option value="Opcion C">Sintetica</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Interpolaciones</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valor (X)</label>
                <input type="number" step="any" name="valor" value={currentMedicion.valor} onChange={handleCurrentMedicionChange} className="search-input" style={{ width: '100%' }} placeholder="Ej: 15.5" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Defecto</label>
                <select name="curvaId" value={currentMedicion.curvaId} onChange={handleCurrentMedicionChange} className="search-input" style={{ width: '100%' }}>
                  {curvas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <button type="button" onClick={agregarMedicion} className="btn-secondary" style={{ padding: '0.6rem 1rem' }}>
                Agregar
              </button>
            </div>

            {mediciones.length > 0 && (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem' }}>Curva</th>
                    <th style={{ padding: '0.5rem' }}>Valor Ingresado</th>
                    <th style={{ padding: '0.5rem' }}>Resultado</th>
                    <th style={{ padding: '0.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {mediciones.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem' }}>{m.curvaNombre}</td>
                      <td style={{ padding: '0.5rem' }}>{m.valorOriginal}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{m.valorInterpolado}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <button type="button" onClick={() => quitarMedicion(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Quitar</button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ padding: '0.75rem 0.5rem' }}>Promedio Final:</td>
                    <td colSpan="2" style={{ padding: '0.75rem 0.5rem', color: 'var(--accent-color)', fontSize: '1.1rem' }}>
                      {promedio}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="search-input" style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
            <button type="button" onClick={handleSubmit} className="btn-primary" disabled={loading || mediciones.length === 0}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioMedicionGrilla;
