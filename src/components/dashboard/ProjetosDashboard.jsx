import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, TrendingUp, TrendingDown, Minus, FolderKanban } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AXIA_BLUE = '#0000FF';
const AXIA_DARK = '#0A003C';
const AXIA_ORANGE = '#FF6B00';
const COLORS_PROJ = ['#0000FF', '#FF6B00', '#10B981', '#8B5CF6', '#EC4899', '#0A003C', '#F59E0B'];

// ---- helpers ----
function calcIDP(projeto, osDoProj) {
  const hoje = new Date();
  const inicio = projeto.data_inicial_prevista ? new Date(projeto.data_inicial_prevista) : null;
  const fim = projeto.data_final_prevista ? new Date(projeto.data_final_prevista) : null;
  if (!inicio || !fim || fim <= inicio) return null;

  const totalDias = differenceInDays(fim, inicio);
  const diasDecorridos = Math.min(Math.max(differenceInDays(hoje, inicio), 0), totalDias);
  const vp = totalDias > 0 ? diasDecorridos / totalDias : 0; // % tempo planejado decorrido

  const totalOS = osDoProj.length;
  if (totalOS === 0) return null;
  const progMedio = osDoProj.reduce((s, os) => s + (os.progresso || 0), 0) / totalOS / 100;
  const va = progMedio; // % trabalho realmente executado

  return vp > 0 ? va / vp : null;
}

function calcSVDias(projeto) {
  if (!projeto.data_final_prevista) return null;
  const hoje = new Date();
  const fim = new Date(projeto.data_final_prevista);
  // SV positivo = adiantado (fim no futuro), negativo = atrasado
  return differenceInDays(fim, hoje);
}

function calcProdutividade(projeto, osDoProj) {
  const concluidas = osDoProj.filter(os => os.status === 'concluido').length;
  const inicio = projeto.data_inicial_prevista ? new Date(projeto.data_inicial_prevista) : null;
  if (!inicio) return null;
  const hoje = new Date();
  const dias = Math.max(differenceInDays(hoje, inicio), 1);
  return parseFloat((concluidas / dias).toFixed(4));
}

function calcCumprimentoPrazos(osDoProj) {
  const comPrazo = osDoProj.filter(os => os.prazo);
  if (comPrazo.length === 0) return null;
  const hoje = new Date();
  const noPrazo = comPrazo.filter(os => {
    if (os.status === 'concluido' && os.data_conclusao) {
      return new Date(os.data_conclusao) <= new Date(os.prazo);
    }
    return new Date(os.prazo) >= hoje;
  }).length;
  return Math.round((noPrazo / comPrazo.length) * 100);
}

function calcLeadTimeMedio(osDoProj) {
  const concluidas = osDoProj.filter(os => os.status === 'concluido' && os.data_conclusao);
  if (concluidas.length === 0) return null;
  const soma = concluidas.reduce((s, os) => {
    const inicio = os.data_inicial || os.created_date;
    return s + Math.abs(differenceInDays(new Date(os.data_conclusao), new Date(inicio)));
  }, 0);
  return Math.round(soma / concluidas.length);
}

function calcThroughputMensal(osDoProj) {
  const concluidas = osDoProj.filter(os => os.status === 'concluido' && os.data_conclusao);
  const meses = {};
  concluidas.forEach(os => {
    const m = format(new Date(os.data_conclusao), 'MMM/yy', { locale: ptBR });
    meses[m] = (meses[m] || 0) + 1;
  });
  return Object.entries(meses).map(([mes, qtd]) => ({ mes, qtd })).slice(-6);
}

// ---- sub-components ----
function DonutProgress({ percent, inProgress, total }) {
  const data = [
    { value: percent },
    { value: 100 - percent }
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={30} outerRadius={42} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              <Cell fill={AXIA_BLUE} />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-800 dark:text-white">{percent}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1">{inProgress}/{total} em exec.</p>
    </div>
  );
}

function IDPBadge({ idp }) {
  if (idp === null) return <span className="text-xs text-slate-400">N/D</span>;
  const cor = idp >= 1 ? 'bg-green-100 text-green-700' : idp >= 0.8 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  const Icon = idp >= 1 ? TrendingUp : idp >= 0.9 ? Minus : TrendingDown;
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cor}`}>
      <Icon className="w-3 h-3" />
      {idp.toFixed(2)}
    </div>
  );
}

function SVBadge({ sv }) {
  if (sv === null) return <span className="text-xs text-slate-400">N/D</span>;
  if (sv > 0) return <span className="text-green-600 font-semibold text-xs">+{sv}d adiantado</span>;
  if (sv === 0) return <span className="text-blue-600 font-semibold text-xs">No prazo</span>;
  return <span className="text-red-600 font-semibold text-xs">{sv}d atrasado</span>;
}

function CumprimentoBadge({ pct }) {
  if (pct === null) return <span className="text-xs text-slate-400">N/D</span>;
  const cor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-blue-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const label = pct >= 90 ? 'Excelente' : pct >= 75 ? 'Bom' : pct >= 60 ? 'Atenção' : 'Crítico';
  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-bold ${cor}`}>{pct}%</span>
      <span className={`text-xs ${cor}`}>{label}</span>
    </div>
  );
}

function ThroughputChart({ data, color }) {
  if (!data || data.length === 0) return <span className="text-xs text-slate-400">Sem dados</span>;
  return (
    <ResponsiveContainer width="100%" height={70}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="mes" tick={{ fontSize: 8 }} />
        <YAxis hide />
        <Tooltip formatter={(v) => [v, 'OS']} contentStyle={{ fontSize: 10 }} />
        <Bar dataKey="qtd" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Help Modal ----
function HelpModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            Guia de Indicadores de Projetos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">1. IDP — Índice de Desempenho de Prazo (SPI)</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Avalia a eficiência do cronograma.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs">
              IDP = VA / VP<br/>
              VA = progresso médio real das OS (%)<br/>
              VP = % do tempo cronograma decorrido até hoje
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-50 rounded p-2 text-center"><span className="font-bold text-green-700">{'> 1'}</span><br/>Adiantado</div>
              <div className="bg-blue-50 rounded p-2 text-center"><span className="font-bold text-blue-700">= 1</span><br/>No prazo</div>
              <div className="bg-red-50 rounded p-2 text-center"><span className="font-bold text-red-700">{'< 1'}</span><br/>Atrasado</div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: 5 OS, progresso médio 60% → VA=0.6. Projeto 50% do tempo decorrido → VP=0.5. IDP=1.2 (adiantado)</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">2. Desvio de Prazo (SV)</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Diferença em dias entre prazo planejado e hoje.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs">
              SV (dias) = DataFinalPrevista − DataHoje<br/>
              Positivo = adiantado | Zero = no prazo | Negativo = atrasado
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: Prazo em 20/03, hoje 08/03 → SV = +12 dias (adiantado)</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">3. Índice de Produtividade</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Eficiência da equipe — OS concluídas por dia.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs">
              Produtividade = OS Concluídas / Dias desde início do projeto
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: 30 OS concluídas em 120 dias → 0,25 OS/dia</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">4. Percentual de Cumprimento de Prazos</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">% de OS entregues dentro do prazo planejado.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs">
              Cumprimento = (OS no Prazo / OS Totais) × 100
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 rounded p-2">{'> 90%'} → Excelente</div>
              <div className="bg-blue-50 rounded p-2">75–90% → Bom</div>
              <div className="bg-yellow-50 rounded p-2">60–75% → Atenção</div>
              <div className="bg-red-50 rounded p-2">{'< 60%'} → Crítico</div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: 80 OS no prazo de 100 totais → Cumprimento = 80% (Bom)</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">5. Lead Time Médio</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Tempo médio desde abertura até conclusão das OS.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs">
              Lead Time = DataConclusão − DataAbertura (por OS)<br/>
              Exibido como média das OS concluídas do projeto
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: OS A=5 dias, OS B=10 dias, OS C=3 dias → Média = 6 dias</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">6. Throughput (Vazão de Entrega)</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Quantidade de OS concluídas por mês.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs">
              Throughput = OS Concluídas / Mês<br/>
              Exibido como gráfico de barras por mês
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: Jan=5, Fev=8, Mar=12 OS concluídas</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Component ----
export default function ProjetosDashboard() {
  const [projetos, setProjetos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ativo');
  const [regionalFilter, setRegionalFilter] = useState('');
  const [almoxarifadoFilter, setAlmoxarifadoFilter] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [projetosData, ordensData, regionaisData, almoxarifadosData] = await Promise.all([
        base44.entities.Projeto.list(),
        base44.entities.OrdemServico.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);
      setProjetos(projetosData);
      setOrdens(ordensData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);
      setLoading(false);
    };
    load();
  }, []);

  const almoxarifadosFiltrados = regionalFilter
    ? almoxarifados.filter(a => a.regional_id === regionalFilter)
    : almoxarifados;

  const projetosFiltrados = projetos.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status_projeto === statusFilter;
    const matchRegional = !regionalFilter || p.regional_id === regionalFilter;
    const matchAlmoxarifado = !almoxarifadoFilter || p.almoxarifado_id === almoxarifadoFilter;
    return matchStatus && matchRegional && matchAlmoxarifado;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (projetosFiltrados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <FolderKanban className="w-12 h-12" />
        <p className="text-lg font-medium">Nenhum projeto encontrado</p>
        <p className="text-sm">Crie projetos na página de Projetos para ver os indicadores aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="parado">Parados</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionalFilter} onValueChange={(v) => { setRegionalFilter(v === 'all' ? '' : v); setAlmoxarifadoFilter(''); }}>
            <SelectTrigger className="w-48 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as regionais</SelectItem>
              {regionais.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.sigla} - {r.descricao}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={almoxarifadoFilter} onValueChange={(v) => setAlmoxarifadoFilter(v === 'all' ? '' : v)} disabled={!regionalFilter}>
            <SelectTrigger className="w-52 bg-white dark:bg-slate-800">
              <SelectValue placeholder={regionalFilter ? "Almoxarifado" : "Selecione regional"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os almoxarifados</SelectItem>
              {almoxarifadosFiltrados.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">{projetosFiltrados.length} projeto(s)</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHelp(true)} className="gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          Entender os indicadores
        </Button>
      </div>

      {/* Table Layout - scroll horizontal */}
      <div className="overflow-x-auto">
        <div className="flex">
          {/* Fixed Left Column */}
          <div className="flex flex-col shrink-0">
            {/* Header Row - Fixed */}
            <div className="w-44 p-3 bg-slate-100 dark:bg-slate-800 rounded-tl-xl border-r border-slate-200 dark:border-slate-700 flex items-center">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Indicador ↓ / Projeto →</span>
            </div>
            {/* All KPI Rows - Fixed */}
            <KPIRow label="Progresso" sublabel="OS em execução / total" fixed />
            <KPIRow label="IDP / SPI" sublabel="Índice de desempenho de prazo" fixed />
            <KPIRow label="Desvio de Prazo" sublabel="Dias planejado vs. hoje" fixed />
            <KPIRow label="Produtividade" sublabel="OS concluídas / dia" fixed />
            <KPIRow label="Cumprimento de Prazos" sublabel="OS entregues no prazo" fixed />
            <KPIRow label="Lead Time Médio" sublabel="Abertura → Conclusão (dias)" fixed />
            <KPIRow label="Throughput" sublabel="OS concluídas/mês" fixed />
            <KPIRow label="Status das OS" sublabel="Distribuição por status" fixed last />
          </div>

          {/* Scrollable Content */}
          <div className="min-w-max">
            {/* Header Row - Scrollable */}
            <div className="flex">
              {/* Placeholder for alignment */}
              <div className="w-44 shrink-0" />

              {projetosFiltrados.map((proj, i) => (
                <div
                  key={proj.id}
                  className="w-52 shrink-0 p-3 text-white text-center font-bold text-sm border-r border-white/20 last:rounded-tr-xl"
                  style={{ background: `linear-gradient(135deg, ${COLORS_PROJ[i % COLORS_PROJ.length]}, ${COLORS_PROJ[(i + 1) % COLORS_PROJ.length]})` }}
                >
                  <div className="truncate">{proj.nome}</div>
                  <div className="flex justify-between text-xs font-normal opacity-80 mt-1">
                    <span>{proj.data_inicial_prevista ? format(new Date(proj.data_inicial_prevista), 'dd/MM/yy') : '—'}</span>
                    <span>{proj.data_final_prevista ? format(new Date(proj.data_final_prevista), 'dd/MM/yy') : '—'}</span>
                  </div>
                  <StatusBadgeSmall status={proj.status_projeto} />
                </div>
              ))}
            </div>

            {/* ROW: Progresso */}
            <div className="flex">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const total = osProj.length;
                const inProgress = osProj.filter(os => os.status === 'execucao').length;
                const pct = total > 0 ? Math.round(osProj.reduce((s, os) => s + (os.progresso || 0), 0) / total) : 0;
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    <DonutProgress percent={pct} inProgress={inProgress} total={total} />
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: IDP */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const idp = calcIDP(proj, osProj);
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    <IDPBadge idp={idp} />
                    <p className="text-xs text-slate-400 mt-1">
                      {idp === null ? 'sem datas' : idp >= 1 ? 'Adiantado' : idp >= 0.8 ? 'Atenção' : 'Atrasado'}
                    </p>
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: Desvio de Prazo */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const sv = calcSVDias(proj);
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    <SVBadge sv={sv} />
                    {proj.data_final_prevista && (
                      <p className="text-xs text-slate-400 mt-1">
                        Prazo: {format(new Date(proj.data_final_prevista), 'dd/MM/yy')}
                      </p>
                    )}
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: Produtividade */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const prod = calcProdutividade(proj, osProj);
                const concluidas = osProj.filter(os => os.status === 'concluido').length;
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                      {prod !== null ? prod.toFixed(2) : '—'}
                    </span>
                    <span className="text-xs text-slate-500">OS/dia</span>
                    <p className="text-xs text-slate-400 mt-1">{concluidas} concluídas</p>
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: Cumprimento de Prazos */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const pct = calcCumprimentoPrazos(osProj);
                const comPrazo = osProj.filter(os => os.prazo).length;
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    <CumprimentoBadge pct={pct} />
                    {pct !== null && (
                      <p className="text-xs text-slate-400 mt-1">{comPrazo} OS com prazo</p>
                    )}
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: Lead Time */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const lt = calcLeadTimeMedio(osProj);
                const concluidas = osProj.filter(os => os.status === 'concluido' && os.data_conclusao).length;
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    {lt !== null ? (
                      <>
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{lt}</span>
                        <span className="text-xs text-slate-500"> dias</span>
                        <p className="text-xs text-slate-400 mt-1">({concluidas} OS concluídas)</p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Sem OS concluídas</span>
                    )}
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: Throughput */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const data = calcThroughputMensal(osProj);
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]}>
                    <div className="w-full">
                      <ThroughputChart data={data} color={COLORS_PROJ[i % COLORS_PROJ.length]} />
                    </div>
                  </KPICell>
                );
              })}
            </div>

            {/* ROW: Resumo OS */}
            <div className="flex rounded-b-xl overflow-hidden">
              <div className="w-44 shrink-0" />
              {projetosFiltrados.map((proj, i) => {
                const osProj = ordens.filter(os => os.projetos_ids?.includes(proj.id));
                const elab = osProj.filter(os => os.status === 'elaboracao').length;
                const exec = osProj.filter(os => os.status === 'execucao').length;
                const conc = osProj.filter(os => os.status === 'concluido').length;
                const canc = osProj.filter(os => os.status === 'cancelado').length;
                return (
                  <KPICell key={proj.id} color={COLORS_PROJ[i % COLORS_PROJ.length]} last>
                    <div className="w-full space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Elaboração</span><span className="font-bold">{elab}</span></div>
                      <div className="flex justify-between"><span className="text-blue-600">Execução</span><span className="font-bold text-blue-600">{exec}</span></div>
                      <div className="flex justify-between"><span className="text-green-600">Concluído</span><span className="font-bold text-green-600">{conc}</span></div>
                      {canc > 0 && <div className="flex justify-between"><span className="text-red-500">Cancelado</span><span className="font-bold text-red-500">{canc}</span></div>}
                      <div className="flex justify-between border-t pt-1 mt-1"><span className="font-semibold text-slate-700 dark:text-slate-300">Total</span><span className="font-bold">{osProj.length}</span></div>
                    </div>
                  </KPICell>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

function KPIRow({ label, sublabel, children, last, fixed }) {
  if (fixed) {
    return (
      <div className={`w-44 shrink-0 p-3 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center ${last ? 'rounded-bl-xl' : ''} border-b border-slate-200 dark:border-slate-700`}>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        {sublabel && <span className="text-xs text-slate-400 mt-0.5">{sublabel}</span>}
      </div>
    );
  }
  return (
    <div className={`flex border-b border-slate-200 dark:border-slate-700 ${last ? 'rounded-b-xl overflow-hidden' : ''}`}>
      <div className="w-44 shrink-0 p-3 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        {sublabel && <span className="text-xs text-slate-400 mt-0.5">{sublabel}</span>}
      </div>
      {children}
    </div>
  );
}

function KPICell({ children, color, last }) {
  return (
    <div className={`w-52 shrink-0 p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center min-h-[90px] ${last ? '' : ''}`}
      style={{ borderLeft: `3px solid ${color}20` }}>
      {children}
    </div>
  );
}

function StatusBadgeSmall({ status }) {
  const map = {
    ativo: 'bg-green-200 text-green-800',
    parado: 'bg-yellow-200 text-yellow-800',
    concluido: 'bg-blue-200 text-blue-800',
    cancelado: 'bg-red-200 text-red-800'
  };
  const labels = { ativo: 'Ativo', parado: 'Parado', concluido: 'Concluído', cancelado: 'Cancelado' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${map[status] || 'bg-slate-200 text-slate-700'}`}>
      {labels[status] || status}
    </span>
  );
}