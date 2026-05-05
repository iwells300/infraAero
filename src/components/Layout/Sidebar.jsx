import React from 'react';
import { LayoutDashboard, Users, Building2, PieChart, Activity, Sun, Moon, Map } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, theme, toggleTheme }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'agents', label: 'Agentes', icon: Users },
        { id: 'properties', label: 'Propiedades', icon: Building2 },
        { id: 'finance', label: 'Finanzas', icon: PieChart },
        { id: 'zonas', label: 'Zonas', icon: Map },
    ];

    return (
        <div className="glass-panel" style={{
            width: '260px',
            height: '96vh',
            margin: '2vh',
            borderRadius: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1rem'
        }}>
            <div className="flex-center" style={{ marginBottom: '3rem', gap: '0.75rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Building2 size={20} color="white" />
                </div>
                <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
                    Lux<span className="text-gradient">Estate</span>
                </h2>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: isActive ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                                color: isActive ? '#fbbf24' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left',
                                fontSize: '0.95rem',
                                fontWeight: isActive ? 600 : 400
                            }}
                            className="nav-item"
                        >
                            <Icon size={20} />
                            {item.label}
                            {isActive && <div style={{
                                marginLeft: 'auto',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#fbbf24'
                            }} />}
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
                                alt="Admin"
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Admin User</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Director</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-primary)',
                        transition: 'background 0.2s'
                    }}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
