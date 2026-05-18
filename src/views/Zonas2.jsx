import React, { useState } from 'react';
import MapaGrillaRwy from '../components/GrillaRwy/MapaGrillaRwy';
import PanelGrillaRwy from '../components/GrillaRwy/PanelGrillaRwy';
import PciRigidoCalculator from '../components/GrillaRwy/PciRigidoCalculator';
import { getGrillaRwyEventoByFid } from '../services/api';

const Zonas2 = () => {
  const [selectedGrilla, setSelectedGrilla] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFormulario, setShowFormulario] = useState(false);

  const fetchDetalle = async (fid) => {
    try {
      const data = await getGrillaRwyEventoByFid(fid);
      setSelectedGrilla({
        ...data.grilla,
        ultimoEvento: data.ultimoEvento,
        ultimo_valor: data.ultimoEvento?.pci ?? data.ultimoEvento?.valor_interpolado ?? null,
        ultimo_evento_fecha: data.ultimoEvento?.fecha ?? null,
      });
      setEventos(data.eventos || []);
    } catch (error) {
      console.error(error);
      setSelectedGrilla(null);
      setEventos([]);
    }
  };

  const handleSelectGrilla = (featureProps) => {
    setSelectedGrilla(featureProps);
    setEventos([]);
    if (featureProps?.fid !== undefined && featureProps?.fid !== null) {
      fetchDetalle(featureProps.fid);
    }
  };

  const handleReload = () => {
    setRefreshTrigger((prev) => prev + 1);
    if (selectedGrilla?.fid !== undefined && selectedGrilla?.fid !== null) {
      fetchDetalle(selectedGrilla.fid);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: '55vh', display: 'flex', flexDirection: 'column' }}>
        <MapaGrillaRwy
          onSelectGrilla={handleSelectGrilla}
          refreshTrigger={refreshTrigger}
          enableDeviceLocation
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PanelGrillaRwy
          grilla={selectedGrilla}
          eventos={eventos}
          onReload={handleReload}
          onNuevaMedicion={() => setShowFormulario(true)}
        />
      </div>

      {showFormulario && selectedGrilla && (
        <PciRigidoCalculator
          grilla={selectedGrilla}
          onClose={() => setShowFormulario(false)}
          onSuccess={async () => {
            setShowFormulario(false);
            setRefreshTrigger((prev) => prev + 1);
            await fetchDetalle(selectedGrilla.fid);
          }}
        />
      )}
    </div>
  );
};

export default Zonas2;
