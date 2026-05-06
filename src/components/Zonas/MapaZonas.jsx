import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getZonasGeojson } from '../../services/api';

const MapaZonas = ({ onSelectZona, refreshTrigger }) => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(Date.now());

  useEffect(() => {
    getZonasGeojson()
      .then((data) => {
        setGeoData(data);
        setMapKey(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshTrigger]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        onSelectZona(feature.properties.zona_id);
      },
    });
    
    const val = feature.properties.ultimo_valor;
    if (val !== null && val !== undefined) {
      layer.bindTooltip(`<div class="zona-map-label" style="color: ${getColorFromValue(val, feature.properties.zona_id)};"><b>${val}</b></div>`, {
        permanent: true,
        direction: 'center',
        className: 'transparent-tooltip'
      });
    }

    // Estilos hover
    layer.on('mouseover', function (e) {
      this.setStyle({
        fillOpacity: 0.8,
        weight: 3
      });
    });
    layer.on('mouseout', function (e) {
      this.setStyle({
        fillOpacity: 0.5,
        weight: 2
      });
    });
  };

  const getColorFromValue = (val, zonaId) => {
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
    
    if (max === min) return 'hsl(60, 100%, 50%)'; // Amarillo si todos tienen el mismo valor o hay solo uno
    
    const percent = (val - min) / (max - min);
    const hue = percent * 120; // 0=rojo, 120=verde
    return `hsl(${hue}, 100%, 50%)`;
  };

  const geojsonStyle = (feature) => {
    const color = getColorFromValue(feature.properties.ultimo_valor, feature.properties.zona_id);
    return {
      color: '#ffffff', // Borde blanco
      weight: 2,
      fillColor: color || '#808080',
      fillOpacity: 0.5,
      opacity: 1
    };
  };

  if (loading) return <div className="glass-panel" style={{height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Cargando mapa...</div>;

  return (
    <div style={{ height: '75vh', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <MapContainer center={[-34.55980196212431, -58.41318606154176]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />


        {geoData && (
          <GeoJSON 
            key={mapKey}
            data={geoData} 
            onEachFeature={onEachFeature} 
            style={geojsonStyle}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapaZonas;
