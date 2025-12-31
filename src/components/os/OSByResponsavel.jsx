import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, Plus, Clock, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function OSByResponsavel({ ordensServico, pessoas, onSelectOS, onNovaOS }) {
  const [expandedResponsavel, setExpandedResponsavel] = useState({});
  const [expandedStatus, setExpandedStatus] = useState({});

  // Agrupar OSs por responsável
  const osPorResponsavel = useMemo(() => {
    if (!Array.isArray(ordensServico) || !Array.isArray(pessoas)) return [];

    const grupos = {};

    // Incluir todos os líderes
    pessoas.forEach(pessoa => {
      if (Array.isArray(pessoa.funcoes) && pessoa.funcoes.includes('lider')) {
        grupos[pessoa.id] = {
          pessoa,
          oss: []
        };
      }
    });

    // Agrupar OSs
    ordensServico.forEach(os => {
      if (os.lider_id) {
        if (!grupos[os.lider_id]) {
          grupos[os.lider_id] = {
            pessoa: pessoas.find(p => p.id === os.lider_id),
            oss: []
          };
        }
        grupos[os.lider_id].oss.push(os);
      }
    });

    // Calcular métricas para cada responsável
    return Object.values(grupos).map(grupo => {
      const oss = grupo.oss;
      const total = oss.length;
      const concluidas = oss.filter(os => os.status === 'concluido').length;
      const incompletas = total - concluidas;
      const hoje = new Date();
      const atrasadas = oss.filter(os => {
        if (os.status === 'concluido') return false;
        if (!os.prazo) return false;
        return new Date(os.prazo) < hoje;
      }).length;

      // Agrupar por status
      const porStatus = {
        elaboracao: oss.filter(os => os.status === 'elaboracao'),
        execucao: oss.filter(os => os.status === 'execucao'),
        atrasadas: oss.filter(os => {
          if (os.status === 'concluido') return false;
          if (!os.prazo) return false;
          return new Date(os.prazo) < hoje;
        }),
        concluido: oss.filter(os => os.status === 'concluido')
      };

      return {
        ...grupo,
        total,
        concluidas,
        incompletas,
        atrasadas,
        porcentagem: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        porStatus
      };
    }).sort((a, b) => b.total - a.total);
  }, [ordensServico, pessoas]);

  const toggleResponsavel = (responsavelId) => {
    setExpandedResponsavel(prev => ({
      ...prev,
      [responsavelId]: !prev[responsavelId]
    }));
  };

  const toggleStatus = (responsavelId, status) => {
    const key = `${responsavelId}-${status}`;
    setExpandedStatus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const statusConfig = {
    elaboracao: {
      label: 'Pendentes',
      icon: Clock,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-700'
    },
    execucao: {
      label: 'Em Andamento',
      icon: PlayCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    atrasadas: {
      label: 'Atrasadas',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900'
    },
    concluido: {
      label: 'Concluídas',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900'
    }
  };

  if (osPorResponsavel.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma ordem de serviço atribuída a líderes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {osPorResponsavel.map((grupo) => {
        const pessoa = grupo.pessoa;
        const isExpanded = expandedResponsavel[pessoa?.id];

        return (
          <Card key={pessoa?.id} className="flex flex-col h-fit">
            <CardHeader className="pb-3">
              {/* Cabeçalho com avatar e nome */}
              <div className="flex items-center gap-3 mb-3">
                {pessoa?.foto_perfil ? (
                  <img
                    src={pessoa.foto_perfil}
                    alt={pessoa.nome}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {pessoa?.nome?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {pessoa?.nome || 'Responsável'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {grupo.total} {grupo.total === 1 ? 'ordem' : 'ordens'}
                  </p>
                </div>
              </div>

              {/* Indicadores */}
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
                  {grupo.incompletas} incompletas
                </Badge>
                {grupo.atrasadas > 0 && (
                  <Badge variant="destructive">
                    {grupo.atrasadas} {grupo.atrasadas === 1 ? 'atrasada' : 'atrasadas'}
                  </Badge>
                )}
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {grupo.porcentagem}%
                  </span>
                </div>
                <Progress value={grupo.porcentagem} className="h-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {grupo.concluidas} de {grupo.total} concluídas
                </p>
              </div>

              {/* Botão adicionar OS */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => onNovaOS?.(pessoa)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ordem de serviço
              </Button>

              {/* Toggle expandir/recolher */}
              {grupo.total > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => toggleResponsavel(pessoa?.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Recolher ordens
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Ver ordens
                    </>
                  )}
                </Button>
              )}
            </CardHeader>

            {/* Lista de OSs expandida */}
            {isExpanded && (
              <CardContent className="pt-0 space-y-3">
                {Object.entries(statusConfig).map(([statusKey, config]) => {
                  const oss = grupo.porStatus[statusKey];
                  if (!oss || oss.length === 0) return null;

                  const isStatusExpanded = expandedStatus[`${pessoa?.id}-${statusKey}`];
                  const Icon = config.icon;

                  return (
                    <div key={statusKey} className="border-t pt-3">
                      <button
                        onClick={() => toggleStatus(pessoa?.id, statusKey)}
                        className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {config.label}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {oss.length}
                          </Badge>
                        </div>
                        {isStatusExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {isStatusExpanded && (
                        <div className="mt-2 space-y-1">
                          {oss.map((os) => (
                            <button
                              key={os.id}
                              onClick={() => onSelectOS(os)}
                              className={`w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${config.bgColor} bg-opacity-30`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {os.codigo}
                                  </p>
                                  {os.prazo && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Prazo: {format(new Date(os.prazo), 'dd/MM/yyyy')}
                                    </p>
                                  )}
                                </div>
                                {os.progresso !== undefined && (
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">
                                    {os.progresso}%
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}