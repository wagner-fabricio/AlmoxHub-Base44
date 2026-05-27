import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine, LabelList,
  AreaChart, Area
} from 'recharts';
import { Target, Clock, Package, TrendingUp, DollarSign, Shield, Box, Navigation, Truck, HelpCircle, FileSpreadsheet } from 'lucide-react';
import { exportTabelaExcel } from '@/components/dashboard/exportTabelaExcel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';
import { useApp } from '@/components/contexts/AppContext';
import OSFormModal from '@/components/os/OSFormModal';
import LeadTimeReservasMensal from '@/components/dashboard/LeadTimeReservasMensal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const safeFormat = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : format(dt, 'dd/MM/yy');
};

// Calcula dias úteis entre duas datas (exclui sábados/domingos)
const diasUteisEntre = (start, end) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  if (e < s) return null;
  let count = 0;
  const cur = new Date(s);
  while (cur < e) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

// Início do prazo de atendimento = maior data entre Reserva, Ressuprimento e Aprovação EPI (aba Documento da OS)
const maiorDataInicioDocumento = (os) => {
  const candidatos = [os?.data_reserva, os?.data_ressuprimento, os?.data_aprovacao_epi]
    .map(d => d ? new Date(d) : null)
    .filter(d => d && !isNaN(d.getTime()));
  if (candidatos.length === 0) return null;
  return new Date(Math.max(...candidatos.map(d => d.getTime())));
};

// SLA por prioridade (em dias úteis): urgente = 1 dia útil; demais = 7 dias úteis
const slaPorPrioridade = (prioridade) => prioridade === 'urgente' ? 1 : 7;

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

const MODAL_COLORS = {
  'Terrestre': '#0000FF', 'Aéreo': '#FF6B00', 'Marítimo': '#10b981', 'Misto': '#6366F1',
};
const RESP_COLORS = {
  'Transportadora': '#0000FF', 'Arrematante': '#FF6B00', 'Empreiteira': '#10b981',
  'Locadora': '#6366F1', 'Portador': '#f59e0b', 'Axia': '#0A003C', 'Correios': '#ef4444',
};
const VINC_COLORS = { 'Custeio': '#0000FF', 'Investimento': '#FF6B00', 'Não definido': '#94a3b8' };

// ─── OTIF calc ────────────────────────────────────────────────────────────────
function calcularOTIF(osExpedicao) {
  const entregues = osExpedicao.filter(os => os.status_separacao === 'entregue');
  const isOnTime = (os) => os.data_entrega && os.data_necessidade
    ? new Date(os.data_entrega) <= new Date(os.data_necessidade) : false;
  const isInFull = (os) => {
    const itens = os.itens_documento || [];
    if (itens.length === 0) return false;
    if (itens.every(i => i.separado === true)) return true;
    const qtdSol = itens.reduce((s, i) => s + (i.quantidade || 0), 0);
    const qtdSep = itens.reduce((s, i) => s + (i.quantidade_separada || 0), 0);
    return qtdSep >= qtdSol && qtdSol > 0;
  };
  const totalOT = entregues.filter(os => os.data_necessidade).length;
  const totalIF = entregues.filter(os => (os.itens_documento || []).length > 0).length;
  const totalOTIF = entregues.filter(os => os.data_necessidade && (os.itens_documento || []).length > 0).length;
  const otCount = entregues.filter(isOnTime).length;
  const ifCount = entregues.filter(isInFull).length;
  const otifCount = entregues.filter(os => isOnTime(os) && isInFull(os)).length;
  return {
    otRate: totalOT > 0 ? Math.round((otCount / totalOT) * 100) : 0,
    ifRate: totalIF > 0 ? Math.round((ifCount / totalIF) * 100) : 0,
    otifRate: totalOTIF > 0 ? Math.round((otifCount / totalOTIF) * 100) : 0,
    otCount, ifCount, otifCount, totalOT, totalIF, totalOTIF, entregues, isOnTime, isInFull,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, gradient, icon: Icon }) {
  return (
    <div className="relative rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[120px]"
      style={{ background: gradient }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-white/80 text-xs font-medium leading-tight pr-2">{title}</p>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }} />
      {title}
    </h3>
  );
}

function DonutChart({ value, color, size = 200, innerRadius = 60, outerRadius = 85 }) {
  const data = [{ value }, { value: 100 - value }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius}
            startAngle={90} endAngle={-270} dataKey="value" paddingAngle={2}>
            <Cell fill={color} /><Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-slate-900 dark:text-white" style={{ fontSize: size > 150 ? 28 : 20 }}>{value}%</span>
      </div>
    </div>
  );
}

const EmptyState = ({ msg = 'Dados insuficientes para exibir' }) => (
  <div className="h-40 flex items-center justify-center text-slate-400 text-sm">{msg}</div>
);

// ─── Help Modal ──────────────────────────────────────────────────────────────
function HelpModalExpedicao({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            Guia de Indicadores — Painel de Expedição
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">

          {[
            {
              num: 1, sigla: 'OTIF', titulo: 'On-Time In-Full',
              desc: 'Percentual de entregas realizadas dentro do prazo E com a quantidade completa.',
              formula: 'OTIF = (Entregas OT ∩ IF / Total Entregas Elegíveis) × 100',
              semaforo: [['≥ 95%', 'Excelente', 'green'], ['80–95%', 'Bom', 'blue'], ['< 80%', 'Crítico', 'red']],
              exemplo: '10 OS entregues; 7 foram on-time e in-full → OTIF = 70%'
            },
            {
              num: 2, sigla: 'On-Time', titulo: 'Entrega No Prazo',
              desc: 'Percentual de entregas com data_entrega ≤ data_necessidade.',
              formula: 'OT = (Entregas com data_entrega ≤ data_necessidade / Total com necessidade) × 100',
              exemplo: '8 de 10 OS entregues antes ou na data pedida → OT = 80%'
            },
            {
              num: 3, sigla: 'In-Full', titulo: 'Entrega Completa',
              desc: 'Percentual de entregas com todos os itens completamente separados (separado=true ou quantidade_separada ≥ quantidade).',
              formula: 'IF = (Entregas com itens 100% separados / Total com itens) × 100',
              exemplo: '9 de 10 OS tiveram todos itens separados → IF = 90%'
            },
            {
              num: 4, sigla: 'TCS', titulo: 'Tempo de Ciclo de Separação',
              desc: 'Tempo médio em dias entre o início da separação e a conclusão da separação.',
              formula: 'TCS = Média(separacao_concluida_em − data_separacao) em dias',
              exemplo: 'OS A: 2d, OS B: 4d, OS C: 3d → TCS = 3 dias'
            },
            {
              num: 5, sigla: 'TCR-MIGO', titulo: 'Ciclo Reserva → MIGO',
              desc: 'Tempo médio do processo logístico desde a abertura da reserva até o lançamento do MIGO (saída no SAP).',
              formula: 'TCR-MIGO = Média(data_migo − data_reserva) em dias',
              semaforo: [['≤ 5d', 'Ágil', 'green'], ['6–10d', 'Atenção', 'yellow'], ['> 10d', 'Lento', 'red']],
              exemplo: 'Reserva em 01/03, MIGO em 08/03 → 7 dias'
            },
            {
              num: 6, sigla: 'Mix Modal', titulo: 'Distribuição por Modal',
              desc: 'Percentual de expedições por modal de transporte utilizado (Terrestre, Aéreo, Marítimo, Misto).',
              formula: '% Modal = (qtd expedições por modal / total expedições) × 100',
              exemplo: '40 Terrestre, 10 Aéreo de 50 expedições → Terrestre 80%, Aéreo 20%'
            },
            {
              num: 7, sigla: 'TACarona', titulo: 'Taxa de Aproveitamento de Carona',
              desc: 'Percentual de expedições que aproveitaram transporte compartilhado, reduzindo custo logístico.',
              formula: 'TACarona = (Expedições com aproveitando_carona = true / Total) × 100',
              exemplo: '15 de 50 expedições usaram carona → TACarona = 30%'
            },
            {
              num: 8, sigla: 'TCS-Seg', titulo: 'Cobertura de Seguro',
              desc: 'Dos materiais marcados como seguráveis, qual percentual das OS efetivamente usou seguro no transporte.',
              formula: 'TCS-Seg = (OS com itens seguráveis E usar_seguro=true / OS com itens seguráveis) × 100',
              exemplo: '3 de 5 OS com itens seguráveis usaram seguro → TCS-Seg = 60%'
            },
            {
              num: 9, sigla: 'CMF', titulo: 'Custo Médio de Frete',
              desc: 'Valor médio pago por frete nas expedições com transportadora contratada.',
              formula: 'CMF = Σ(transportadora.valor_frete) / nº expedições com frete',
              exemplo: 'R$1.500 + R$2.500 em 2 expedições → CMF = R$2.000'
            },
            {
              num: 10, sigla: 'TME', titulo: 'Ticket Médio por Expedição',
              desc: 'Valor médio dos materiais expedidos por remessa.',
              formula: 'TME = Σ(detalhamento_expedicao.valor_total) / total de expedições com valor',
              exemplo: 'R$10k + R$20k + R$30k em 3 expedições → TME = R$20.000'
            },
            {
              num: 11, sigla: 'Volume', titulo: 'Volume Expedido (M³ e Peso)',
              desc: 'Soma total do volume cúbico e peso bruto dos volumes registrados nas OS do período.',
              formula: 'Volume = Σ(volumes.m3) | Peso = Σ(volumes.peso_bruto)',
              exemplo: '10 volumes de 0,5m³ cada = 5m³ total'
            },
          ].map(item => (
            <div key={item.num} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold shrink-0">{item.num}</span>
                <span className="text-blue-700 dark:text-blue-400">{item.sigla}</span>
                <span className="text-slate-600 dark:text-slate-400 font-normal">— {item.titulo}</span>
              </h3>
              <p className="text-slate-500 text-xs mb-2">{item.desc}</p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-700 dark:text-slate-300 mb-2">{item.formula}</div>
              {item.semaforo && (
                <div className="flex gap-2 mb-2">
                  {item.semaforo.map(([v, l, c]) => (
                    <div key={v} className={`flex-1 rounded p-1.5 text-center text-xs bg-${c}-50 text-${c}-700 dark:bg-${c}-900/20 dark:text-${c}-400`}>
                      <div className="font-bold">{v}</div>
                      <div>{l}</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 italic">Exemplo: {item.exemplo}</p>
            </div>
          ))}

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PainelExpedicao({ filteredOrdens, almoxarifados, hideToolbar = false }) {
  const { regionais, categorias, subcategorias, pessoas, instalacoes: ctxInstalacoes, projetos: ctxProjetos } = useApp();
  const [selectedOS, setSelectedOS] = useState(null);
  const [formInitialMode, setFormInitialMode] = useState('edit');
  const [showHelp, setShowHelp] = useState(false);
  const [tabelaPage, setTabelaPage] = useState(1);
  const TABELA_PAGE_SIZE = 200;

  // Use AppContext data — no extra requests needed
  const instalacoes = ctxInstalacoes || [];
  const projetos = ctxProjetos || [];

  // ── OTIF ──────────────────────────────────────────────────────────────────
  const { otRate, ifRate, otifRate, otCount, ifCount, otifCount, totalOT, totalIF, totalOTIF, entregues, isOnTime, isInFull } =
    useMemo(() => calcularOTIF(filteredOrdens), [filteredOrdens]);

  // ── Todas as expedições (detalhamento) ────────────────────────────────────
  const todasExpedicoes = useMemo(() =>
    filteredOrdens.flatMap(os => (os.detalhamento_expedicao || []).map(exp => ({ ...exp, os }))),
    [filteredOrdens]);

  // ── TCS: Ciclo de Separação ───────────────────────────────────────────────
  const osComSep = useMemo(() =>
    filteredOrdens.filter(os => os.data_separacao && os.separacao_concluida_em), [filteredOrdens]);
  const tcs = osComSep.length > 0
    ? (osComSep.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.separacao_concluida_em), new Date(os.data_separacao))), 0) / osComSep.length).toFixed(1)
    : null;

  // ── Lead Time Reservas: dias úteis entre maior(Reserva, Ressuprimento, Aprov.EPI) e data_migo ────────
  const osComMigo = useMemo(() => {
    return filteredOrdens
      .map(os => {
        const inicio = maiorDataInicioDocumento(os);
        const dias = diasUteisEntre(inicio, os.data_migo);
        return { os, dias, sla: slaPorPrioridade(os.prioridade) };
      })
      .filter(x => x.dias !== null && x.os.data_migo);
  }, [filteredOrdens]);
  const tcrMigo = osComMigo.length > 0
    ? (osComMigo.reduce((s, x) => s + x.dias, 0) / osComMigo.length).toFixed(1)
    : null;

  // ── Mix Modal ─────────────────────────────────────────────────────────────
  const mixModal = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => { if (e.modal_transporte) map[e.modal_transporte] = (map[e.modal_transporte] || 0) + 1; });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v, pct: total > 0 ? Math.round((v / total) * 100) : 0 })).sort((a, b) => b.value - a.value);
  }, [todasExpedicoes]);

  // ── Mix Responsável ───────────────────────────────────────────────────────
  const mixResponsavel = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => { if (e.responsavel_transporte) map[e.responsavel_transporte] = (map[e.responsavel_transporte] || 0) + 1; });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v, pct: total > 0 ? Math.round((v / total) * 100) : 0 })).sort((a, b) => b.value - a.value);
  }, [todasExpedicoes]);

  // ── TACarona ──────────────────────────────────────────────────────────────
  const caronaCount = todasExpedicoes.filter(e => e.aproveitando_carona === true).length;
  const taCarona = todasExpedicoes.length > 0 ? Math.round((caronaCount / todasExpedicoes.length) * 100) : 0;

  // ── TCS-Seg: Cobertura de Seguro ──────────────────────────────────────────
  const osComSeguravel = filteredOrdens.filter(os => (os.itens_documento || []).some(i => i.seguravel));
  const comSeguro = osComSeguravel.filter(os => (os.detalhamento_expedicao || []).some(e => e.usar_seguro)).length;
  const tcsSeg = osComSeguravel.length > 0 ? Math.round((comSeguro / osComSeguravel.length) * 100) : null;

  // ── CMF + frete total ─────────────────────────────────────────────────────
  const expComFrete = todasExpedicoes.filter(e => (e.transportadora?.valor_frete || 0) > 0);
  const freteTotal = expComFrete.reduce((s, e) => s + (e.transportadora.valor_frete || 0), 0);
  const cmf = expComFrete.length > 0 ? freteTotal / expComFrete.length : null;

  // ── TME: Ticket Médio ─────────────────────────────────────────────────────
  const expComValor = todasExpedicoes.filter(e => (e.valor_total || 0) > 0);
  const tme = expComValor.length > 0
    ? expComValor.reduce((s, e) => s + (e.valor_total || 0), 0) / expComValor.length : null;

  // ── Volume ────────────────────────────────────────────────────────────────
  const volumeM3Total = filteredOrdens.reduce((s, os) => s + (os.volumes || []).reduce((a, v) => a + (v.m3 || 0), 0), 0);
  const pesoTotalKg = filteredOrdens.reduce((s, os) => s + (os.volumes || []).reduce((a, v) => a + (v.peso_bruto || 0), 0), 0);

  // ── Vinculação ────────────────────────────────────────────────────────────
  const vinculacaoData = useMemo(() => {
    const c = filteredOrdens.filter(os => os.vinculacao === 'custeio').length;
    const inv = filteredOrdens.filter(os => os.vinculacao === 'investimento').length;
    const nd = filteredOrdens.filter(os => !os.vinculacao).length;
    return [{ name: 'Custeio', value: c }, { name: 'Investimento', value: inv }, { name: 'Não definido', value: nd }].filter(d => d.value > 0);
  }, [filteredOrdens]);
  const totalVinc = vinculacaoData.reduce((s, d) => s + d.value, 0);

  // ── Ranking Transportadoras ───────────────────────────────────────────────
  const rankingTransp = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => {
      const nome = e.transportadora?.razao_social;
      if (!nome) return;
      if (!map[nome]) map[nome] = { nome, qtd: 0, frete: 0 };
      map[nome].qtd++;
      map[nome].frete += e.transportadora?.valor_frete || 0;
    });
    return Object.values(map).sort((a, b) => b.qtd - a.qtd).slice(0, 8).map(t => ({
      ...t, name: t.nome.length > 24 ? t.nome.substring(0, 22) + '…' : t.nome, nomeCompleto: t.nome,
    }));
  }, [todasExpedicoes]);

  // ── OTIF por Almoxarifado ─────────────────────────────────────────────────
  const otifPorAlmoxarifado = useMemo(() => {
    return almoxarifados.map(almox => {
      const osAlmox = entregues.filter(os => os.almoxarifado_id === almox.id && os.data_necessidade && (os.itens_documento || []).length > 0);
      if (osAlmox.length === 0) return null;
      const cnt = osAlmox.filter(os => isOnTime(os) && isInFull(os)).length;
      const pct = Math.round((cnt / osAlmox.length) * 100);
      return { name: almox.nome.length > 20 ? almox.nome.substring(0, 18) + '…' : almox.nome, nomeCompleto: almox.nome, otif: pct, naoOtif: 100 - pct, total: osAlmox.length };
    }).filter(Boolean).sort((a, b) => b.otif - a.otif);
  }, [entregues, almoxarifados]);

  // ── Volume Mensal ─────────────────────────────────────────────────────────
  const volumeMensal = useMemo(() => {
    const map = {};
    filteredOrdens.forEach(os => {
      if (!os.created_date) return;
      const key = os.created_date.substring(0, 7);
      if (!map[key]) map[key] = { m3: 0, peso: 0 };
      (os.volumes || []).forEach(v => { map[key].m3 += v.m3 || 0; map[key].peso += v.peso_bruto || 0; });
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), m3: parseFloat(v.m3.toFixed(1)), peso: parseFloat(v.peso.toFixed(0)) };
      })
      .filter(d => d.m3 > 0 || d.peso > 0);
  }, [filteredOrdens]);

  // ── Frete & Ticket Mensal ─────────────────────────────────────────────────
  const freteMensal = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => {
      if (!e.os?.created_date) return;
      const key = e.os.created_date.substring(0, 7);
      if (!map[key]) map[key] = { frete: 0, valor: 0, qtd: 0 };
      map[key].frete += e.transportadora?.valor_frete || 0;
      map[key].valor += e.valor_total || 0;
      map[key].qtd++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), frete: Math.round(v.frete), ticket: v.qtd > 0 ? Math.round(v.valor / v.qtd) : 0 };
      })
      .filter(d => d.frete > 0 || d.ticket > 0);
  }, [todasExpedicoes]);

  // ── Ciclo MIGO Mensal ─────────────────────────────────────────────────────
  const cicloMigoMensal = useMemo(() => {
    const map = {};
    osComMigo.forEach(({ os, dias }) => {
      const inicio = maiorDataInicioDocumento(os);
      if (!inicio) return;
      const iso = inicio.toISOString();
      const key = iso.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, dias: 0 };
      map[key].total++;
      map[key].dias += dias;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), dias: parseFloat((v.dias / v.total).toFixed(1)) };
      });
  }, [osComMigo]);

  // ── Tendência OTIF Mensal ─────────────────────────────────────────────────
  const tendenciaMensal = useMemo(() => {
    const map = {};
    entregues.forEach(os => {
      if (!os.data_entrega || !os.data_necessidade || !(os.itens_documento || []).length) return;
      const key = os.data_entrega.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, otif: 0 };
      map[key].total++;
      if (isOnTime(os) && isInFull(os)) map[key].otif++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), otif: Math.round((v.otif / v.total) * 100) };
      });
  }, [entregues]);

  // ── Distribuição Tempo Entrega ────────────────────────────────────────────
  const distribuicaoTempoEntrega = useMemo(() => {
    const buckets = [
      { label: '-15d to -10d', min: -Infinity, max: -10 }, { label: '-10d to -5d', min: -10, max: -5 },
      { label: '-5d to -1d', min: -5, max: -1 }, { label: 'On Time', min: -1, max: 0 },
      { label: '1d - 5d', min: 0, max: 5 }, { label: '5d - 10d', min: 5, max: 10 },
      { label: '10d - 15d', min: 10, max: 15 }, { label: 'more than 15d', min: 15, max: Infinity },
    ];
    const osComDatas = entregues.filter(os => os.data_entrega && os.data_necessidade);
    const total = osComDatas.length;
    if (total === 0) return [];
    return buckets.map(b => {
      const count = osComDatas.filter(os => {
        const dias = differenceInDays(new Date(os.data_entrega), new Date(os.data_necessidade));
        return dias > b.min && dias <= b.max;
      }).length;
      return { label: b.label, pct: total > 0 ? Math.round((count / total) * 100) : 0, count, isOnTime: b.label === 'On Time' };
    }).filter(b => b.count > 0 || b.label === 'On Time');
  }, [entregues]);

  // ── Tabela de OS ──────────────────────────────────────────────────────────
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters();

  const osTabela = useMemo(() => {
    return filteredOrdens.map(os => {
      const itens = os.itens_documento || [];
      const qtdSol = itens.reduce((s, i) => s + (i.quantidade || 0), 0);
      const qtdSep = itens.reduce((s, i) => s + (i.quantidade_separada || 0), 0);
      const tempoEntrega = (os.data_entrega && os.data_necessidade) ? differenceInDays(new Date(os.data_entrega), new Date(os.data_necessidade)) : null;
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      const tempoCicloSep = (os.data_separacao && os.separacao_concluida_em)
        ? Math.abs(differenceInDays(new Date(os.separacao_concluida_em), new Date(os.data_separacao)))
        : null;
      const leadTimeReservaMigo = diasUteisEntre(maiorDataInicioDocumento(os), os.data_migo);
      const leadTimeSLA = slaPorPrioridade(os.prioridade);
      const subcatNomes = (os.subcategorias_ids || [])
        .map(sid => subcategorias?.find(s => s.id === sid)?.nome)
        .filter(Boolean)
        .join(', ') || '—';
      const liderNome = pessoas?.find(p => p.id === os.lider_id)?.nome || '—';
      return { os, almox, qtdSol, qtdSep, tempoEntrega, tempoCicloSep, leadTimeReservaMigo, leadTimeSLA, subcatNomes, liderNome };
    });
  }, [filteredOrdens, almoxarifados, subcategorias, pessoas]);

  const osTabelaFiltrada = useMemo(() => {
    let rows = [...osTabela];
    Object.entries(columnFilters).forEach(([col, values]) => {
      if (!values || values.length === 0) return;
      rows = rows.filter(({ os, almox, tempoEntrega, subcatNomes, liderNome }) => {
        if (col === 'almox') return values.includes(almox?.nome || '—');
        if (col === 'instalacao_origem') {
          const inst = instalacoes?.find(i => i.id === os.instalacao_origem_id);
          return values.includes(inst?.nome || '—');
        }
        if (col === 'instalacao_destino') {
          const inst = instalacoes?.find(i => i.id === os.instalacao_destino_id);
          return values.includes(inst?.nome || '—');
        }
        if (col === 'num_reserva') return values.includes(os.num_reserva || '—');
        if (col === 'num_migo') return values.includes(os.num_migo || '—');
        if (col === 'data_reserva') return values.includes(safeFormat(os.data_reserva));
        if (col === 'data_migo') return values.includes(safeFormat(os.data_migo));
        if (col === 'data_necessidade') return values.includes(safeFormat(os.data_necessidade));
        if (col === 'data_entrega') return values.includes(safeFormat(os.data_entrega));
        if (col === 'tempoEntrega') {
          const label = tempoEntrega === null ? '—' : (tempoEntrega === 0 ? 'No prazo' : `${tempoEntrega > 0 ? '+' : ''}${tempoEntrega}d`);
          return values.includes(label);
        }
        if (col === 'subcategoria') return values.includes(subcatNomes);
        if (col === 'lider') return values.includes(liderNome);
        return true;
      });
    });
    if (sortConfig.column && sortConfig.direction) {
      rows.sort((a, b) => {
        let va, vb;
        const col = sortConfig.column;
        if (col === 'codigo') { va = a.os.codigo || ''; vb = b.os.codigo || ''; }
        else if (col === 'almox') { va = a.almox?.nome || ''; vb = b.almox?.nome || ''; }
        else if (col === 'instalacao_origem') {
          va = instalacoes?.find(i => i.id === a.os.instalacao_origem_id)?.nome || '';
          vb = instalacoes?.find(i => i.id === b.os.instalacao_origem_id)?.nome || '';
        }
        else if (col === 'instalacao_destino') {
          va = instalacoes?.find(i => i.id === a.os.instalacao_destino_id)?.nome || '';
          vb = instalacoes?.find(i => i.id === b.os.instalacao_destino_id)?.nome || '';
        }
        else if (col === 'num_reserva') { va = a.os.num_reserva || ''; vb = b.os.num_reserva || ''; }
        else if (col === 'num_migo') { va = a.os.num_migo || ''; vb = b.os.num_migo || ''; }
        else if (col === 'data_reserva') { va = a.os.data_reserva || ''; vb = b.os.data_reserva || ''; }
        else if (col === 'data_migo') { va = a.os.data_migo || ''; vb = b.os.data_migo || ''; }
        else if (col === 'qtdSol') { va = a.qtdSol; vb = b.qtdSol; }
        else if (col === 'qtdSep') { va = a.qtdSep; vb = b.qtdSep; }
        else if (col === 'data_necessidade') { va = a.os.data_necessidade || ''; vb = b.os.data_necessidade || ''; }
        else if (col === 'data_entrega') { va = a.os.data_entrega || ''; vb = b.os.data_entrega || ''; }
        else if (col === 'tempoEntrega') { va = a.tempoEntrega ?? Infinity; vb = b.tempoEntrega ?? Infinity; }
        else if (col === 'cicloSep') { va = a.tempoCicloSep ?? Infinity; vb = b.tempoCicloSep ?? Infinity; }
        else if (col === 'leadTimeReservaMigo') { va = a.leadTimeReservaMigo ?? Infinity; vb = b.leadTimeReservaMigo ?? Infinity; }
        else if (col === 'volM3') {
          va = (a.os.volumes || []).reduce((s, v) => s + (v.m3 || 0), 0);
          vb = (b.os.volumes || []).reduce((s, v) => s + (v.m3 || 0), 0);
        }
        else if (col === 'status_separacao') { va = a.os.status_separacao || ''; vb = b.os.status_separacao || ''; }
        else if (col === 'progresso') { va = Number(a.os.progresso) || 0; vb = Number(b.os.progresso) || 0; }
        else if (col === 'subcategoria') { va = a.subcatNomes; vb = b.subcatNomes; }
        else if (col === 'lider') { va = a.liderNome; vb = b.liderNome; }
        else { va = ''; vb = ''; }
        if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [osTabela, sortConfig, columnFilters]);

  const getUniqueValues = (col) => {
    const vals = osTabela.map(({ os, almox, tempoEntrega, subcatNomes, liderNome }) => {
      if (col === 'almox') return almox?.nome || '—';
      if (col === 'instalacao_origem') {
        const inst = instalacoes?.find(i => i.id === os.instalacao_origem_id);
        return inst?.nome || '—';
      }
      if (col === 'instalacao_destino') {
        const inst = instalacoes?.find(i => i.id === os.instalacao_destino_id);
        return inst?.nome || '—';
      }
      if (col === 'num_reserva') return os.num_reserva || '—';
      if (col === 'num_migo') return os.num_migo || '—';
      if (col === 'data_reserva') return safeFormat(os.data_reserva);
      if (col === 'data_migo') return safeFormat(os.data_migo);
      if (col === 'data_necessidade') return safeFormat(os.data_necessidade);
      if (col === 'data_entrega') return safeFormat(os.data_entrega);
      if (col === 'tempoEntrega') return tempoEntrega === null ? '—' : (tempoEntrega === 0 ? 'No prazo' : `${tempoEntrega > 0 ? '+' : ''}${tempoEntrega}d`);
      if (col === 'subcategoria') return subcatNomes;
      if (col === 'lider') return liderNome;
      return '—';
    });
    return [...new Set(vals)].sort();
  };

  const temDados = entregues.length > 0;

  return (
    <>
    <div className="space-y-6">

      {/* ── Botões de ação ── */}
      {!hideToolbar && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = osTabelaFiltrada.map(({ os, almox, qtdSol, qtdSep, tempoEntrega, tempoCicloSep, leadTimeReservaMigo, subcatNomes, liderNome }) => {
              const totalM3 = (os.volumes || []).reduce((sum, v) => sum + (v.m3 || 0), 0);
              const origem = instalacoes?.find(i => i.id === os.instalacao_origem_id);
              const destino = instalacoes?.find(i => i.id === os.instalacao_destino_id);
              return {
                'Nº OS': os.codigo || os.id?.substring(0, 8) || '',
                'Status Exp.': os.status_separacao || '',
                'Progresso (%)': Math.max(0, Math.min(100, Math.round(os.progresso || 0))),
                'Subcategoria': subcatNomes === '—' ? '' : subcatNomes,
                'Almoxarifado': almox?.nome || '',
                'Origem': origem?.nome || '',
                'Destino': destino?.nome || '',
                'Nº Reserva': os.num_reserva || '',
                'Nº MIGO': os.num_migo || '',
                'Reserva': safeFormat(os.data_reserva),
                'MIGO': safeFormat(os.data_migo),
                'Sol.': qtdSol || 0,
                'Sep.': qtdSep || 0,
                'Necessidade': safeFormat(os.data_necessidade),
                'Entrega': safeFormat(os.data_entrega),
                'Tempo (dias)': tempoEntrega !== null ? tempoEntrega : '',
                'Ciclo Sep. (dias)': tempoCicloSep !== null ? tempoCicloSep : '',
                'Lead Time Atend. (dias úteis)': leadTimeReservaMigo !== null ? leadTimeReservaMigo : '',
                'Vol. M³': totalM3 > 0 ? totalM3 : '',
                'Líder': liderNome === '—' ? '' : liderNome,
              };
            });
            exportTabelaExcel(rows, 'painel_expedicao', 'Dados dos Indicadores');
          }} className="gap-2" disabled={osTabelaFiltrada.length === 0}>
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Exportar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHelp(true)} className="gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            Entender os indicadores
          </Button>
        </div>
      )}

      {/* ── Seção Indicadores ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Volumetrias e Indicadores
        </h3>
        <div className="space-y-4">
          {/* ── KPI Row 1: OTIF, On-Time, In-Full, TCS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard title="OTIF" value={`${otifRate}%`}
              subtitle={`${otifCount} de ${totalOTIF} entregas`}
              gradient="linear-gradient(135deg, #0000FF 0%, #0A003C 100%)" icon={Target} />
            <KPICard title="On-Time" value={`${otRate}%`}
              subtitle={`${otCount} de ${totalOT} no prazo`}
              gradient="linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)" icon={Clock} />
            <KPICard title="In-Full" value={`${ifRate}%`}
              subtitle={`${ifCount} de ${totalIF} completos`}
              gradient="linear-gradient(135deg, #059669 0%, #10B981 100%)" icon={Package} />
            <KPICard title="Ciclo Separação (TCS)"
              value={tcs !== null ? `${tcs}d` : '—'}
              subtitle={`${osComSep.length} OS medidas`}
              gradient="linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)" icon={TrendingUp} />
          </div>

          {/* ── KPI Row 2: TCR-MIGO, CMF, TME, Volume ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard title="Lead Time Reservas"
              value={tcrMigo !== null ? `${tcrMigo}d úteis` : '—'}
              subtitle={`${osComMigo.length} OS medidas (média de dias úteis Reserva→MIGO)`}
              gradient="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)" icon={Navigation} />
            <KPICard title="Custo Médio Frete"
              value={cmf !== null ? `R$${Math.round(cmf).toLocaleString('pt-BR')}` : '—'}
              subtitle={`${expComFrete.length} exp. com frete`}
              gradient="linear-gradient(135deg, #6366F1 0%, #818CF8 100%)" icon={DollarSign} />
            <KPICard title="Ticket Médio"
              value={tme !== null ? `R$${Math.round(tme).toLocaleString('pt-BR')}` : '—'}
              subtitle={`${expComValor.length} exp. com valor`}
              gradient="linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)" icon={DollarSign} />
            <KPICard title="Volume Total"
              value={volumeM3Total > 0 ? `${volumeM3Total.toFixed(1)}m³` : `${pesoTotalKg.toFixed(0)}kg`}
              subtitle={volumeM3Total > 0 ? `${pesoTotalKg.toFixed(0)} kg peso bruto` : 'sem dados de volume'}
              gradient="linear-gradient(135deg, #64748b 0%, #94a3b8 100%)" icon={Box} />
          </div>
        </div>
      </div>

      {/* ── Visão Geral OTIF (donuts + OTIF por Almoxarifado) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Visão Geral OTIF" />
        {!temDados ? (
          <EmptyState msg="Sem entregas registradas no período" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Col 1 — Donut OTIF principal */}
            <div className="lg:col-span-3 flex flex-col items-center gap-2">
              <DonutChart value={otifRate} color="#0000FF" size={170} innerRadius={55} outerRadius={75} />
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">% OTIF</p>
                <p className="text-xs text-slate-500">{otifCount} entregas completas e no prazo</p>
              </div>
            </div>
            {/* Col 2 — Donuts On-Time / In-Full */}
            <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-5 lg:border-l border-slate-200 dark:border-slate-700 lg:pl-6">
              <div className="flex flex-col items-center gap-1.5">
                <DonutChart value={otRate} color="#FF6B00" size={110} innerRadius={36} outerRadius={50} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">% On-Time</p>
                  <p className="text-xs text-slate-500">{otCount}/{totalOT} no prazo</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <DonutChart value={ifRate} color="#10b981" size={110} innerRadius={36} outerRadius={50} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">% In-Full</p>
                  <p className="text-xs text-slate-500">{ifCount}/{totalIF} completas</p>
                </div>
              </div>
            </div>
            {/* Col 3 — Legenda */}
            <div className="lg:col-span-3 flex flex-col gap-2 text-sm lg:border-l border-slate-200 dark:border-slate-700 lg:pl-6">
              {[
                { label: 'OTIF', value: `${otifRate}%`, color: '#0000FF', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                { label: 'On-Time', value: `${otRate}%`, color: '#FF6B00', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                { label: 'In-Full', value: `${ifRate}%`, color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/10' },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between gap-4 p-2.5 rounded-lg ${item.bg}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500">
                Total entregues: <strong>{entregues.length}</strong>
              </div>
            </div>
            {/* Col 4 — % OTIF por Almoxarifado */}
            <div className="lg:col-span-4 lg:border-l border-slate-200 dark:border-slate-700 lg:pl-6">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">% OTIF por Almoxarifado</p>
              {otifPorAlmoxarifado.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={Math.max(220, otifPorAlmoxarifado.length * 32)}>
                  <BarChart data={otifPorAlmoxarifado} layout="vertical" margin={{ top: 5, right: 35, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={90} />
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      formatter={(v, n) => [`${v}%`, n === 'otif' ? '% OTIF' : '% Não-OTIF']}
                      labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l} />
                    <Bar dataKey="otif" stackId="a" name="otif" radius={[0, 0, 0, 0]}>
                      {otifPorAlmoxarifado.map((e, i) => <Cell key={i} fill={e.otif >= 80 ? '#10b981' : e.otif >= 60 ? '#f59e0b' : '#ef4444'} />)}
                    </Bar>
                    <Bar dataKey="naoOtif" stackId="a" fill="#ef444428" name="naoOtif" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Resultados Mensais - Atendimento de Reservas ── */}
      <LeadTimeReservasMensal filteredOrdens={filteredOrdens} />

      {/* ── Mix Modal + Mix Responsável ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Mix por Modal de Transporte" />
          {mixModal.length === 0 ? <EmptyState /> : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={mixModal} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={2} dataKey="value">
                      {mixModal.map((e, i) => <Cell key={i} fill={MODAL_COLORS[e.name] || `hsl(${i*60},70%,50%)`} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {mixModal.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs p-2.5 rounded-lg"
                    style={{ backgroundColor: `${MODAL_COLORS[e.name] || '#94a3b8'}18` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MODAL_COLORS[e.name] || '#94a3b8' }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{e.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white ml-2">{e.value} ({e.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Mix por Responsável pelo Transporte" />
          {mixResponsavel.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mixResponsavel} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={115} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(v, n, p) => [`${v} (${p.payload.pct}%)`, 'Expedições']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {mixResponsavel.map((e, i) => <Cell key={i} fill={RESP_COLORS[e.name] || `hsl(${i*45},65%,50%)`} />)}
                  <LabelList dataKey="value" position="right" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── TACarona + TCS-Seg + Vinculação ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Aproveitamento de Carona" />
          <div className="flex flex-col items-center">
            <DonutChart value={taCarona} color="#FF6B00" size={160} innerRadius={50} outerRadius={72} />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3 text-center">
              {caronaCount} de {todasExpedicoes.length} expedições
            </p>
            <p className="text-xs text-slate-400 mt-1 text-center">aproveitaram transporte compartilhado</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Cobertura de Seguro" />
          {tcsSeg === null ? (
            <EmptyState msg="Nenhum item segurável encontrado" />
          ) : (
            <div className="flex flex-col items-center">
              <DonutChart value={tcsSeg} color="#059669" size={160} innerRadius={50} outerRadius={72} />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3 text-center">
                {comSeguro} de {osComSeguravel.length} OS com itens seguráveis
              </p>
              <p className="text-xs text-slate-400 mt-1 text-center">utilizaram seguro</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Custeio vs Investimento" />
          {vinculacaoData.length === 0 ? <EmptyState /> : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={vinculacaoData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value">
                      {vinculacaoData.map((e, i) => <Cell key={i} fill={VINC_COLORS[e.name] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 w-full">
                {vinculacaoData.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs p-2 rounded"
                    style={{ backgroundColor: `${VINC_COLORS[e.name]}18` }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VINC_COLORS[e.name] }} />
                      <span className="text-slate-700 dark:text-slate-300">{e.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {e.value} ({totalVinc > 0 ? Math.round((e.value / totalVinc) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ranking de Transportadoras ── */}
      {rankingTransp.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Ranking de Transportadoras" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Por Frequência (nº expedições)</p>
              <ResponsiveContainer width="100%" height={Math.max(200, rankingTransp.length * 36)}>
                <BarChart data={rankingTransp} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={130} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                    formatter={v => [v, 'Expedições']} />
                  <Bar dataKey="qtd" radius={[0, 4, 4, 0]}>
                    {rankingTransp.map((_, i) => <Cell key={i} fill={`hsl(220, ${80 - i * 5}%, ${58 - i * 3}%)`} />)}
                    <LabelList dataKey="qtd" position="right" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Por Valor de Frete (R$)</p>
              {rankingTransp.some(t => t.frete > 0) ? (
                <ResponsiveContainer width="100%" height={Math.max(200, rankingTransp.length * 36)}>
                  <BarChart data={rankingTransp} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={130} />
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                      formatter={v => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Frete Total']} />
                    <Bar dataKey="frete" radius={[0, 4, 4, 0]}>
                      {rankingTransp.map((_, i) => <Cell key={i} fill={`hsl(150, ${70 - i * 4}%, ${48 - i * 3}%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState msg="Valores de frete não informados" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Volume Expedido Mensal ── */}
      {volumeMensal.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Volume Expedido Mensal (M³ e Peso)" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Volume (m³)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volumeMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradM3exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0000FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0000FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}m³`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} m³`, 'Volume']} />
                  <Area type="monotone" dataKey="m3" stroke="#0000FF" strokeWidth={2} fill="url(#gradM3exp)"
                    dot={{ fill: '#0000FF', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Peso Bruto (kg)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volumeMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradPesoexp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} kg`, 'Peso']} />
                  <Area type="monotone" dataKey="peso" stroke="#FF6B00" strokeWidth={2} fill="url(#gradPesoexp)"
                    dot={{ fill: '#FF6B00', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Frete + Ticket Médio Mensal ── */}
      {freteMensal.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Evolução de Custos — Frete e Ticket Médio" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Custo Total de Frete Mensal (R$)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={freteMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Frete Total']} />
                  <Bar dataKey="frete" fill="#6366F1" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="frete" position="top"
                      formatter={v => v > 0 ? `R$${(v / 1000).toFixed(1)}k` : ''}
                      style={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Ticket Médio por Expedição (R$)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={freteMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Ticket Médio']} />
                  <Line type="monotone" dataKey="ticket" stroke="#0284C7" strokeWidth={2.5}
                    dot={{ fill: '#0284C7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Ciclo Reserva → MIGO Mensal ── */}
      {cicloMigoMensal.length >= 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Evolução Ciclo Reserva → MIGO (dias)" />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cicloMigoMensal} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}d`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} dias`, 'Ciclo Médio']} />
              <Bar dataKey="dias" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="dias" position="top" formatter={v => `${v}d`}
                  style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                {cicloMigoMensal.map((e, i) => (
                  <Cell key={i} fill={e.dias <= 5 ? '#10b981' : e.dias <= 10 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">Verde ≤5d · Amarelo ≤10d · Vermelho &gt;10d</p>
        </div>
      )}

      {/* ── Tendência OTIF Mensal ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Tendência OTIF Mensal" />
        {tendenciaMensal.length < 2 ? (
          <EmptyState msg="Dados insuficientes para tendência mensal" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendenciaMensal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, '% OTIF']} />
              <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5"
                label={{ value: 'Meta: 80%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
              <Line type="monotone" dataKey="otif" stroke="#0000FF" strokeWidth={2.5}
                dot={{ fill: '#0000FF', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Distribuição por Tempo de Entrega ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Distribuição por Tempo de Entrega" />
        {distribuicaoTempoEntrega.length === 0 ? (
          <EmptyState msg="Sem entregas com datas preenchidas" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribuicaoTempoEntrega} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v, n, p) => [`${v}% (${p.payload.count} OS)`, 'Entregas']} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="pct" position="top"
                  formatter={v => v > 0 ? `${v}%` : ''} style={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                {distribuicaoTempoEntrega.map((e, i) => {
                  let color = '#ef4444';
                  if (e.label === 'On Time') color = '#10b981';
                  else if (e.label.startsWith('-')) color = '#10b981';
                  else if (e.label === '1d - 5d') color = '#f59e0b';
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tabela de OS ── */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(osTabelaFiltrada.length / TABELA_PAGE_SIZE));
        const safePage = Math.min(tabelaPage, totalPages);
        const pageRows = osTabelaFiltrada.slice((safePage - 1) * TABELA_PAGE_SIZE, safePage * TABELA_PAGE_SIZE);
        const startRow = (safePage - 1) * TABELA_PAGE_SIZE + 1;
        const endRow = Math.min(safePage * TABELA_PAGE_SIZE, osTabelaFiltrada.length);
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Dados dos Indicadores
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({osTabelaFiltrada.length}{osTabelaFiltrada.length !== osTabela.length ? ` de ${osTabela.length}` : ''} OS)
                  </span>
                </h3>
                {osTabelaFiltrada.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exibindo {startRow}–{endRow} de {osTabelaFiltrada.length}
                  </p>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTabelaPage(1)}
                    disabled={safePage === 1}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >«</button>
                  <button
                    onClick={() => setTabelaPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setTabelaPage(p)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${safePage === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >{p}</button>
                    ))
                  }
                  <button
                    onClick={() => setTabelaPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >›</button>
                  <button
                    onClick={() => setTabelaPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >»</button>
                </div>
              )}
            </div>
            {osTabela.length === 0 ? (
              <EmptyState msg="Nenhuma OS com movimentação encontrada" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                      {[
                        { col: 'codigo', label: 'Nº OS', filter: false, width: 'w-48' },
                        { col: 'status_separacao', label: 'Status Exp.', filter: false, width: 'w-32' },
                        { col: 'progresso', label: 'Progresso', filter: false, width: 'w-28' },
                        { col: 'subcategoria', label: 'Subcategoria', filter: true, width: 'w-32' },
                        { col: 'almox', label: 'Almoxarifado', filter: true, width: 'w-36' },
                        { col: 'instalacao_origem', label: 'Origem', filter: true, width: 'w-36' },
                        { col: 'instalacao_destino', label: 'Destino', filter: true, width: 'w-36' },
                        { col: 'num_reserva', label: 'Nº Reserva', filter: true, width: 'w-24' },
                        { col: 'num_migo', label: 'Nº MIGO', filter: true, width: 'w-24' },
                        { col: 'data_reserva', label: 'Reserva', filter: true, width: 'w-24' },
                        { col: 'data_migo', label: 'MIGO', filter: true, width: 'w-24' },
                        { col: 'qtdSol', label: 'Sol.', filter: false, width: 'w-16' },
                        { col: 'qtdSep', label: 'Sep.', filter: false, width: 'w-16' },
                        { col: 'data_necessidade', label: 'Necessidade', filter: true, width: 'w-24' },
                        { col: 'data_entrega', label: 'Entrega', filter: true, width: 'w-24' },
                        { col: 'tempoEntrega', label: 'Tempo', filter: true, width: 'w-20' },
                        { col: 'cicloSep', label: 'Ciclo Sep.', filter: false, width: 'w-24' },
                        { col: 'leadTimeReservaMigo', label: 'Lead Time Atend.', filter: false, width: 'w-32' },
                        { col: 'volM3', label: 'Vol. M³', filter: false, width: 'w-20' },
                        { col: 'lider', label: 'Líder', filter: true, width: 'w-32' },
                      ].map(({ col, label, filter, width }) => (
                        <th key={col} className={`px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left ${width} whitespace-nowrap`}>
                          <SortableTableHead label={label} column={col} sortConfig={sortConfig} onSort={handleSort}
                            filterConfig={filter ? columnFilters : null}
                            onToggleFilter={toggleFilter} onClearFilter={clearFilter} getUniqueValues={getUniqueValues} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ os, almox, qtdSol, qtdSep, tempoEntrega, tempoCicloSep, leadTimeReservaMigo, leadTimeSLA, subcatNomes, liderNome }, idx) => {
                      let tempoColor = 'text-slate-600 dark:text-slate-400';
                      if (tempoEntrega !== null) {
                        if (tempoEntrega <= 0) tempoColor = 'text-green-600 font-semibold';
                        else if (tempoEntrega <= 5) tempoColor = 'text-yellow-600 font-semibold';
                        else tempoColor = 'text-red-600 font-semibold';
                      }
                      return (
                        <tr key={os.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <button onClick={() => { setFormInitialMode('edit'); setSelectedOS(os); }}
                              className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                              {os.codigo || os.id?.substring(0, 8)}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            {(() => {
                              const statusLabels = {
                                pendente: { label: 'Pendente', cls: 'bg-slate-100 text-slate-600' },
                                em_separacao: { label: 'Em Sep.', cls: 'bg-blue-100 text-blue-700' },
                                separado: { label: 'Separado', cls: 'bg-indigo-100 text-indigo-700' },
                                embalando: { label: 'Embalando', cls: 'bg-purple-100 text-purple-700' },
                                aguardando_transporte: { label: 'Ag. Transp.', cls: 'bg-yellow-100 text-yellow-700' },
                                em_rota: { label: 'Em Rota', cls: 'bg-orange-100 text-orange-700' },
                                entregue: { label: 'Entregue', cls: 'bg-green-100 text-green-700' },
                              };
                              const s = statusLabels[os.status_separacao];
                              return s ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span> : '—';
                            })()}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            {(() => {
                              const p = Math.max(0, Math.min(100, Math.round(os.progresso || 0)));
                              const barColor = p >= 100 ? 'bg-green-500' : p >= 50 ? 'bg-blue-500' : p > 0 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600';
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
                                    <div className={`h-full ${barColor} transition-all`} style={{ width: `${p}%` }} />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">{p}%</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300" title={subcatNomes}>{subcatNomes}</td>
                          <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{almox?.nome || '—'}</td>
                          <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{(() => { const inst = instalacoes?.find(i => i.id === os.instalacao_origem_id); return inst?.nome || '—'; })()}</td>
                          <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{(() => { const inst = instalacoes?.find(i => i.id === os.instalacao_destino_id); return inst?.nome || '—'; })()}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{os.num_reserva || '—'}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{os.num_migo || '—'}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_reserva)}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_migo)}</td>
                          <td className="px-2 py-2 text-right">{qtdSol > 0 ? qtdSol.toLocaleString('pt-BR') : '—'}</td>
                          <td className="px-2 py-2 text-right">{qtdSep > 0 ? qtdSep.toLocaleString('pt-BR') : '—'}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_necessidade)}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_entrega)}</td>
                          <td className={`px-2 py-2 text-center whitespace-nowrap ${tempoColor}`}>
                            {tempoEntrega !== null ? (tempoEntrega === 0 ? 'No prazo' : `${tempoEntrega > 0 ? '+' : ''}${tempoEntrega}d`) : '—'}
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            {tempoCicloSep !== null ? `${tempoCicloSep}d` : '—'}
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            {(() => {
                              if (leadTimeReservaMigo === null) return <span className="text-slate-400">—</span>;
                              const cls = leadTimeReservaMigo <= leadTimeSLA
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold';
                              const slaLabel = os.prioridade === 'urgente' ? 'Urgente: 1 dia útil' : 'Baixa/Média/Alta: 7 dias úteis';
                              return <span className={cls} title={`SLA — ${slaLabel}`}>{leadTimeReservaMigo}d úteis</span>;
                            })()}
                          </td>
                          <td className="px-2 py-2 text-right whitespace-nowrap">
                            {(() => {
                              const totalM3 = (os.volumes || []).reduce((sum, v) => sum + (v.m3 || 0), 0);
                              return totalM3 > 0 ? totalM3.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : '—';
                            })()}
                          </td>
                          <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300" title={liderNome}>{liderNome}</td>
                          </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-400">Página {safePage} de {totalPages} · {TABELA_PAGE_SIZE} registros por página</p>
                <div className="flex gap-2">
                  <button onClick={() => setTabelaPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    ← Anterior
                  </button>
                  <button onClick={() => setTabelaPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>

    <HelpModalExpedicao open={showHelp} onClose={() => setShowHelp(false)} />

    {selectedOS && (
      <OSFormModal
        open={!!selectedOS}
        onClose={() => setSelectedOS(null)}
        os={selectedOS}
        regionais={regionais}
        almoxarifados={almoxarifados}
        pessoas={pessoas}
        categorias={categorias}
        subcategorias={subcategorias}
        projetos={projetos}
        instalacoes={instalacoes}
        initialMode={formInitialMode}
        onSave={() => setFormInitialMode('read')}
      />
    )}
    </>
  );
}