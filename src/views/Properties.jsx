import React, { useState, useMemo } from 'react';
import Card from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import { MapPin, Bed, Bath, Ruler, Tag, Calendar, User } from 'lucide-react';

const PropertyCard = ({ property, onClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Vendido': case 'Alquilado': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'Reservado': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Oferta recibida': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    // Inline style helper as we don't have Tailwind classes fully set up in JS
    const getStatusStyle = (status) => {
        if (['Vendido', 'Alquilado'].includes(status)) return 'badge-success';
        if (status === 'Reservado') return 'badge-warning';
        if (status === 'Oferta recibida') return 'badge-info';
        return 'badge-info'; // default
    };

    return (
        <div className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={onClick}>
            <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                <img src={property.image} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                    {property.type}
                </div>
            </div>
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}>{property.title}</h3>
                    <span className={`badge ${getStatusStyle(property.status)}`}>{property.status}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                    <MapPin size={14} /> {property.address}
                </p>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bed size={14} /> {property.rooms} hab</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bath size={14} /> {property.baths} baños</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ruler size={14} /> {property.area} m²</span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        {property.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        {property.type === 'Alquiler' && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/mes</span>}
                    </span>
                </div>
            </div>
        </div>
    );
};

const Properties = ({ data }) => {
    const { properties, agents } = data;
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterZone, setFilterZone] = useState('');
    const [selectedProp, setSelectedProp] = useState(null);

    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            if (filterType !== 'All' && p.type !== filterType) return false;
            if (filterStatus !== 'All' && p.status !== filterStatus) return false;
            if (filterZone && !p.address.toLowerCase().includes(filterZone.toLowerCase())) return false;
            return true;
        });
    }, [properties, filterType, filterStatus, filterZone]);

    const getAgentName = (id) => agents.find(a => a.id === id)?.name || 'Desconocido';

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filters */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tipo</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', minWidth: '150px' }}
                    >
                        <option value="All">Todos</option>
                        <option value="Venta">Venta</option>
                        <option value="Alquiler">Alquiler</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estado</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', minWidth: '150px' }}
                    >
                        <option value="All">Todos</option>
                        <option value="Captado">Captado</option>
                        <option value="En comercialización">En comercialización</option>
                        <option value="Vendido">Vendido</option>
                        <option value="Alquiler">Alquilado</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Buscar por Zona</label>
                    <input
                        type="text"
                        placeholder="Ej. Barrio Salamanca..."
                        value={filterZone}
                        onChange={(e) => setFilterZone(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{filteredProperties.length} propiedades encontradas</span>
                </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredProperties.map(p => (
                    <PropertyCard key={p.id} property={p} onClick={() => setSelectedProp(p)} />
                ))}
            </div>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedProp} onClose={() => setSelectedProp(null)} title={selectedProp?.title}>
                {selectedProp && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div style={{ height: '300px', borderRadius: '1rem', overflow: 'hidden' }}>
                            <img src={selectedProp.image} alt={selectedProp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Detalles</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Precio</span>
                                        <span style={{ fontWeight: 600, color: '#fbbf24' }}>{selectedProp.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Superficie</span>
                                        <span>{selectedProp.area} m²</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Habitaciones</span>
                                        <span>{selectedProp.rooms}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Baños</span>
                                        <span>{selectedProp.baths}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Agente</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={14} /> {getAgentName(selectedProp.agentId)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Historial</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ padding: '0.25rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%' }}><Calendar size={14} color="#3b82f6" /></div>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Captación</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedProp.dateListed.toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ padding: '0.25rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%' }}><User size={14} color="#10b981" /></div>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Visitas Totales</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedProp.visits} visitas realizadas</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ padding: '0.25rem', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '50%' }}><Tag size={14} color="#fbbf24" /></div>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Estado Actual</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedProp.status}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Properties;
