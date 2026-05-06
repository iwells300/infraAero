import React from 'react';
import GraficoHistorial from './GraficoHistorial';

const PanelZona = ({ zona, onNuevaMedicion }) => {
  if (!zona) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Selecciona un polígono en el mapa para ver sus detalles.</p>
      </div>
    );
  }

  const ultimoRegistro = zona.registros && zona.registros.length > 0 ? zona.registros[0] : null;

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{zona.nombre}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>ID: {zona.id}</p>
          <p style={{ marginTop: '0.5rem' }}>{zona.descripcion}</p>
        </div>
        <button className="btn-primary" onClick={onNuevaMedicion}>
          + Nueva Medición
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <p className="stat-label">Área</p>
          <p className="stat-value">{zona.area || 'N/A'} m²</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pcr</p>
          <p className="stat-value">{zona.pcr || 'N/A'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Último Valor Interpolado</p>
          <p className="stat-value" style={{ color: 'var(--primary-color)' }}>
            {ultimoRegistro ? ultimoRegistro.valor_interpolado : 'Sin datos'}
          </p>
          {ultimoRegistro && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{new Date(ultimoRegistro.fecha).toLocaleString()}</p>}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Historial de Mediciones</h3>
        <GraficoHistorial zonaId={zona.id} key={zona.id + (ultimoRegistro?.id || '')} />
      </div>
    </div>
  );
};

export default PanelZona;
