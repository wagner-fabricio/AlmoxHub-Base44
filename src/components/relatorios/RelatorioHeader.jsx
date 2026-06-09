import React from 'react';
import { format } from 'date-fns';

export default function RelatorioHeader({ filtrosAplicados, periodoLabel, dataGeracao }) {
  const filtrosResumo = [];
  if (filtrosAplicados.regionais?.length) filtrosResumo.push(`Regionais: ${filtrosAplicados.regionais.join(', ')}`);
  if (filtrosAplicados.almoxarifados?.length) filtrosResumo.push(`Almoxarifados: ${filtrosAplicados.almoxarifados.length}`);
  if (filtrosAplicados.categorias?.length) filtrosResumo.push(`Categorias: ${filtrosAplicados.categorias.join(', ')}`);
  if (filtrosAplicados.status?.length) filtrosResumo.push(`Status: ${filtrosAplicados.status.join(', ')}`);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-medium">Relatório Gerencial</p>
          <h1 className="text-3xl font-semibold mt-2 tracking-tight text-slate-900 dark:text-white">AlmoxHub · Axia Energia</h1>
          <p className="text-slate-500 text-sm mt-1">Análise consolidada de operações logísticas</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Emitido em</p>
          <p className="font-medium text-slate-900 dark:text-white mt-1">{format(new Date(dataGeracao), 'dd/MM/yyyy HH:mm')}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] mb-1">Período</p>
          <p className="text-slate-900 dark:text-white font-medium">{periodoLabel}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] mb-1">Escopo</p>
          <p className="text-slate-700 dark:text-slate-300 text-sm">{filtrosResumo.length > 0 ? filtrosResumo.join(' · ') : 'Todos os dados disponíveis'}</p>
        </div>
      </div>
    </div>
  );
}