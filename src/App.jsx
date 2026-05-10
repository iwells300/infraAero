import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import { buildInitialState } from './data/generator';

// Real Views
import Dashboard from './views/AirsideDashboard';
import DashboardSABE from './views/AerDashboard';
import Agents from './views/Agents';
import Properties from './views/Properties';
import Financial from './views/Financial';
import Zonas from './views/Zonas';
import Zonas2 from './views/Zonas2';
import AgendaMantenimiento from './views/AgendaMantenimiento';

const App = () => {
  const [activeTab, setActiveTab] = useState('Panel general');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
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
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(251, 191, 36, 0.3)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-secondary">Cargando sistema SABE...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'panel general': return <Dashboard data={data} />;
      case 'panel AEP': return <DashboardSABE data={data} />;
      case 'agents': return <Agents data={data} />;
      case 'properties': return <Properties data={data} />;
      case 'finance': return <Financial data={data} />;
      case 'Pavement Condition Index': return <Zonas2 />;
      case 'Pavement Classification Rating': return <Zonas />;
      case 'mantenimiento': return <AgendaMantenimiento />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
    <div className="layout-grid">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.175rem' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            
          </div>
          <div className="glass-panel" style={{ padding: '0.1rem 1rem', borderRadius: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            
            <p style={{ color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
