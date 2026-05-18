const RAW_SABE_API_URL = import.meta.env.VITE_SABE_API_URL;

export const SABE_API_URL = (RAW_SABE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/i, '');
export const SABE_TIMETABLE = import.meta.env.VITE_SABE_TIMETABLE || 'live';

const ensureSabeApiUrl = () => {
  if (!SABE_API_URL) {
    throw new Error('Falta configurar VITE_SABE_API_URL');
  }
  return SABE_API_URL;
};

const requestSabe = async (path, options) => {
  const res = await fetch(`${ensureSabeApiUrl()}${path}`, options);
  if (!res.ok) {
    throw new Error(`Error en API SABE (${res.status})`);
  }
  return res.json();
};

export const getSabeBootstrap = (timetable = SABE_TIMETABLE) => (
  requestSabe(`/api/bootstrap?timetable=${encodeURIComponent(timetable)}`)
);

export const getSabeWindows = ({ timetable = SABE_TIMETABLE, unitId, durations = '15,30,60,120,180', step = 15 }) => {
  const params = new URLSearchParams({
    timetable,
    unit_id: unitId,
    durations,
    step: String(step),
  });
  return requestSabe(`/api/windows?${params}`);
};

export const getSabeScenario = ({ timetable = SABE_TIMETABLE, unitId, start, end, mode, signal }) => {
  const params = new URLSearchParams({
    timetable,
    unit_id: unitId,
    start,
    end,
    mode,
  });
  return requestSabe(`/api/scenario?${params}`, { signal });
};
