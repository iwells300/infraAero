import React, { useState, useEffect } from 'react';
import MapaZonas from '../components/Zonas/MapaZonas';
import PanelZona from '../components/Zonas/PanelZona';
import FormularioMedicion from '../components/Zonas/FormularioMedicion';
import { getZonaById } from '../services/api';

const Zonas = () => {
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zonaDetails, setZonaDetails] = useState(null);
  const [showFormulario, setShowFormulario] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchZonaDetails = async (id) => {
    try {
      const data = await getZonaById(id);
      setZonaDetails(data);
    } catch (error) {
      console.error(error);
      setZonaDetails(null);
    }
  };

  useEffect(() => {
    if (selectedZonaId) {
      fetchZonaDetails(selectedZonaId);
    }
  }, [selectedZonaId]);

  const handleSelectZona = (id) => {
    setSelectedZonaId(id);
  };

  const handleSuccessForm = () => {
    setShowFormulario(false);
    setRefreshTrigger(prev => prev + 1); // Forzar recarga del mapa
    if (selectedZonaId) {
      fetchZonaDetails(selectedZonaId); // Refrescar detalles y gráfico
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '100%' }}>
      {/* Columna Izquierda: Mapa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--primary-color)' }}>📍</span> Mapa de Zonas Industriales
        </h2>
        <MapaZonas onSelectZona={handleSelectZona} refreshTrigger={refreshTrigger} />
      </div>

      {/* Columna Derecha: Panel de Detalles */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PanelZona 
          zona={zonaDetails} 
          onNuevaMedicion={() => setShowFormulario(true)} 
        />
      </div>

      {/* Modal Formulario */}
      {showFormulario && zonaDetails && (
        <FormularioMedicion 
          zona={zonaDetails} 
          onClose={() => setShowFormulario(false)}
          onSuccess={handleSuccessForm}
        />
      )}
    </div>
  );
};

export default Zonas;
