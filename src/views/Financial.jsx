import React, { useMemo } from 'react';
import Card from '../components/UI/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Archive } from 'lucide-react';

const Financial = ({ data }) => {
    const { transactions } = data;

    const metrics = useMemo(() => {
        const salesRevenue = transactions.filter(t => t.type === 'Venta').reduce((sum, t) => sum + t.commission, 0);
        const rentalRevenue = transactions.filter(t => t.type === 'Alquiler').reduce((sum, t) => sum + t.commission, 0);
        const totalRevenue = salesRevenue + rentalRevenue;

        // Mock expenses (approx 30% of revenue)
        const marketing = totalRevenue * 0.12;
        const operations = totalRevenue * 0.15;
        const legal = totalRevenue * 0.05;
        const totalExpenses = marketing + operations + legal;

        const netProfit = totalRevenue - totalExpenses;

        return {
            salesRevenue,
            rentalRevenue,
            totalRevenue,
            expenses: { marketing, operations, legal, total: totalExpenses },
            netProfit
        };
    }, [transactions]);

    const pieData = [
        { name: 'Ventas', value: metrics.salesRevenue, color: '#fbbf24' },
        { name: 'Alquileres', value: metrics.rentalRevenue, color: '#3b82f6' },
    ];

    const expensesData = [
        { name: 'Marketing', value: metrics.expenses.marketing, color: '#f472b6' },
        { name: 'Operativos', value: metrics.expenses.operations, color: '#a78bfa' },
        { name: 'Legal', value: metrics.expenses.legal, color: '#34d399' },
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '1rem' }}>
                            <TrendingUp size={24} color="#34d399" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ingresos Brutos</p>
                            <h3 style={{ fontSize: '1.5rem' }}>{metrics.totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '1rem' }}>
                            <TrendingDown size={24} color="#f87171" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gastos Totales</p>
                            <h3 style={{ fontSize: '1.5rem' }}>{metrics.expenses.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '1rem' }}>
                            <DollarSign size={24} color="#60a5fa" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Beneficio Neto</p>
                            <h3 style={{ fontSize: '1.5rem', color: '#fbbf24' }}>{metrics.netProfit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Revenue Mix */}
                <Card title="Desglose de Ingresos">
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    modifier="dark"
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                    formatter={(value) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Expenses Breakdown */}
                <Card title="Distribución de Gastos">
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expensesData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                    formatter={(value) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {expensesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

        </div>
    );
};

export default Financial;
