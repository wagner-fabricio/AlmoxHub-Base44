import React from 'react';
import TorreControleTab from './TorreControleTab';

export default function TorreControleContent({
  filteredOrdens,
  tempoMedioRegularizacaoCompra,
  numItensNFCompra
}) {
  return (
    <TorreControleTab 
      filteredOrdens={filteredOrdens}
      tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
      numItensNFCompra={numItensNFCompra}
    />
  );
}