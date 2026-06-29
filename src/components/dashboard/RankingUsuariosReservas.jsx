import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer
} from 'recharts';
import { Users } from 'lucide-react';

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

// Ranking de usuários que mais fazem reservas (dados vindos das OS de expedição com reserva).
// O nome do usuário vem do campo "usuario_reserva" (Área do Usuário > Nome do Usuário) da aba Documento da OS.
export default function RankingUsuariosReservas({ filteredOrdens = [] }) {
  const data = useMemo(() => {
    const contagem = {};
    filteredOrdens.forEach(os => {
      const nome = (os.usuario_reserva || '').trim();
      // Considera apenas OS que efetivamente têm reserva
      const temReserva = nome || os.num_reserva || os.data_reserva;
      if (!temReserva || !nome) return;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({
        nomeCompleto: nome,
        name: nome.length > 26 ? nome.substring(0, 24) + '…' : nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 15);
  }, [filteredOrdens]);

  const totalReservas = data.reduce((s, d) => s + d.quantidade, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }} />
        Ranking de Usuários que mais fazem Reservas
      </h3>
      {data.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <Users className="w-8 h-8 opacity-30" />
          Nenhuma reserva com usuário identificado no período
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(240, data.length * 40)}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={180} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                formatter={v => [v, 'Reservas']} />
              <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => {
                  const l = Math.round(80 - (i / data.length) * 50);
                  return <Cell key={i} fill={`hsl(220, 80%, ${l}%)`} />;
                })}
                <LabelList dataKey="quantidade" position="right"
                  style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">
            Total de reservas: {totalReservas} · {data.length} usuário(s)
          </p>
        </>
      )}
    </div>
  );
}