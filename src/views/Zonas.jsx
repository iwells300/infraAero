import React, { useCallback, useState, useEffect } from 'react';
import MapaZonas from '../components/Zonas/MapaZonasPCR';
import PanelZona from '../components/Zonas/PanelZonaPCR';
import FormularioMedicion from '../components/Zonas/FormularioMedicion';
import { getZonaById } from '../services/api';

const Zonas = () => {
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zonaDetails, setZonaDetails] = useState(null);
  const [showFormulario, setShowFormulario] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchZonaDetails = useCallback(async (id) => {
    try {
      const data = await getZonaById(id);
      setZonaDetails(data);
    } catch (error) {
      console.error(error);
      setZonaDetails(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedZonaId) {
      return undefined;
    }

    let isActive = true;
    getZonaById(selectedZonaId)
      .then((data) => {
        if (isActive) setZonaDetails(data);
      })
      .catch((error) => {
        console.error(error);
        if (isActive) setZonaDetails(null);
      });

    return () => {
      isActive = false;
    };
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
    <div style={{ display: 'flex', flexDirection: 'column', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
      {/* Columna Izquierda: Mapa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem',height:'75vh' }}>
        
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
