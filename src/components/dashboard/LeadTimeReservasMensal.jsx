import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { HelpCircle } from 'lucide-react';
import { useApp } from '@/components/contexts/AppContext';
import {
  carregarFeriados, buildFeriadosSet, diasUteisEntreComFeriados, contextoDaOS,
} from '@/lib/diasUteis';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// SLA padrão (em dias úteis) por prioridade da OS
const slaPorPrioridade = (prioridade) => prioridade === 'urgente' ? 1 : 7;

// Retorna a maior data entre Data Reserva, Data Ressuprimento e Data Aprovação EPI (aba Documento)
const maiorDataInicioDocumento = (os) => {
  const candidatos = [os?.data_reserva, os?.data_ressuprimento, os?.data_aprovacao_epi]
    .map(d => d ? new Date(d) : null)
    .filter(d => d && !isNaN(d.getTime()));
  if (candidatos.length === 0) return null;
  return new Date(Math.max(...candidatos.map(d => d.getTime())));
};

const METRICAS = [
  { id: 'quantOS', label: 'Quant OS' },
  { id: 'quantItens', label: 'Quant Itens' },
  { id: 'valoresOS', label: 'Valores OS' },
  { id: 'pesoOS', label: 'Peso OS' },
];

// Retorna o valor de uma OS conforme a métrica selecionada e a fonte de itens/valores
function valorMetrica(os, metrica, itensField, valorField) {
  if (metrica === 'quantOS') return 1;
  const itens = os[itensField] || [];
  if (metrica === 'quantItens') return itens.length;
  if (metrica === 'valoresOS') {
    return itens.reduce((s, item) => {
      const v = item[valorField];
      return s + (typeof v === 'number' ? v : parseFloat(v) || 0);
    }, 0);
  }
  if (metrica === 'pesoOS') {
    return (os.volumes || []).reduce((s, v) => s + (v.peso_bruto || 0), 0);
  }
  return 0;
}

export default function LeadTimeReservasMensal({
  filteredOrdens,
  titulo = 'Resultados Mensais - Atendimento de Reservas',
  startDateField = 'data_reserva',
  endDateField = 'data_migo',
  itensField = 'itens_documento',
  valorField = 'r_total',
  filterFn = null,
}) {
  const [metrica, setMetrica] = useState('quantItens');
  const currentYear = new Date().getFullYear();
  const { almoxarifados, instalacoes } = useApp();
  const [feriados, setFeriados] = useState([]);
  useEffect(() => { carregarFeriados().then(setFeriados); }, []);

  // Set de feriados aplicáveis por contexto (almoxarifado/UF/cidade), memoizado por chave
  const feriadosSetPorOS = useMemo(() => {
    const cache = new Map();
    return (os) => {
      const ctx = contextoDaOS(os, almoxarifados, instalacoes);
      const key = `${ctx.almoxarifado_id || ''}|${ctx.estado}|${ctx.cidade}`;
      if (!cache.has(key)) cache.set(key, buildFeriadosSet(feriados, ctx));
      return cache.get(key);
    };
  }, [feriados, almoxarifados, instalacoes]);

  const { dadosMensais, totalNoPrazo, totalForaPrazo, total, percentualNoPrazo } = useMemo(() => {
    const baseOrdens = filterFn ? filteredOrdens.filter(filterFn) : filteredOrdens;
    // Início = maior data entre Data Reserva, Data Ressuprimento e Data Aprovação EPI
    // Fim = endDateField (Data MIGO)
    // Dias úteis descontam sábados/domingos E feriados aplicáveis ao almoxarifado da OS.
    const reservasValidas = baseOrdens
      .map(os => {
        const inicio = maiorDataInicioDocumento(os);
        const dias = diasUteisEntreComFeriados(inicio, os[endDateField], feriadosSetPorOS(os));
        return { os, dias, sla: slaPorPrioridade(os.prioridade) };
      })
      .filter(x => x.dias !== null && x.os[endDateField]);

    const dados = MESES.map((mes, idx) => {
      const doMes = reservasValidas.filter(({ os }) => {
        const d = new Date(os[endDateField]);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });
      const noPrazo = doMes
        .filter(x => x.dias <= x.sla)
        .reduce((s, x) => s + valorMetrica(x.os, metrica, itensField, valorField), 0);
      const foraPrazo = doMes
        .filter(x => x.dias > x.sla)
        .reduce((s, x) => s + valorMetrica(x.os, metrica, itensField, valorField), 0);
      return { mes, 'No Prazo': noPrazo, 'Fora do Prazo': foraPrazo };
    });

    const tNoPrazo = dados.reduce((s, d) => s + d['No Prazo'], 0);
    const tForaPrazo = dados.reduce((s, d) => s + d['Fora do Prazo'], 0);
    const t = tNoPrazo + tForaPrazo;
    const pct = t > 0 ? ((tNoPrazo / t) * 100).toFixed(2) : 0;

    return {
      dadosMensais: dados,
      totalNoPrazo: tNoPrazo,
      totalForaPrazo: tForaPrazo,
      total: t,
      percentualNoPrazo: pct
    };
  }, [filteredOrdens, currentYear, metrica, endDateField, itensField, valorField, filterFn, feriadosSetPorOS]);

  // Formatadores conforme métrica
  const formatTickY = (v) => {
    if (metrica === 'valoresOS') {
      if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
      return `R$ ${v}`;
    }
    if (metrica === 'pesoOS') {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}Mt`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}t`;
      return `${v} kg`;
    }
    return v;
  };

  const formatTooltip = (v) => {
    if (metrica === 'valoresOS') return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (metrica === 'pesoOS') return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
    if (metrica === 'quantOS') return `${v} OS`;
    return `${v} itens`;
  };

  const formatResumo = (v) => {
    if (metrica === 'valoresOS') {
      if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
      if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
      return `R$ ${v.toFixed(0)}`;
    }
    if (metrica === 'pesoOS') {
      return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v.toFixed(0)} kg`;
    }
    return v.toLocaleString('pt-BR');
  };

  const tituloMetrica = {
    quantOS: 'Total por Prazo - Ano Corrente',
    quantItens: 'Itens por Prazo - Ano Corrente',
    valoresOS: 'Valor de Materiais por Prazo - Ano Corrente',
    pesoOS: 'Peso de Materiais por Prazo - Ano Corrente',
  }[metrica];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          {titulo}
          <span
            className="relative group inline-flex items-center"
            tabIndex={0}
          >
            <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
            <span className="invisible group-hover:visible group-focus-within:visible absolute left-6 top-1/2 -translate-y-1/2 z-20 w-80 p-3 bg-slate-900 text-white text-xs font-normal normal-case tracking-normal rounded-lg shadow-xl">
              <strong className="block mb-1">Como o prazo é calculado:</strong>
              <span className="block mb-1.5">• <strong>Início:</strong> maior data entre <em>Data Reserva</em>, <em>Data Ressuprimento</em> e <em>Data Aprovação EPI</em> (aba Documento da OS).</span>
              <span className="block mb-1.5">• <strong>Fim:</strong> <em>Data MIGO</em>.</span>
              <span className="block mb-1.5">• Apenas dias úteis (segunda a sexta) são contados — sábados, domingos e <em>feriados cadastrados</em> (nacionais, estaduais, municipais ou locais conforme o almoxarifado da OS) são descontados.</span>
              <strong className="block mt-2 mb-1">SLA por prioridade:</strong>
              <span className="block">• Baixa, Média, Alta: <strong>7 dias úteis</strong></span>
              <span className="block">• Urgente: <strong>1 dia útil</strong></span>
            </span>
          </span>
        </h3>
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-full">
          {METRICAS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setMetrica(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                metrica === opt.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras Mensais */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {tituloMetrica}
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dadosMensais} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} width={80} tickFormatter={formatTickY} allowDecimals={metrica !== 'quantOS' && metrica !== 'quantItens'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => [formatTooltip(value)]}
              />
              <Bar dataKey="No Prazo" stackId="total" fill="#22c55e" radius={[0, 0, 0, 0]}>
                <LabelList position="center" content={(props) => {
                  const { x, y, width, height } = props;
                  const row = dadosMensais[props.index];
                  if (!row) return null;
                  const noPrazo = row['No Prazo'];
                  const total = noPrazo + row['Fora do Prazo'];
                  if (total === 0 || noPrazo === 0 || height < 16) return null;
                  const percent = Math.round((noPrazo / total) * 100);
                  return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700">{percent}%</text>;
                }} />
              </Bar>
              <Bar dataKey="Fora do Prazo" stackId="total" fill="#ef4444" radius={[8, 8, 0, 0]}>
                <LabelList position="center" content={(props) => {
                  const { x, y, width, height } = props;
                  const row = dadosMensais[props.index];
                  if (!row) return null;
                  const foraPrazo = row['Fora do Prazo'];
                  const total = row['No Prazo'] + foraPrazo;
                  if (total === 0 || foraPrazo === 0 || height < 16) return null;
                  const percent = Math.round((foraPrazo / total) * 100);
                  return <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700">{percent}%</text>;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Rosca - Resumo Anual */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Resumo Anual por Prazo</h4>
          {total === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'No Prazo', value: totalNoPrazo, fill: '#22c55e' },
                        { name: 'Fora do Prazo', value: totalForaPrazo, fill: '#ef4444' }
                      ]}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                      paddingAngle={2} dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{percentualNoPrazo}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No Prazo</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 w-full">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">No Prazo</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{formatResumo(totalNoPrazo)}</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Fora do Prazo</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{formatResumo(totalForaPrazo)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}