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
    <div className="space-y-8">
      {/* Seção Volumetrias */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-6 h-6" style={{ color: '#0000FF' }} />
          Volumetrias
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nº de Itens */}
          <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#0000FF' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8" style={{ color: '#0000FF' }} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Nº de Itens</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{(numItensNFCompra || 0).toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#FF6B00' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8" style={{ color: '#FF6B00' }} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Valor Total</p>
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
            </CardContent>
          </Card>

          {/* Tempo Médio Previsto */}
          <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#10B981' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Timer className="w-8 h-8" style={{ color: '#10B981' }} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Tempo Médio Previsto</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {Math.abs(tempoMedioRegularizacaoCompra).toFixed(1)} dias
              </p>
            </CardContent>
          </Card>

          {/* Total de OS */}
          <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#A0B4D2' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <ClipboardList className="w-8 h-8" style={{ color: '#A0B4D2' }} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Total de OS</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{filteredOrdens.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção Resultados Mensais - OS */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" style={{ color: '#0000FF' }} />
          Resultados Mensais - Ordens de Serviço
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras Mensais */}
          <Card className="bg-white dark:bg-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Total de OS por Prazo - Ano Corrente</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dadosMensaisOS} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Bar dataKey="No Prazo" stackId="total" fill="#22c55e">
                    <LabelList position="center" content={(props) => {
                      const { x, y, width, height, value } = props;
                      const total = dadosMensaisOS[props.index]['No Prazo'] + dadosMensaisOS[props.index]['Fora do Prazo'];
                      if (total === 0 || value === 0) return null;
                      const percent = ((value / total) * 100).toFixed(0);
                      return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600">{percent}%</text>;
                    }} />
                  </Bar>
                  <Bar dataKey="Fora do Prazo" stackId="total" fill="#ef4444" radius={[4, 4, 0, 0]}>
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
            </CardContent>
          </Card>

          {/* Gráfico de Rosca - Total Anual */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Resumo Anual por Prazo</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <div className="mt-6 space-y-2 w-full px-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-600 dark:text-slate-400">No Prazo</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{totalNoPrazo}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-slate-600 dark:text-slate-400">Fora do Prazo</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{totalForaPrazo}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}