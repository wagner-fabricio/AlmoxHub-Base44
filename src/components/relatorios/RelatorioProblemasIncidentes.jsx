import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertOctagon, PackageX, TruckIcon } from 'lucide-react';
import { AXIA } from './axiaColors';

const TopList = ({ titulo, icon: Icon, color, dados, totalOS }) => {
  if (!dados || dados.top.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4" style={{ color }} />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h3>
          </div>
          <p className="text-sm text-slate-400 py-4 text-center">Sem incidências registradas no período.</p>
        </CardContent>
      </Card>
    );
  }

  const maxOcorrencias = dados.top[0].ocorrencias;
  const totalInc = dados.totalIncidentesCatalogados;

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color }} />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{totalOS} OS impactadas</p>
            <p className="text-[10px] text-slate-400">{totalInc} incidentes</p>
          </div>
        </div>
        <ul className="space-y-2.5">
          {dados.top.slice(0, 5).map((p, i) => {
            const pct = Math.round((p.ocorrencias / maxOcorrencias) * 100);
            return (
              <li key={p.id}>
                <div className="flex items-start justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium break-words min-w-0 pr-2">
                    {i + 1}. {p.descricao}
                  </span>
                  <span className="text-slate-500 font-semibold shrink-0">{p.ocorrencias}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default function RelatorioProblemasIncidentes({ problemas }) {
  if (!problemas) return null;
  const temAlgumaIncidencia =
    problemas.expedicao.top.length > 0 || problemas.recebimento.top.length > 0;

  if (!temAlgumaIncidencia) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
        <AlertOctagon className="w-5 h-5" style={{ color: AXIA.warningDark }} />
        Principais Incidências de Expedição e Recebimento
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList
          titulo="Top Incidências — Expedição"
          icon={TruckIcon}
          color={AXIA.accent}
          dados={problemas.expedicao}
          totalOS={problemas.expedicao.totalOSComOcorrencia}
        />
        <TopList
          titulo="Top Incidências — Recebimento"
          icon={PackageX}
          color={AXIA.danger}
          dados={problemas.recebimento}
          totalOS={problemas.recebimento.totalOSComProblema}
        />
      </div>
    </div>
  );
}