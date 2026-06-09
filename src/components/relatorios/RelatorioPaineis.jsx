import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Package, Truck } from 'lucide-react';

const KPIMini = ({ label, value, color = '#0000FF' }) => (
  <Card className="bg-white dark:bg-slate-800">
    <CardContent className="p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    </CardContent>
  </Card>
);

export default function RelatorioPaineis({ recebimento, expedicao }) {
  const COLORS_REC = ['#10b981', '#f59e0b', '#ef4444'];
  const COLORS_EXP = ['#0000FF', '#FF6B00', '#A0B4D2', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Recebimento */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-600" /> Painel Recebimento
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KPIMini label="Total OS Recebimento" value={recebimento.total} color="#10b981" />
          <KPIMini label="Conformidade" value={`${recebimento.taxaConformidade}%`} color="#10b981" />
          <KPIMini label="Com Problemas" value={recebimento.comProblemas} color="#ef4444" />
          <KPIMini label="Lead Time Médio" value={`${recebimento.leadTime} dias`} color="#0000FF" />
        </div>
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3 text-slate-700">Distribuição de Status</h3>
            {recebimento.distribuicao.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={recebimento.distribuicao} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {recebimento.distribuicao.map((_, i) => <Cell key={i} fill={COLORS_REC[i % COLORS_REC.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-slate-400 py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Expedição */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Truck className="w-6 h-6 text-orange-600" /> Painel Expedição
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KPIMini label="Total OS Expedição" value={expedicao.total} color="#FF6B00" />
          <KPIMini label="OTIF" value={`${expedicao.otif}%`} color="#10b981" />
          <KPIMini label="Em Trânsito" value={expedicao.emTransito} color="#0000FF" />
          <KPIMini label="Lead Time Médio" value={`${expedicao.leadTime} dias`} color="#FF6B00" />
        </div>
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3 text-slate-700">Status de Separação/Expedição</h3>
            {expedicao.statusSeparacao.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={expedicao.statusSeparacao} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-slate-400 py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}