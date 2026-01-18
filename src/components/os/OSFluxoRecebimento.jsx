import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function OSFluxoRecebimento({ fluxo }) {
  const calcularProgresso = () => {
    if (!fluxo) return 0;
    let etapas = 0;
    if (fluxo.xml_importado) etapas++;
    if (fluxo.conferencia_manual_completa) etapas++;
    if (fluxo.validacao_divergencias_completa) etapas++;
    if (fluxo.armazenagem_completa) etapas++;
    return Math.round((etapas / 4) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fluxo de Recebimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso: Etapa {fluxo?.etapa_atual || 1} de 4</span>
            <span className="text-sm text-slate-500">{calcularProgresso()}%</span>
          </div>
          <Progress value={calcularProgresso()} className="h-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
          <div className={`p-3 rounded text-center ${fluxo?.xml_importado ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <div className="font-semibold">1. Importar XML</div>
            <div className="text-xs mt-1">{fluxo?.xml_importado ? '✓' : '○'}</div>
          </div>
          <div className={`p-3 rounded text-center ${fluxo?.conferencia_manual_completa ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <div className="font-semibold">2. Conferência Manual</div>
            <div className="text-xs mt-1">{fluxo?.conferencia_manual_completa ? '✓' : '○'}</div>
          </div>
          <div className={`p-3 rounded text-center ${fluxo?.validacao_divergencias_completa ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <div className="font-semibold">3. Divergências</div>
            <div className="text-xs mt-1">{fluxo?.validacao_divergencias_completa ? '✓' : '○'}</div>
          </div>
          <div className={`p-3 rounded text-center ${fluxo?.armazenagem_completa ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <div className="font-semibold">4. Armazenagem</div>
            <div className="text-xs mt-1">{fluxo?.armazenagem_completa ? '✓' : '○'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}