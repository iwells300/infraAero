import React, { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCdfBuffersGeojson, getGrillaRwyGeojson, getZonasGeojson } from '../../services/api';

const getNumericPcr = (props = {}) => {
  const explicit = Number(props.valorpcr);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const match = String(props.pcr || '').match(/\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

const MapaZonas = ({ onSelectZona, refreshTrigger, aircraftVerification = [], cdfVerificationAdditions = [] }) => {
  const [geoData, setGeoData] = useState(null);
  const [cdfData, setCdfData] = useState(null);
  const [pciData, setPciData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(Date.now());
  const [cdfKey, setCdfKey] = useState(Date.now());
  const [pciKey, setPciKey] = useState(Date.now());

  useEffect(() => {
    Promise.all([getZonasGeojson(), getCdfBuffersGeojson(), getGrillaRwyGeojson()])
      .then(([zonasData, buffersData, grillaData]) => {
        setGeoData(zonasData);
        setCdfData(buffersData);
        setPciData(grillaData);
        setMapKey(Date.now());
        setCdfKey(Date.now());
        setPciKey(Date.now());
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshTrigger]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        onSelectZona(feature.properties.zona_id);
      },
    });
    
    const val = feature.properties.zona_id;
    if (val !== null && val !== undefined) {
      layer.bindTooltip(`<div class="zona-map-label" style="font-size:10px; color: #ffffff;"><b>${val}</b></div>`, {
        permanent: true,
        direction: 'center',
        className: 'transparent-tooltip'
      });
    }

    // Estilos hover
    layer.on('mouseover', function () {
      this.setStyle({
        fillOpacity: 0.8,
        weight: 3
      });
    });
    layer.on('mouseout', function () {
      this.setStyle({
        fillOpacity: 0.5,
        weight: 2
      });
    });
  };

  const getColorFromValue = (val) => {
    if (val === null || val === undefined) return 'rgba(59, 130, 246, 0.8)'; // Bright blue default
    
    // Calculamos el color dinámicamente. 
    // Para no iterar en cada feature sobre toda la colección, pasamos la colección global.
    let max = -Infinity;
    let min = Infinity;
    geoData.features.forEach(f => {
      const v = f.properties.ultimo_valor;
      if (v !== null && v !== undefined) {
        if (v > max) max = v;
        if (v < min) min = v;
      }
    });
    
    if (max === min) return 'rgba(59, 130, 246, 0.8)';
    
    const percent = (val - min) / (max - min);
    const hue = percent * 120; // 0=rojo, 120=verde
    return `hsl(${hue}, 100%, 50%)`;
  };

  const getCdfColor = (value) => {
    const cdf = Number(value);
    if (!Number.isFinite(cdf)) return 'rgba(148, 163, 184, 0.5)';
    const clamped = Math.max(0, Math.min(1, cdf));
    const hue = (1 - clamped) * 120;
    return `hsl(${hue}, 95%, 48%)`;
  };

  const getPciColor = (value) => {
    if (value === null || value === undefined || value === '') return 'rgba(59, 130, 246, 0.72)';
    const pci = Math.max(0, Math.min(100, Number(value)));
    if (!Number.isFinite(pci)) return 'rgba(59, 130, 246, 0.72)';
    if (pci <= 50) return 'hsl(0, 100%, 50%)';
    const hue = pci <= 75
      ? ((pci - 50) / 25) * 60
      : 60 + ((pci - 75) / 25) * 60;
    return `hsl(${hue}, 100%, 50%)`;
  };

  const maxVerificationAcr = aircraftVerification.reduce((max, aircraft) => {
    const acr = Number(aircraft.acr_b);
    return Number.isFinite(acr) ? Math.max(max, acr) : max;
  }, 0);

  const cdfAdditionsBySectionX = useMemo(() => {
    const maxByAircraft = new Map();
    const additions = new Map();
    cdfVerificationAdditions.forEach((point) => {
      const x = Number(point.x_m);
      const cdf = Number(point.cdf);
      if (!point.section_name || !Number.isFinite(x) || !Number.isFinite(cdf)) return;
      const aircraftKey = `${point.section_name}||${Math.abs(x).toFixed(3)}||${point.aircraft_id || 'aircraft'}`;
      maxByAircraft.set(aircraftKey, Math.max(maxByAircraft.get(aircraftKey) || 0, cdf));
    });

    maxByAircraft.forEach((cdf, aircraftKey) => {
      const [sectionName, xKey] = aircraftKey.split('||');
      const key = `${sectionName}||${xKey}`;
      additions.set(key, (additions.get(key) || 0) + cdf);
    });

    return additions;
  }, [cdfVerificationAdditions]);

  const getVerificationColor = (props) => {
    if (!maxVerificationAcr) return null;
    const pcr = getNumericPcr(props);
    if (!pcr) return 'rgba(148, 163, 184, 0.62)';
    if (maxVerificationAcr < pcr) return '#22c55e';
    if (maxVerificationAcr <= pcr * 1.1) return '#facc15';
    return '#ef4444';
  };

  const geojsonStyle = (feature) => {
    const verificationColor = getVerificationColor(feature.properties);
    const color = getColorFromValue(feature.properties.ultimo_valor);
    return {
      color: '#ffffff', // Borde blanco
      weight: 2,
      fillColor: verificationColor || color || '#808080',
      fillOpacity: verificationColor ? 0.68 : 0.5,
      opacity: 1
    };
  };

  const getAdjustedCdf = (props = {}) => {
    const x = Number(props.x_m ?? props.distance_m);
    const key = `${props.section_name}||${Math.abs(x).toFixed(3)}`;
    return (Number(props.cdf) || 0) + (cdfAdditionsBySectionX.get(key) || 0);
  };

  const cdfStyle = (feature) => ({
    color: getCdfColor(getAdjustedCdf(feature.properties)),
    weight: 1,
    fillColor: getCdfColor(getAdjustedCdf(feature.properties)),
    fillOpacity: 0.36,
    opacity: 0.65,
  });

  const pciStyle = (feature) => ({
    color: '#ffffff',
    weight: 1,
    fillColor: getPciColor(feature.properties?.ultimo_valor),
    fillOpacity: 0.45,
    opacity: 0.85,
  });

  const onEachCdfFeature = (feature, layer) => {
    const props = feature.properties || {};
    layer.on({
      click: () => {
        if (props.zona_id) onSelectZona(props.zona_id);
      },
      mouseover() {
        this.setStyle({ fillOpacity: 0.52, weight: 2 });
      },
      mouseout() {
        this.setStyle({ fillOpacity: 0.36, weight: 1 });
      },
    });
  };

  const onEachPciFeature = (feature, layer) => {
    layer.on({
      mouseover() {
        this.setStyle({ fillOpacity: 0.68, weight: 2 });
      },
      mouseout() {
        this.setStyle(pciStyle(feature));
      },
    });
  };

  if (loading) return <div className="glass-panel" style={{height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Cargando mapa...</div>;

  return (
    <div style={{ height: '75vh', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <MapContainer center={[-34.55980196212431, -58.41318606154176]} zoom={15} maxZoom={20} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Mapa claro">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
              maxNativeZoom={18}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Imagen satelital">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png"
              maxZoom={20}
              maxNativeZoom={19}
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>

          {geoData && (
            <LayersControl.Overlay checked name="Secciones PCR">
              <GeoJSON
                key={mapKey}
                data={geoData}
                onEachFeature={onEachFeature}
                style={geojsonStyle}
              />
            </LayersControl.Overlay>
          )}

          {cdfData && (
            <LayersControl.Overlay name="CDF total por anillo">
              <GeoJSON
                key={cdfKey}
                data={cdfData}
                onEachFeature={onEachCdfFeature}
                style={cdfStyle}
              />
            </LayersControl.Overlay>
          )}

          {pciData && (
            <LayersControl.Overlay name="PCI grilla RWY">
              <GeoJSON
                key={pciKey}
                data={pciData}
                onEachFeature={onEachPciFeature}
                style={pciStyle}
              />
            </LayersControl.Overlay>
          )}
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default MapaZonas;
