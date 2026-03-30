import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import OSCard from './OSCard';
import { FileX } from 'lucide-react';

const columns = [
  { id: 'aguardando_xml', title: 'Aguardando XML', color: 'bg-slate-500', etapa: 0 },
  { id: 'xml_importado', title: 'XML Importado', color: 'bg-blue-500', etapa: 1 },
  { id: 'em_conferencia', title: 'Em Conferência', color: 'bg-amber-500', etapa: 2 },
  { id: 'validando_divergencias', title: 'Validando Divergências', color: 'bg-orange-500', etapa: 3 },
  { id: 'definindo_armazenagem', title: 'Definindo Armazenagem', color: 'bg-purple-500', etapa: 4 },
  { id: 'concluido', title: 'Concluído', color: 'bg-green-500', etapa: 5 },
];

export default function OSKanbanRecebimento({ ordens, pessoas, categorias, regionais, instalacoes, onOSClick, onStatusChange, currentPessoa, onOSChange }) {
  const getOSByEtapaRecebimento = (columnId) => {
    return ordens.filter(os => {
      const fluxo = os.fluxo_recebimento || {};
      const etapaAtual = fluxo.etapa_atual || 1;
      
      // Aguardando XML: etapa 0 ou 1 sem XML importado
      if (columnId === 'aguardando_xml') {
        return !fluxo.xml_importado;
      }
      
      // XML Importado: etapa 1 com XML importado, mas conferência não completa
      if (columnId === 'xml_importado') {
        return fluxo.xml_importado && !fluxo.conferencia_manual_completa;
      }
      
      // Em Conferência: etapa 2 ou conferência não completa mas XML importado
      if (columnId === 'em_conferencia') {
        return etapaAtual === 2 || (fluxo.xml_importado && fluxo.conferencia_manual_completa && !fluxo.validacao_divergencias_completa);
      }
      
      // Validando Divergências: etapa 3 ou validação não completa
      if (columnId === 'validando_divergencias') {
        return etapaAtual === 3 || (fluxo.conferencia_manual_completa && fluxo.validacao_divergencias_completa && !fluxo.armazenagem_completa);
      }
      
      // Definindo Armazenagem: etapa 4
      if (columnId === 'definindo_armazenagem') {
        return etapaAtual === 4 || (fluxo.validacao_divergencias_completa && !fluxo.armazenagem_completa);
      }
      
      // Concluído: todas as etapas completas
      if (columnId === 'concluido') {
        return fluxo.armazenagem_completa;
      }
      
      return false;
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newColumnId = destination.droppableId;
    const os = ordens.find(o => o.id === draggableId);
    
    if (os) {
      // Mapear coluna para etapa e atualizar fluxo
      const column = columns.find(c => c.id === newColumnId);
      if (column) {
        const fluxoAtualizado = {
          etapa_atual: column.etapa,
          xml_importado: column.etapa >= 1,
          conferencia_manual_completa: column.etapa >= 2,
          validacao_divergencias_completa: column.etapa >= 3,
          armazenagem_completa: column.etapa >= 5
        };
        
        // Chamar onStatusChange com o novo fluxo
        onStatusChange?.(os.id, 'fluxo_recebimento', fluxoAtualizado);
      }
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
                {getOSByEtapaRecebimento(column.id).length}
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
                  {getOSByEtapaRecebimento(column.id).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                      <FileX className="w-8 h-8 mb-2" />
                      <span className="text-sm">Nenhuma OS</span>
                    </div>
                  ) : (
                    getOSByEtapaRecebimento(column.id).map((os, index) => (
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