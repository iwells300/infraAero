//const API_URL = 'http://localhost:3001/api';
const API_URL = import.meta.env.VITE_API_URL;

export const getZonasGeojson = async () => {
  const res = await fetch(`${API_URL}/zonas/geojson`);
  if (!res.ok) throw new Error('Error al obtener GeoJSON');
  return res.json();
};

export const getZonaById = async (id) => {
  const res = await fetch(`${API_URL}/zonas/${id}`);
  if (!res.ok) throw new Error('Error al obtener detalles de la zona');
  return res.json();
};

export const getRegistrosByZona = async (zonaId) => {
  const res = await fetch(`${API_URL}/registros/${zonaId}`);
  if (!res.ok) throw new Error('Error al obtener el historial');
  return res.json();
};

export const createRegistro = async (data) => {
  const res = await fetch(`${API_URL}/registros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al guardar registro');
  }
  return res.json();
};
