import React from 'react';

const materialColors = {
  superficie: '#64748b',
  'base estabilizada': '#f59e0b',
  'base granular': '#c084fc',
  'subbase granular': '#38bdf8',
  rasante: '#22c55e',
};

const formatNumber = (value, digits = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : 'N/A';
};

const getLayerColor = (layerRole = '') => {
  const role = layerRole.toLowerCase();
  return materialColors[role] || '#94a3b8';
};

const PanelZona = ({ zona, onNuevaMedicion }) => {
  const estructura = zona?.estructura || [];
  const capasConEspesor = estructura.filter((capa) => Number(capa.espesor_cm) > 0);
  const espesorTotal = capasConEspesor.reduce((sum, capa) => sum + Number(capa.espesor_cm), 0);

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Verificar ACR PCR</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {zona ? zona.nombre : 'Selecciona una zona del mapa para ver su estructura.'}
          </p>
        </div>
        <button className="btn-primary" onClick={onNuevaMedicion} disabled={!zona}>
          + Nueva Medicion
        </button>
      </div>

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
              <p className="stat-label">Espesor total</p>
              <p className="stat-value">{formatNumber(espesorTotal)} cm</p>
            </div>
          </div>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(320px, 1.2fr)', gap: '1rem', alignItems: 'stretch' }}>
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.24)' }}>
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

            <div style={{ border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.24)' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>Capas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {estructura.map((capa) => (
                  <div
                    key={capa.zona_estructura_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '12px minmax(120px, 1fr) 80px 95px 70px',
                      gap: '0.6rem',
                      alignItems: 'center',
                      color: 'var(--text-primary)',
                      fontSize: '0.86rem'
                    }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: getLayerColor(capa.layer_role) }} />
                    <strong>{capa.faarfield_material || capa.layer_role}</strong>
                    <span>{formatNumber(capa.espesor_cm)} cm</span>
                    <span>E {formatNumber(capa.modulus_mpa, 0)} MPa</span>
                    <span>CBR {formatNumber(capa.cbr_rasante)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PanelZona;
