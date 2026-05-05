import React, { useMemo } from 'react';
import Card from '../components/UI/Card';
import { Mail, Phone, Award, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AgentCard = ({ agent }) => (
    <Card className="hover:scale-105" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem' }}>
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <img src={agent.photo} alt={agent.name} style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-gold)' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#fbbf24', borderRadius: '50%', padding: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <Award size={16} color="black" />
            </div>
        </div>

        <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{agent.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{agent.seniority} experiencia</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Ventas</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{agent.closedDeals}</p>
            </div>
            <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Activos</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{agent.activeDeals}</p>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button className="glass-panel hover:bg-white/10" style={{ padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', border: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}><Mail size={18} /></button>
            <button className="glass-panel hover:bg-white/10" style={{ padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', border: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}><Phone size={18} /></button>
        </div>
    </Card>
);

const Agents = ({ data }) => {
    const { agents } = data;

    const chartData = useMemo(() => {
        return agents.map(a => ({
            name: a.name.split(' ')[0],
            commission: a.totalCommission
        })).sort((a, b) => b.commission - a.commission);
    }, [agents]);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Agent Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                {/* Commission Chart */}
                <Card title="Comisiones Totales (YTD)">
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={60} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <Bar dataKey="commission" fill="#fbbf24" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#fbbf24' : 'rgba(251, 191, 36, 0.5)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Detailed Table */}
                <Card title="Detalle de Rendimiento">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>Agente</th>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>Seniority</th>
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>Valoración</th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>Cerradas</th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>Volumen Total</th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>Comisión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agents.map(agent => (
                                    <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{agent.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{agent.seniority}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ color: '#fbbf24', marginRight: '4px' }}>★</span>
                                                {agent.rating}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{agent.closedDeals}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{(agent.totalSales / 1000).toFixed(0)}k €</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981' }}>{(agent.totalCommission / 1000).toFixed(1)}k €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Agents;
