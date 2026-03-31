import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Square, ChevronLeft, ChevronRight, Clock, Tv2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Dashboard slides
import TorreControleContent from '@/components/dashboard/TorreControleContent';
import PainelRecebimento from '@/components/dashboard/PainelRecebimento';
import PainelExpedicao from '@/components/dashboard/PainelExpedicao';
import OSProductivityRanking from '@/components/dashboard/OSProductivityRanking';
import OSPorPessoaChart from '@/components/dashboard/OSPorPessoaChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckCircle, Clock as ClockIcon, TrendingUp, AlertTriangle, MapPin, Building2, Users } from 'lucide-react';

// OS slides
import OSKanban from '@/components/os/OSKanban';
import OSKanbanExpedicao from '@/components/os/OSKanbanExpedicao';
import OSKanbanRecebimento from '@/components/os/OSKanbanRecebimento';
import OSTimeSheetView from '@/components/timesheet/OSTimeSheetView';
import OSPendenciasExpedicao from '@/components/os/OSPendenciasExpedicao';
import OSPendenciasRecebimento from '@/components/os/OSPendenciasRecebimento';

const COLORS = ['#0000FF', '#FF6B00', '#10B981', '#A0B4D2', '#0A003C', '#EC4899'];
const statusLabels = { elaboracao: 'Em Elaboração', execucao: 'Em Execução', concluido: 'Concluído', cancelado: 'Cancelado' };

function SlideContent({ slideId, dashData, osData }) {
  const { filteredOrdens, pessoas, categorias, subcategorias, regionais, almoxarifados, problemasRecebimento, categoriaRecebimento, categoriaExpedicao, tempoMedioRegularizacaoCompra, numItensNFCompra, filters } = dashData;

  if (slideId === 'dash_geral') {
    const totalOS = filteredOrdens.length;
    const osEmExecucao = filteredOrdens.filter(o => o.status === 'execucao').length;
    const osConcluidas = filteredOrdens.filter(o => o.status === 'concluido').length;
    const osEmElaboracao = filteredOrdens.filter(o => o.status === 'elaboracao').length;
    const avgProgress = totalOS > 0 ? Math.round(filteredOrdens.reduce((s, o) => s + (o.progresso || 0), 0) / totalOS) : 0;
    const osByRegional = regionais.map(r => ({
      name: r.sigla,
      elaboracao: filteredOrdens.filter(o => o.regional_id === r.id && o.status === 'elaboracao').length,
      execucao: filteredOrdens.filter(o => o.regional_id === r.id && o.status === 'execucao').length,
      concluido: filteredOrdens.filter(o => o.regional_id === r.id && o.status === 'concluido').length,
    })).filter(d => d.elaboracao + d.execucao + d.concluido > 0);
    const osByStatus = Object.entries(statusLabels).map(([k, label]) => ({ name: label, value: filteredOrdens.filter(o => o.status === k).length })).filter(d => d.value > 0);

    return (
      <div className="h-full flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total OS', value: totalOS, color: '#0000FF', icon: ClipboardList },
            { label: 'Em Execução', value: osEmExecucao, color: '#FF6B00', icon: ClockIcon },
            { label: 'Concluídas', value: osConcluidas, color: '#10b981', icon: CheckCircle },
            { label: 'Em Elaboração', value: osEmElaboracao, color: '#A0B4D2', icon: AlertTriangle },
          ].map((kpi, i) => (
            <div key={i} className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${kpi.color} 0%, ${kpi.color}cc 100%)` }}>
              <p className="text-white/80 text-sm font-medium">{kpi.label}</p>
              <p className="text-5xl font-bold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" />OS por Regional</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={osByRegional}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [v, statusLabels[n] || n]} />
                  <Bar dataKey="elaboracao" stackId="a" fill="#64748b" />
                  <Bar dataKey="execucao" stackId="a" fill="#0000FF" />
                  <Bar dataKey="concluido" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-green-500" />OS por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={osByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {osByStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={v => v} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (slideId === 'dash_torre') {
    return (
      <div className="h-full overflow-auto">
        <TorreControleContent
          filteredOrdens={filteredOrdens}
          tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
          numItensNFCompra={numItensNFCompra}
          pessoas={pessoas}
          categorias={categorias}
          regionais={regionais}
          almoxarifados={almoxarifados}
        />
      </div>
    );
  }

  if (slideId === 'dash_recebimento') {
    return (
      <div className="h-full overflow-auto">
        <PainelRecebimento
          filteredOrdens={filteredOrdens}
          categoriaRecebimento={categoriaRecebimento}
          almoxarifados={almoxarifados}
          problemasRecebimento={problemasRecebimento}
        />
      </div>
    );
  }

  if (slideId === 'dash_expedicao') {
    return (
      <div className="h-full overflow-auto">
        <PainelExpedicao
          filteredOrdens={filteredOrdens}
          almoxarifados={almoxarifados}
        />
      </div>
    );
  }

  if (slideId === 'dash_produtividade') {
    return (
      <div className="h-full overflow-auto space-y-4">
        <OSProductivityRanking ordens={filteredOrdens} pessoas={pessoas} />
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" />Ranking de Líderes</CardTitle></CardHeader>
          <CardContent>
            <OSPorPessoaChart ordens={filteredOrdens} pessoas={pessoas} regionais={regionais} almoxarifados={almoxarifados} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // OS slides
  const { ordens, categorias: cats, subcategorias: subcats, pessoas: pess, regionais: regs, almoxarifados: almoxs, instalacoes, osFilters } = osData;

  const filteredOrdensOS = ordens.filter(os => {
    if (osFilters?.regional && osFilters.regional !== 'all' && os.regional_id !== osFilters.regional) return false;
    if (osFilters?.almoxarifado && osFilters.almoxarifado !== 'all' && os.almoxarifado_id !== osFilters.almoxarifado) return false;
    return true;
  });

  const noop = () => {};

  if (slideId === 'os_kanban') {
    return (
      <div className="h-full overflow-auto">
        <OSKanban ordens={filteredOrdensOS.filter(o => ['elaboracao','execucao','concluido','cancelado'].includes(o.status))} pessoas={pess} categorias={cats} regionais={regs} instalacoes={instalacoes} onOSClick={noop} onStatusChange={noop} />
      </div>
    );
  }

  if (slideId === 'os_kanban_expedicao') {
    const catExp = cats.find(c => c.nome?.toLowerCase().includes('expedição'));
    const ordensExp = catExp ? filteredOrdensOS.filter(o => o.categoria_id === catExp.id) : filteredOrdensOS;
    return (
      <div className="h-full overflow-auto">
        <OSKanbanExpedicao ordens={ordensExp} pessoas={pess} categorias={cats} regionais={regs} instalacoes={instalacoes} onOSClick={noop} onStatusChange={noop} />
      </div>
    );
  }

  if (slideId === 'os_kanban_recebimento') {
    const catRec = cats.find(c => c.nome?.toLowerCase().includes('recebimento'));
    const ordensRec = catRec ? filteredOrdensOS.filter(o => o.categoria_id === catRec.id) : filteredOrdensOS;
    return (
      <div className="h-full overflow-auto">
        <OSKanbanRecebimento ordens={ordensRec} pessoas={pess} categorias={cats} regionais={regs} instalacoes={instalacoes} onOSClick={noop} onStatusChange={noop} />
      </div>
    );
  }

  if (slideId === 'os_timesheet') {
    const osEmPlay = filteredOrdensOS.filter(o => o.timesheet_status === 'playing');
    return (
      <div className="h-full overflow-auto">
        <OSTimeSheetView osEmPlay={osEmPlay} pessoas={pess} categorias={cats} subcategorias={subcats} almoxarifados={almoxs} regionais={regs} filters={osFilters} onClickOS={noop} />
      </div>
    );
  }

  if (slideId === 'os_pendencias_expedicao') {
    const catExp = cats.find(c => c.nome?.toLowerCase().includes('expedição'));
    const ordensExp = catExp ? filteredOrdensOS.filter(o => o.categoria_id === catExp.id) : filteredOrdensOS;
    return (
      <div className="h-full overflow-auto">
        <OSPendenciasExpedicao ordens={ordensExp} categorias={cats} subcategorias={subcats} instalacoes={instalacoes} onOSClick={noop} />
      </div>
    );
  }

  if (slideId === 'os_pendencias_recebimento') {
    const catRec = cats.find(c => c.nome?.toLowerCase().includes('recebimento'));
    const ordensRec = catRec ? filteredOrdensOS.filter(o => o.categoria_id === catRec.id) : filteredOrdensOS;
    return (
      <div className="h-full overflow-auto">
        <OSPendenciasRecebimento ordens={ordensRec} categorias={cats} subcategorias={subcats} almoxarifados={almoxs} onOSClick={noop} />
      </div>
    );
  }

  return <div className="flex items-center justify-center h-full text-slate-400">Tela não encontrada</div>;
}

export default function PresentationOverlay({ slides, dashData, osData, onStop }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [now, setNow] = useState(new Date());
  const timerRef = useRef(null);
  const elapsedRef = useRef(null);
  const clockRef = useRef(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimer = useRef(null);

  const currentSlide = slides[currentIdx];
  const durationSecs = (currentSlide?.duration || 5) * 60;

  const goToSlide = useCallback((idx) => {
    setVisible(false);
    setElapsed(0);
    setTimeout(() => {
      setCurrentIdx(idx);
      setVisible(true);
    }, 400);
  }, []);

  const next = useCallback(() => {
    goToSlide((currentIdx + 1) % slides.length);
  }, [currentIdx, slides.length, goToSlide]);

  const prev = useCallback(() => {
    goToSlide((currentIdx - 1 + slides.length) % slides.length);
  }, [currentIdx, slides.length, goToSlide]);

  // Auto-advance timer
  useEffect(() => {
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= durationSecs) {
          // advance slide
          setVisible(false);
          setTimeout(() => {
            setCurrentIdx(ci => {
              const next = (ci + 1) % slides.length;
              return next;
            });
            setElapsed(0);
            setVisible(true);
          }, 400);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIdx, durationSecs, slides.length]);

  // Clock
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Reset idle — activity keep-alive: dispatch mouse event every 30s to prevent idle logout
  useEffect(() => {
    const keepAlive = setInterval(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    }, 30000);
    return () => clearInterval(keepAlive);
  }, []);

  // Auto-hide controls
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    showControls();
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, []);

  const progress = durationSecs > 0 ? (elapsed / durationSecs) * 100 : 0;
  const remaining = durationSecs - elapsed;
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      {/* Header bar — minimal */}
      <div
        className="flex items-center justify-between px-5 py-2.5 bg-slate-800/90 border-b border-slate-700/50"
        style={{ minHeight: '48px' }}
      >
        <div className="flex items-center gap-3">
          <Tv2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-white font-semibold text-sm truncate max-w-xs">{currentSlide?.label}</span>
          <span className="text-slate-400 text-xs">
            {currentIdx + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Slide dots */}
          <div className="hidden md:flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goToSlide(i)} className={`rounded-full transition-all ${i === currentIdx ? 'w-5 h-2 bg-blue-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'}`} />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{remMin}:{String(remSec).padStart(2, '0')}</span>
          </div>

          {/* Clock */}
          <span className="text-slate-300 text-sm font-mono hidden sm:inline">
            {format(now, 'HH:mm:ss')}
          </span>

          {/* Nav */}
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stop */}
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Square className="w-3 h-3" />
            Parar
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-700 shrink-0">
        <div
          className="h-full bg-blue-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slide content */}
      <div
        className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out',
          padding: '16px',
        }}
      >
        <SlideContent
          key={currentSlide?.id}
          slideId={currentSlide?.id}
          dashData={dashData}
          osData={osData}
        />
      </div>
    </div>
  );
}