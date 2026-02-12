import React, { useState, useMemo, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Loader2, 
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval, addMonths, differenceInDays } from 'date-fns';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'bg-slate-300', label: 'Não iniciado' },
  execucao: { icon: Loader2, color: 'bg-blue-500', label: 'Em andamento' },
  concluido: { icon: CheckCircle, color: 'bg-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'bg-red-500', label: 'Cancelado' },
};

// Componente de linha de projeto
const ProjetoRow = memo(({ projeto, isExpanded, onToggle, progress }) => (
  <div 
    className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer"
    onClick={onToggle}
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
));

// Componente de linha de OS
const OSRow = memo(({ os, lider, onOpenOS }) => {
  const StatusIcon = statusConfig[os.status]?.icon || Clock;
  const statusColor = statusConfig[os.status]?.color === 'bg-green-500' ? 'text-green-500' : 'text-slate-400';

  return (
    <div 
      className="flex items-center gap-2 p-2 pl-10 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer text-sm"
      onClick={onOpenOS}
    >
      <StatusIcon className={`w-4 h-4 ${statusColor}`} />
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
});

// Componente de barra do Gantt
const GanttBar = memo(({ os, barStyle, barColor, onOpenOS }) => {
  if (!barStyle) return null;
  
  return (
    <div className="relative h-9 px-1">
      <div
        className={`absolute h-6 rounded ${barColor} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
        style={{ 
          left: barStyle.left,
          width: Math.max(barStyle.width, 20)
        }}
        onClick={onOpenOS}
      >
        <span className="text-xs text-white font-medium px-2 truncate">
          {os.progresso || 0}%
        </span>
      </div>
    </div>
  );
});

function ProjetosGantt({ projetos, ordens, pessoas, onOpenOS }) {
  const [expandedProjetos, setExpandedProjetos] = useState(new Set());
  const [zoom, setZoom] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoizar mapa de pessoas para lookup rápido
  const pessoasMap = useMemo(() => {
    if (!Array.isArray(pessoas)) return new Map();
    return new Map(pessoas.map(p => [p.id, p]));
  }, [pessoas]);

  // Memoizar timeline range
  const timelineRange = useMemo(() => {
    const now = new Date();
    const defaultRange = {
      start: startOfMonth(now),
      end: endOfMonth(addMonths(now, 3))
    };

    if (!Array.isArray(ordens) || ordens.length === 0) return defaultRange;

    const allDates = [];
    for (const os of ordens) {
      if (os?.data_inicial) allDates.push(new Date(os.data_inicial));
      if (os?.prazo) allDates.push(new Date(os.prazo));
    }

    if (allDates.length === 0) return defaultRange;

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    return {
      start: startOfMonth(addMonths(minDate, -1)),
      end: endOfMonth(addMonths(maxDate, 1))
    };
  }, [ordens]);

  // Memoizar células da timeline (limitado para performance)
  const timelineCells = useMemo(() => {
    const { start, end } = timelineRange;
    
    if (zoom === 'week') {
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    } else {
      return eachMonthOfInterval({ start, end });
    }
  }, [timelineRange, zoom]);

  const cellWidth = zoom === 'week' ? 80 : 120;

  // Memoizar ordens por projeto
  const ordensByProjeto = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(ordens) || !Array.isArray(projetos)) return map;
    
    for (const projeto of projetos) {
      const projetoOrdens = ordens.filter(os => os?.projetos_ids?.includes(projeto.id));
      map.set(projeto.id, projetoOrdens);
    }
    return map;
  }, [ordens, projetos]);

  // Projetos filtrados
  const filteredProjetos = useMemo(() => {
    if (!Array.isArray(projetos)) return [];
    if (!searchTerm) return projetos;
    const term = searchTerm.toLowerCase();
    return projetos.filter(p => p?.nome?.toLowerCase().includes(term));
  }, [projetos, searchTerm]);

  // Callbacks memoizados
  const toggleExpanded = useCallback((projetoId) => {
    setExpandedProjetos(prev => {
      const next = new Set(prev);
      if (next.has(projetoId)) {
        next.delete(projetoId);
      } else {
        next.add(projetoId);
      }
      return next;
    });
  }, []);

  const getProjetoProgress = useCallback((projetoId) => {
    const projetoOrdens = ordensByProjeto.get(projetoId) || [];
    if (projetoOrdens.length === 0) return 0;
    const totalProgress = projetoOrdens.reduce((sum, os) => sum + (os.progresso || 0), 0);
    return Math.round(totalProgress / projetoOrdens.length);
  }, [ordensByProjeto]);

  const getBarStyle = useCallback((os) => {
    if (!os.data_inicial && !os.prazo) return null;

    const start = os.data_inicial ? new Date(os.data_inicial) : new Date(os.prazo);
    const end = os.prazo ? new Date(os.prazo) : new Date(os.data_inicial);
    const offsetDays = differenceInDays(start, timelineRange.start);
    const durationDays = Math.max(1, differenceInDays(end, start));
    const divisor = zoom === 'week' ? 7 : 30;
    
    return { 
      left: (offsetDays / divisor) * cellWidth,
      width: (durationDays / divisor) * cellWidth
    };
  }, [timelineRange, zoom, cellWidth]);

  const getBarColor = useCallback((os) => {
    if (os.status === 'concluido') return 'bg-green-500';
    if (os.status === 'cancelado') return 'bg-red-500';
    
    if (os.prazo) {
      const prazo = new Date(os.prazo);
      if (prazo < new Date() && os.status !== 'concluido') return 'bg-red-600';
    }
    
    return os.status === 'execucao' ? 'bg-blue-500' : 'bg-slate-400';
  }, []);

  // Calcular linha vertical "hoje"
  const todayLineStyle = useMemo(() => {
    const today = new Date();
    const offsetDays = differenceInDays(today, timelineRange.start);
    const divisor = zoom === 'week' ? 7 : 30;
    return { left: (offsetDays / divisor) * cellWidth };
  }, [timelineRange, zoom, cellWidth]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
        <Input
          placeholder="Filtrar projetos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setZoom('week')} 
            className={zoom === 'week' ? 'bg-slate-100' : ''}
          >
            Semanas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setZoom('month')} 
            className={zoom === 'month' ? 'bg-slate-100' : ''}
          >
            Meses
          </Button>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lista de projetos */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-semibold text-sm">
            Projetos / Ordens
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredProjetos.map(projeto => {
                const projetoOrdens = ordensByProjeto.get(projeto.id) || [];
                const isExpanded = expandedProjetos.has(projeto.id);
                const progress = getProjetoProgress(projeto.id);

                return (
                  <div key={projeto.id}>
                    <ProjetoRow 
                      projeto={projeto}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpanded(projeto.id)}
                      progress={progress}
                    />
                    {isExpanded && projetoOrdens.map(os => (
                      <OSRow
                        key={os.id}
                        os={os}
                        lider={os.lider_id ? pessoasMap.get(os.lider_id) : null}
                        onOpenOS={() => onOpenOS?.(os)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header da timeline */}
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto">
            <div className="flex" style={{ minWidth: `${timelineCells.length * cellWidth}px` }}>
              {timelineCells.map((date, idx) => (
                <div 
                  key={idx} 
                  className="text-xs text-center font-medium py-2 border-r border-slate-200 dark:border-slate-700"
                  style={{ width: cellWidth }}
                >
                  {zoom === 'week' ? format(date, "dd/MM") : format(date, 'MM/yyyy')}
                </div>
              ))}
            </div>
          </div>

          {/* Área de barras */}
          <div className="flex-1 relative overflow-auto">
            <div className="relative" style={{ minWidth: `${timelineCells.length * cellWidth}px` }}>
              {/* Grid de fundo */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timelineCells.map((_, idx) => (
                  <div 
                    key={idx}
                    className="border-r border-slate-100 dark:border-slate-700"
                    style={{ width: cellWidth }}
                  />
                ))}
              </div>

              {/* Linha "hoje" */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{ left: todayLineStyle.left }}
              />

              {/* Barras */}
              <div className="relative space-y-1 py-2">
                {filteredProjetos.map(projeto => {
                  const projetoOrdens = ordensByProjeto.get(projeto.id) || [];
                  const isExpanded = expandedProjetos.has(projeto.id);

                  return (
                    <div key={projeto.id}>
                      <div className="h-9" />
                      {isExpanded && projetoOrdens.map(os => (
                        <GanttBar
                          key={os.id}
                          os={os}
                          barStyle={getBarStyle(os)}
                          barColor={getBarColor(os)}
                          onOpenOS={() => onOpenOS?.(os)}
                        />
                      ))}
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

export default memo(ProjetosGantt);