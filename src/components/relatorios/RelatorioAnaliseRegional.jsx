import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Warehouse } from 'lucide-react';
import RelatorioHeatmapStatus from './RelatorioHeatmapStatus';

export default function RelatorioAnaliseRegional({ porRegional, porAlmoxarifado, categoriasUsadas = [], agruparPorAlmoxarifado = false, regionalSelecionada = null }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Análise por Regional e Almoxarifado</h2>

      <RelatorioHeatmapStatus
        porRegional={porRegional}
        agruparPorAlmoxarifado={agruparPorAlmoxarifado}
        regionalSelecionada={regionalSelecionada}
      />

      <Card className="bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-amber-500" />
            Top 10 Almoxarifados por Volume de OS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {porAlmoxarifado.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(320, porAlmoxarifado.length * 40 + 80)}>
              <BarChart data={porAlmoxarifado} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={140} interval={0} />
                <Tooltip />
                <Legend />
                {categoriasUsadas.map((c, idx) => (
                  <Bar key={c.nome} dataKey={c.nome} stackId="a" fill={c.cor || ['#0000FF', '#FF6B00', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#A0B4D2'][idx % 8]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400">Sem dados</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}