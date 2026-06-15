import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { rankingErrosPorAtendente, TIPOS_ERRO } from '@/lib/osErros';

export default function OSAtendenteErrosRanking({ ordens, categorias, subcategorias }) {
  const data = useMemo(
    () => rankingErrosPorAtendente(ordens || [], { categorias, subcategorias }).slice(0, 15),
    [ordens, categorias, subcategorias]
  );

  const totalErros = useMemo(() => data.reduce((s, d) => s + d.total, 0), [data]);

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">
        ✓ Nenhum erro de preenchimento detectado
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {totalErros} erro(s) de preenchimento em {data.length} atendente(s). Cada cor representa um tipo de erro.
      </p>
      <ResponsiveContainer width="100%" height={Math.max(320, data.length * 42)}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis type="category" dataKey="atendente" width={150} tick={{ fill: '#475569', fontSize: 11 }} interval={0} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            formatter={(value, name) => {
              const tipo = TIPOS_ERRO.find(t => t.key === name);
              return [value, tipo?.label || name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            formatter={(value) => TIPOS_ERRO.find(t => t.key === value)?.label || value}
          />
          {TIPOS_ERRO.map((t, idx) => (
            <Bar key={t.key} dataKey={t.key} stackId="erros" fill={t.cor}
              radius={idx === TIPOS_ERRO.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}>
              {idx === TIPOS_ERRO.length - 1 && (
                <LabelList dataKey="total" position="right"
                  style={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}