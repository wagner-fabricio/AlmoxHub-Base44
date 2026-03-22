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
  
  // Dados mensais para OS — contagem de OS (para o gráfico de barras por quantidade)
  const dadosMensaisOSContagem = meses.map((mes, index) => {
    const osMes = filteredOrdens.filter(os => {
      const dataCreated = new Date(os.created_date);
      return dataCreated.getFullYear() === currentYear && dataCreated.getMonth() === index;
    });
    return {
      mes,
      'No Prazo': osMes.filter(os => isNoPrazo(os, hoje)).length,
      'Fora do Prazo': osMes.filter(os => isForaPrazo(os, hoje)).length,
    };
  });

  // Dados mensais para OS — valores monetários (para o gráfico de evolução de valores)
  const dadosMensaisOS = meses.map((mes, index) => {
    const osMes = filteredOrdens.filter(os => {
      const dataCreated = new Date(os.created_date);
      return dataCreated.getFullYear() === currentYear && dataCreated.getMonth() === index;
    });
    
    const valorNoPrazo = osMes.filter(os => isNoPrazo(os, hoje)).reduce((sum, os) => {
      const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
      const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
      return sum + valorExpedicao + valorRecebimento;
    }, 0);
    
    const valorForaPrazo = osMes.filter(os => isForaPrazo(os, hoje)).reduce((sum, os) => {
      const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
      const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
      return sum + valorExpedicao + valorRecebimento;
    }, 0);
    
    return {
      mes,
      'No Prazo': valorNoPrazo,
      'Fora do Prazo': valorForaPrazo
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
  
  // Valores totais anuais para gráfico de rosca
  const valorTotalNoPrazo = osAnoCorrente.filter(os => isNoPrazo(os, hoje)).reduce((sum, os) => {
    const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
    return sum + valorExpedicao + valorRecebimento;
  }, 0);
  
  const valorTotalForaPrazo = osAnoCorrente.filter(os => isForaPrazo(os, hoje)).reduce((sum, os) => {
    const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
    return sum + valorExpedicao + valorRecebimento;
  }, 0);
  
  const valorTotalAnual = valorTotalNoPrazo + valorTotalForaPrazo;
  const percentualValorNoPrazo = valorTotalAnual > 0 ? ((valorTotalNoPrazo / valorTotalAnual) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Seção Volumetrias */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Volumetrias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nº de Itens */}
          <div 
            className="relative rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
            style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-sm font-medium text-white/90">Nº de Itens</p>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{(numItensNFCompra || 0).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-white/80">
              {variacaoItens >= 0 ? '↑' : '↓'} {Math.abs(variacaoItens)}% vs. ontem
            </p>
          </div>

          {/* Valor Total */}
          <div 
            className="relative rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
            style={{ background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-sm font-medium text-white/90">Valor Total</p>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              R$ {(() => {
                const valorTotal = filteredOrdens.reduce((sum, os) => {
                  const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
                  const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => {
                    return s + (parseFloat(item.valor_total) || 0);
                  }, 0);
                  return sum + valorExpedicao + valorRecebimento;
                }, 0);
                return (valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
              })()}
            </p>
            <p className="text-xs text-white/80">
              {variacaoValor >= 0 ? '↑' : '↓'} {Math.abs(variacaoValor)}% vs. ontem
            </p>
          </div>

          {/* Tempo Médio Previsto */}
          <div 
            className="relative rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-sm font-medium text-white/90">Tempo Médio Previsto</p>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Timer className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {Math.abs(tempoMedioRegularizacaoCompra).toFixed(1)} dias
            </p>
            <p className="text-xs text-white/80">
              Conforme filtros aplicados
            </p>
          </div>

          {/* Total de OS */}
          <div 
            className="relative rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <p className="text-sm font-medium text-white/90">Total de OS</p>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{filteredOrdens.length}</p>
            <p className="text-xs text-white/80">
              {variacaoTotalOS >= 0 ? '↑' : '↓'} {Math.abs(variacaoTotalOS)}% vs. ontem
            </p>
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
              <BarChart data={dadosMensaisOSContagem} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => [`${value} OS`]}
                />
                <Bar dataKey="No Prazo" stackId="total" fill="#22c55e" radius={[0, 0, 0, 0]}>
                  <LabelList position="center" content={(props) => {
                    const { x, y, width, height } = props;
                    const row = dadosMensaisOSContagem[props.index];
                    if (!row) return null;
                    const noPrazo = row['No Prazo'];
                    const total = noPrazo + row['Fora do Prazo'];
                    if (total === 0 || noPrazo === 0 || height < 16) return null;
                    const percent = Math.round((noPrazo / total) * 100);
                    return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700">{percent}%</text>;
                  }} />
                </Bar>
                <Bar dataKey="Fora do Prazo" stackId="total" fill="#ef4444" radius={[8, 8, 0, 0]}>
                  <LabelList position="center" content={(props) => {
                    const { x, y, width, height } = props;
                    const row = dadosMensaisOSContagem[props.index];
                    if (!row) return null;
                    const foraPrazo = row['Fora do Prazo'];
                    const total = row['No Prazo'] + foraPrazo;
                    if (total === 0 || foraPrazo === 0 || height < 16) return null;
                    const percent = Math.round((foraPrazo / total) * 100);
                    return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700">{percent}%</text>;
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

      {/* Seção Evolução Mensal por Valores */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Evolução Mensal - Valores por Prazo
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras Mensais - Valores */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-6">Valor Total de Materiais por Prazo - Ano Corrente</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dadosMensaisOS} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Bar dataKey="No Prazo" stackId="total" fill="#22c55e" radius={[0, 0, 0, 0]}>
                  <LabelList position="center" content={(props) => {
                    const { x, y, width, height } = props;
                    const row = dadosMensaisOS[props.index];
                    if (!row) return null;
                    const noPrazo = row['No Prazo'];
                    const total = noPrazo + row['Fora do Prazo'];
                    if (total === 0 || noPrazo === 0 || height < 16) return null;
                    const percent = Math.round((noPrazo / total) * 100);
                    return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700">{percent}%</text>;
                  }} />
                </Bar>
                <Bar dataKey="Fora do Prazo" stackId="total" fill="#ef4444" radius={[8, 8, 0, 0]}>
                  <LabelList position="center" content={(props) => {
                    const { x, y, width, height } = props;
                    const row = dadosMensaisOS[props.index];
                    if (!row) return null;
                    const foraPrazo = row['Fora do Prazo'];
                    const total = row['No Prazo'] + foraPrazo;
                    if (total === 0 || foraPrazo === 0 || height < 16) return null;
                    const percent = Math.round((foraPrazo / total) * 100);
                    return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700">{percent}%</text>;
                  }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Rosca - Valores Anuais */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50">
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-6">Resumo Anual - Valores</h4>
            {valorTotalAnual === 0 ? (
              <div className="h-96 flex items-center justify-center text-slate-400">Sem dados</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'No Prazo', value: valorTotalNoPrazo, fill: '#22c55e' }, 
                          { name: 'Fora do Prazo', value: valorTotalForaPrazo, fill: '#ef4444' }
                        ]} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={85} 
                        outerRadius={110} 
                        paddingAngle={2} 
                        dataKey="value"
                      >
                        {[{ fill: '#22c55e' }, { fill: '#ef4444' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">{percentualValorNoPrazo}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No Prazo</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 w-full">
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">No Prazo</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      R$ {(valorTotalNoPrazo / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Fora do Prazo</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      R$ {(valorTotalForaPrazo / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}