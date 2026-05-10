import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getGrillaRwyGeojson } from '../../services/api';

const pciColorFromValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'rgba(59, 130, 246, 0.8)';
  }

  const pci = Math.max(0, Math.min(100, Number(value)));
  if (!Number.isFinite(pci)) {
    return 'rgba(59, 130, 246, 0.8)';
  }

  if (pci <= 50) return 'hsl(0, 100%, 50%)';

  const hue = pci <= 75
    ? ((pci - 50) / 25) * 60
    : 60 + ((pci - 75) / 25) * 60;
  return `hsl(${hue}, 100%, 50%)`;
};

const MapaGrillaRwy = ({
  onSelectGrilla,
  refreshTrigger,
  styleResolver,
  tooltipResolver,
  styleKey = 'default',
}) => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(Date.now());

  useEffect(() => {
    setLoading(true);
    getGrillaRwyGeojson()
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

  const resolveStyle = (feature) => {
    if (styleResolver) {
      return styleResolver(feature, geoData);
    }

    const value = feature.properties?.ultimo_valor;
    return {
      color: '#ffffff',
      weight: 2,
      fillColor: pciColorFromValue(value),
      fillOpacity: 0.55,
      opacity: 1,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        onSelectGrilla?.(feature.properties);
      },
    });

    const tooltipContent = tooltipResolver?.(feature, geoData);
    if (tooltipContent) {
      layer.bindTooltip(tooltipContent, {
        permanent: true,
        direction: 'center',
        className: 'transparent-tooltip',
      });
    } else {
      const value = feature.properties?.ultimo_valor;
      if (value !== null && value !== undefined) {
        layer.bindTooltip(
          `<div class="zona-map-label" style="font-size:10px; color: ${pciColorFromValue(value)};"><b>${Number(value).toFixed(0)}</b></div>`,
          {
            permanent: true,
            direction: 'center',
            className: 'transparent-tooltip',
          }
        );
      }
    }

    layer.on('mouseover', function () {
      this.setStyle({
        fillOpacity: 0.82,
        weight: 3,
      });
    });

    layer.on('mouseout', function () {
      this.setStyle(resolveStyle(feature));
    });
  };

  const geoJsonKey = useMemo(() => `${mapKey}-${styleKey}`, [mapKey, styleKey]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando mapa...
      </div>
    );
  }

  return (
    <div style={{ height: '75vh', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <MapContainer center={[-34.55980196212431, -58.41318606154176]} zoom={15} maxZoom={22}  style={{ height: '100%', width: '100%' }}>
       
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png"
          maxZoom={22}       // El zoom visual máximo que permite esta capa
          maxNativeZoom={19} 
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, and the GIS User Community'
        />
        {geoData && (
          <GeoJSON
            key={geoJsonKey}
            data={geoData}
            onEachFeature={onEachFeature}
            style={resolveStyle}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapaGrillaRwy;
