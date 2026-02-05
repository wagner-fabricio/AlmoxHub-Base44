import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, Clock, Users, TrendingUp, Package, Shield } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function DashboardInsights({ ordens, pessoas, categorias }) {
  // Identificar categoria de Expedição
  const categoriaExpedicao = categorias?.find(c => c.nome?.toLowerCase().includes('expedi'));

  // 1. Expedições com risco de atraso (próximas 7 dias)
  const expedicoesRisco = ordens.filter(os => 
    os.categoria_id === categoriaExpedicao?.id &&
    os.prazo && 
    os.status !== 'concluido' && 
    os.status !== 'cancelado' &&
    differenceInDays(new Date(os.prazo), new Date()) >= 0 &&
    differenceInDays(new Date(os.prazo), new Date()) <= 7
  );

  // 2. Ordens atrasadas
  const ordensAtrasadas = ordens.filter(os => 
    os.prazo && 
    os.status !== 'concluido' && 
    os.status !== 'cancelado' &&
    new Date(os.prazo) < new Date()
  );

  // 3. Ordens paradas (sem atualização há mais de 7 dias)
  const ordensParadas = ordens.filter(os =>
    os.status !== 'concluido' && 
    os.status !== 'cancelado' &&
    os.updated_date && 
    differenceInDays(new Date(), new Date(os.updated_date)) > 7
  );

  // 4. Responsáveis sobrecarregados
  const osAtivas = ordens.filter(os => os.status === 'elaboracao' || os.status === 'execucao');
  const osPorLider = {};
  osAtivas.forEach(os => {
    if (os.lider_id) {
      osPorLider[os.lider_id] = (osPorLider[os.lider_id] || 0) + 1;
    }
  });
  const mediaOSPorLider = Object.values(osPorLider).length > 0 
    ? Object.values(osPorLider).reduce((a, b) => a + b, 0) / Object.values(osPorLider).length 
    : 0;
  const lideresComCargaAlta = Object.entries(osPorLider)
    .filter(([id, count]) => count > mediaOSPorLider * 1.5)
    .map(([id]) => id);

  // 5. Expedições sem seguro
  const expedicoesSemSeguro = ordens.filter(os => 
    os.categoria_id === categoriaExpedicao?.id &&
    os.status !== 'concluido' && 
    os.status !== 'cancelado' &&
    os.detalhamento_expedicao?.some(exp => !exp.usar_seguro)
  );

  // 6. Expedições sem transporte definido
  const expedicoesSemTransporte = ordens.filter(os => 
    os.categoria_id === categoriaExpedicao?.id &&
    os.status !== 'concluido' && 
    os.status !== 'cancelado' &&
    (!os.detalhamento_expedicao || os.detalhamento_expedicao.length === 0)
  );

  const insights = [
    {
      id: 'expedicoes-risco',
      title: 'Expedições com Risco de Atraso',
      description: `${expedicoesRisco.length} expedições com prazo nos próximos 7 dias`,
      value: expedicoesRisco.length,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      iconColor: 'text-orange-600',
      show: expedicoesRisco.length > 0,
      severity: 'medium',
      link: createPageUrl('OrdensServico')
    },
    {
      id: 'ordens-atrasadas',
      title: 'Ordens Atrasadas',
      description: `${ordensAtrasadas.length} ordens ultrapassaram o prazo`,
      value: ordensAtrasadas.length,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconColor: 'text-red-600',
      show: ordensAtrasadas.length > 0,
      severity: 'high',
      link: createPageUrl('OrdensServico')
    },
    {
      id: 'ordens-paradas',
      title: 'Ordens sem Movimentação',
      description: `${ordensParadas.length} ordens sem atualização há mais de 7 dias`,
      value: ordensParadas.length,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600',
      show: ordensParadas.length > 0,
      severity: 'medium',
      link: createPageUrl('OrdensServico')
    },
    {
      id: 'lideres-sobrecarregados',
      title: 'Responsáveis Sobrecarregados',
      description: `${lideresComCargaAlta.length} responsáveis com carga acima da média`,
      value: lideresComCargaAlta.length,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600',
      show: lideresComCargaAlta.length > 0,
      severity: 'medium',
      link: createPageUrl('Pessoas')
    },
    {
      id: 'expedicoes-sem-seguro',
      title: 'Expedições sem Seguro',
      description: `${expedicoesSemSeguro.length} expedições sem cobertura ativada`,
      value: expedicoesSemSeguro.length,
      icon: <Shield className="w-5 h-5" />,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600',
      show: expedicoesSemSeguro.length > 0,
      severity: 'medium',
      link: createPageUrl('OrdensServico')
    },
    {
      id: 'expedicoes-sem-transporte',
      title: 'Expedições sem Transporte',
      description: `${expedicoesSemTransporte.length} expedições sem definição de transporte`,
      value: expedicoesSemTransporte.length,
      icon: <Package className="w-5 h-5" />,
      color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
      iconColor: 'text-indigo-600',
      show: expedicoesSemTransporte.length > 0,
      severity: 'medium',
      link: createPageUrl('OrdensServico')
    }
  ].filter(insight => insight.show);

  // Ordenar por severidade (high > medium > low)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Observações</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Análises automáticas baseadas nos dados atuais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <Link key={insight.id} to={insight.link}>
            <Card className={`${insight.color} border-2 hover:shadow-lg transition-all cursor-pointer h-full`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                    {insight.title}
                  </CardTitle>
                </div>
                <div className={`${insight.iconColor}`}>
                  {insight.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-2 ${insight.iconColor}`}>
                  {insight.value}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {insight.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}