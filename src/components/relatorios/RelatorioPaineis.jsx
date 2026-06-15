import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Package, Truck } from 'lucide-react';
import { AXIA, RECEBIMENTO_COLORS } from './axiaColors';

const KPIMini = ({ label, value, color = AXIA.primary }) => (
  <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
    <CardContent className="p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    </CardContent>
  </Card>
);

export default function RelatorioPaineis({ recebimento, expedicao }) {
  const COLORS_REC = [AXIA.success, AXIA.warning, AXIA.danger];

  return (
    <div className="space-y-8">
      {/* Recebimento */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-6 h-6" style={{ color: AXIA.successDark }} /> Painel Recebimento
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KPIMini label="Total OS Recebimento" value={recebimento.total} color={AXIA.success} />
          <KPIMini label="Conformidade" value={`${recebimento.taxaConformidade}%`} color={AXIA.success} />
          <KPIMini label="Com Problemas" value={recebimento.comProblemas} color={AXIA.danger} />
          <KPIMini label="Lead Time Receb. (LTR)" value={`${recebimento.leadTime} dias`} color={AXIA.primary} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Barras empilhadas — coluna maior */}
          <Card className="bg-white dark:bg-slate-800 lg:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3 text-slate-700">
                Recebimento por {recebimento.breakdownTipo === 'almoxarifado' ? 'Almoxarifado' : 'Regional'}
              </h3>
              {recebimento.breakdown && recebimento.breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={recebimento.breakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-15} textAnchor="end" height={60} interval={0} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="conformes" name="Conformes" stackId="a" fill={RECEBIMENTO_COLORS.conformes} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="comProblemas" name="Com Problemas" stackId="a" fill={RECEBIMENTO_COLORS.comProblemas} />
                    <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill={RECEBIMENTO_COLORS.pendentes} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">Sem dados</p>}
            </CardContent>
          </Card>

          {/* Rosca — coluna menor */}
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3 text-slate-700">Distribuição de Status</h3>
              {recebimento.distribuicao.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={recebimento.distribuicao} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {recebimento.distribuicao.map((_, i) => <Cell key={i} fill={COLORS_REC[i % COLORS_REC.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">Sem dados</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expedição */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Truck className="w-6 h-6" style={{ color: AXIA.accent }} /> Painel Expedição
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KPIMini label="Total OS Expedição" value={expedicao.total} color={AXIA.accent} />
          <KPIMini label="OTIF" value={`${expedicao.otif}%`} color={AXIA.success} />
          <KPIMini label="Em Trânsito" value={expedicao.emTransito} color={AXIA.primary} />
          <KPIMini label="Lead Time Médio" value={`${expedicao.leadTime} dias`} color={AXIA.accent} />
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
                  <Bar dataKey="total" fill={AXIA.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-slate-400 py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}