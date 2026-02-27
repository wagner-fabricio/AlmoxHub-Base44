import React from 'react';
import TorreControleTab from './TorreControleTab';
import KanbanExecucao from './KanbanExecucao';
import ExportTorreControleButton from './ExportTorreControleButton';

export default function TorreControleContent({
  filteredOrdens,
  tempoMedioRegularizacaoCompra,
  numItensNFCompra
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <ExportTorreControleButton filteredOrdens={filteredOrdens} />
      </div>
      <TorreControleTab 
        filteredOrdens={filteredOrdens}
        tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
        numItensNFCompra={numItensNFCompra}
      />
      <KanbanExecucao ordens={filteredOrdens} />
    </div>
  );
}