import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import OSCard from './OSCard';
import { FileX } from 'lucide-react';

const columns = [
  { id: 'pendente', title: 'Pendente', color: 'bg-slate-500' },
  { id: 'em_separacao', title: 'Em Separação', color: 'bg-amber-500' },
  { id: 'separado', title: 'Separado', color: 'bg-blue-500' },
  { id: 'embalando', title: 'Embalando', color: 'bg-purple-500' },
  { id: 'aguardando_transporte', title: 'Aguardando Transporte', color: 'bg-orange-500' },
  { id: 'em_rota', title: 'Em Rota', color: 'bg-indigo-500' },
  { id: 'entregue', title: 'Entregue', color: 'bg-green-500' },
  { id: 'em_ocorrencia', title: 'Em Ocorrência', color: 'bg-red-500', isOcorrencia: true },
];

// OS com ocorrência aberta = marcada "Sim" e sem data de solução
const temOcorrenciaAberta = (os) =>
  os?.houve_ocorrencia_expedicao === true && !os?.data_solucao_expedicao;

export default function OSKanbanExpedicao({ ordens, pessoas, categorias, regionais, instalacoes, onOSClick, onStatusChange, currentPessoa, onOSChange, onRequestSelecaoSessao }) {
  const getOSByStatusSeparacao = (status) => {
    if (status === 'em_ocorrencia') {
      return ordens.filter(temOcorrenciaAberta);
    }
    // OS com ocorrência aberta saem dos buckets normais e ficam só em "Em Ocorrência"
    return ordens.filter(os => !temOcorrenciaAberta(os) && (os.status_separacao || 'pendente') === status);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    // Bucket "Em Ocorrência" não muda status_separacao — é derivado dos campos da ocorrência
    if (newStatus === 'em_ocorrencia') return;
    const os = ordens.find(o => o.id === draggableId);
    // Não permite arrastar uma OS em ocorrência para outro bucket por drag
    if (os && temOcorrenciaAberta(os)) return;

    if (os && (os.status_separacao || 'pendente') !== newStatus) {
      onStatusChange?.(os.id, newStatus);
    }
  };

  const getLider = (liderId) => pessoas.find(p => p.id === liderId);
  const getCategoria = (catId) => categorias.find(c => c.id === catId);
  const getRegional = (regId) => regionais.find(r => r.id === regId);

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
                {getOSByStatusSeparacao(column.id).length}
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
                  {getOSByStatusSeparacao(column.id).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                      <FileX className="w-8 h-8 mb-2" />
                      <span className="text-sm">Nenhuma OS</span>
                    </div>
                  ) : (
                    getOSByStatusSeparacao(column.id).map((os, index) => (
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
                             onOSChange={onOSChange}
                             onRequestSelecaoSessao={onRequestSelecaoSessao}
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