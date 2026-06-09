import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Warehouse } from 'lucide-react';

const PALETTE = ['#0000FF', '#FF6B00', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#A0B4D2', '#ec4899', '#6366f1'];

function buildData(porAlmoxarifado, categoriasUsadas) {
  return (porAlmoxarifado || []).map(item => {
    let dominante = null;
    let maiorValor = -1;
    (categoriasUsadas || []).forEach((c, idx) => {
      const v = Number(item[c.nome] || 0);
      if (v > maiorValor) {
        maiorValor = v;
        dominante = { nome: c.nome, valor: v, cor: c.cor || PALETTE[idx % PALETTE.length] };
      }
    });
    const total = (categoriasUsadas || []).reduce((acc, c) => acc + Number(item[c.nome] || 0), 0);
    return {
      name: item.name,
      size: total,
      total,
      dominanteNome: dominante?.nome || '—',
      dominanteValor: dominante?.valor || 0,
      fill: dominante?.cor || '#94a3b8'
    };
  }).filter(d => d.size > 0);
}

const CustomNode = (props) => {
  const { x, y, width, height, name, total, dominanteNome, fill } = props;
  if (width < 2 || height < 2) return null;

  const showLabel = width > 70 && height > 40;
  const showSub = width > 110 && height > 70;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill, stroke: '#ffffff', strokeWidth: 2, opacity: 0.92 }}
      />
      {showLabel && (
        <>
          <text x={x + 10} y={y + 22} fill="#fff" fontSize={13} fontWeight={600} style={{ pointerEvents: 'none' }}>
            {name}
          </text>
          <text x={x + 10} y={y + 42} fill="#fff" fontSize={20} fontWeight={700} style={{ pointerEvents: 'none', letterSpacing: '-0.02em' }}>
            {total}
          </text>
          {showSub && (
            <text x={x + 10} y={y + 60} fill="rgba(255,255,255,0.85)" fontSize={11} style={{ pointerEvents: 'none' }}>
              {dominanteNome}
            </text>
          )}
        </>
      )}
    </g>
  );
};

const TooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="font-semibold text-slate-900 dark:text-white">{d.name}</div>
      <div className="text-slate-600 dark:text-slate-300">Total: <span className="font-semibold">{d.total} OS</span></div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Categoria dominante: <span className="font-medium" style={{ color: d.fill }}>{d.dominanteNome}</span> ({d.dominanteValor})
      </div>
    </div>
  );
};

export default function TopAlmoxarifadosTreemap({ porAlmoxarifado, categoriasUsadas = [] }) {
  const data = useMemo(() => buildData(porAlmoxarifado, categoriasUsadas), [porAlmoxarifado, categoriasUsadas]);

  // Top 10 categorias por volume total agregado em todos os almoxarifados
  const legendaCategorias = useMemo(() => {
    const totais = new Map();
    (categoriasUsadas || []).forEach((c, idx) => {
      const cor = c.cor || PALETTE[idx % PALETTE.length];
      const total = (porAlmoxarifado || []).reduce((acc, item) => acc + Number(item[c.nome] || 0), 0);
      if (total > 0) totais.set(c.nome, { cor, total });
    });
    return Array.from(totais.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([nome, { cor, total }]) => [nome, cor, total]);
  }, [porAlmoxarifado, categoriasUsadas]);

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white tracking-tight">
          <Warehouse className="w-4 h-4 text-amber-500" />
          Top 10 Almoxarifados por Volume de OS
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tamanho = volume total · Cor = categoria dominante
        </p>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={380}>
              <Treemap
                data={data}
                dataKey="size"
                stroke="#fff"
                content={<CustomNode />}
                animationDuration={400}
              >
                <Tooltip content={<TooltipContent />} />
              </Treemap>
            </ResponsiveContainer>
            {legendaCategorias.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Top 10 categorias por volume</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {legendaCategorias.map(([nome, cor, total]) => (
                    <div key={nome} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-3 h-3 rounded-sm" style={{ background: cor }} />
                      <span>{nome}</span>
                      <span className="text-slate-400">· {total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-400">Sem dados</div>
        )}
      </CardContent>
    </Card>
  );
}