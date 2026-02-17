import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, TrendingUp, TrendingDown, Clock, CheckCircle, Target, Award, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0000FF', '#0A003C', '#A0B4D2', '#3B82F6', '#8B5CF6'];

export default function MeuDesempenhoMobile({ onClose, minhasOS, todasOS, pessoas, categorias, almoxarifados, regionais, currentPessoaId }) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    calcularMetricas();
  }, [minhasOS, todasOS, mesAtual]);

  const calcularMetricas = () => {
    const inicioMesAtual = startOfMonth(mesAtual);
    const fimMesAtual = endOfMonth(mesAtual);
    const inicioMesAnterior = startOfMonth(subMonths(mesAtual, 1));
    const fimMesAnterior = endOfMonth(subMonths(mesAtual, 1));

    // Minhas OS
    const minhasOSMesAtual = minhasOS.filter(os => {
      const dataCriacao = new Date(os.created_date);
      return dataCriacao >= inicioMesAtual && dataCriacao <= fimMesAtual;
    });

    const minhasOSMesAnterior = minhasOS.filter(os => {
      const dataCriacao = new Date(os.created_date);
      return dataCriacao >= inicioMesAnterior && dataCriacao <= fimMesAnterior;
    });

    // Filtrar pessoas do mesmo almoxarifado
    const pessoaAtual = pessoas.find(p => p.id === currentPessoaId);
    const pessoasMesmoAlmoxarifado = pessoas.filter(p => 
      p.almoxarifados_ids?.some(almoxId => pessoaAtual?.almoxarifados_ids?.includes(almoxId))
    );

    // OS do almoxarifado
    const osAlmoxarifado = todasOS.filter(os => 
      pessoasMesmoAlmoxarifado.some(p => os.lider_id === p.id || (os.executores_ids || []).includes(p.id))
    );

    const osAlmoxarifadoMesAtual = osAlmoxarifado.filter(os => {
      const dataCriacao = new Date(os.created_date);
      return dataCriacao >= inicioMesAtual && dataCriacao <= fimMesAtual;
    });

    // Calcular tempo médio de conclusão (apenas OS concluídas)
    const minhasOSConcluidas = minhasOS.filter(os => os.status === 'concluido' && os.data_conclusao);
    const tempoMedioProprio = minhasOSConcluidas.length > 0
      ? minhasOSConcluidas.reduce((acc, os) => {
          const inicio = new Date(os.created_date);
          const fim = new Date(os.data_conclusao);
          return acc + differenceInDays(fim, inicio);
        }, 0) / minhasOSConcluidas.length
      : 0;

    const osAlmoxarifadoConcluidas = osAlmoxarifado.filter(os => os.status === 'concluido' && os.data_conclusao);
    const tempoMedioAlmoxarifado = osAlmoxarifadoConcluidas.length > 0
      ? osAlmoxarifadoConcluidas.reduce((acc, os) => {
          const inicio = new Date(os.created_date);
          const fim = new Date(os.data_conclusao);
          return acc + differenceInDays(fim, inicio);
        }, 0) / osAlmoxarifadoConcluidas.length
      : 0;

    // OS por status (mês atual vs anterior)
    const osPorStatusAtual = {
      elaboracao: minhasOSMesAtual.filter(os => os.status === 'elaboracao').length,
      execucao: minhasOSMesAtual.filter(os => os.status === 'execucao').length,
      concluido: minhasOSMesAtual.filter(os => os.status === 'concluido').length,
      cancelado: minhasOSMesAtual.filter(os => os.status === 'cancelado').length,
    };

    const osPorStatusAnterior = {
      elaboracao: minhasOSMesAnterior.filter(os => os.status === 'elaboracao').length,
      execucao: minhasOSMesAnterior.filter(os => os.status === 'execucao').length,
      concluido: minhasOSMesAnterior.filter(os => os.status === 'concluido').length,
      cancelado: minhasOSMesAnterior.filter(os => os.status === 'cancelado').length,
    };

    // Categorias mais atribuídas
    const categoriasCont = {};
    minhasOS.forEach(os => {
      const categoria = categorias.find(c => c.id === os.categoria_id);
      if (categoria) {
        categoriasCont[categoria.nome] = (categoriasCont[categoria.nome] || 0) + 1;
      }
    });

    const categoriasTop = Object.entries(categoriasCont)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }));

    // Taxa de conclusão
    const taxaConclusao = minhasOS.length > 0 
      ? ((minhasOS.filter(os => os.status === 'concluido').length / minhasOS.length) * 100).toFixed(1)
      : 0;

    setMetricas({
      totalOSMesAtual: minhasOSMesAtual.length,
      totalOSMesAnterior: minhasOSMesAnterior.length,
      tempoMedioProprio: tempoMedioProprio.toFixed(1),
      tempoMedioAlmoxarifado: tempoMedioAlmoxarifado.toFixed(1),
      osPorStatusAtual,
      osPorStatusAnterior,
      categoriasTop,
      taxaConclusao,
      totalOSAlmoxarifadoMesAtual: osAlmoxarifadoMesAtual.length,
    });
  };

  const dadosComparacaoStatus = metricas ? [
    {
      status: 'Elaboração',
      atual: metricas.osPorStatusAtual.elaboracao,
      anterior: metricas.osPorStatusAnterior.elaboracao,
    },
    {
      status: 'Execução',
      atual: metricas.osPorStatusAtual.execucao,
      anterior: metricas.osPorStatusAnterior.execucao,
    },
    {
      status: 'Concluído',
      atual: metricas.osPorStatusAtual.concluido,
      anterior: metricas.osPorStatusAnterior.concluido,
    },
    {
      status: 'Cancelado',
      atual: metricas.osPorStatusAtual.cancelado,
      anterior: metricas.osPorStatusAnterior.cancelado,
    },
  ] : [];

  const variacao = metricas && metricas.totalOSMesAnterior > 0 
    ? ((metricas.totalOSMesAtual - metricas.totalOSMesAnterior) / metricas.totalOSMesAnterior * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">Meu Desempenho</h2>
              <p className="text-xs text-white/80">{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</p>
            </div>
          </div>
          <Award className="w-8 h-8 text-white/90" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4 pb-20">
        {!metricas ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-white/90" />
                    <p className="text-xs text-white/90 font-medium">OS Atribuídas</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{metricas.totalOSMesAtual}</p>
                    {variacao !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        variacao > 0 ? 'text-green-200' : 'text-red-200'
                      }`}>
                        {variacao > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(variacao)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-white/90" />
                    <p className="text-xs text-white/90 font-medium">Taxa Conclusão</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{metricas.taxaConclusao}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Tempo Médio de Atendimento */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Tempo Médio de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Seu Tempo</p>
                      <p className="text-2xl font-bold text-blue-600">{metricas.tempoMedioProprio} dias</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Média do Almoxarifado</p>
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{metricas.tempoMedioAlmoxarifado} dias</p>
                    </div>
                  </div>
                  {metricas.tempoMedioProprio < metricas.tempoMedioAlmoxarifado && metricas.tempoMedioProprio > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                      <span>Você está {((1 - metricas.tempoMedioProprio / metricas.tempoMedioAlmoxarifado) * 100).toFixed(0)}% mais rápido que a média!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* OS por Status - Comparação Mensal */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  OS por Status
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Comparação: {format(subMonths(mesAtual, 1), 'MMM', { locale: ptBR })} vs {format(mesAtual, 'MMM', { locale: ptBR })}
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosComparacaoStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="status" 
                      tick={{ fontSize: 11 }}
                      stroke="#64748b"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      stroke="#64748b"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => value === 'atual' ? 'Mês Atual' : 'Mês Anterior'}
                    />
                    <Bar dataKey="anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atual" fill="#0000FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Categorias Mais Atribuídas */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Categorias Mais Atribuídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricas.categoriasTop.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma OS atribuída ainda</p>
                ) : (
                  <div className="space-y-3">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={metricas.categoriasTop}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="quantidade"
                        >
                          {metricas.categoriasTop.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {metricas.categoriasTop.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.nome}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{cat.quantidade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produtividade vs Almoxarifado */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Produtividade no Almoxarifado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Minhas OS (mês atual)</p>
                      <p className="text-3xl font-bold text-blue-600">{metricas.totalOSMesAtual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total do Almoxarifado</p>
                      <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">{metricas.totalOSAlmoxarifadoMesAtual}</p>
                    </div>
                  </div>
                  {metricas.totalOSAlmoxarifadoMesAtual > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Sua contribuição</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((metricas.totalOSMesAtual / metricas.totalOSAlmoxarifadoMesAtual) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-right text-sm font-bold text-blue-600">
                        {((metricas.totalOSMesAtual / metricas.totalOSAlmoxarifadoMesAtual) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}