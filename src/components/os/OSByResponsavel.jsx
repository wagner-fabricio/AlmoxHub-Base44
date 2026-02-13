import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Plus, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function OSByResponsavel({ ordensServico, pessoas, onSelectOS, onNovaOS, filteredOrdens }) {
  const [expandedStatus, setExpandedStatus] = useState({});
  
  // Usar as OSs filtradas se fornecidas, senão usar todas
  const ordensParaUsar = filteredOrdens || ordensServico;

  // Agrupar OSs por responsável
  const osPorResponsavel = useMemo(() => {
    if (!Array.isArray(ordensParaUsar) || !Array.isArray(pessoas)) return [];

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
    ordensParaUsar.forEach(os => {
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
      const incompletasList = oss.filter(os => os.status === 'elaboracao' || os.status === 'execucao');
      const atrasadasList = oss.filter(os => {
        if (os.status === 'concluido') return false;
        if (!os.prazo) return false;
        return new Date(os.prazo) < hoje;
      });
      const concluidasList = oss.filter(os => os.status === 'concluido');
      
      const porStatus = {
        incompleto: incompletasList,
        atrasadas: atrasadasList,
        concluido: concluidasList
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
    }).filter(grupo => grupo.total > 0).sort((a, b) => b.total - a.total);
  }, [ordensParaUsar, pessoas]);

  const toggleStatus = (responsavelId, status) => {
    const key = `${responsavelId}-${status}`;
    setExpandedStatus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const statusConfig = {
    incompleto: {
      label: 'Incompleto',
      icon: Clock,
      color: 'text-slate-600 dark:text-slate-400'
    },
    atrasadas: {
      label: 'Atrasadas',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400'
    },
    concluido: {
      label: 'Concluída',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400'
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
    <div className="flex gap-4 overflow-x-auto pb-4">
      {osPorResponsavel.map((grupo) => {
        const pessoa = grupo.pessoa;

        return (
          <Card key={pessoa?.id} className="flex flex-col shrink-0 w-80">
            {/* Header - Avatar e nome */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {pessoa?.foto_perfil ? (
                  <img
                    src={pessoa.foto_perfil}
                    alt={pessoa.nome}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                      {pessoa?.nome?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                    {pessoa?.nome || 'Responsável'}
                  </h3>
                </div>
              </div>
              
              {/* Contadores de status */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {grupo.incompletas}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Incompleto
                  </div>
                </div>
                <div className="flex-1 text-center border-l border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {grupo.atrasadas}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Atrasadas
                  </div>
                </div>
              </div>
            </div>

            {/* Botão adicionar tarefa */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                onClick={() => onNovaOS?.(pessoa)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar tarefa
              </Button>
            </div>

            {/* Lista de OSs por status - sempre expandido */}
            <div className="flex-1 overflow-auto max-h-[600px]">
              {Object.entries(statusConfig).map(([statusKey, config]) => {
                const oss = grupo.porStatus[statusKey];
                if (!oss || oss.length === 0) return null;

                const isStatusExpanded = expandedStatus[`${pessoa?.id}-${statusKey}`] ?? true;
                const Icon = config.icon;

                return (
                  <div key={statusKey} className="border-b border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => toggleStatus(pessoa?.id, statusKey)}
                      className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isStatusExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                          {config.label}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {oss.length}
                      </Badge>
                    </button>

                    {isStatusExpanded && (
                      <div className="pb-2">
                        {oss.map((os) => (
                          <button
                            key={os.id}
                            onClick={() => onSelectOS(os)}
                            className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <Checkbox 
                              checked={os.status === 'concluido'}
                              className="mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm text-slate-900 dark:text-white leading-tight ${
                                os.status === 'concluido' ? 'line-through opacity-60' : ''
                              }`}>
                                {os.codigo}
                              </p>
                              {os.prazo && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {format(new Date(os.prazo), 'dd/MM/yyyy')}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}