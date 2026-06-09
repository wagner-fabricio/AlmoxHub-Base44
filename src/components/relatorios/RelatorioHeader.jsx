import React from 'react';
import { Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function RelatorioHeader({ filtrosAplicados, periodoLabel, dataGeracao }) {
  const filtrosResumo = [];
  if (filtrosAplicados.regionais?.length) filtrosResumo.push(`Regionais: ${filtrosAplicados.regionais.join(', ')}`);
  if (filtrosAplicados.almoxarifados?.length) filtrosResumo.push(`Almoxarifados: ${filtrosAplicados.almoxarifados.length}`);
  if (filtrosAplicados.categorias?.length) filtrosResumo.push(`Categorias: ${filtrosAplicados.categorias.join(', ')}`);
  if (filtrosAplicados.status?.length) filtrosResumo.push(`Status: ${filtrosAplicados.status.join(', ')}`);

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
      <div className="p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Zap className="w-9 h-9 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Relatório Gerencial Executivo</p>
              <h1 className="text-3xl font-bold mt-1">AlmoxHub - Axia Energia</h1>
              <p className="text-white/80 text-sm mt-1">Análise consolidada de operações logísticas</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-white/70">Emitido em</p>
            <p className="font-semibold">{format(new Date(dataGeracao), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Período Analisado</p>
            <p className="text-white font-semibold">{periodoLabel}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Escopo</p>
            <p className="text-white text-sm">{filtrosResumo.length > 0 ? filtrosResumo.join(' • ') : 'Todos os dados disponíveis'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}