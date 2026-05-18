import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import { buildInitialState } from './data/generator';
import { Menu } from 'lucide-react';

// Real Views
import Dashboard from './views/AirsideDashboard';
import DashboardSABE from './views/AerDashboard';
import Zonas from './views/Zonas';
import Zonas2 from './views/Zonas2';
import AgendaMantenimiento from './views/AgendaMantenimiento';
import SabeMaintenance from './views/SabeMaintenance';

const TAB_TITLES = {
  'panel general': 'Panel General',
  'panel AEP': 'Panel AEP',
  'Pavement Condition Index': 'Pavement Condition Index (PCI)',
  'Pavement Classification Rating': 'Pavement Classification Rating (PCR)',
  'sabe-maintenance': 'Predictor ventanas de mantenimiento',
  'mantenimiento': 'Planificador de tareas',
};

const App = () => {
  const [activeTab, setActiveTab] = useState('panel general');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const initialState = buildInitialState();
      setData(initialState);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(251,191,36,0.3)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-secondary">Cargando sistema SABE...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'panel general': return <Dashboard data={data} />;
      case 'panel AEP':    return <DashboardSABE data={data} />;
      case 'Pavement Condition Index': return <Zonas2 />;
      case 'Pavement Classification Rating': return <Zonas />;
      case 'mantenimiento': return <AgendaMantenimiento />;
      case 'sabe-maintenance': return <SabeMaintenance />;
      default: return <Dashboard data={data} />;
    }
  };

  const title = TAB_TITLES[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <div className={`layout-grid${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`sidebar-wrapper${mobileOpen ? ' mobile-open' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      <main className="main-content">
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              style={{
                display: 'none',
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '0.4rem',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="mobile-hamburger"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{title}</h1>
          </div>

          <div className="glass-panel" style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        {renderContent()}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-hamburger { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
