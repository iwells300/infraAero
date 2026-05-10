//const API_URL = 'http://localhost:3001/api';
const API_URL = import.meta.env.VITE_API_URL;

export const getZonasGeojson = async () => {
  const res = await fetch(`${API_URL}/zonas/geojson`);
  if (!res.ok) throw new Error('Error al obtener GeoJSON');
  return res.json();
};

export const getGrillaRwyGeojson = async () => {
  const res = await fetch(`${API_URL}/grilla-rwy/geojson`);
  if (!res.ok) throw new Error('Error al obtener GeoJSON de grilla RWY');
  return res.json();
};

export const getZonaById = async (id) => {
  const res = await fetch(`${API_URL}/zonas/${id}`);
  if (!res.ok) throw new Error('Error al obtener detalles de la zona');
  return res.json();
};

export const getGrillaRwyByFid = async (fid) => {
  const res = await fetch(`${API_URL}/grilla-rwy/${fid}`);
  if (!res.ok) throw new Error('Error al obtener detalles de la grilla RWY');
  return res.json();
};

export const getGrillaRwyEventoByFid = async (fid) => {
  const res = await fetch(`${API_URL}/grilla-rwy/eventos/${fid}`);
  if (!res.ok) throw new Error('Error al obtener el ultimo evento de la grilla RWY');
  return res.json();
};

export const getGrillaRwyEventoById = async (id) => {
  const res = await fetch(`${API_URL}/grilla-rwy/eventos/detalle/${id}`);
  if (!res.ok) throw new Error('Error al obtener el detalle del evento de grilla RWY');
  return res.json();
};

export const createGrillaRwyEvento = async (data) => {
  const res = await fetch(`${API_URL}/grilla-rwy/eventos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al guardar evento de grilla');
  }

  return res.json();
};

export const getZonas = async () => {
  const res = await fetch(`${API_URL}/zonas`);
  if (!res.ok) throw new Error('Error al obtener zonas');
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

export const getCurvas = async () => {
  const res = await fetch(`${API_URL}/curvas`);
  if (!res.ok) throw new Error('Error al obtener curvas');
  return res.json();
};

export const getMantenimientos = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/mantenimientos${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Error al obtener la agenda de mantenimiento');
  return res.json();
};

export const createMantenimiento = async (data) => {
  const res = await fetch(`${API_URL}/mantenimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al guardar mantenimiento');
  }

  return res.json();
};

export const updateEstadoMantenimiento = async (id, estado) => {
  const res = await fetch(`${API_URL}/mantenimientos/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al actualizar mantenimiento');
  }

  return res.json();
};
