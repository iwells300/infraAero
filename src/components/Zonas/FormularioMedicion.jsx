import React, { useState } from 'react';
import { createRegistro } from '../../services/api';

const FormularioMedicion = ({ zona, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    valorPrincipal: '',
    observaciones: '',
    dropdownSeleccion: 'Opcion A'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createRegistro({
        zona_id: zona.id,
        ...formData,
        valorPrincipal: Number(formData.valorPrincipal)
      });
      onSuccess(); // Refrescar datos
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Nueva Medición - {zona.nombre}</h2>
        
        {error && <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fecha y Hora</label>
            <input type="datetime-local" name="fecha" value={formData.fecha} onChange={handleChange} required className="search-input" style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor de Medición (X)</label>
            <input type="number" step="any" name="valorPrincipal" value={formData.valorPrincipal} onChange={handleChange} required className="search-input" style={{ width: '100%' }} placeholder="Ej: 15.5" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="search-input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tipo de Muestra</label>
            <select name="dropdownSeleccion" value={formData.dropdownSeleccion} onChange={handleChange} className="search-input" style={{ width: '100%' }}>
              <option value="Opcion A">Superficie</option>
              <option value="Opcion B">Profunda</option>
              <option value="Opcion C">Sintética</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar y Calcular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioMedicion;
