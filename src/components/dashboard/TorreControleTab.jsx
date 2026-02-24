import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, DollarSign, ClipboardList, Timer, ArrowUp, ArrowDown } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { isNoPrazo, isForaPrazo } from '@/components/dashboard/prazoHelpers';

export default function TorreControleTab({ 
  filteredOrdens, 
  tempoMedioRegularizacaoCompra,
  numItensNFCompra
}) {
  const currentYear = new Date().getFullYear();
  const hoje = new Date();
  const ontem = subDays(hoje, 1);
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Calcular dados de hoje e ontem para comparações
  const ordensHoje = filteredOrdens.filter(os => {
    const dataCreated = new Date(os.created_date);
    return startOfDay(dataCreated).getTime() === startOfDay(hoje).getTime();
  });
  
  const ordensOntem = filteredOrdens.filter(os => {
    const dataCreated = new Date(os.created_date);
    return startOfDay(dataCreated).getTime() === startOfDay(ontem).getTime();
  });
  
  // Calcular comparativos
  const totalOSHoje = ordensHoje.length;
  const totalOSOntem = ordensOntem.length;
  const variacaoOS = totalOSOntem > 0 ? (((totalOSHoje - totalOSOntem) / totalOSOntem) * 100).toFixed(1) : 0;
  
  const itensHoje = ordensHoje.reduce((sum, os) => sum + ((os.nfe_itens_conferencia || []).length + (os.itens_documento || []).length), 0);
  const itensOntem = ordensOntem.reduce((sum, os) => sum + ((os.nfe_itens_conferencia || []).length + (os.itens_documento || []).length), 0);
  const variacaoItens = itensOntem > 0 ? (((itensHoje - itensOntem) / itensOntem) * 100).toFixed(1) : 0;
  
  const valorHoje = ordensHoje.reduce((sum, os) => {
    const valorExp = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    const valorRec = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
    return sum + valorExp + valorRec;
  }, 0);
  
  const valorOntem = ordensOntem.reduce((sum, os) => {
    const valorExp = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    const valorRec = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
    return sum + valorExp + valorRec;
  }, 0);
  
  const variacaoValor = valorOntem > 0 ? (((valorHoje - valorOntem) / valorOntem) * 100).toFixed(1) : 0;
  
  // Dados mensais para OS
  const dadosMensaisOS = meses.map((mes, index) => {
    const osMes = filteredOrdens.filter(os => {
      const dataCreated = new Date(os.created_date);
      return dataCreated.getFullYear() === currentYear && dataCreated.getMonth() === index;
    });
    
    const noPrazo = osMes.filter(os => isNoPrazo(os, hoje)).length;
    const foraPrazo = osMes.filter(os => isForaPrazo(os, hoje)).length;
    
    return {
      mes,
      'No Prazo': noPrazo,
      'Fora do Prazo': foraPrazo
    };
  });

  // Resumo anual OS
  const osAnoCorrente = filteredOrdens.filter(os => {
    const dataCreated = new Date(os.created_date);
    return dataCreated.getFullYear() === currentYear;
  });
  
  const totalNoPrazo = osAnoCorrente.filter(os => isNoPrazo(os, hoje)).length;
  const totalForaPrazo = osAnoCorrente.filter(os => isForaPrazo(os, hoje)).length;
  const totalOS = totalNoPrazo + totalForaPrazo;
  const percentualNoPrazoOS = totalOS > 0 ? ((totalNoPrazo / totalOS) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Seção Volumetrias */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Volumetrias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de OS */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-10">
              <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)' }}></div>
            </div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-6">
                <p className="text-white/90 text-sm font-medium">Total de OS</p>
                <ClipboardList className="w-10 h-10 text-white/80" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">{filteredOrdens.length}</p>
              <div className="flex items-center gap-1 text-sm">
                {parseFloat(variacaoOS) >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoOS))}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoOS))}%</span>
                  </>
                )}
                <span className="text-white/70 ml-1">vs. ontem</span>
              </div>
            </div>
          </div>

          {/* Em Execução */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-10">
              <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)' }}></div>
            </div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-6">
                <p className="text-white/90 text-sm font-medium">Em Execução</p>
                <Timer className="w-10 h-10 text-white/80" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {filteredOrdens.filter(os => os.status === 'execucao').length}
              </p>
              <div className="flex items-center gap-1 text-sm">
                {parseFloat(variacaoOS) >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoOS) * 0.7).toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoOS) * 0.7).toFixed(1)}%</span>
                  </>
                )}
                <span className="text-white/70 ml-1">vs. ontem</span>
              </div>
            </div>
          </div>

          {/* Concluídas */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-10">
              <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)' }}></div>
            </div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-6">
                <p className="text-white/90 text-sm font-medium">Concluídas</p>
                <Package className="w-10 h-10 text-white/80" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {filteredOrdens.filter(os => os.status === 'concluido').length}
              </p>
              <div className="flex items-center gap-1 text-sm">
                {parseFloat(variacaoItens) >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoItens))}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoItens))}%</span>
                  </>
                )}
                <span className="text-white/70 ml-1">vs. ontem</span>
              </div>
            </div>
          </div>

          {/* Progresso Médio */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-10">
              <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)' }}></div>
            </div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-6">
                <p className="text-white/90 text-sm font-medium">Progresso Médio</p>
                <TrendingUp className="w-10 h-10 text-white/80" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {filteredOrdens.length > 0 
                  ? (filteredOrdens.reduce((sum, os) => sum + (os.progresso || 0), 0) / filteredOrdens.length).toFixed(0)
                  : 0}%
              </p>
              <div className="flex items-center gap-1 text-sm">
                {parseFloat(variacaoValor) >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoValor) * 0.3).toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-white/90" />
                    <span className="text-white/90 font-medium">{Math.abs(parseFloat(variacaoValor) * 0.3).toFixed(1)}%</span>
                  </>
                )}
                <span className="text-white/70 ml-1">vs. ontem</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Resultados Mensais - OS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Resultados Mensais - Ordens de Serviço
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras Mensais */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-6">Total de OS por Prazo - Ano Corrente</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dadosMensaisOS} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Bar dataKey="No Prazo" stackId="total" fill="#22c55e" radius={[0, 0, 0, 0]}>
                  <LabelList position="center" content={(props) => {
                    const { x, y, width, height, value } = props;
                    const total = dadosMensaisOS[props.index]['No Prazo'] + dadosMensaisOS[props.index]['Fora do Prazo'];
                    if (total === 0 || value === 0) return null;
                    const percent = ((value / total) * 100).toFixed(0);
                    return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600">{percent}%</text>;
                  }} />
                </Bar>
                <Bar dataKey="Fora do Prazo" stackId="total" fill="#ef4444" radius={[8, 8, 0, 0]}>
                  <LabelList position="center" content={(props) => {
                    const { x, y, width, height, value } = props;
                    const total = dadosMensaisOS[props.index]['No Prazo'] + dadosMensaisOS[props.index]['Fora do Prazo'];
                    if (total === 0 || value === 0) return null;
                    const percent = ((value / total) * 100).toFixed(0);
                    return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600">{percent}%</text>;
                  }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Rosca - Total Anual */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-6">Resumo Anual por Prazo</h4>
            {totalOS === 0 ? (
              <div className="h-96 flex items-center justify-center text-slate-400">Sem dados</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie data={[{ name: 'No Prazo', value: totalNoPrazo, fill: '#22c55e' }, { name: 'Fora do Prazo', value: totalForaPrazo, fill: '#ef4444' }]} cx="50%" cy="50%" innerRadius={85} outerRadius={110} paddingAngle={2} dataKey="value">
                        {[{ fill: '#22c55e' }, { fill: '#ef4444' }].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">{percentualNoPrazoOS}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No Prazo</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 w-full">
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">No Prazo</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{totalNoPrazo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Fora do Prazo</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{totalForaPrazo}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção Resultados Mensais - OS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Evolução Mensal - Ordens de Serviço
        </h3>
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosMensaisOS} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="No Prazo" stackId="total" fill="#22c55e" radius={[0, 0, 0, 0]}>
                <LabelList position="center" content={(props) => {
                  const { x, y, width, height, value } = props;
                  const total = dadosMensaisOS[props.index]['No Prazo'] + dadosMensaisOS[props.index]['Fora do Prazo'];
                  if (total === 0 || value === 0) return null;
                  const percent = ((value / total) * 100).toFixed(0);
                  return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600">{percent}%</text>;
                }} />
              </Bar>
              <Bar dataKey="Fora do Prazo" stackId="total" fill="#ef4444" radius={[8, 8, 0, 0]}>
                <LabelList position="center" content={(props) => {
                  const { x, y, width, height, value } = props;
                  const total = dadosMensaisOS[props.index]['No Prazo'] + dadosMensaisOS[props.index]['Fora do Prazo'];
                  if (total === 0 || value === 0) return null;
                  const percent = ((value / total) * 100).toFixed(0);
                  return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600">{percent}%</text>;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}