import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const etapas = [
  { id: 1, nome: 'Solicitação', campo: 'solicitacao' },
  { id: 2, nome: 'Separação', campo: 'separacao' },
  { id: 3, nome: 'Preparação', campo: 'preparacao' },
  { id: 4, nome: 'Envio', campo: 'envio' },
  { id: 5, nome: 'Entrega', campo: 'entrega' }
];

export default function ExpedicaoProgressTracker({ os, isMobile = false }) {
  const fluxo = os?.fluxo_expedicao || {};
  const etapaAtual = fluxo.etapa_atual || 1;

  const getEtapaStatus = (etapa) => {
    const completa = fluxo[`${etapa.campo}_completa`];
    const data = fluxo[`${etapa.campo}_data`];
    
    if (completa) return { status: 'completa', data };
    if (etapa.id === etapaAtual) return { status: 'atual', data: null };
    if (etapa.id < etapaAtual) return { status: 'completa', data };
    return { status: 'pendente', data: null };
  };

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          Fluxo de Expedição
        </h3>
        <div className="space-y-3">
          {etapas.map((etapa, index) => {
            const { status, data } = getEtapaStatus(etapa);
            const isLast = index === etapas.length - 1;
            
            return (
              <div key={etapa.id} className="relative">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10
                    ${status === 'completa' ? 'bg-green-500' : ''}
                    ${status === 'atual' ? 'bg-blue-500' : ''}
                    ${status === 'pendente' ? 'bg-slate-200 dark:bg-slate-700' : ''}
                  `}>
                    {status === 'completa' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === 'atual' ? (
                      <Clock className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      status === 'completa' ? 'text-green-600' :
                      status === 'atual' ? 'text-blue-600' :
                      'text-slate-400'
                    }`}>
                      {etapa.nome}
                    </p>
                    {data && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {format(new Date(data), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className={`
                    absolute left-4 top-8 w-0.5 h-6 -translate-x-1/2
                    ${status === 'completa' ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-100 dark:border-slate-600">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">
        Fluxo de Expedição
      </h3>
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
        
        {/* Progress Bar Fill */}
        <div 
          className="absolute top-4 left-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${((etapaAtual - 1) / (etapas.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {etapas.map((etapa) => {
            const { status, data } = getEtapaStatus(etapa);
            
            return (
              <div key={etapa.id} className="flex flex-col items-center" style={{ width: '20%' }}>
                {/* Icon */}
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center z-10 shadow-lg
                  ${status === 'completa' ? 'bg-green-500' : ''}
                  ${status === 'atual' ? 'bg-blue-500 ring-4 ring-blue-200 dark:ring-blue-900' : ''}
                  ${status === 'pendente' ? 'bg-slate-200 dark:bg-slate-600' : ''}
                `}>
                  {status === 'completa' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : status === 'atual' ? (
                    <Clock className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Label */}
                <p className={`text-xs font-medium mt-3 text-center ${
                  status === 'completa' ? 'text-green-600 dark:text-green-400' :
                  status === 'atual' ? 'text-blue-600 dark:text-blue-400' :
                  'text-slate-400'
                }`}>
                  {etapa.nome}
                </p>

                {/* Date */}
                {data && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                    {format(new Date(data), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}