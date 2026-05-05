import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getRegistrosByZona } from '../../services/api';

const GraficoHistorial = ({ zonaId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegistrosByZona(zonaId)
      .then(registros => {
        // Formatear datos para el gráfico
        const chartData = registros.map(r => ({
          fecha: new Date(r.fecha).toLocaleDateString(),
          valor: r.valor_interpolado
        }));
        setData(chartData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [zonaId]);

  if (loading) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando gráfico...</div>;
  if (data.length === 0) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No hay registros históricos para esta zona.</div>;

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="fecha" stroke="var(--text-secondary)" fontSize={12} />
          <YAxis stroke="var(--text-secondary)" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--primary-color)' }}
          />
          <Line type="monotone" dataKey="valor" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoHistorial;
