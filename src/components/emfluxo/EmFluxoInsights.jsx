import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertCircle, Clock, CheckCircle2, Calendar, Flag } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function EmFluxoInsights({ minhasOS, currentUserId }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Tarefas vencendo hoje
  const tarefasVencemHoje = minhasOS.filter(os => {
    if (!os.prazo || os.status === 'concluido' || os.status === 'cancelado') return false;
    const prazo = new Date(os.prazo);
    prazo.setHours(0, 0, 0, 0);
    return prazo.getTime() === hoje.getTime();
  });

  // 2. Tarefas atrasadas
  const tarefasAtrasadas = minhasOS.filter(os => {
    if (!os.prazo || os.status === 'concluido' || os.status === 'cancelado') return false;
    return new Date(os.prazo) < hoje;
  });

  // 3. Tarefas próximas (próximos 3 dias)
  const tarefasProximas = minhasOS.filter(os => {
    if (!os.prazo || os.status === 'concluido' || os.status === 'cancelado') return false;
    const prazo = new Date(os.prazo);
    const diff = differenceInDays(prazo, hoje);
    return diff > 0 && diff <= 3;
  });

  // 4. Tarefas em elaboração (aguardando início)
  const tarefasAguardandoInicio = minhasOS.filter(os => 
    os.status === 'elaboracao'
  );

  // 5. Tarefas de alta prioridade em execução
  const tarefasAltaPrioridade = minhasOS.filter(os =>
    os.prioridade === 'alta' || os.prioridade === 'urgente' &&
    os.status === 'execucao'
  );

  // 6. Tarefas próximas de finalizar (progresso >= 80%)
  const tarefasQuaseConcluidas = minhasOS.filter(os =>
    os.status === 'execucao' &&
    (os.progresso || 0) >= 80
  );

  const insights = [
    {
      id: 'vence-hoje',
      title: 'Vence Hoje',
      description: tarefasVencemHoje.length === 1 ? '1 tarefa com prazo para hoje' : `${tarefasVencemHoje.length} tarefas com prazo para hoje`,
      value: tarefasVencemHoje.length,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconColor: 'text-red-600',
      show: tarefasVencemHoje.length > 0,
      severity: 'high'
    },
    {
      id: 'atrasadas',
      title: 'Tarefas Atrasadas',
      description: tarefasAtrasadas.length === 1 ? '1 tarefa vencida' : `${tarefasAtrasadas.length} tarefas vencidas`,
      value: tarefasAtrasadas.length,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      iconColor: 'text-orange-600',
      show: tarefasAtrasadas.length > 0,
      severity: 'high'
    },
    {
      id: 'proximas',
      title: 'Próximos 3 Dias',
      description: tarefasProximas.length === 1 ? '1 tarefa próxima do prazo' : `${tarefasProximas.length} tarefas próximas do prazo`,
      value: tarefasProximas.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600',
      show: tarefasProximas.length > 0,
      severity: 'medium'
    },
    {
      id: 'aguardando-inicio',
      title: 'Aguardando Início',
      description: tarefasAguardandoInicio.length === 1 ? '1 tarefa em elaboração' : `${tarefasAguardandoInicio.length} tarefas em elaboração`,
      value: tarefasAguardandoInicio.length,
      icon: <Flag className="w-5 h-5" />,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600',
      show: tarefasAguardandoInicio.length > 0,
      severity: 'medium'
    },
    {
      id: 'alta-prioridade',
      title: 'Alta Prioridade',
      description: tarefasAltaPrioridade.length === 1 ? '1 tarefa urgente em execução' : `${tarefasAltaPrioridade.length} tarefas urgentes em execução`,
      value: tarefasAltaPrioridade.length,
      icon: <Flag className="w-5 h-5" />,
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600',
      show: tarefasAltaPrioridade.length > 0,
      severity: 'medium'
    },
    {
      id: 'quase-concluidas',
      title: 'Quase Concluídas',
      description: tarefasQuaseConcluidas.length === 1 ? '1 tarefa próxima de finalizar' : `${tarefasQuaseConcluidas.length} tarefas próximas de finalizar`,
      value: tarefasQuaseConcluidas.length,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconColor: 'text-green-600',
      show: tarefasQuaseConcluidas.length > 0,
      severity: 'low'
    }
  ].filter(insight => insight.show);

  // Ordenar por severidade
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Alertas e lembretes das suas tarefas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={`${insight.color} border-2 h-full`}>
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
        ))}
      </div>
    </div>
  );
}