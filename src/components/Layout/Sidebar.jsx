import React from 'react';
import {
  LayoutDashboard, PieChart, Sun, Moon, PlaneTakeoff, CalendarDays, Wrench,
  LayoutPanelLeft, LandPlot, Shovel, TowerControl, ChevronLeft, ChevronRight
} from 'lucide-react';

const menuItems = [
  { id: 'panel general',               label: 'Panel general',          icon: LayoutDashboard },
  { id: 'panel AEP',                   label: 'Panel AEP',              icon: LayoutPanelLeft },
  { id: 'Pavement Condition Index',    label: 'PCI',                    icon: LandPlot },
  { id: 'Pavement Classification Rating', label: 'PCR',                 icon: Shovel },
  { id: 'sabe-maintenance',            label: 'Ventanas Mantenimiento', icon: TowerControl },
  { id: 'mantenimiento',               label: 'Agenda Mantenimiento',   icon: CalendarDays },
];

const Sidebar = ({ activeTab, setActiveTab, collapsed, onToggle }) => {
  return (
    <div
      className="glass-panel"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '1.25rem 0' : '1.25rem 0.85rem',
        transition: 'var(--sidebar-transition)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        flexShrink: 0,
        background: 'rgba(15, 23, 42, 0.85)',
      }}
    >
      {/* Logo / Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: collapsed ? '0 0.5rem' : '0 0.25rem',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          minWidth: '32px', width: '32px', height: '32px',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <PlaneTakeoff size={18} color="white" />
        </div>
        {!collapsed && (
          <h2 style={{ fontSize: '1rem', letterSpacing: '-0.025em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            Aeroparque<br />
            <span className="text-gradient">Jorge Newbery</span>
          </h2>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.7rem 0' : '0.65rem 0.85rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: isActive ? 'rgba(251,191,36,0.15)' : 'transparent',
                color: isActive ? '#fbbf24' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 400,
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <Icon size={19} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.label}</span>}
              {!collapsed && isActive && (
                <div style={{
                  width: '5px', height: '5px',
                  borderRadius: '50%',
                  background: '#fbbf24',
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom area */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
        {/* User card */}
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.25rem' }}>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
              alt="Admin"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin User</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>Director</p>
            </div>
          </div>
        )}

        {/* Toggle collapse button */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          style={{
            width: '100%',
            padding: '0.55rem',
            borderRadius: '0.65rem',
            border: '1px solid var(--glass-border)',
            background: 'rgba(148,163,184,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            transition: 'background 0.15s',
            fontSize: '0.8rem',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Colapsar</span></>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
