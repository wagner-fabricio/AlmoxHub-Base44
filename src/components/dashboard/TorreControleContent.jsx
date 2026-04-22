import React from 'react';
import TorreControleTab from './TorreControleTab';
import KanbanExecucao from './KanbanExecucao';
import ExportTorreControleButton from './ExportTorreControleButton';
import BurndownBurnupChart from './BurndownBurnupChart';

export default function TorreControleContent({
  filteredOrdens,
  tempoMedioRegularizacaoCompra,
  numItensNFCompra,
  pessoas = [],
  categorias = [],
  regionais = [],
  almoxarifados = [],
  filters = {}
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <ExportTorreControleButton
          filteredOrdens={filteredOrdens}
          pessoas={pessoas}
          categorias={categorias}
          regionais={regionais}
          almoxarifados={almoxarifados}
        />
      </div>
      <TorreControleTab 
        filteredOrdens={filteredOrdens}
        tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
        numItensNFCompra={numItensNFCompra}
      />
      <KanbanExecucao ordens={filteredOrdens} />
      <BurndownBurnupChart filteredOrdens={filteredOrdens} filters={filters} />
    </div>
  );
}