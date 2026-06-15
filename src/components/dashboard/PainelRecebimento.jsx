import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine, LabelList
} from 'recharts';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle, AlertTriangle, Clock, Package, TrendingUp, Activity,
  BarChart2, Timer, HelpCircle, FileSpreadsheet
} from 'lucide-react';
import { exportTabelaExcel } from '@/components/dashboard/exportTabelaExcel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/contexts/AppContext';
import OSFormModal from '@/components/os/OSFormModal';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';
import LeadTimeReservasMensal from '@/components/dashboard/LeadTimeReservasMensal';
import {
  carregarFeriados, buildFeriadosSet, diasUteisEntreComFeriados, contextoDaOS,
} from '@/lib/diasUteis';

// Verifica se a OS pertence à subcategoria "Compra - Estoque"
const isCompraEstoque = (os, subcategorias) => {
  const norm = (s) => (s || '').toLowerCase().replace(/[\s-]/g, '');
  return (os.subcategorias_ids || []).some(sid => {
    const sub = subcategorias?.find(s => s.id === sid);
    return sub && norm(sub.nome) === 'compraestoque';
  });
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({ title, value, subtitle, gradient, icon: Icon }) {
  return (
    <div
      className="relative rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[120px]"
      style={{ background: gradient }}
    >
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

const EMPTY = (
  <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
    Dados insuficientes para exibir
  </div>
);

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

const STATUS_COLORS = { completo: '#10b981', parcial: '#f59e0b', pendente: '#94a3b8', excedente: '#ef4444' };
const STATUS_LABELS = { completo: 'Completo', parcial: 'Parcial', pendente: 'Pendente', excedente: 'Excedente' };

// ─── Help Modal ──────────────────────────────────────────────────────────────
function HelpModalRecebimento({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            Guia de Indicadores — Painel de Recebimento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">

          {[
            {
              num: 1, sigla: 'TCR', titulo: 'Taxa de Conformidade no Recebimento',
              desc: 'Percentual de OS de recebimento sem ocorrência de problema registrado.',
              formula: 'TCR = ((Total OS − OS com Problema) / Total OS) × 100',
              semaforo: [['≥ 90%', 'Excelente', 'green'], ['75–90%', 'Atenção', 'yellow'], ['< 75%', 'Crítico', 'red']],
              exemplo: '90 OS sem problema de 100 → TCR = 90%'
            },
            {
              num: 2, sigla: 'TAC', titulo: 'Taxa de Acuracidade na Conferência',
              desc: 'Percentual de itens conferidos com status "completo" em relação ao total de itens conferidos.',
              formula: 'TAC = (Itens com status_conferencia = "completo" / Total Itens) × 100',
              semaforo: [['≥ 95%', 'Excelente', 'green'], ['80–95%', 'Bom', 'blue'], ['< 80%', 'Crítico', 'red']],
              exemplo: '190 itens completos de 200 conferidos → TAC = 95%'
            },
            {
              num: 3, sigla: 'LTR', titulo: 'Lead Time de Recebimento',
              desc: 'Tempo médio em dias corridos entre a data de recebimento e o lançamento do MIGO (entrada no SAP).',
              formula: 'LTR = Média(data_migo_receb − data_recebimento) em dias corridos',
              semaforo: [['≤ 3d', 'Ágil', 'green'], ['4–7d', 'Atenção', 'yellow'], ['> 7d', 'Lento', 'red']],
              exemplo: 'Recebimento em 01/03, MIGO em 04/03 → LTR = 3 dias'
            },
            {
              num: 3, sigla: 'LTE', titulo: 'Lead Time de Entrega',
              desc: 'Tempo médio em dias corridos entre a emissão da NF-e e a data de recebimento do material.',
              formula: 'LTE = Média(data_recebimento − nfe_data_emissao) em dias corridos',
              semaforo: [['≤ 3d', 'Ágil', 'green'], ['4–7d', 'Atenção', 'yellow'], ['> 7d', 'Lento', 'red']],
              exemplo: 'Emissão NF em 01/03, recebimento em 05/03 → LTE = 4 dias'
            },
            {
              num: 3, sigla: 'IRP-EST', titulo: 'Índice de Regularização de material de Estoque',
              desc: 'Mesma fórmula do LTR (recebimento → MIGO), porém medido em dias úteis (descontando fins de semana e feriados). Aplicado APENAS à subcategoria "Compra - Estoque".',
              formula: 'IRP-EST = Média(data_migo_receb − data_recebimento) em dias úteis',
              semaforo: [['≤ 3d', 'Ágil', 'green'], ['4–7d', 'Atenção', 'yellow'], ['> 7d', 'Lento', 'red']],
              exemplo: 'Receb. sexta 01/03, MIGO terça 05/03 → IRP-EST = 2 dias úteis'
            },
            {
              num: 4, sigla: 'TCF', titulo: 'Taxa de Conclusão do Fluxo',
              desc: 'Percentual de OS que completaram todas as etapas do fluxo de recebimento (incluindo armazenagem).',
              formula: 'TCF = (OS com fluxo_recebimento.armazenagem_completa = true / Total OS) × 100',
              exemplo: '60 OS com armazenagem finalizada de 100 → TCF = 60%'
            },
            {
              num: 5, sigla: 'TDQ', titulo: 'Taxa de Divergência de Quantidade',
              desc: 'Percentual de itens com discrepância entre quantidade esperada e recebida (status parcial ou excedente).',
              formula: 'TDQ = (Itens parcial + excedente / Total Itens) × 100',
              semaforo: [['≤ 5%', 'Excelente', 'green'], ['5–15%', 'Atenção', 'yellow'], ['> 15%', 'Crítico', 'red']],
              exemplo: '20 itens divergentes de 200 → TDQ = 10%'
            },
            {
              num: 6, sigla: 'Backlog', titulo: 'Backlog de Recebimento',
              desc: 'Quantidade de OS que possuem NF-e registrada mas ainda não tiveram o MIGO lançado — ou seja, estão pendentes de entrada no SAP.',
              formula: 'Backlog = Σ OS com nfe_data_receb preenchida e data_migo_receb em branco',
              exemplo: '8 NF-es recebidas sem MIGO → Backlog = 8'
            },
            {
              num: 7, sigla: 'IRP', titulo: 'Índice de Resolução de Problemas',
              desc: 'Percentual de OS com problemas de recebimento que já foram solucionados (data_solucao preenchida).',
              formula: 'IRP = (OS com problema E data_solucao / Total OS com problema) × 100',
              semaforo: [['≥ 80%', 'Bom', 'green'], ['50–80%', 'Atenção', 'yellow'], ['< 50%', 'Crítico', 'red']],
              exemplo: '8 de 10 problemas resolvidos → IRP = 80%'
            },
            {
              num: 8, sigla: 'TMRP', titulo: 'Tempo Médio de Resolução de Problemas',
              desc: 'Tempo médio em dias entre o registro do recebimento e a solução do problema identificado.',
              formula: 'TMRP = Média(data_solucao − data_recebimento) em dias',
              semaforo: [['≤ 3d', 'Rápido', 'green'], ['4–7d', 'Atenção', 'yellow'], ['> 7d', 'Lento', 'red']],
              exemplo: 'Problema registrado 02/03, solução em 05/03 → TMRP = 3 dias'
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PainelRecebimento({
  filteredOrdens,
  categoriaRecebimento,
  almoxarifados,
  problemasRecebimento,
  hideToolbar = false,
}) {
  // Filtrar apenas OS de recebimento
  const { regionais, categorias, subcategorias, pessoas, instalacoes: ctxInstalacoes, projetos: ctxProjetos } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null);
  const [formInitialMode, setFormInitialMode] = useState('edit');
  const [tabelaPage, setTabelaPage] = useState(1);
  const TABELA_PAGE_SIZE = 200;
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters();

  // Use AppContext data — no extra requests needed
  const instalacoes = ctxInstalacoes || [];
  const projetos = ctxProjetos || [];

  const osReceb = useMemo(
    () => filteredOrdens.filter(os => os.categoria_id === categoriaRecebimento?.id),
    [filteredOrdens, categoriaRecebimento]
  );

  const totalReceb = osReceb.length;

  // Carrega feriados para o cálculo de dias úteis (IRP-EST)
  const [feriados, setFeriados] = useState([]);
  useEffect(() => { carregarFeriados().then(setFeriados); }, []);
  const feriadosSetPorOS = useMemo(() => {
    const cache = new Map();
    return (os) => {
      const ctx = contextoDaOS(os, almoxarifados, instalacoes);
      const key = `${ctx.almoxarifado_id || ''}|${ctx.estado}|${ctx.cidade}`;
      if (!cache.has(key)) cache.set(key, buildFeriadosSet(feriados, ctx));
      return cache.get(key);
    };
  }, [feriados, almoxarifados, instalacoes]);

  // ── 1. TCR ──────────────────────────────────────────────────────────────────
  const osComProblemaArr = useMemo(() => osReceb.filter(os => os.problema_recebimento === true), [osReceb]);
  const tcr = totalReceb > 0 ? Math.round(((totalReceb - osComProblemaArr.length) / totalReceb) * 100) : 0;

  // ── 2. TAC ──────────────────────────────────────────────────────────────────
  const todosItens = useMemo(() => osReceb.flatMap(os => os.nfe_itens_conferencia || []), [osReceb]);
  const itensCompletos = todosItens.filter(i => i.status_conferencia === 'completo').length;
  const tac = todosItens.length > 0 ? Math.round((itensCompletos / todosItens.length) * 100) : 0;

  // ── 3. LTR (Lead Time de Recebimento) ────────────────────────────────────────
  // Fórmula: data_migo_receb − data_recebimento (dias corridos)
  const osComLTR = useMemo(
    () => osReceb.filter(os => os.data_recebimento && os.data_migo_receb),
    [osReceb]
  );
  const ltr = osComLTR.length > 0
    ? (osComLTR.reduce((s, os) =>
        s + Math.max(0, differenceInDays(new Date(os.data_migo_receb), new Date(os.data_recebimento))), 0
      ) / osComLTR.length).toFixed(1)
    : null;

  // ── 3b. LTE (Lead Time de Entrega) ───────────────────────────────────────────
  // Fórmula: data_recebimento − nfe_data_emissao (dias corridos)
  const osComLTE = useMemo(
    () => osReceb.filter(os => os.nfe_data_emissao && os.data_recebimento),
    [osReceb]
  );
  const lte = osComLTE.length > 0
    ? (osComLTE.reduce((s, os) =>
        s + Math.max(0, differenceInDays(new Date(os.data_recebimento), new Date(os.nfe_data_emissao))), 0
      ) / osComLTE.length).toFixed(1)
    : null;

  // ── 3c. IRP-EST (Índice de Regularização de material de Estoque) ──────────────
  // Mesma fórmula do LTR (data_migo_receb − data_recebimento), mas em DIAS ÚTEIS
  // e aplicado APENAS à subcategoria "Compra - Estoque".
  const osComIrpEst = useMemo(
    () => osReceb.filter(os => os.data_recebimento && os.data_migo_receb && isCompraEstoque(os, subcategorias)),
    [osReceb, subcategorias]
  );
  const irpEst = osComIrpEst.length > 0
    ? (osComIrpEst.reduce((s, os) => {
        const dias = diasUteisEntreComFeriados(os.data_recebimento, os.data_migo_receb, feriadosSetPorOS(os));
        return s + (dias ?? 0);
      }, 0) / osComIrpEst.length).toFixed(1)
    : null;

  // ── 4. TCF ──────────────────────────────────────────────────────────────────
  const osFluxoConcluido = osReceb.filter(os => os.fluxo_recebimento?.armazenagem_completa === true).length;
  const tcf = totalReceb > 0 ? Math.round((osFluxoConcluido / totalReceb) * 100) : 0;

  // ── 5. TDQ ──────────────────────────────────────────────────────────────────
  const itensDivergentes = todosItens.filter(i =>
    i.status_conferencia === 'parcial' || i.status_conferencia === 'excedente'
  ).length;
  const tdq = todosItens.length > 0 ? Math.round((itensDivergentes / todosItens.length) * 100) : 0;

  // ── 6. Backlog ───────────────────────────────────────────────────────────────
  const backlog = osReceb.filter(os => os.nfe_data_receb && !os.data_migo_receb).length;

  // ── 7. IRP ──────────────────────────────────────────────────────────────────
  const osSolucionadas = osComProblemaArr.filter(os => os.data_solucao).length;
  const irp = osComProblemaArr.length > 0 ? Math.round((osSolucionadas / osComProblemaArr.length) * 100) : 100;

  // ── 8. TMRP ─────────────────────────────────────────────────────────────────
  const osResolvidasComData = osComProblemaArr.filter(os => os.data_solucao && os.data_recebimento);
  const tmrp = osResolvidasComData.length > 0
    ? (osResolvidasComData.reduce((s, os) =>
        s + Math.abs(differenceInDays(new Date(os.data_solucao), new Date(os.data_recebimento))), 0
      ) / osResolvidasComData.length).toFixed(1)
    : null;

  // ── Chart: TCR Mensal (linha) ─────────────────────────────────────────────
  const tcrMensal = useMemo(() => {
    const map = {};
    osReceb.forEach(os => {
      if (!os.created_date) return;
      const key = os.created_date.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, ok: 0 };
      map[key].total++;
      if (!os.problema_recebimento) map[key].ok++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        tcr: v.total > 0 ? Math.round((v.ok / v.total) * 100) : 0,
      }));
  }, [osReceb]);

  // ── Chart: TAC por status de conferência (donut) ──────────────────────────
  const tacPorStatus = useMemo(() => {
    const map = { completo: 0, parcial: 0, pendente: 0, excedente: 0 };
    todosItens.forEach(i => {
      if (i.status_conferencia && map[i.status_conferencia] !== undefined)
        map[i.status_conferencia]++;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k, value: v }));
  }, [todosItens]);

  // ── Chart: Lead Time Mensal (barras) ─────────────────────────────────────
  const ltrMensal = useMemo(() => {
    const map = {};
    osComLTR.forEach(os => {
      const key = os.data_recebimento.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, dias: 0 };
      map[key].total++;
      map[key].dias += Math.max(0, differenceInDays(new Date(os.data_migo_receb), new Date(os.data_recebimento)));
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        diasMedio: v.total > 0 ? parseFloat((v.dias / v.total).toFixed(1)) : 0,
      }));
  }, [osComLTR]);

  // ── Chart: Backlog por Almoxarifado (barras horizontais) ─────────────────
  const backlogPorAlmox = useMemo(() =>
    almoxarifados.map(a => ({
      name: a.nome.length > 22 ? a.nome.substring(0, 20) + '…' : a.nome,
      nomeCompleto: a.nome,
      backlog: osReceb.filter(os => os.almoxarifado_id === a.id && os.nfe_data_receb && !os.data_migo_receb).length,
    }))
    .filter(d => d.backlog > 0)
    .sort((a, b) => b.backlog - a.backlog)
    .slice(0, 10),
  [osReceb, almoxarifados]);

  // ── Chart: IRP Mensal (linha) ─────────────────────────────────────────────
  const irpMensal = useMemo(() => {
    const map = {};
    osComProblemaArr.forEach(os => {
      if (!os.data_recebimento) return;
      let keyDate;
      try { keyDate = new Date(os.data_recebimento); if (isNaN(keyDate)) return; } catch { return; }
      const key = format(keyDate, 'yyyy-MM');
      if (!map[key]) map[key] = { total: 0, resolvidos: 0 };
      map[key].total++;
      if (os.data_solucao) map[key].resolvidos++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(-12)
      .map(([key, v]) => ({
        key,
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        irp: v.total > 0 ? Math.round((v.resolvidos / v.total) * 100) : 0,
        tmrp: (() => {
          const resolved = osComProblemaArr.filter(os => {
            if (!os.data_recebimento || !os.data_solucao) return false;
            try { return format(new Date(os.data_recebimento), 'yyyy-MM') === key; } catch { return false; }
          });
          if (!resolved.length) return null;
          const avg = resolved.reduce((s, os) =>
            s + Math.abs(differenceInDays(new Date(os.data_solucao), new Date(os.data_recebimento))), 0
          ) / resolved.length;
          return parseFloat(avg.toFixed(1));
        })(),
      }));
  }, [osComProblemaArr]);

  // ── OS com XML importado (base para gráficos de fornecedor/UF) ────────────
  const osComXml = useMemo(
    () => osReceb.filter(os => os.fluxo_recebimento?.xml_importado === true),
    [osReceb]
  );

  // ── Chart: Top 20 Fornecedores por qtd NF ────────────────────────────────
  const top20FornecedoresQtd = useMemo(() => {
    const map = {};
    osComXml.forEach(os => {
      const nome = os.nfe_dados_emissor?.xNome || os.nfe_dados_emissor?.razao_social || 'Desconhecido';
      map[nome] = (map[nome] || 0) + 1;
    });
    return Object.entries(map)
      .map(([nome, qtd]) => ({ nome: nome.length > 30 ? nome.substring(0, 28) + '…' : nome, nomeCompleto: nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 20);
  }, [osComXml]);

  // ── Chart: Top 20 Fornecedores por valor total ───────────────────────────
  const top20FornecedoresValor = useMemo(() => {
    const map = {};
    osComXml.forEach(os => {
      const nome = os.nfe_dados_emissor?.xNome || os.nfe_dados_emissor?.razao_social || 'Desconhecido';
      const valor = (os.nfe_itens_conferencia || []).reduce((s, i) => s + ((parseFloat(i.quantidade_esperada) || 0) * (parseFloat(i.valor_unitario) || 0)), 0);
      map[nome] = (map[nome] || 0) + valor;
    });
    return Object.entries(map)
      .map(([nome, valor]) => ({ nome: nome.length > 30 ? nome.substring(0, 28) + '…' : nome, nomeCompleto: nome, valor: parseFloat(valor.toFixed(2)) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 20);
  }, [osComXml]);

  // ── Chart: NF por UF de Origem ────────────────────────────────────────────
  const nfPorUfOrigem = useMemo(() => {
    const map = {};
    osComXml.forEach(os => {
      const uf = os.nfe_dados_emissor?.estado || os.nfe_dados_emissor?.UF || os.nfe_dados_emissor?.uf || 'N/D';
      map[uf] = (map[uf] || 0) + 1;
    });
    return Object.entries(map).map(([uf, qtd]) => ({ name: uf, value: qtd })).sort((a, b) => b.value - a.value);
  }, [osComXml]);

  // ── Chart: NF por UF de Destino ──────────────────────────────────────────
  const nfPorUfDestino = useMemo(() => {
    const map = {};
    osComXml.forEach(os => {
      const uf = os.nfe_dados_destinatario?.estado || os.nfe_dados_destinatario?.UF || os.nfe_dados_destinatario?.uf || 'N/D';
      map[uf] = (map[uf] || 0) + 1;
    });
    return Object.entries(map).map(([uf, qtd]) => ({ name: uf, value: qtd })).sort((a, b) => b.value - a.value);
  }, [osComXml]);

  const UF_COLORS = [
    '#0000FF','#3B5BDB','#4C6EF5','#748FFC','#91A7FF',
    '#0C8599','#15AABF','#22B8CF','#3BC9DB','#66D9E8',
    '#2F9E44','#40C057','#51CF66','#69DB7C','#8CE99A',
    '#E67700','#F59F00','#FAB005','#FCC419','#FFD43B',
    '#C92A2A','#E03131','#F03E3E','#FA5252','#FF6B6B',
    '#862E9C','#9C36B5','#AE3EC9','#BE4BDB','#CC5DE8',
  ];

  const fmtValor = (v) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
    return `R$ ${v.toFixed(0)}`;
  };

  // ── Helper: formato de data seguro ────────────────────────────────────────
  const safeF = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd/MM/yy', { locale: ptBR }); } catch { return '—'; }
  };

  // ── Tabela: linhas enriquecidas + filtros + sort (compartilhado p/ Excel) ─
  const ETAPAS_RECEB = ['Importar XML', 'Conferência Manual', 'Divergências', 'Armazenagem'];
  // Verifica se a OS usa o fluxo de recebimento (apenas subcategorias "Compra - Aplicação Específica" ou "Compra - Estoque")
  const osUsaFluxoRecebimento = (os) => {
    const subs = (os.subcategorias_ids || []).map(sid => subcategorias?.find(s => s.id === sid)).filter(Boolean);
    return subs.some(s => {
      const nome = s?.nome?.toLowerCase() || '';
      return nome.includes('aplicação específica') || nome.includes('aplicacao especifica') || nome.includes('estoque');
    });
  };
  const getEtapaAtualLabel = (os) => {
    if (!osUsaFluxoRecebimento(os)) return 'Sem Fluxo';
    const f = os.fluxo_recebimento;
    if (!f) return 'Importar XML';
    if (f.armazenagem_completa) return 'Concluído';
    const idx = (f.etapa_atual || 1) - 1;
    return ETAPAS_RECEB[idx] || 'Importar XML';
  };

  const osTabelaRows = useMemo(() => {
    const osTabela = osReceb.map(os => {
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      const ltrDias = os.data_recebimento && os.data_migo_receb
        ? Math.max(0, differenceInDays(new Date(os.data_migo_receb), new Date(os.data_recebimento)))
        : null;
      const lteDias = os.nfe_data_emissao && os.data_recebimento
        ? Math.max(0, differenceInDays(new Date(os.data_recebimento), new Date(os.nfe_data_emissao)))
        : null;
      const ehCompraEstoque = isCompraEstoque(os, subcategorias);
      const irpEstDias = ehCompraEstoque && os.data_recebimento && os.data_migo_receb
        ? (diasUteisEntreComFeriados(os.data_recebimento, os.data_migo_receb, feriadosSetPorOS(os)) ?? null)
        : null;
      const tmrpDias = os.data_solucao && os.data_recebimento
        ? Math.abs(differenceInDays(new Date(os.data_solucao), new Date(os.data_recebimento)))
        : null;
      const itens = os.nfe_itens_conferencia || [];
      const itensComp = itens.filter(i => i.status_conferencia === 'completo').length;
      const tacPct = itens.length > 0 ? Math.round((itensComp / itens.length) * 100) : null;
      const armazenado = os.fluxo_recebimento?.armazenagem_completa === true;
      const temProblema = os.problema_recebimento === true;
      const progresso = Math.max(0, Math.min(100, Math.round(os.progresso || 0)));
      const subcatNomes = (os.subcategorias_ids || [])
        .map(sid => subcategorias?.find(s => s.id === sid)?.nome)
        .filter(Boolean)
        .join(', ') || '—';
      const etapaAtual = getEtapaAtualLabel(os);
      const liderNome = pessoas?.find(p => p.id === os.lider_id)?.nome || '—';
      return { os, almox, ltrDias, lteDias, irpEstDias, ehCompraEstoque, tmrpDias, itens, itensComp, tacPct, armazenado, temProblema, progresso, subcatNomes, etapaAtual, liderNome };
    });

    let rows = [...osTabela];
    Object.entries(columnFilters).forEach(([col, values]) => {
      if (!values || values.length === 0) return;
      rows = rows.filter(({ os, almox, ltrDias, lteDias, irpEstDias, tmrpDias, tacPct, armazenado, temProblema, subcatNomes, etapaAtual, liderNome }) => {
        if (col === 'almox') return values.includes(almox?.nome || '—');
        if (col === 'nfe_data_emissao') return values.includes(safeF(os.nfe_data_emissao));
        if (col === 'nfe_data_receb') return values.includes(safeF(os.nfe_data_receb));
        if (col === 'data_migo_receb') return values.includes(safeF(os.data_migo_receb));
        if (col === 'ltrDias') return values.includes(ltrDias !== null ? `${ltrDias}d` : '—');
        if (col === 'lteDias') return values.includes(lteDias !== null ? `${lteDias}d` : '—');
        if (col === 'irpEstDias') return values.includes(irpEstDias !== null ? `${irpEstDias}d` : '—');
        if (col === 'data_recebimento') return values.includes(safeF(os.data_recebimento));
        if (col === 'armazenado') return values.includes(armazenado ? 'Sim' : 'Não');
        if (col === 'temProblema') return values.includes(temProblema ? 'Sim' : 'Não');
        if (col === 'data_solucao') return values.includes(safeF(os.data_solucao));
        if (col === 'tmrpDias') return values.includes(tmrpDias !== null ? `${tmrpDias}d` : '—');
        if (col === 'tacPct') return values.includes(tacPct !== null ? `${tacPct}%` : '—');
        if (col === 'numero_migo_receb') return values.includes(os.numero_migo_receb || '—');
        if (col === 'subcategoria') return values.includes(subcatNomes);
        if (col === 'etapaAtual') return values.includes(etapaAtual);
        if (col === 'lider') return values.includes(liderNome);
        return true;
      });
    });

    if (sortConfig.column && sortConfig.direction) {
     rows.sort((a, b) => {
       const col = sortConfig.column;
       let va, vb;
       if (col === 'codigo') { va = a.os.codigo || ''; vb = b.os.codigo || ''; }
       else if (col === 'almox') { va = a.almox?.nome || ''; vb = b.almox?.nome || ''; }
       else if (col === 'nfe_data_receb') { va = a.os.nfe_data_receb || ''; vb = b.os.nfe_data_receb || ''; }
       else if (col === 'data_migo_receb') { va = a.os.data_migo_receb || ''; vb = b.os.data_migo_receb || ''; }
       else if (col === 'ltrDias') { va = a.ltrDias ?? Infinity; vb = b.ltrDias ?? Infinity; }
       else if (col === 'lteDias') { va = a.lteDias ?? Infinity; vb = b.lteDias ?? Infinity; }
       else if (col === 'irpEstDias') { va = a.irpEstDias ?? Infinity; vb = b.irpEstDias ?? Infinity; }
       else if (col === 'data_recebimento') { va = a.os.data_recebimento || ''; vb = b.os.data_recebimento || ''; }
       else if (col === 'tmrpDias') { va = a.tmrpDias ?? Infinity; vb = b.tmrpDias ?? Infinity; }
       else if (col === 'tacPct') { va = a.tacPct ?? -1; vb = b.tacPct ?? -1; }
       else if (col === 'itensConf') { va = a.itens.length; vb = b.itens.length; }
       else if (col === 'completos') { va = a.itensComp; vb = b.itensComp; }
       else if (col === 'progresso') { va = a.progresso; vb = b.progresso; }
       else if (col === 'numero_migo_receb') { va = a.os.numero_migo_receb || ''; vb = b.os.numero_migo_receb || ''; }
       else if (col === 'subcategoria') { va = a.subcatNomes; vb = b.subcatNomes; }
       else if (col === 'etapaAtual') { va = a.etapaAtual; vb = b.etapaAtual; }
       else if (col === 'lider') { va = a.liderNome; vb = b.liderNome; }
       else { va = ''; vb = ''; }
       if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
       if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
       return 0;
     });
    }
    return rows;
  }, [osReceb, almoxarifados, subcategorias, columnFilters, sortConfig, feriadosSetPorOS]);

  // ── Chart: Ranking Problemas ──────────────────────────────────────────────
  const problemasChartData = useMemo(() => {
    const pMap = {};
    problemasRecebimento.forEach(p => { pMap[p.id] = p; });
    const contagem = {};
    osComProblemaArr.forEach(os => {
      (os.problemas_recebimento_ids || []).forEach(pid => {
        const p = pMap[pid];
        if (p) {
          const nome = p.descricao_resumida || p.nome;
          contagem[nome] = (contagem[nome] || 0) + 1;
        }
      });
    });
    return Object.entries(contagem)
      .filter(([n]) => n && n !== 'undefined')
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [osComProblemaArr, problemasRecebimento]);

  if (!categoriaRecebimento) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        Categoria de recebimento não encontrada. Verifique o cadastro de categorias.
      </div>
    );
  }

  if (totalReceb === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        Nenhuma OS de recebimento encontrada para os filtros aplicados.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Botões de ação ── */}
      {!hideToolbar && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = osTabelaRows.map(({ os, almox, ltrDias, lteDias, irpEstDias, tmrpDias, itens, itensComp, tacPct, armazenado, temProblema, progresso, subcatNomes, etapaAtual, liderNome }) => ({
              'Nº OS': os.codigo || os.id?.substring(0, 8) || '',
              'Progresso (%)': progresso,
              'Subcategoria': subcatNomes === '—' ? '' : subcatNomes,
              'Etapa Atual': etapaAtual,
              'Almoxarifado': almox?.nome || '',
              'Nº MIGO': os.numero_migo_receb || '',
              'NF-e Emissão': safeF(os.nfe_data_emissao),
              'NF-e Receb.': safeF(os.nfe_data_receb),
              'MIGO Receb.': safeF(os.data_migo_receb),
              'Recebimento': safeF(os.data_recebimento),
              'LTR (d)': ltrDias !== null ? ltrDias : '',
              'LTE (d)': lteDias !== null ? lteDias : '',
              'IRP-EST (du)': irpEstDias !== null ? irpEstDias : '',
              'Armazenagem': armazenado ? 'Sim' : 'Não',
              'Problema?': temProblema ? 'Sim' : 'Não',
              'Solução': temProblema ? safeF(os.data_solucao) : '',
              'TMRP (d)': tmrpDias !== null ? tmrpDias : '',
              'Itens Conf.': itens.length || 0,
              'Completos': itens.length > 0 ? itensComp : 0,
              'TAC %': tacPct !== null ? tacPct : '',
              'Líder': liderNome === '—' ? '' : liderNome,
            }));
            exportTabelaExcel(rows, 'painel_recebimento', 'Dados dos Indicadores');
          }} className="gap-2" disabled={osTabelaRows.length === 0}>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard
              title="Conformidade (TCR)"
              value={`${tcr}%`}
              subtitle={`${totalReceb - osComProblemaArr.length} de ${totalReceb} OS`}
              gradient="linear-gradient(135deg, #0000FF 0%, #0A003C 100%)"
              icon={CheckCircle}
            />
        <KPICard
          title="Acuracidade (TAC)"
          value={`${tac}%`}
          subtitle={`${itensCompletos} de ${todosItens.length} itens`}
          gradient="linear-gradient(135deg, #059669 0%, #10B981 100%)"
          icon={Package}
        />
        <KPICard
          title="Conclusão Fluxo (TCF)"
          value={`${tcf}%`}
          subtitle={`${osFluxoConcluido} OS armazenadas`}
          gradient="linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)"
          icon={Activity}
        />
        <KPICard
          title="Divergência (TDQ)"
          value={`${tdq}%`}
          subtitle={`${itensDivergentes} itens divergentes`}
          gradient="linear-gradient(135deg, #DC2626 0%, #EF4444 100%)"
          icon={AlertTriangle}
        />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Lead Time Receb. (LTR)"
          value={ltr !== null ? `${ltr}d` : '—'}
          subtitle={`MIGO − Receb. · ${osComLTR.length} OS`}
          gradient="linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)"
          icon={Clock}
        />
            <KPICard
              title="Backlog"
              value={backlog}
              subtitle="NF-e sem MIGO lançado"
              gradient="linear-gradient(135deg, #EA580C 0%, #F97316 100%)"
              icon={BarChart2}
            />
            <KPICard
              title="Resolução Prob. (IRP)"
              value={`${irp}%`}
              subtitle={`${osSolucionadas} de ${osComProblemaArr.length} resolvidos`}
              gradient="linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)"
              icon={TrendingUp}
            />
            <KPICard
              title="Tempo Resolução (TMRP)"
              value={tmrp !== null ? `${tmrp}d` : '—'}
              subtitle={`${osResolvidasComData.length} problemas medidos`}
              gradient="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
              icon={Timer}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard
              title="Lead Time Entrega (LTE)"
              value={lte !== null ? `${lte}d` : '—'}
              subtitle={`Receb. − Emissão NF · ${osComLTE.length} OS`}
              gradient="linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)"
              icon={Clock}
            />
            <KPICard
              title="Regularização Estoque (IRP-EST)"
              value={irpEst !== null ? `${irpEst}d` : '—'}
              subtitle={`Dias úteis · ${osComIrpEst.length} OS Compra-Estoque`}
              gradient="linear-gradient(135deg, #0369A1 0%, #0891B2 100%)"
              icon={Timer}
            />
          </div>
        </div>
      </div>

      {/* ── TCR Mensal + TAC Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Taxa de Conformidade Mensal (TCR)" />
          {tcrMensal.length < 2 ? EMPTY : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tcrMensal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, '% TCR']} />
                <ReferenceLine y={90} stroke="#94a3b8" strokeDasharray="5 5"
                  label={{ value: 'Meta: 90%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
                <Line type="monotone" dataKey="tcr" stroke="#0000FF" strokeWidth={2.5}
                  dot={{ fill: '#0000FF', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Status de Conferência (TAC)" />
          {tacPorStatus.length === 0 ? EMPTY : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={tacPorStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={2} dataKey="value">
                      {tacPorStatus.map((e, i) => (
                        <Cell key={i} fill={STATUS_COLORS[e.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      formatter={(v, n) => [v, STATUS_LABELS[n] || n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{tac}%</span>
                  <span className="text-xs text-slate-500">completos</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 w-full">
                {tacPorStatus.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs p-2 rounded-lg"
                    style={{ backgroundColor: `${STATUS_COLORS[e.name]}18` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[e.name] }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{STATUS_LABELS[e.name] || e.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {e.value} ({todosItens.length > 0 ? Math.round((e.value / todosItens.length) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Resultados Mensais - NF de estoque (apenas subcategoria compra-estoque) ── */}
      {(() => {
        const norm = (s) => (s || '').toLowerCase().replace(/[\s-]/g, '');
        const subCompraEstoque = (subcategorias || []).find(s => norm(s?.nome) === 'compraestoque');
        return (
          <LeadTimeReservasMensal
            filteredOrdens={osReceb}
            titulo="Resultados Mensais - NF de estoque"
            startDateField="data_recebimento"
            endDateField="data_migo_receb"
            itensField="nfe_itens_conferencia"
            valorField="valor_total"
            filterFn={subCompraEstoque ? ((os) => (os.subcategorias_ids || []).includes(subCompraEstoque.id)) : null}
          />
        );
      })()}

      {/* ── Lead Time Mensal + Backlog por Almox ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Lead Time de Recebimento Mensal (LTR)" />
          {ltrMensal.length === 0 ? EMPTY : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ltrMensal} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}d`} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={v => [`${v} dias`, 'Média Lead Time']} />
                <Bar dataKey="diasMedio" radius={[4, 4, 0, 0]} name="diasMedio">
                  <LabelList dataKey="diasMedio" position="top"
                    formatter={v => v > 0 ? `${v}d` : ''} style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  {ltrMensal.map((e, i) => (
                    <Cell key={i}
                      fill={e.diasMedio <= 3 ? '#10b981' : e.diasMedio <= 7 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-slate-400 mt-2">{"Verde ≤3d · Amarelo ≤7d · Vermelho >7d"}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title={`Backlog por Almoxarifado (${backlog} total)`} />
          {backlogPorAlmox.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">
              ✓ Nenhum backlog pendente
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={backlogPorAlmox} layout="vertical"
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                  formatter={v => [v, 'OS em backlog']} />
                <Bar dataKey="backlog" fill="#FF6B00" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="backlog" position="right"
                    style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── IRP + TMRP Mensal ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Evolução de Resolução de Problemas (IRP & TMRP)" />
        {irpMensal.length < 2 ? (
          osComProblemaArr.length === 0
            ? <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">✓ Nenhum problema de recebimento registrado</div>
            : EMPTY
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* IRP linha */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">% IRP — Índice de Resolução</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={irpMensal} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, '% IRP']} />
                  <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5"
                    label={{ value: 'Meta: 80%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
                  <Line type="monotone" dataKey="irp" stroke="#0284C7" strokeWidth={2.5}
                    dot={{ fill: '#0284C7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* TMRP barras */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Dias Médios — Tempo de Resolução (TMRP)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={irpMensal.filter(d => d.tmrp !== null)}
                  margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}d`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} dias`, 'TMRP']} />
                  <Bar dataKey="tmrp" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="tmrp" position="top"
                      formatter={v => v != null ? `${v}d` : ''} style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                    {irpMensal.filter(d => d.tmrp !== null).map((e, i) => (
                      <Cell key={i}
                        fill={e.tmrp <= 3 ? '#10b981' : e.tmrp <= 7 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Ranking de Problemas (último) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Ranking de Principais Problemas de Regularização" />
        {problemasChartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">
            ✓ Nenhum problema registrado
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(240, problemasChartData.length * 56)}>
              <BarChart data={problemasChartData} layout="vertical"
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" width={220}
                  tick={({ x, y, payload }) => {
                    const words = payload.value.split(' ');
                    const lines = [];
                    let current = '';
                    words.forEach(word => {
                      const test = current ? `${current} ${word}` : word;
                      if (test.length > 28 && current) { lines.push(current); current = word; }
                      else { current = test; }
                    });
                    if (current) lines.push(current);
                    return (
                      <g transform={`translate(${x},${y})`}>
                        {lines.map((line, i) => (
                          <text key={i} x={0} y={0} dy={i * 14 - ((lines.length - 1) * 7)} textAnchor="end"
                            fill="#64748b" fontSize={11}>{line}</text>
                        ))}
                      </g>
                    );
                  }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'Ocorrências']} />
                <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} fill="#0000FF">
                  {problemasChartData.map((_, i) => {
                    const t = problemasChartData.length;
                    const ratio = i / t;
                    const l = Math.round(80 - ratio * 50);
                    return <Cell key={i} fill={`hsl(220, 80%, ${l}%)`} />;
                  })}
                  <LabelList dataKey="quantidade" position="right"
                    style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">
              Total de OS com problemas: {osComProblemaArr.length}
            </p>
          </>
        )}
      </div>

      {/* ── Gráficos de Fornecedores e UF (apenas OS com XML) ── */}
      {osComXml.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 italic">
            Gráficos abaixo consideram apenas as {osComXml.length} OS de recebimento com XML importado.
          </p>

          {/* Top 20 Fornecedores por Qtd NF + por Valor */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Qtd */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <SectionHeader title="Top 20 Fornecedores — Quantidade de NF" />
              {top20FornecedoresQtd.length === 0 ? EMPTY : (
                <ResponsiveContainer width="100%" height={Math.max(300, top20FornecedoresQtd.length * 30)}>
                  <BarChart data={top20FornecedoresQtd} layout="vertical"
                    margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: '#64748b', fontSize: 11 }} width={160} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                      formatter={v => [v, 'Notas Fiscais']}
                    />
                    <Bar dataKey="qtd" radius={[0, 4, 4, 0]}>
                      {top20FornecedoresQtd.map((_, i) => (
                        <Cell key={i} fill={`hsl(220, 80%, ${Math.round(75 - i * 2.5)}%)`} />
                      ))}
                      <LabelList dataKey="qtd" position="right"
                        style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Valor */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <SectionHeader title="Top 20 Fornecedores — Valor Total (R$)" />
              {top20FornecedoresValor.length === 0 ? EMPTY : (
                <ResponsiveContainer width="100%" height={Math.max(300, top20FornecedoresValor.length * 30)}>
                  <BarChart data={top20FornecedoresValor} layout="vertical"
                    margin={{ top: 5, right: 80, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={fmtValor} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: '#64748b', fontSize: 11 }} width={160} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                      formatter={v => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v), 'Valor Total']}
                    />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      {top20FornecedoresValor.map((_, i) => (
                        <Cell key={i} fill={`hsl(160, 65%, ${Math.round(68 - i * 2.2)}%)`} />
                      ))}
                      <LabelList dataKey="valor" position="right"
                        formatter={fmtValor}
                        style={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Rosca UF Origem + Destino */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { title: 'NF por UF de Origem (Emissor)', data: nfPorUfOrigem },
              { title: 'NF por UF de Destino (Destinatário)', data: nfPorUfDestino },
            ].map(({ title, data }) => (
              <div key={title} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <SectionHeader title={title} />
                {data.length === 0 ? EMPTY : (
                  <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="shrink-0">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                            paddingAngle={2} dataKey="value">
                            {data.map((_, i) => (
                              <Cell key={i} fill={UF_COLORS[i % UF_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v, `UF: ${n}`]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1 w-full">
                      {data.map((e, i) => (
                        <div key={e.name} className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-lg"
                          style={{ backgroundColor: `${UF_COLORS[i % UF_COLORS.length]}18` }}>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: UF_COLORS[i % UF_COLORS.length] }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 w-7">{e.name}</span>
                          <span className="text-slate-500">{e.value} NF</span>
                          <span className="text-slate-400 ml-auto">
                            {osComXml.length > 0 ? Math.round(e.value / osComXml.length * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabela de Dados dos Indicadores ── */}
      {(() => {
        const rows = osTabelaRows;

        const getUniqueValues = (col) => {
           const vals = rows.map(({ os, almox, ltrDias, lteDias, irpEstDias, tmrpDias, tacPct, armazenado, temProblema, subcatNomes, etapaAtual, liderNome }) => {
             if (col === 'almox') return almox?.nome || '—';
             if (col === 'nfe_data_emissao') return safeF(os.nfe_data_emissao);
             if (col === 'nfe_data_receb') return safeF(os.nfe_data_receb);
             if (col === 'data_migo_receb') return safeF(os.data_migo_receb);
             if (col === 'ltrDias') return ltrDias !== null ? `${ltrDias}d` : '—';
             if (col === 'lteDias') return lteDias !== null ? `${lteDias}d` : '—';
             if (col === 'irpEstDias') return irpEstDias !== null ? `${irpEstDias}d` : '—';
             if (col === 'data_recebimento') return safeF(os.data_recebimento);
             if (col === 'armazenado') return armazenado ? 'Sim' : 'Não';
             if (col === 'temProblema') return temProblema ? 'Sim' : 'Não';
             if (col === 'data_solucao') return safeF(os.data_solucao);
             if (col === 'tmrpDias') return tmrpDias !== null ? `${tmrpDias}d` : '—';
             if (col === 'tacPct') return tacPct !== null ? `${tacPct}%` : '—';
             if (col === 'numero_migo_receb') return os.numero_migo_receb || '—';
             if (col === 'subcategoria') return subcatNomes;
             if (col === 'etapaAtual') return etapaAtual;
             if (col === 'lider') return liderNome;
             return '—';
           });
           return [...new Set(vals)].sort();
         };

        const totalPages = Math.max(1, Math.ceil(rows.length / TABELA_PAGE_SIZE));
        const safePage = Math.min(tabelaPage, totalPages);
        const pageRows = rows.slice((safePage - 1) * TABELA_PAGE_SIZE, safePage * TABELA_PAGE_SIZE);
        const startRow = (safePage - 1) * TABELA_PAGE_SIZE + 1;
        const endRow = Math.min(safePage * TABELA_PAGE_SIZE, rows.length);

        const COLS = [
          { col: 'codigo',          label: 'Nº OS',        filter: false, width: 'min-w-[160px]' },
          { col: 'progresso',       label: 'Progresso',    filter: false, width: 'w-28' },
          { col: 'subcategoria',    label: 'Subcategoria', filter: true,  width: 'w-32' },
          { col: 'etapaAtual',      label: 'Etapa Atual',  filter: true,  width: 'w-36' },
          { col: 'almox',           label: 'Almoxarifado', filter: true,  width: 'w-36' },
          { col: 'numero_migo_receb', label: 'Nº MIGO',    filter: true,  width: 'w-24' },
          { col: 'nfe_data_emissao',label: 'NF-e Emissão', filter: true,  width: 'w-24' },
          { col: 'nfe_data_receb',  label: 'NF-e Receb.',  filter: true,  width: 'w-24' },
          { col: 'data_migo_receb', label: 'MIGO Receb.',  filter: true,  width: 'w-24' },
          { col: 'data_recebimento',label: 'Recebimento',  filter: true,  width: 'w-24' },
          { col: 'ltrDias',         label: 'LTR (d)',      filter: true,  width: 'w-20' },
          { col: 'lteDias',         label: 'LTE (d)',      filter: true,  width: 'w-20' },
          { col: 'irpEstDias',      label: 'IRP-EST (du)', filter: true,  width: 'w-24' },
          { col: 'armazenado',      label: 'Armazenagem',  filter: true,  width: 'w-24' },
          { col: 'temProblema',     label: 'Problema?',    filter: true,  width: 'w-22' },
          { col: 'data_solucao',    label: 'Solução',      filter: true,  width: 'w-24' },
          { col: 'tmrpDias',        label: 'TMRP (d)',     filter: true,  width: 'w-20' },
          { col: 'itensConf',       label: 'Itens Conf.',  filter: false, width: 'w-20' },
          { col: 'completos',       label: 'Completos',    filter: false, width: 'w-20' },
          { col: 'tacPct',          label: 'TAC %',        filter: true,  width: 'w-16' },
          { col: 'lider',           label: 'Líder',        filter: true,  width: 'w-32' },
        ];

        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Dados dos Indicadores
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({rows.length}{rows.length !== osReceb.length ? ` de ${osReceb.length}` : ''} OS)
                  </span>
                </h3>
                {rows.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">Exibindo {startRow}–{endRow} de {rows.length}</p>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setTabelaPage(1)} disabled={safePage === 1}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">«</button>
                  <button onClick={() => setTabelaPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                    .map((p, i) => p === '...' ? (
                      <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button key={p} onClick={() => setTabelaPage(p)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${safePage === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        {p}
                      </button>
                    ))}
                  <button onClick={() => setTabelaPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">›</button>
                  <button onClick={() => setTabelaPage(totalPages)} disabled={safePage === totalPages}
                    className="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">»</button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    {COLS.map(({ col, label, filter, width }) => (
                      <th key={col} className={`px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left ${width} whitespace-nowrap`}>
                        <SortableTableHead label={label} column={col} sortConfig={sortConfig} onSort={handleSort}
                          filterConfig={filter ? columnFilters : null}
                          onToggleFilter={toggleFilter} onClearFilter={clearFilter} getUniqueValues={getUniqueValues} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ os, almox, ltrDias, lteDias, irpEstDias, tmrpDias, itens, itensComp, tacPct, armazenado, temProblema, progresso, subcatNomes, etapaAtual, liderNome }, idx) => {
                    const ltrColor = ltrDias === null ? '' : ltrDias <= 3 ? 'text-green-600 font-semibold' : ltrDias <= 7 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold';
                    const lteColor = lteDias === null ? '' : lteDias <= 3 ? 'text-green-600 font-semibold' : lteDias <= 7 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold';
                    const irpEstColor = irpEstDias === null ? '' : irpEstDias <= 3 ? 'text-green-600 font-semibold' : irpEstDias <= 7 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold';
                    const tmrpColor = tmrpDias === null ? '' : tmrpDias <= 3 ? 'text-green-600 font-semibold' : tmrpDias <= 7 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold';
                    const tacColor = tacPct === null ? '' : tacPct >= 95 ? 'text-green-600 font-semibold' : tacPct >= 80 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold';
                    const barColor = progresso >= 100 ? 'bg-green-500' : progresso >= 50 ? 'bg-blue-500' : progresso > 0 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600';
                    const etapaCls = etapaAtual === 'Concluído' ? 'bg-green-100 text-green-700' :
                                     etapaAtual === 'Armazenagem' ? 'bg-blue-100 text-blue-700' :
                                     etapaAtual === 'Divergências' ? 'bg-amber-100 text-amber-700' :
                                     etapaAtual === 'Conferência Manual' ? 'bg-indigo-100 text-indigo-700' :
                                     etapaAtual === 'Sem Fluxo' ? 'bg-slate-100 text-slate-500 italic' :
                                     'bg-slate-100 text-slate-600';
                    return (
                      <tr key={os.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                        <td className="px-2 py-2 whitespace-nowrap min-w-[160px]">
                          <button onClick={() => { setFormInitialMode('edit'); setSelectedOS(os); }} className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                            {os.codigo || os.id?.substring(0, 8)}
                          </button>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
                              <div className={`h-full ${barColor} transition-all`} style={{ width: `${progresso}%` }} />
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">{progresso}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300" title={subcatNomes}>{subcatNomes}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${etapaCls}`}>{etapaAtual}</span>
                        </td>
                        <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300">{almox?.nome || '—'}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{os.numero_migo_receb || '—'}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{safeF(os.nfe_data_emissao)}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{safeF(os.nfe_data_receb)}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{safeF(os.data_migo_receb)}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{safeF(os.data_recebimento)}</td>
                        <td className={`px-2 py-2 text-center whitespace-nowrap ${ltrColor}`}>{ltrDias !== null ? `${ltrDias}d` : '—'}</td>
                        <td className={`px-2 py-2 text-center whitespace-nowrap ${lteColor}`}>{lteDias !== null ? `${lteDias}d` : '—'}</td>
                        <td className={`px-2 py-2 text-center whitespace-nowrap ${irpEstColor}`}>{irpEstDias !== null ? `${irpEstDias}d` : '—'}</td>
                        <td className="px-2 py-2 text-center">
                          {armazenado
                            ? <span className="inline-block px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">✓ Sim</span>
                            : <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">Não</span>}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {temProblema
                            ? <span className="inline-block px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">Sim</span>
                            : <span className="inline-block px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">Não</span>}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{temProblema ? safeF(os.data_solucao) : '—'}</td>
                        <td className={`px-2 py-2 text-center whitespace-nowrap ${tmrpColor}`}>{tmrpDias !== null ? `${tmrpDias}d` : '—'}</td>
                        <td className="px-2 py-2 text-right">{itens.length > 0 ? itens.length : '—'}</td>
                        <td className="px-2 py-2 text-right">{itens.length > 0 ? itensComp : '—'}</td>
                        <td className={`px-2 py-2 text-right whitespace-nowrap ${tacColor}`}>{tacPct !== null ? `${tacPct}%` : '—'}</td>
                        <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300">{liderNome}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

      <HelpModalRecebimento open={showHelp} onClose={() => setShowHelp(false)} />

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
    </div>
  );
}