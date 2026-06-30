import React, { useEffect, useState } from 'react';
import { Loader2, Database } from 'lucide-react';

// Status de carregamento do Dashboard: mostra uma barra de progresso animada
// e a contagem de Ordens de Serviço já carregadas, dando ao usuário noção de
// quanto falta para os dados aparecerem.
export default function DashboardLoadingStatus({ loaded = 0, done = false }) {
  // Barra "indeterminada com avanço suave": como não sabemos o total exato à frente,
  // aproximamos o progresso de forma assintótica (nunca chega a 100% antes de concluir).
  const [pct, setPct] = useState(8);

  useEffect(() => {
    if (done) { setPct(100); return; }
    // Avança rápido no início e desacelera, simulando progresso real
    const target = Math.min(92, 8 + Math.log10(loaded + 1) * 28);
    setPct((prev) => Math.max(prev, target));
  }, [loaded, done]);

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-5 px-6">
      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0000FF' }} />
        <span className="text-lg font-semibold">Carregando dados do dashboard…</span>
      </div>

      <div className="w-full max-w-md">
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0000FF 0%, #6366f1 100%)' }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            {loaded.toLocaleString('pt-BR')} ordens de serviço carregadas
          </span>
          <span className="font-medium">{Math.round(pct)}%</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-sm">
        O sistema está reunindo todas as ordens de serviço para montar os indicadores. Isso pode levar alguns segundos no primeiro acesso.
      </p>
    </div>
  );
}