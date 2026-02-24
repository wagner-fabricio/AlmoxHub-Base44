import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, DollarSign, ClipboardList, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { isNoPrazo, isForaPrazo } from '@/components/dashboard/prazoHelpers';

export default function TorreControleTab({ 
  filteredOrdens, 
  tempoMedioRegularizacaoCompra,
  numItensNFCompra
}) {
  const currentYear = new Date().getFullYear();
  const hoje = new Date();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Cálculo de período anterior (30 dias atrás)
  const mesAtual = hoje.getMonth();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoMesAnterior = mesAtual === 0 ? currentYear - 1 : currentYear;
  
  // Filtrar OS do mês atual
  const osAtual = filteredOrdens.filter(os => {
    const dataCreated = new Date(os.created_date);
    return dataCreated.getFullYear() === currentYear && dataCreated.getMonth() === mesAtual;
  });
  
  // Filtrar OS do mês anterior
  const osAnterior = filteredOrdens.filter(os => {
    const dataCreated = new Date(os.created_date);
    return dataCreated.getFullYear() === anoMesAnterior && dataCreated.getMonth() === mesAnterior;
  });
  
  // KPI: Total de OS
  const totalOSAtual = osAtual.length;
  const totalOSAnterior = osAnterior.length;
  const variacaoTotalOS = totalOSAnterior > 0 ? (((totalOSAtual - totalOSAnterior) / totalOSAnterior) * 100).toFixed(1) : 0;
  
  // KPI: Nº de Itens
  const numItensAtual = osAtual.reduce((sum, os) => {
    const itensExpedicao = (os.itens_documento || []).length;
    const itensRecebimento = (os.nfe_itens_conferencia || []).length;
    return sum + itensExpedicao + itensRecebimento;
  }, 0);
  
  const numItensAnterior = osAnterior.reduce((sum, os) => {
    const itensExpedicao = (os.itens_documento || []).length;
    const itensRecebimento = (os.nfe_itens_conferencia || []).length;
    return sum + itensExpedicao + itensRecebimento;
  }, 0);
  
  const variacaoItens = numItensAnterior > 0 ? (((numItensAtual - numItensAnterior) / numItensAnterior) * 100).toFixed(1) : 0;
  
  // KPI: Valor Total
  const valorTotalAtual = osAtual.reduce((sum, os) => {
    const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
    return sum + valorExpedicao + valorRecebimento;
  }, 0);
  
  const valorTotalAnterior = osAnterior.reduce((sum, os) => {
    const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
    return sum + valorExpedicao + valorRecebimento;
  }, 0);
  
  const variacaoValor = valorTotalAnterior > 0 ? (((valorTotalAtual - valorTotalAnterior) / valorTotalAnterior) * 100).toFixed(1) : 0;
  
  // KPI: Tempo Médio Previsto (apenas informativo, sem comparação histórica confiável)
  const variacaoTempo = 0; // Não há dados históricos suficientes para comparação confiável
  
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
          {/* Nº de Itens */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 255, 0.05), rgba(0, 0, 255, 0.1))' }}></div>
            <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #4169E1 100%)' }}>
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">Nº de Itens</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{(numItensNFCompra || 0).toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Valor Total */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.05), rgba(255, 107, 0, 0.1))' }}></div>
            <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8534 100%)' }}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">Valor Total</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                R$ {(() => {
                  const valorTotal = filteredOrdens.reduce((sum, os) => {
                    const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
                    const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => {
                      return s + (parseFloat(item.valor_total) || 0);
                    }, 0);
                    return sum + valorExpedicao + valorRecebimento;
                  }, 0);
                  return (valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </p>
            </div>
          </div>

          {/* Tempo Médio Previsto */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1))' }}></div>
            <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>
                  <Timer className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">Tempo Médio Previsto</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {Math.abs(tempoMedioRegularizacaoCompra).toFixed(1)} <span className="text-lg">dias</span>
              </p>
            </div>
          </div>

          {/* Total de OS */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(160, 180, 210, 0.05), rgba(160, 180, 210, 0.1))' }}></div>
            <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A0B4D2 0%, #B8C9DE 100%)' }}>
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">Total de OS</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{filteredOrdens.length}</p>
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