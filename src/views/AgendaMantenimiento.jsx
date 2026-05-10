import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  MapPin,
  Plus,
  ScanSearch
} from 'lucide-react';
import MapaGrillaRwy from '../components/GrillaRwy/MapaGrillaRwy';
import Modal from '../components/UI/Modal';
import {
  createMantenimiento,
  getGrillaRwyByFid,
  getGrillaRwyGeojson,
  getMantenimientos,
  updateEstadoMantenimiento
} from '../services/api';

const PRIORITY_META = {
  baja: { label: 'Baja', color: '#14b8a6', badge: 'badge-info', rank: 1 },
  media: { label: 'Media', color: '#f59e0b', badge: 'badge-warning', rank: 2 },
  alta: { label: 'Alta', color: '#f97316', badge: 'badge-danger', rank: 3 },
  critica: { label: 'Critica', color: '#ef4444', badge: 'badge-danger', rank: 4 }
};

const STATUS_OPTIONS = {
  programado: 'Programado',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado'
};

const VIEW_MODES = {
  all: { label: 'Toda la grilla' },
  sector: { label: 'Sector seleccionado' }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const fromKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toKey = (date) => date.toISOString().slice(0, 10);

const formatDate = (key) => {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
};

const monthTitle = (date) => {
  const formatted = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return formatted.replace(/ de /g, ' ');
};

const isWithinRange = (dateKey, startKey, endKey) => dateKey >= startKey && dateKey <= endKey;

const maintenanceStartKey = (item) => (item.fecha ? toKey(new Date(item.fecha)) : null);
const maintenanceEndKey = (item) => (item.fecha_fin ? toKey(new Date(item.fecha_fin)) : maintenanceStartKey(item));

const activeOnDate = (item, dateKey) => {
  const startKey = maintenanceStartKey(item);
  const endKey = maintenanceEndKey(item);
  if (!startKey || !endKey) return false;
  return isWithinRange(dateKey, startKey, endKey);
};

const overlapsVisibleRange = (item, rangeStartKey, rangeEndKey) => {
  const startKey = maintenanceStartKey(item);
  const endKey = maintenanceEndKey(item);
  if (!startKey || !endKey) return false;
  return !(endKey < rangeStartKey || startKey > rangeEndKey);
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);

    return {
      date: day,
      key: toKey(day),
      isCurrentMonth: day.getMonth() === month
    };
  });
};

const pickPriority = (items) => {
  let best = 'baja';
  let rank = 0;

  items.forEach((item) => {
    const currentRank = PRIORITY_META[item.prioridad]?.rank || 0;
    if (currentRank > rank) {
      best = item.prioridad;
      rank = currentRank;
    }
  });

  return best;
};

const grillaLabel = (item) => {
  const parts = [item.sector, item.seccion !== '---' ? item.seccion : null, item.umuestra !== '---' ? item.umuestra : null]
    .filter(Boolean);
  return parts.join(' - ') || item.nombre || item.id;
};

const assignLanes = (items) => {
  const sorted = [...items].sort((a, b) => {
    if (a.startKey === b.startKey) return a.endKey.localeCompare(b.endKey);
    return a.startKey.localeCompare(b.startKey);
  });

  const laneEnds = [];

  return sorted.map((item) => {
    let laneIndex = laneEnds.findIndex((endKey) => item.startKey > endKey);
    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(item.endKey);
    } else {
      laneEnds[laneIndex] = item.endKey;
    }

    return { ...item, laneIndex };
  });
};

const getEdgeIndex = (calendarDays, key, fallback, rangeStartKey, rangeEndKey) => {
  const exact = calendarDays.findIndex((day) => day.key === key);
  if (exact !== -1) return exact;
  if (key < rangeStartKey) return 0;
  if (key > rangeEndKey) return calendarDays.length - 1;
  return fallback;
};

const AgendaMantenimiento = () => {
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zonaDetails, setZonaDetails] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [visibleMonth, setVisibleMonth] = useState(fromKey(todayKey()));
  const [mantenimientos, setMantenimientos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fecha_inicio: todayKey(),
    fecha_fin: todayKey(),
    hora_inicio: '08:00',
    hora_fin: '10:00',
    tarea: '',
    prioridad: 'media'
  });

  const loadAgenda = async () => {
    setLoading(true);
    setError('');

    try {
      const [mantenimientosData, zonasData] = await Promise.all([
        getMantenimientos(),
        getGrillaRwyGeojson()
      ]);

      setMantenimientos(
        mantenimientosData.map((item) => ({
          ...item,
          startKey: maintenanceStartKey(item),
          endKey: maintenanceEndKey(item)
        }))
      );

      setZonas(
        zonasData.features.map((feature) => ({
          id: String(feature.properties.fid),
          nombre: grillaLabel(feature.properties),
          ...feature.properties
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  useEffect(() => {
    if (!selectedZonaId) {
      setZonaDetails(null);
      return;
    }

    getGrillaRwyByFid(selectedZonaId)
      .then(setZonaDetails)
      .catch(() => setZonaDetails(null));
  }, [selectedZonaId]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const calendarStartKey = calendarDays[0]?.key || selectedDate;
  const calendarEndKey = calendarDays[calendarDays.length - 1]?.key || selectedDate;

  const zoneRecords = useMemo(() => {
    if (viewMode === 'sector') {
      if (!selectedZonaId) return [];
      return mantenimientos.filter((item) => item.zona_id === selectedZonaId);
    }

    return mantenimientos;
  }, [mantenimientos, selectedZonaId, viewMode]);

  const visibleZones = useMemo(() => {
    if (viewMode === 'sector') {
      return selectedZonaId ? zonas.filter((zona) => zona.id === selectedZonaId) : [];
    }

    return zonas;
  }, [zonas, selectedZonaId, viewMode]);

  const activeRecordsOnSelectedDate = useMemo(
    () => zoneRecords.filter((item) => activeOnDate(item, selectedDate)),
    [zoneRecords, selectedDate]
  );

  const activeByZone = useMemo(() => {
    return mantenimientos.reduce((acc, item) => {
      if (!activeOnDate(item, selectedDate)) return acc;
      if (!acc[item.zona_id]) acc[item.zona_id] = [];
      acc[item.zona_id].push(item);
      return acc;
    }, {});
  }, [mantenimientos, selectedDate]);

  const recordsByZone = useMemo(() => {
    return zoneRecords.reduce((acc, item) => {
      if (!acc[item.zona_id]) acc[item.zona_id] = [];
      if (overlapsVisibleRange(item, calendarStartKey, calendarEndKey)) {
        acc[item.zona_id].push(item);
      }
      return acc;
    }, {});
  }, [zoneRecords, calendarStartKey, calendarEndKey]);

  const handleSelectZona = (grilla) => {
    setSelectedZonaId(String(grilla.fid));
  };

  const handleMonthChange = (direction) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const openForm = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedZonaId) {
      setError('Selecciona un sector en el mapa antes de agendar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await createMantenimiento({
        zona_id: selectedZonaId,
        fecha: form.fecha_inicio,
        fecha_fin: form.fecha_fin || form.fecha_inicio,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        tarea: form.tarea,
        prioridad: form.prioridad
      });

      setShowForm(false);
      setForm((current) => ({ ...current, tarea: '' }));
      await loadAgenda();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEstadoChange = async (id, estado) => {
    setError('');

    try {
      await updateEstadoMantenimiento(id, estado);
      await loadAgenda();
    } catch (err) {
      setError(err.message);
    }
  };

  const mapStyleResolver = (feature) => {
    const zoneId = String(feature.properties.fid);
    const activeItems = activeByZone[zoneId] || [];
    const isSelectedZone = selectedZonaId === zoneId;

    const priority = activeItems.length > 0 ? pickPriority(activeItems) : null;
    const priorityColor = priority ? PRIORITY_META[priority].color : '#3b82f6';

    let color = 'rgba(255, 255, 255, 0.8)';
    let weight = 2;
    let fillOpacity = activeItems.length > 0 ? 0.72 : 0.42;

    if (isSelectedZone) {
      color = '#fbbf24';
      weight = 4;
      fillOpacity = activeItems.length > 0 ? 0.82 : 0.56;
    } else if (viewMode === 'sector' && selectedZonaId) {
      color = 'rgba(148, 163, 184, 0.55)';
      weight = 1.25;
      fillOpacity = 0.2;
    }

    return {
      color,
      weight,
      fillColor: priorityColor,
      fillOpacity,
      opacity: 1
    };
  };

  const mapTooltipResolver = (feature) => {
    const zoneId = String(feature.properties.fid);
    const activeItems = activeByZone[zoneId] || [];
    const label = feature.properties.umuestra && feature.properties.umuestra !== '---'
      ? feature.properties.umuestra
      : feature.properties.sector;
    const activeLabel = activeItems.length ? ` - ${activeItems.length}` : '';
    return `<div class="zona-map-label" style="font-size:10px; color:#ffffff;"><b>${label}${activeLabel}</b></div>`;
  };

  const renderCalendarRow = (zona) => {
    const zoneItems = (recordsByZone[zona.id] || [])
      .map((item) => ({
        ...item,
        startIndex: getEdgeIndex(calendarDays, item.startKey, 0, calendarStartKey, calendarEndKey),
        endIndex: getEdgeIndex(calendarDays, item.endKey, calendarDays.length - 1, calendarStartKey, calendarEndKey)
      }))
      .filter((item) => item.startIndex <= item.endIndex);

    const laneItems = assignLanes(zoneItems);
    const laneCount = Math.max(1, laneItems.reduce((max, item) => Math.max(max, item.laneIndex), 0) + 1);
    const rowHeight = Math.max(56, laneCount * 32);

    return (
      <div
        key={zona.id}
        className="maintenance-row"
        style={{
          minHeight: `${rowHeight}px`
        }}
      >
        <div
          className="maintenance-zone-cell"
          style={{
            gridRow: `1 / span ${laneCount}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <MapPin size={15} />
            <strong style={{ fontSize: '0.92rem' }}>{zona.nombre || zona.id}</strong>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{zona.id}</span>
        </div>

        {calendarDays.map((day, index) => {
          const isSelected = day.key === selectedDate;
          const isToday = day.key === todayKey();
          return (
            <div
              key={day.key}
              className="maintenance-day-cell"
              style={{
                gridColumn: index + 2,
                gridRow: `1 / span ${laneCount}`,
                background: isSelected
                  ? 'rgba(251, 191, 36, 0.12)'
                  : isToday
                    ? 'rgba(59, 130, 246, 0.08)'
                    : day.isCurrentMonth
                      ? 'rgba(15, 23, 42, 0.14)'
                      : 'rgba(15, 23, 42, 0.06)'
              }}
            />
          );
        })}

        {laneItems.map((item) => {
          const meta = PRIORITY_META[item.prioridad] || PRIORITY_META.media;
          const isSelectedDay = activeOnDate(item, selectedDate);

          return (
            <div
              key={item.id}
              className="maintenance-gantt-bar"
              style={{
                gridColumn: `${item.startIndex + 2} / ${item.endIndex + 3}`,
                gridRow: item.laneIndex + 1,
                background: meta.color,
                border: isSelectedDay ? '2px solid #f8fafc' : '1px solid rgba(15, 23, 42, 0.35)',
                boxShadow: isSelectedDay ? '0 0 0 2px rgba(251, 191, 36, 0.25)' : 'none'
              }}
              title={`${item.tarea} | ${item.hora_inicio}-${item.hora_fin} | ${formatDate(item.startKey)} a ${formatDate(item.endKey)}`}
            >
              {item.tarea}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="maintenance-layout">
      <div className="maintenance-column">
        <MapaGrillaRwy
          onSelectGrilla={handleSelectZona}
          styleResolver={mapStyleResolver}
          tooltipResolver={mapTooltipResolver}
          styleKey={`${viewMode}-${selectedZonaId || 'all'}-${selectedDate}`}
        />

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div className="stat-card">
            <p className="stat-label">Vista</p>
            <p className="stat-value" style={{ fontSize: '1rem' }}>{VIEW_MODES[viewMode].label}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Sector</p>
            <p className="stat-value" style={{ fontSize: '1rem' }}>{zonaDetails ? grillaLabel(zonaDetails) : 'Todos'}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Activos hoy</p>
            <p className="stat-value">{activeRecordsOnSelectedDate.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Poligonos</p>
            <p className="stat-value">{zonas.length}</p>
          </div>
        </div>
      </div>

      <div className="maintenance-column">
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
          <div className="maintenance-toolbar">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(VIEW_MODES).map(([key, mode]) => {
                const isActive = viewMode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={isActive ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setViewMode(key)}
                    style={{ padding: '0.55rem 0.9rem' }}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <button type="button" className="btn-primary" onClick={openForm} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <Plus size={16} />
              Agendar mantenimiento
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutGrid size={18} />
              <strong>Calendario visual</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn-secondary" type="button" onClick={() => handleMonthChange(-1)}>Anterior</button>
              <h2 style={{ fontSize: '1.1rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CalendarDays size={18} />
                {monthTitle(visibleMonth)}
              </h2>
              <button className="btn-secondary" type="button" onClick={() => handleMonthChange(1)}>Siguiente</button>
            </div>
          </div>

          <div className="maintenance-calendar-shell">
            <div className="maintenance-calendar-scroll">
              <div className="maintenance-calendar-grid">
                <div className="maintenance-calendar-head">
                  <div className="maintenance-zone-head">Sector</div>
                  {calendarDays.map((day) => {
                    const isSelected = day.key === selectedDate;
                    const isToday = day.key === todayKey();
                    return (
                      <button
                        key={day.key}
                        type="button"
                        className="maintenance-day-head"
                        onClick={() => setSelectedDate(day.key)}
                        style={{
                          background: isSelected
                            ? 'rgba(251, 191, 36, 0.2)'
                            : isToday
                              ? 'rgba(59, 130, 246, 0.16)'
                              : 'transparent'
                        }}
                      >
                        <span>{day.date.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3)}</span>
                        <span>{day.date.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {loading && <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cargando agenda...</div>}

                {!loading && visibleZones.length === 0 && viewMode === 'sector' && (
                  <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    Selecciona un sector en el mapa para ver su calendario.
                  </div>
                )}

                {!loading && visibleZones.map((zona) => renderCalendarRow(zona))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel maintenance-task-list" style={{ padding: '1.25rem', borderRadius: '0.75rem', flex: '1', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <ScanSearch size={18} />
              Tareas para el {formatDate(selectedDate)}
            </h2>
            <span className="badge badge-info">{activeRecordsOnSelectedDate.length} activos</span>
          </div>

          <div className="maintenance-task-scroll">
            {!loading && activeRecordsOnSelectedDate.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No hay mantenimientos activos en esta fecha.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeRecordsOnSelectedDate.map((item) => {
                const meta = PRIORITY_META[item.prioridad] || PRIORITY_META.media;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--glass-border)',
                      borderRadius: '0.75rem',
                      padding: '0.85rem',
                      background: 'rgba(15, 23, 42, 0.28)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700 }}>{item.zona?.nombre || item.zona_id}</p>
                        <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>
                          {item.hora_inicio} - {item.hora_fin}
                        </p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {formatDate(item.startKey)} a {formatDate(item.endKey)}
                        </p>
                      </div>
                      <span className={`badge ${meta.badge}`}>{meta.label}</span>
                    </div>

                    <p style={{ margin: '0.6rem 0', lineHeight: 1.4 }}>{item.tarea}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="var(--accent-green)" />
                      <select value={item.estado} onChange={(event) => handleEstadoChange(item.id, event.target.value)}>
                        {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="Agendar mantenimiento">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <MapPin size={16} />
            {zonaDetails ? `${grillaLabel(zonaDetails)} - PCR ${zonaDetails.pcr || 'N/A'}` : 'Selecciona un sector en el mapa'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label className="form-field">
              Inicio
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(event) => setForm({ ...form, fecha_inicio: event.target.value })}
              />
            </label>
            <label className="form-field">
              Fin
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(event) => setForm({ ...form, fecha_fin: event.target.value })}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label className="form-field">
              Hora inicio
              <input
                type="time"
                value={form.hora_inicio}
                onChange={(event) => setForm({ ...form, hora_inicio: event.target.value })}
              />
            </label>
            <label className="form-field">
              Hora fin
              <input
                type="time"
                value={form.hora_fin}
                onChange={(event) => setForm({ ...form, hora_fin: event.target.value })}
              />
            </label>
          </div>

          <label className="form-field">
            Tarea
            <textarea
              rows={4}
              value={form.tarea}
              onChange={(event) => setForm({ ...form, tarea: event.target.value })}
              placeholder="Describe la tarea de mantenimiento"
            />
          </label>

          <label className="form-field">
            Prioridad
            <select
              value={form.prioridad}
              onChange={(event) => setForm({ ...form, prioridad: event.target.value })}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Critica</option>
            </select>
          </label>

          {error && <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar turno'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AgendaMantenimiento;
