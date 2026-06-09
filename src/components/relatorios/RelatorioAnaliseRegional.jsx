import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapPin } from 'lucide-react';
import TopAlmoxarifadosTreemap from './TopAlmoxarifadosTreemap';

const statusLabels = {
  elaboracao: 'Em Elaboração',
  execucao: 'Em Execução',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

export default function RelatorioAnaliseRegional({ porRegional, porAlmoxarifado, categoriasUsadas = [], agruparPorAlmoxarifado = false, regionalSelecionada = null }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">🗺️ Análise por Regional e Almoxarifado</h2>

      <Card className="bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            {agruparPorAlmoxarifado
              ? `Distribuição de OS por Almoxarifado${regionalSelecionada ? ` — Regional ${regionalSelecionada}` : ''}`
              : 'Distribuição de OS por Regional'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {porRegional.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={porRegional} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={agruparPorAlmoxarifado ? -25 : 0} textAnchor={agruparPorAlmoxarifado ? 'end' : 'middle'} height={agruparPorAlmoxarifado ? 60 : 30} interval={0} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [value, statusLabels[name] || name]} />
                <Legend formatter={(value) => statusLabels[value] || value} />
                <Bar dataKey="elaboracao" stackId="a" fill="#64748b" />
                <Bar dataKey="execucao" stackId="a" fill="#0000FF" />
                <Bar dataKey="concluido" stackId="a" fill="#10b981" />
                <Bar dataKey="cancelado" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400">Sem dados</div>
          )}
        </CardContent>
      </Card>

      <TopAlmoxarifadosTreemap porAlmoxarifado={porAlmoxarifado} categoriasUsadas={categoriasUsadas} />
    </div>
  );
}