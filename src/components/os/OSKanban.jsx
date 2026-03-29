import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import OSCard from './OSCard';
import { FileX } from 'lucide-react';

const columns = [
  { id: 'elaboracao', title: 'Em Elaboração', color: 'bg-slate-500' },
  { id: 'execucao', title: 'Em Execução', color: 'bg-blue-500' },
  { id: 'concluido', title: 'Concluído', color: 'bg-green-500' },
];

export default function OSKanban({ ordens, pessoas, categorias, regionais, instalacoes, onOSClick, onStatusChange, currentPessoa }) {
  // Mapas O(1) memoizados
  const pessoasMap = useMemo(() => new Map(pessoas.map(p => [p.id, p])), [pessoas]);
  const categoriasMap = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias]);
  const regionaisMap = useMemo(() => new Map(regionais.map(r => [r.id, r])), [regionais]);

  // Agrupar OS por status uma única vez
  const osByStatus = useMemo(() => {
    const map = { elaboracao: [], execucao: [], concluido: [] };
    ordens.forEach(os => { if (map[os.status]) map[os.status].push(os); });
    return map;
  }, [ordens]);

  const getOSByStatus = (status) => osByStatus[status] || [];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const os = ordens.find(o => o.id === draggableId);
    if (os && os.status !== newStatus) {
      onStatusChange?.(os.id, newStatus);
    }
  };

  const getLider = (liderId) => pessoasMap.get(liderId);
  const getCategoria = (catId) => categoriasMap.get(catId);
  const getRegional = (regId) => regionaisMap.get(regId);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-220px)]">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {column.title}
              </h3>
              <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                {getOSByStatus(column.id).length}
              </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    space-y-3 p-2 rounded-xl min-h-[200px] transition-colors
                    ${snapshot.isDraggingOver 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600' 
                      : 'bg-slate-100/50 dark:bg-slate-800/50'
                    }
                  `}
                >
                  {getOSByStatus(column.id).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                      <FileX className="w-8 h-8 mb-2" />
                      <span className="text-sm">Nenhuma OS</span>
                    </div>
                  ) : (
                    getOSByStatus(column.id).map((os, index) => (
                      <Draggable key={os.id} draggableId={os.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'rotate-2 scale-105' : ''}
                          >
                            <OSCard
                              os={os}
                              lider={getLider(os.lider_id)}
                              categoria={getCategoria(os.categoria_id)}
                              regional={getRegional(os.regional_id)}
                              instalacoes={instalacoes}
                              onClick={onOSClick}
                              currentPessoa={currentPessoa}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}