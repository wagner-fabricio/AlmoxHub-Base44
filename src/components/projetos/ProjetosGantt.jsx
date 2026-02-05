import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Loader2, 
  AlertTriangle,
  Filter,
  X,
  FolderKanban
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, addMonths, isToday, differenceInDays } from 'date-fns';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'bg-slate-300', label: 'Não iniciado' },
  execucao: { icon: Loader2, color: 'bg-blue-500', label: 'Em andamento' },
  concluido: { icon: CheckCircle, color: 'bg-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'bg-red-500', label: 'Cancelado' },
};

export default function ProjetosGantt({ 
  projetos, 
  ordens, 
  pessoas,
  categorias,
  onOpenOS 
}) {
  const [expandedProjetos, setExpandedProjetos] = useState(new Set());
  const [zoom, setZoom] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle expansão de projeto
  const toggleExpanded = (projetoId) => {
    const newExpanded = new Set(expandedProjetos);
    if (newExpanded.has(projetoId)) {
      newExpanded.delete(projetoId);
    } else {
      newExpanded.add(projetoId);
    }
    setExpandedProjetos(newExpanded);
  };

  // Calcular timeline range
  const timelineRange = useMemo(() => {
    if (!Array.isArray(ordens) || ordens.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(addMonths(now, 3))
      };
    }

    const allDates = ordens
      .filter(os => os?.data_inicial || os?.prazo)
      .flatMap(os => [os?.data_inicial, os?.prazo].filter(Boolean).map(d => new Date(d)));

    if (allDates.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(addMonths(now, 3))
      };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    return {
      start: startOfMonth(addMonths(minDate, -1)),
      end: endOfMonth(addMonths(maxDate, 1))
    };
  }, [ordens]);

  // Gerar células da timeline
  const timelineCells = useMemo(() => {
    const { start, end } = timelineRange;
    
    if (zoom === 'day') {
      return eachDayOfInterval({ start, end });
    } else if (zoom === 'week') {
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    } else {
      return eachMonthOfInterval({ start, end });
    }
  }, [timelineRange, zoom]);

  // Calcular largura da célula
  const cellWidth = zoom === 'day' ? 40 : zoom === 'week' ? 80 : 120;

  // Aplicar filtros
  const filteredProjetos = useMemo(() => {
    if (!Array.isArray(projetos)) return [];
    return projetos.filter(projeto => {
      if (!projeto) return false;
      if (searchTerm && !projeto?.nome?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [projetos, searchTerm]);

  const getFilteredOrdens = (projetoId) => {
    if (!Array.isArray(ordens)) return [];
    return ordens.filter(os => os?.projetos_ids?.includes(projetoId));
  };

  // Calcular progresso do projeto
  const getProjetoProgress = (projetoId) => {
    const projetoOrdens = getFilteredOrdens(projetoId);
    if (projetoOrdens.length === 0) return 0;

    const totalProgress = projetoOrdens.reduce((sum, os) => sum + (os.progresso || 0), 0);
    return Math.round(totalProgress / projetoOrdens.length);
  };

  // Calcular posição e largura da barra
  const getBarStyle = (os) => {
    if (!os.data_inicial && !os.prazo) return null;

    const start = os.data_inicial ? new Date(os.data_inicial) : new Date(os.prazo);
    const end = os.prazo ? new Date(os.prazo) : new Date(os.data_inicial);

    const { start: timelineStart } = timelineRange;
    const offsetDays = differenceInDays(start, timelineStart);
    const durationDays = Math.max(1, differenceInDays(end, start));

    const divisor = zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30;
    const left = (offsetDays / divisor) * cellWidth;
    const width = (durationDays / divisor) * cellWidth;

    return { left, width };
  };

  // Determinar cor da barra
  const getBarColor = (os) => {
    if (os.status === 'concluido') return 'bg-green-500';
    if (os.status === 'cancelado') return 'bg-red-500';
    
    const now = new Date();
    const prazo = os.prazo ? new Date(os.prazo) : null;
    
    if (prazo && prazo < now && os.status !== 'concluido') {
      return 'bg-red-600';
    }
    
    if (os.status === 'execucao') return 'bg-blue-500';
    return 'bg-slate-400';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header com controles */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 flex-1">
          <Input
            placeholder="Filtrar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom('day')} className={zoom === 'day' ? 'bg-slate-100' : ''}>
            Dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom('week')} className={zoom === 'week' ? 'bg-slate-100' : ''}>
            Semanas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom('month')} className={zoom === 'month' ? 'bg-slate-100' : ''}>
            Meses
          </Button>
        </div>
      </div>

      {/* Área principal: Lista + Timeline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel Esquerdo - Lista */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-semibold text-sm">
            Projetos / Ordens
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredProjetos.map(projeto => {
                const projetoOrdens = getFilteredOrdens(projeto.id);
                const isExpanded = expandedProjetos.has(projeto.id);
                const progress = getProjetoProgress(projeto.id);

                return (
                  <div key={projeto.id}>
                    {/* Linha do Projeto */}
                    <div 
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer"
                      onClick={() => toggleExpanded(projeto.id)}
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${projeto.cor}20` }}
                      >
                        <FolderKanban className="w-3 h-3" style={{ color: projeto.cor }} />
                      </div>
                      <span className="font-medium text-sm flex-1 truncate">{projeto.nome}</span>
                      <span className="text-xs text-slate-500">{progress}%</span>
                    </div>

                    {/* Ordens do Projeto */}
                    {isExpanded && projetoOrdens.map(os => {
                      const StatusIcon = statusConfig[os.status]?.icon || Clock;
                      const lider = os.lider_id && Array.isArray(pessoas) ? pessoas.find(p => p?.id === os.lider_id) : null;

                      return (
                        <div 
                          key={os.id}
                          className="flex items-center gap-2 p-2 pl-10 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer text-sm"
                          onClick={() => onOpenOS?.(os)}
                        >
                          <StatusIcon className={`w-4 h-4 ${statusConfig[os.status]?.color === 'bg-green-500' ? 'text-green-500' : 'text-slate-400'}`} />
                          <span className="flex-1 truncate">{os.codigo}</span>
                          {lider && (
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {lider.nome?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {os.status === 'concluido' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel Direito - Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header da Timeline */}
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto">
            <div className="flex" style={{ minWidth: `${timelineCells.length * cellWidth}px` }}>
              {timelineCells.map((date, idx) => (
                <div 
                  key={idx} 
                  className="text-xs text-center font-medium py-2 border-r border-slate-200 dark:border-slate-700"
                  style={{ width: cellWidth }}
                >
                  {zoom === 'day' && format(date, 'dd/MM')}
                  {zoom === 'week' && format(date, "dd/MM")}
                  {zoom === 'month' && format(date, 'MM/yyyy')}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline com barras */}
          <div className="flex-1 relative overflow-auto">
            <div className="relative" style={{ minWidth: `${timelineCells.length * cellWidth}px` }}>
              {/* Grid de fundo */}
              <div className="absolute inset-0 flex">
                {timelineCells.map((date, idx) => (
                  <div 
                    key={idx}
                    className={`border-r border-slate-100 dark:border-slate-700 ${isToday(date) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                    style={{ width: cellWidth }}
                  />
                ))}
              </div>

              {/* Linha vertical "hoje" */}
              {(() => {
                const today = new Date();
                const { start: timelineStart } = timelineRange;
                const offsetDays = differenceInDays(today, timelineStart);
                const todayLeft = (offsetDays / (zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30)) * cellWidth;
                
                return (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: todayLeft }}
                  />
                );
              })()}

              {/* Barras das tarefas */}
              <div className="relative space-y-1 py-2">
                {filteredProjetos.map(projeto => {
                  const projetoOrdens = getFilteredOrdens(projeto.id);
                  const isExpanded = expandedProjetos.has(projeto.id);

                  return (
                    <div key={projeto.id}>
                      {/* Linha do projeto (vazia, só espaço) */}
                      <div className="h-9" />

                      {/* Barras das ordens */}
                      {isExpanded && projetoOrdens.map(os => {
                        const barStyle = getBarStyle(os);
                        const barColor = getBarColor(os);

                        return (
                          <div key={os.id} className="relative h-9 px-1">
                            {barStyle && (
                              <div
                                className={`absolute h-6 rounded ${barColor} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
                                style={{ 
                                  left: barStyle.left,
                                  width: Math.max(barStyle.width, 20)
                                }}
                                onClick={() => onOpenOS?.(os)}
                              >
                                <span className="text-xs text-white font-medium px-2 truncate">
                                  {os.progresso || 0}%
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}