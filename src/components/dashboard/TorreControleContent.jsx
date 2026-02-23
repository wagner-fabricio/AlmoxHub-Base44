import React from 'react';
import TorreControleTab from './TorreControleTab';
import TorreControleProblemas from './TorreControleProblemass';

export default function TorreControleContent({
  filteredOrdens,
  tempoMedioRegularizacaoCompra,
  numItensNFCompra,
  categorias,
  regionais,
  problemasRecebimento
}) {
  return (
    <>
      <TorreControleTab 
        filteredOrdens={filteredOrdens}
        tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
        numItensNFCompra={numItensNFCompra}
      />
      
      <TorreControleProblemas 
        filteredOrdens={filteredOrdens}
        categorias={categorias}
        regionais={regionais}
        problemasRecebimento={problemasRecebimento}
      />
    </>
  );
}