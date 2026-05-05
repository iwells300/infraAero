import React, { useMemo } from 'react';
import Card from '../components/UI/Card';
import { Users, Euro, Home, TrendingUp, Briefcase, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const KPICard = ({ title, value, change, icon: Icon, color }) => (
    <Card className="hover:scale-105 transition-transform" style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.6))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</h3>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '1rem', background: `rgba(${color}, 0.2)` }}>
                <Icon size={24} color={`rgb(${color})`} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', gap: '0.5rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                <TrendingUp size={12} style={{ marginRight: '4px' }} /> {change}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>vs mes anterior</span>
        </div>
    </Card>
);

const FUNNEL_STAGES = ['Captado', 'En comercialización', 'Visitas programadas', 'Oferta recibida', 'Reservado'];

const Dashboard = ({ data }) => {
    const { agents, properties, transactions } = data;

    const kpis = useMemo(() => {
        const totalRevenue = properties
            .filter(p => p.status === 'Vendido' || p.status === 'Alquilado')
            .reduce((sum, p) => sum + (p.type === 'Venta' ? p.price * 0.03 : p.price), 0); // Approx

        const activeProperties = properties.filter(p => !['Vendido', 'Alquilado'].includes(p.status)).length;

        // Simulate current month sales
        const thisMonthSales = transactions.filter(t => t.date.getMonth() === new Date().getMonth()).length;

        return {
            revenue: totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
            activeProps: activeProperties,
            salesCount: thisMonthSales,
            avgCommission: '4.2%'
        };
    }, [properties, transactions]);

    const topAgents = useMemo(() => {
        return [...agents].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
    }, [agents]);

    const funnelData = useMemo(() => {
        return FUNNEL_STAGES.map(stage => ({
            name: stage,
            count: properties.filter(p => p.status === stage).length
        }));
    }, [properties]);

    const chartData = [
        { name: 'Ene', sales: 4000, rentals: 2400 },
        { name: 'Feb', sales: 3000, rentals: 1398 },
        { name: 'Mar', sales: 2000, rentals: 9800 },
        { name: 'Abr', sales: 2780, rentals: 3908 },
        { name: 'May', sales: 1890, rentals: 4800 },
        { name: 'Jun', sales: 2390, rentals: 3800 },
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <KPICard title="Ingresos Totales" value={kpis.revenue} change="+12.5%" icon={Euro} color="251, 191, 36" />
                <KPICard title="Propiedades Activas" value={kpis.activeProps} change="+4" icon={Home} color="59, 130, 246" />
                <KPICard title="Ventas del Mes" value={kpis.salesCount} change="-2" icon={Briefcase} color="16, 185, 129" />
                <KPICard title="Productividad" value="94%" change="+1.2%" icon={Activity} color="236, 72, 153" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Main Chart */}
                <Card title="Rendimiento Semestral">
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#fbbf24" fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="rentals" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRentals)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Funnel */}
                <Card title="Pipeline de Ventas">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {funnelData.map((stage, idx) => (
                            <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', width: '120px' }}>{stage.name}</span>
                                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(stage.count / 15) * 100}%`,
                                        background: idx % 2 === 0 ? '#fbbf24' : '#3b82f6',
                                        borderRadius: '4px'
                                    }} />
                                </div>
                                <span style={{ fontWeight: 600, width: '20px' }}>{stage.count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Top Performers */}
            <Card title="Top Agentes">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Agente</th>
                                <th style={{ padding: '1rem' }}>Ventas</th>
                                <th style={{ padding: '1rem' }}>Volumen</th>
                                <th style={{ padding: '1rem' }}>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topAgents.map((agent) => (
                                <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img src={agent.photo} alt={agent.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{agent.name}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{agent.closedDeals}</td>
                                    <td style={{ padding: '1rem' }}>{(agent.totalSales / 1000000).toFixed(1)}M €</td>
                                    <td style={{ padding: '1rem', color: '#fbbf24' }}>★ {agent.rating}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
