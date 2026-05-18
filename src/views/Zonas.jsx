import React, { useEffect, useState } from 'react';
import MapaZonas from '../components/Zonas/MapaZonasPCR';
import PanelZona from '../components/Zonas/PanelZonaPCR';
import { getZonaById } from '../services/api';

const Zonas = () => {
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zonaDetails, setZonaDetails] = useState(null);
  const [aircraftVerification, setAircraftVerification] = useState([]);
  const [cdfVerificationAdditions, setCdfVerificationAdditions] = useState([]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '75vh' }}>
        <MapaZonas
          onSelectZona={handleSelectZona}
          refreshTrigger={0}
          aircraftVerification={aircraftVerification}
          cdfVerificationAdditions={cdfVerificationAdditions}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PanelZona
          zona={zonaDetails}
          verificationAircraft={aircraftVerification}
          onVerificarAeronave={setAircraftVerification}
          onCdfVerificationChange={setCdfVerificationAdditions}
        />
      </div>
    </div>
  );
};

export default Zonas;
