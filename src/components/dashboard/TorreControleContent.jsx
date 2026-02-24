import React from 'react';
import TorreControleTab from './TorreControleTab';
import KanbanExecucao from './KanbanExecucao';

export default function TorreControleContent({
  filteredOrdens,
  tempoMedioRegularizacaoCompra,
  numItensNFCompra
}) {
  return (
    <div className="space-y-8">
      <TorreControleTab 
        filteredOrdens={filteredOrdens}
        tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
        numItensNFCompra={numItensNFCompra}
      />
      <KanbanExecucao ordens={filteredOrdens} />
    </div>
  );
}