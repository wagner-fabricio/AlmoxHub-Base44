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
      <KanbanExecucao ordens={filteredOrdens} />
      <TorreControleTab 
        filteredOrdens={filteredOrdens}
        tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
        numItensNFCompra={numItensNFCompra}
      />
    </div>
  );
}