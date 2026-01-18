import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

const etapas = [
  { id: 1, nome: 'Importar XML', campo: 'xml_importado' },
  { id: 2, nome: 'Conferência Manual', campo: 'conferencia_manual_completa' },
  { id: 3, nome: 'Divergências', campo: 'validacao_divergencias_completa' },
  { id: 4, nome: 'Armazenagem', campo: 'armazenagem_completa' }
];

export default function OSFluxoRecebimento({ fluxo }) {
  const etapaAtual = fluxo?.etapa_atual || 1;

  const getEtapaStatus = (etapa) => {
    const completa = fluxo?.[etapa.campo];
    
    if (completa) return 'completa';
    if (etapa.id === etapaAtual) return 'atual';
    return 'pendente';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-100 dark:border-slate-600">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">
        Fluxo de Recebimento
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
            const status = getEtapaStatus(etapa);
            
            return (
              <div key={etapa.id} className="flex flex-col items-center" style={{ width: '25%' }}>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}