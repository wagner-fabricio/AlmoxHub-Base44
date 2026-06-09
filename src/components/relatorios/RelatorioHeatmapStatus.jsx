import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const STATUS_COLS = [
  { key: 'elaboracao', label: 'Em Elaboração', color: '100, 116, 139' },   // slate
  { key: 'execucao',   label: 'Em Execução',   color: '0, 0, 255' },        // azul
  { key: 'concluido',  label: 'Concluído',     color: '16, 185, 129' },     // verde
  { key: 'cancelado',  label: 'Cancelado',     color: '239, 68, 68' },      // vermelho
];

export default function RelatorioHeatmapStatus({ porRegional, agruparPorAlmoxarifado = false, regionalSelecionada = null }) {
  // Calcula o máximo por COLUNA (status) para escala de intensidade independente
  const maxPorStatus = useMemo(() => {
    const max = {};
    STATUS_COLS.forEach(s => { max[s.key] = 0; });
    porRegional.forEach(row => {
      STATUS_COLS.forEach(s => {
        if ((row[s.key] || 0) > max[s.key]) max[s.key] = row[s.key] || 0;
      });
    });
    return max;
  }, [porRegional]);

  const linhas = useMemo(() => {
    return porRegional
      .map(r => ({
        ...r,
        total: STATUS_COLS.reduce((acc, s) => acc + (r[s.key] || 0), 0)
      }))
      .sort((a, b) => b.total - a.total);
  }, [porRegional]);

  const intensidade = (value, statusKey) => {
    const max = maxPorStatus[statusKey] || 1;
    if (!value) return 0;
    return Math.max(0.08, value / max); // mínimo 8% para célula com valor
  };

  const titulo = agruparPorAlmoxarifado
    ? `Concentração de OS por Almoxarifado × Status${regionalSelecionada ? ` — Regional ${regionalSelecionada}` : ''}`
    : 'Concentração de OS por Regional × Status';

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
          <MapPin className="w-5 h-5" style={{ color: '#0000FF' }} />
          {titulo}
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Intensidade da cor indica o volume relativo dentro de cada status. Linhas ordenadas pelo total.
        </p>
      </CardHeader>
      <CardContent>
        {linhas.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400 pb-2 pr-3">
                    {agruparPorAlmoxarifado ? 'Almoxarifado' : 'Regional'}
                  </th>
                  {STATUS_COLS.map(s => (
                    <th key={s.key} className="text-center text-[11px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400 pb-2 px-1">
                      {s.label}
                    </th>
                  ))}
                  <th className="text-right text-[11px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400 pb-2 pl-3">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(row => (
                  <tr key={row.name}>
                    <td className="text-sm font-medium text-slate-700 dark:text-slate-300 pr-3 py-1 whitespace-nowrap">
                      {row.name}
                    </td>
                    {STATUS_COLS.map(s => {
                      const value = row[s.key] || 0;
                      const alpha = intensidade(value, s.key);
                      const textColor = alpha > 0.55 ? '#fff' : '#1d1d1f';
                      return (
                        <td key={s.key} className="px-1 py-0.5">
                          <div
                            className="h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors"
                            style={{
                              backgroundColor: value ? `rgba(${s.color}, ${alpha})` : 'rgba(241, 245, 249, 0.6)',
                              color: value ? textColor : '#cbd5e1'
                            }}
                            title={`${row.name} · ${s.label}: ${value}`}
                          >
                            {value || '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right text-sm font-semibold text-slate-900 dark:text-white pl-3 py-1 tabular-nums">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}