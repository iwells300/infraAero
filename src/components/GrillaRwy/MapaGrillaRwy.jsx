import React, { useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
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

const DeviceLocationLayer = ({ location, follow }) => {
  const map = useMap();

  useEffect(() => {
    if (!location || !follow) return;
    map.setView([location.lat, location.lng], Math.max(map.getZoom(), 18), {
      animate: true,
    });
  }, [follow, location, map]);

  if (!location) return null;

  const center = [location.lat, location.lng];

  return (
    <>
      {Number.isFinite(location.accuracy) && (
        <Circle
          center={center}
          radius={location.accuracy}
          pathOptions={{
            color: '#38bdf8',
            fillColor: '#38bdf8',
            fillOpacity: 0.12,
            opacity: 0.42,
            weight: 1,
          }}
        />
      )}
      <CircleMarker
        center={center}
        radius={7}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#38bdf8',
          fillOpacity: 1,
          opacity: 1,
          weight: 2,
        }}
      >
        <Tooltip direction="top" offset={[0, -8]}>
          Ubicacion del dispositivo
        </Tooltip>
      </CircleMarker>
    </>
  );
};

const MapaGrillaRwy = ({
  onSelectGrilla,
  refreshTrigger,
  loadGeojson = getGrillaRwyGeojson,
  styleResolver,
  tooltipResolver,
  styleKey = 'default',
  enableDeviceLocation = false,
}) => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(Date.now());
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [deviceLocationError, setDeviceLocationError] = useState('');
  const [followDevice, setFollowDevice] = useState(false);

  useEffect(() => {
    if (!enableDeviceLocation) return undefined;

    if (!navigator.geolocation) {
      setDeviceLocationError('Ubicacion no disponible');
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDeviceLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setDeviceLocationError('');
      },
      (error) => {
        setDeviceLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Permiso de ubicacion denegado'
            : 'No se pudo obtener la ubicacion'
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableDeviceLocation]);

  useEffect(() => {
    setLoading(true);
    loadGeojson()
      .then((data) => {
        setGeoData(data);
        setMapKey(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshTrigger, loadGeojson]);

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
    <div style={{ height: '75vh', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
      {enableDeviceLocation && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.55rem',
            borderRadius: '0.5rem',
            fontSize: '0.78rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: deviceLocation ? '#38bdf8' : deviceLocationError ? '#f87171' : '#fbbf24',
              boxShadow: deviceLocation ? '0 0 0 4px rgba(56, 189, 248, 0.18)' : 'none',
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {deviceLocation ? `GPS ${Math.round(deviceLocation.accuracy || 0)} m` : deviceLocationError || 'Buscando GPS'}
          </span>
          <button
            type="button"
            className={followDevice ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFollowDevice((current) => !current)}
            disabled={!deviceLocation}
            title="Centrar ubicacion del dispositivo"
            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
          >
            Centrar
          </button>
        </div>
      )}
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
        {enableDeviceLocation && (
          <DeviceLocationLayer location={deviceLocation} follow={followDevice} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapaGrillaRwy;
