import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, startOfWeek, addWeeks, startOfMonth, addMonths, parseISO, isValid, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

function parseDateSafe(d) {
  if (!d) return null;
  const dt = typeof d === 'string' ? parseISO(d) : new Date(d);
  return isValid(dt) ? dt : null;
}

// Conta dias úteis entre duas datas (seg–sex)
function diasUteis(start, end) {
  if (!start || !end || end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default function BacklogChart({ filteredOrdens }) {
  const [granularidade, setGranularidade] = useState('semana'); // 'semana' | 'mes'
  const [horasDia, setHorasDia] = useState(8);
  const [produtividade, setProdutividade] = useState(70);

  const chartData = useMemo(() => {
    if (!filteredOrdens || filteredOrdens.length === 0) return [];

    // Determinar janela de datas
    const todasDatas = filteredOrdens
      .map(os => parseDateSafe(os.created_date))
      .filter(Boolean);
    if (todasDatas.length === 0) return [];

    const minDate = new Date(Math.min(...todasDatas));
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    // Gerar períodos
    const periodos = [];
    if (granularidade === 'semana') {
      let cur = startOfWeek(minDate, { weekStartsOn: 1 });
      while (cur <= hoje) {
        const fim = new Date(cur);
        fim.setDate(fim.getDate() + 6);
        fim.setHours(23, 59, 59, 999);
        periodos.push({ inicio: new Date(cur), fim: fim < hoje ? fim : new Date(hoje) });
        cur = addWeeks(cur, 1);
      }
    } else {
      let cur = startOfMonth(minDate);
      while (cur <= hoje) {
        const fim = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
        periodos.push({ inicio: new Date(cur), fim: fim < hoje ? fim : new Date(hoje) });
        cur = addMonths(cur, 1);
      }
    }

    // Filtrar apenas últimos 24 períodos para não sobrecarregar o gráfico
    const periodosVisiveis = periodos.slice(-24);

    return periodosVisiveis.map(({ inicio, fim }) => {
      const label = granularidade === 'semana'
        ? format(inicio, 'dd/MM', { locale: ptBR })
        : format(inicio, 'MMM/yy', { locale: ptBR });

      // OS abertas no período (elaboracao + execucao) - criadas até o fim do período, não concluídas até o fim
      const osAbertas = filteredOrdens.filter(os => {
        const criada = parseDateSafe(os.created_date);
        if (!criada || criada > fim) return false;
        if (os.status === 'concluido' || os.status === 'cancelado') {
          const conc = parseDateSafe(os.data_conclusao) || parseDateSafe(os.updated_date);
          if (conc && conc <= fim) return false;
        }
        return true;
      });

      // Esforço total das OS abertas (horas úteis entre data_inicial/created_date e prazo)
      let esforcoTotalHoras = 0;
      osAbertas.forEach(os => {
        const inicio_ = parseDateSafe(os.data_inicial) || parseDateSafe(os.created_date);
        const prazo = parseDateSafe(os.prazo);
        if (!inicio_ || !prazo) return;
        const du = diasUteis(inicio_, prazo);
        const esforcoOS = du * horasDia;
        const progresso = os.progresso || 0;
        const restante = esforcoOS * (1 - progresso / 100);
        esforcoTotalHoras += Math.max(0, restante);
      });

      // Capacidade do período
      const duPeriodo = diasUteis(inicio, fim);
      // Número de pessoas com OS abertas no período (proxy da equipe)
      const pessoasAtivas = new Set(
        osAbertas.map(os => os.lider_id).filter(Boolean)
      ).size || 1;
      const capacidadeHoras = duPeriodo * horasDia * pessoasAtivas * (produtividade / 100);

      // Backlog = esforço restante / capacidade do período
      const backlog = capacidadeHoras > 0
        ? parseFloat((esforcoTotalHoras / capacidadeHoras).toFixed(2))
        : null;

      // Novas OS criadas neste período
      const novasOS = filteredOrdens.filter(os => {
        const d = parseDateSafe(os.created_date);
        return d && d >= inicio && d <= fim;
      }).length;

      // OS concluídas neste período
      const osConcluidas = filteredOrdens.filter(os => {
        if (os.status !== 'concluido' && os.status !== 'cancelado') return false;
        const d = parseDateSafe(os.data_conclusao) || parseDateSafe(os.updated_date);
        return d && d >= inicio && d <= fim;
      }).length;

      return { label, backlog, novasOS, osConcluidas, osAbertas: osAbertas.length };
    });
  }, [filteredOrdens, granularidade, horasDia, produtividade]);

  if (!filteredOrdens || filteredOrdens.length === 0) return null;

  const hasBacklog = chartData.some(d => d.backlog !== null);

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Evolução do Backlog
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Índice = horas restantes das OS abertas ÷ capacidade real da equipe no período.
            Ideal: entre 1 e 4 semanas (≈ 0,25–1,0 mês).
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-3 items-center text-xs">
          {/* Granularidade */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {['semana', 'mes'].map(g => (
              <button
                key={g}
                onClick={() => setGranularidade(g)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  granularidade === g
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {g === 'semana' ? 'Semanal' : 'Mensal'}
              </button>
            ))}
          </div>

          {/* Horas/dia */}
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>Horas/dia:</span>
            <input
              type="number"
              min={1}
              max={24}
              value={horasDia}
              onChange={e => setHorasDia(Math.max(1, Math.min(24, parseInt(e.target.value) || 8)))}
              className="w-14 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
            />
          </label>

          {/* Produtividade */}
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span>Produtividade:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={produtividade}
              onChange={e => setProdutividade(Math.max(1, Math.min(100, parseInt(e.target.value) || 70)))}
              className="w-14 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
            />
            <span>%</span>
          </label>
        </div>
      </div>

      {!hasBacklog ? (
        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
          OS sem prazo ou data inicial preenchidos — não é possível calcular o backlog.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                yAxisId="os"
                orientation="right"
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
                label={{ value: 'Qtd OS', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11, dy: 30 }}
              />
              <YAxis
                yAxisId="backlog"
                orientation="left"
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={true}
                tickFormatter={v => v.toFixed(1)}
                label={{ value: 'Backlog', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11, dy: -10 }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, n) => {
                  if (n === 'backlog') return [v?.toFixed(2) ?? '—', 'Índice de Backlog (períodos)'];
                  if (n === 'novasOS') return [v, 'Novas OS'];
                  if (n === 'osConcluidas') return [v, 'OS Concluídas'];
                  return [v, n];
                }}
              />
              <Legend
                formatter={v =>
                  v === 'backlog' ? 'Índice de Backlog' :
                  v === 'novasOS' ? 'Novas OS' : 'OS Concluídas'
                }
              />

              {/* Faixas de referência via ReferenceLine não disponíveis no ComposedChart diretamente — usando área visual */}
              <Bar yAxisId="os" dataKey="novasOS" fill="#10b981" opacity={0.7} name="novasOS" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar yAxisId="os" dataKey="osConcluidas" fill="#60a5fa" opacity={0.7} name="osConcluidas" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Line
                yAxisId="backlog"
                type="monotone"
                dataKey="backlog"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                name="backlog"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-red-500" style={{ height: '2px' }} />
              Índice de Backlog (eixo esq.) — quanto menor, melhor
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-emerald-500 opacity-70" />
              Novas OS (eixo dir.)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-blue-400 opacity-70" />
              OS Concluídas (eixo dir.)
            </span>
          </div>
        </>
      )}
    </div>
  );
}