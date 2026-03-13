import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/components/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, LabelList } from 'recharts';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, TrendingUp, Building2, MapPin, Loader2, Zap, Warehouse, Grid, Users, Package, DollarSign, Timer, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, differenceInDays } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardInsights from '@/components/dashboard/DashboardInsights';
import OSPorPessoaChart from '@/components/dashboard/OSPorPessoaChart';
import ExportDashboardButton from '@/components/dashboard/ExportDashboardButton';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import TorreControleContent from '@/components/dashboard/TorreControleContent';
import TorreControleRecebimentoProblemas from '@/components/dashboard/TorreControleRecebimentoProblemas';
import PainelRecebimento from '@/components/dashboard/PainelRecebimento';
import OSProductivityRanking from '@/components/dashboard/OSProductivityRanking';
import OSPorAtendenteChart from '@/components/dashboard/OSPorAtendenteChart';
import { isNoPrazo, isForaPrazo } from '@/components/dashboard/prazoHelpers';
import ProjetosDashboard from '@/components/dashboard/ProjetosDashboard';
import OTIFExpedicao from '@/components/dashboard/OTIFExpedicao';
import PainelExpedicao from '@/components/dashboard/PainelExpedicao';

const COLORS = ['#0000FF', '#FF6B00', '#10B981', '#A0B4D2', '#0A003C', '#EC4899'];

const statusLabels = {
  elaboracao: 'Em Elaboração',
  execucao: 'Em Execução',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

export default function Dashboard() {
  const { regionais, categorias, subcategorias, pessoas, loading: ctxLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [ordens, setOrdens] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [problemasRecebimento, setProblemasRecebimento] = useState([]);
  const [mapFilters, setMapFilters] = useState({
    usina: true,
    subestacao: true,
    almoxarifado: true,
    outros: true,
    almoxarifadosEntidade: true
  });
  const [heatmapCriteria, setHeatmapCriteria] = useState('quantidade_os');
  const [heatmapInstalacao, setHeatmapInstalacao] = useState('destino');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('geral');
  const [filters, setFilters] = useState({
    regional: 'all',
    almoxarifado: 'all',
    categoria: 'all',
    subcategoria: 'all',
    status: 'all',
    periodo: '30',
    dataInicio: '',
    dataFim: ''
  });

  const updateFilters = async (newFilters) => {
    setFilters(newFilters);
    try {
      const savedFilters = currentUser?.filtros_preferidos || {};
      await base44.auth.updateMe({
        filtros_preferidos: {
          ...savedFilters,
          Dashboard: newFilters
        }
      });
    } catch (e) {
      console.error('Erro ao salvar filtros');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, ordensData, almoxarifadosData, instalacoesData, problemasData] = await Promise.all([
        base44.auth.me(),
        base44.entities.OrdemServico.list(),
        base44.entities.Almoxarifado.list(),
        base44.entities.Instalacao.list(),
        base44.entities.ProblemaRecebimento.list()
      ]);
      setCurrentUser(user);
      setOrdens(ordensData);
      setAlmoxarifados(almoxarifadosData);
      setInstalacoes(instalacoesData);
      setProblemasRecebimento(problemasData);

      if (user.filtros_preferidos?.Dashboard) {
        setFilters(user.filtros_preferidos.Dashboard);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const isWidgetVisible = (widgetId) => {
    const saved = currentUser?.dashboard_visible_widgets;
    if (!saved || !Array.isArray(saved)) return true;
    return saved.includes(widgetId);
  };

  // Torre de Controle - KPIs Volumetrias (definir antes de usar nos filtros)
  const categoriaRecebimento = categorias.find(c => c.nome?.toLowerCase().includes('recebimento'));
  const categoriaExpedicao = categorias.find(c => c.nome?.toLowerCase().includes('expedição'));

  // Filter data
  const filteredOrdens = ordens.filter(os => {
    if (filters.regional !== 'all' && os.regional_id !== filters.regional) return false;
    if (filters.almoxarifado !== 'all' && os.almoxarifado_id !== filters.almoxarifado) return false;
    
    // Filtrar por categoria conforme a aba selecionada
    if (activeTab === 'recebimento') {
      if (os.categoria_id !== categoriaRecebimento?.id) return false;
    } else if (activeTab === 'expedicao') {
      if (os.categoria_id !== categoriaExpedicao?.id) return false;
    } else {
      // Aba geral, mapas e torre usam o filtro de categoria normal
      if (filters.categoria !== 'all' && os.categoria_id !== filters.categoria) return false;
    }
    
    if (filters.subcategoria !== 'all' && !os.subcategorias_ids?.includes(filters.subcategoria)) return false;
    if (filters.status !== 'all' && os.status !== filters.status) return false;
    
    // Period filter
    if (filters.periodo === 'mes_atual') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const osDate = new Date(os.created_date);
      if (osDate < startOfMonth || osDate > endOfMonth) return false;
    } else if (filters.periodo === 'customizado') {
      if (filters.dataInicio) {
        const startDate = new Date(filters.dataInicio);
        if (new Date(os.created_date) < startDate) return false;
      }
      if (filters.dataFim) {
        const endDate = new Date(filters.dataFim);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(os.created_date) > endDate) return false;
      }
    } else if (filters.periodo !== 'all') {
      const days = parseInt(filters.periodo);
      const cutoff = subDays(new Date(), days);
      if (new Date(os.created_date) < cutoff) return false;
    }
    return true;
  });

  // Subcategorias filtradas pela categoria selecionada (ou pela categoria fixa da aba)
  const activeCategoriaId = 
    activeTab === 'recebimento' ? categoriaRecebimento?.id :
    activeTab === 'expedicao' ? categoriaExpedicao?.id :
    filters.categoria !== 'all' ? filters.categoria : null;

  const filteredSubcategorias = activeCategoriaId
    ? subcategorias.filter(s => s.categoria_id === activeCategoriaId)
    : subcategorias;

  // KPIs - Com comparação de ontem
  const yesterday = subDays(new Date(), 1);
  const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
  
  const ordensOntem = ordens.filter(os => {
    const createdDate = new Date(os.created_date);
    return createdDate < yesterdayStart;
  });
  
  const totalOS = filteredOrdens.length;
  const totalOSOntem = ordensOntem.length;
  const diffTotalOS = totalOS - totalOSOntem;
  const percTotalOS = totalOSOntem > 0 ? ((diffTotalOS / totalOSOntem) * 100).toFixed(1) : 0;
  
  const osEmElaboracao = filteredOrdens.filter(os => os.status === 'elaboracao').length;
  const osEmElaboracaoOntem = ordensOntem.filter(os => os.status === 'elaboracao').length;
  const diffElaboracao = osEmElaboracao - osEmElaboracaoOntem;
  const percElaboracao = osEmElaboracaoOntem > 0 ? ((diffElaboracao / osEmElaboracaoOntem) * 100).toFixed(1) : 0;
  
  const osEmExecucao = filteredOrdens.filter(os => os.status === 'execucao').length;
  const osEmExecucaoOntem = ordensOntem.filter(os => os.status === 'execucao').length;
  const diffExecucao = osEmExecucao - osEmExecucaoOntem;
  const percExecucao = osEmExecucaoOntem > 0 ? ((diffExecucao / osEmExecucaoOntem) * 100).toFixed(1) : 0;
  
  const osConcluidas = filteredOrdens.filter(os => os.status === 'concluido').length;
  const osConcluidasOntem = ordensOntem.filter(os => os.status === 'concluido').length;
  const diffConcluidas = osConcluidas - osConcluidasOntem;
  const percConcluidas = osConcluidasOntem > 0 ? ((diffConcluidas / osConcluidasOntem) * 100).toFixed(1) : 0;

  // Average progress
  const avgProgress = totalOS > 0 
    ? Math.round(filteredOrdens.reduce((sum, os) => sum + (os.progresso || 0), 0) / totalOS)
    : 0;
  const avgProgressOntem = totalOSOntem > 0 
    ? Math.round(ordensOntem.reduce((sum, os) => sum + (os.progresso || 0), 0) / totalOSOntem)
    : 0;
  const diffProgress = avgProgress - avgProgressOntem;
  const percProgress = avgProgressOntem > 0 ? ((diffProgress / avgProgressOntem) * 100).toFixed(1) : 0;

  // On-time completion rate - todas as OS com prazo definido
  const osComPrazo = filteredOrdens.filter(os => os.prazo);
  const hoje = new Date();
  
  const onTimeCount = osComPrazo.filter(os => {
    // Se concluída, verificar se foi dentro do prazo
    if (os.status === 'concluido' && os.data_conclusao) {
      return new Date(os.data_conclusao) <= new Date(os.prazo);
    }
    // Se não concluída, verificar se o prazo ainda não passou
    return new Date(os.prazo) >= hoje;
  }).length;
  
  const onTimeRate = osComPrazo.length > 0 ? Math.round((onTimeCount / osComPrazo.length) * 100) : 0;

  // Average resolution time
  const osConcluidasParaCalculo = filteredOrdens.filter(os => os.status === 'concluido');
  const osConcluidasComData = osConcluidasParaCalculo.filter(os => os.data_conclusao);
  
  const avgResolutionDays = osConcluidasComData.length > 0
    ? Math.round(osConcluidasComData.reduce((sum, os) => {
        const start = new Date(os.data_inicial || os.created_date);
        const end = new Date(os.data_conclusao);
        const dias = Math.abs(differenceInDays(end, start));
        return sum + dias;
      }, 0) / osConcluidasComData.length)
    : 0;

    // KPIs Recebimento
    const osRecebimento = filteredOrdens.filter(os => os.categoria_id === categoriaRecebimento?.id);

  const numItensNFCompra = filteredOrdens.reduce((sum, os) => {
    return sum + (os.itens_documento?.length || 0) + (os.nfe_itens_conferencia?.length || 0);
  }, 0);

  const valorItensNFCompra = filteredOrdens.reduce((sum, os) => {
    // Valor de expedição vem dos itens_documento
    const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
    // Valor de recebimento vem de nfe_itens_conferencia
    const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => {
      const valorItem = (item.quantidade_esperada || 0) * (parseFloat(item.valor_unitario) || 0);
      return s + valorItem;
    }, 0);
    return sum + valorExpedicao + valorRecebimento;
  }, 0);

  const osComDatasPrazo = filteredOrdens.filter(os => os.data_inicial && os.prazo);

  const tempoMedioRegularizacaoCompra = osComDatasPrazo.length > 0
    ? osComDatasPrazo.reduce((sum, os) => {
        const dataInicial = new Date(os.data_inicial);
        const dataPrazo = new Date(os.prazo);
        return sum + differenceInDays(dataPrazo, dataInicial);
      }, 0) / osComDatasPrazo.length
    : 0;
  
  // KPIs Expedição
  const osExpedicao = filteredOrdens.filter(os => os.categoria_id === categoriaExpedicao?.id);
  
  const numItensExpedidos = osExpedicao.reduce((sum, os) => {
    return sum + (os.itens_documento?.length || 0);
  }, 0);
  
  const valorExpedicao = osExpedicao.reduce((sum, os) => {
    return sum + (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
  }, 0);
  
  const osExpedicaoConcluidas = osExpedicao.filter(os => os.status === 'concluido' && os.data_migo && os.data_reserva);
  
  const tempoMedioAtendimentoExpedicao = osExpedicaoConcluidas.length > 0
    ? osExpedicaoConcluidas.reduce((sum, os) => {
        const dataMigo = new Date(os.data_migo);
        const dataReserva = new Date(os.data_reserva);
        return sum + differenceInDays(dataMigo, dataReserva);
      }, 0) / osExpedicaoConcluidas.length
    : 0;

  // Chart data: OS by Regional (com breakdown por status)
  const osByRegional = regionais.map(r => {
    const ordensRegional = filteredOrdens.filter(os => os.regional_id === r.id);
    return {
      name: r.sigla,
      elaboracao: ordensRegional.filter(os => os.status === 'elaboracao').length,
      execucao: ordensRegional.filter(os => os.status === 'execucao').length,
      concluido: ordensRegional.filter(os => os.status === 'concluido').length,
      cancelado: ordensRegional.filter(os => os.status === 'cancelado').length,
      total: ordensRegional.length
    };
  }).filter(d => d.total > 0);

  // Chart data: OS by Category
  const osByCategoria = categorias.map(c => ({
    name: c.nome,
    total: filteredOrdens.filter(os => os.categoria_id === c.id).length
  })).filter(d => d.total > 0);

  // Chart data: OS by Status
  const osByStatus = Object.entries(statusLabels).map(([key, label]) => ({
    name: label,
    value: filteredOrdens.filter(os => os.status === key).length
  })).filter(d => d.value > 0);

  // Chart data: Top Almoxarifados
  const osByAlmoxarifado = almoxarifados.map(a => ({
    name: a.nome,
    total: filteredOrdens.filter(os => os.almoxarifado_id === a.id).length
  })).sort((a, b) => b.total - a.total).slice(0, 5);

  // Heatmap data: OS de Expedição agrupadas por instalação de origem ou destino
  const categoriaExpedicaoHeatmap = Array.isArray(categorias) ? categorias.find(c => c?.nome?.toLowerCase().includes('expedi')) : null;
  const campoInstalacao = heatmapInstalacao === 'origem' ? 'instalacao_origem_id' : 'instalacao_destino_id';
  const osExpedicaoHeatmap = Array.isArray(ordens) ? ordens.filter(os => os?.categoria_id === categoriaExpedicaoHeatmap?.id && os?.[campoInstalacao]) : [];
  
  const heatmapData = instalacoes
    .filter(inst => inst.latitude && inst.longitude)
    .map(inst => {
      const osDestino = osExpedicaoHeatmap.filter(os => os[campoInstalacao] === inst.id);
      
      let value = 0;
      if (heatmapCriteria === 'quantidade_os') {
        value = osDestino.length;
      } else if (heatmapCriteria === 'valor_total') {
        value = osDestino.reduce((sum, os) => {
          const totalOS = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
          return sum + totalOS;
        }, 0);
      } else if (heatmapCriteria === 'peso_total') {
        value = osDestino.reduce((sum, os) => {
          const pesoOS = (os.volumes || []).reduce((s, vol) => s + (vol.peso_bruto || 0), 0);
          return sum + pesoOS;
        }, 0);
      } else if (heatmapCriteria === 'quantidade_itens') {
        value = osDestino.reduce((sum, os) => {
          const qtdItens = (os.itens_documento || []).reduce((s, item) => s + (item.quantidade || 0), 0);
          return sum + qtdItens;
        }, 0);
      }
      
      return {
        instalacao: inst,
        osCount: osDestino.length,
        value: value
      };
    })
    .filter(d => d.value > 0);
  
  const maxValue = Math.max(...heatmapData.map(d => d.value), 1);
  
  const getCircleRadius = (value) => {
    const minRadius = 5000;
    const maxRadius = 100000;
    const normalized = value / maxValue;
    return minRadius + (normalized * (maxRadius - minRadius));
  };
  
  const getCircleColor = (value) => {
    const normalized = value / maxValue;
    if (normalized > 0.7) return '#dc2626';
    if (normalized > 0.4) return '#f97316';
    if (normalized > 0.2) return '#eab308';
    return '#22c55e';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Visão geral das operações</p>
          </div>
          <div className="flex gap-2">
            <ExportDashboardButton 
              dashboardData={{
                kpis: {
                  totalOS,
                  percTotalOS,
                  emExecucao: osEmExecucao,
                  percExecucao,
                  concluidas: osConcluidas,
                  percConcluidas,
                  avgProgress,
                  percProgress
                },
                charts: {
                  osByRegional,
                  osByCategoria,
                  osByStatus
                }
              }}
              filters={filters}
              regionais={regionais}
              categorias={categorias}
            />
            <DashboardCustomizer 
              currentUser={currentUser}
              onUpdate={loadData}
            />
          </div>
        </div>
        
        {/* Filtros - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Select value={filters.regional} onValueChange={(v) => updateFilters({ ...filters, regional: v, almoxarifado: 'all' })}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regionais</SelectItem>
              {regionais.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.almoxarifado} onValueChange={(v) => updateFilters({ ...filters, almoxarifado: v })}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800">
              <SelectValue placeholder="Almoxarifado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Almoxarifados</SelectItem>
              {almoxarifados
                .filter(a => filters.regional === 'all' || a.regional_id === filters.regional)
                .map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select 
            value={activeTab === 'recebimento' ? categoriaRecebimento?.id : activeTab === 'expedicao' ? categoriaExpedicao?.id : filters.categoria}
            onValueChange={(v) => updateFilters({ ...filters, categoria: v, subcategoria: 'all' })}
            disabled={activeTab === 'recebimento' || activeTab === 'expedicao'}
          >
            <SelectTrigger className="w-full bg-white dark:bg-slate-800">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {activeTab === 'recebimento' ? (
                <SelectItem value={categoriaRecebimento?.id}>{categoriaRecebimento?.nome}</SelectItem>
              ) : activeTab === 'expedicao' ? (
                <SelectItem value={categoriaExpedicao?.id}>{categoriaExpedicao?.nome}</SelectItem>
              ) : (
                <>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <Select 
            value={filters.subcategoria} 
            onValueChange={(v) => updateFilters({ ...filters, subcategoria: v })}
            disabled={filters.categoria === 'all'}
          >
            <SelectTrigger className="w-full bg-white dark:bg-slate-800">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subcategorias</SelectItem>
              {filteredSubcategorias.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => updateFilters({ ...filters, status: v })}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="elaboracao">Em Elaboração</SelectItem>
              <SelectItem value="execucao">Em Execução</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={filters.periodo} onValueChange={(v) => updateFilters({ ...filters, periodo: v })}>
              <SelectTrigger className="w-full bg-white dark:bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="mes_atual">Mês atual</SelectItem>
                <SelectItem value="customizado">Período customizado</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => updateFilters({
                regional: 'all',
                almoxarifado: 'all',
                categoria: 'all',
                subcategoria: 'all',
                status: 'all',
                periodo: '30',
                dataInicio: '',
                dataFim: ''
              })}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              title="Limpar filtros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {filters.periodo === 'customizado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Data Início</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => updateFilters({ ...filters, dataInicio: e.target.value })}
                className="bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => updateFilters({ ...filters, dataFim: e.target.value })}
                className="bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-none h-auto p-0 space-x-8 w-full justify-start">
          <TabsTrigger 
            value="geral" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Geral
          </TabsTrigger>
          <TabsTrigger 
            value="mapas" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Mapas
          </TabsTrigger>
          <TabsTrigger 
            value="torre" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Torre de Controle
          </TabsTrigger>
          <TabsTrigger 
            value="recebimento" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Painel Recebimento
          </TabsTrigger>
          <TabsTrigger 
            value="expedicao" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Painel Expedição
          </TabsTrigger>
          <TabsTrigger 
            value="produtividade" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Painel Produtividade
          </TabsTrigger>
          <TabsTrigger 
            value="projetos" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
          >
            Projetos
          </TabsTrigger>
        </TabsList>

        {/* ABA GERAL */}
        <TabsContent value="geral" className="mt-6 space-y-8">
      {/* KPI Cards - Cores Axia */}
      {isWidgetVisible('kpis') && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">Total de OS</p>
                <p className="text-4xl font-bold text-white mt-1">{filteredOrdens.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              Conforme filtros aplicados
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">Em Execução</p>
                <p className="text-4xl font-bold text-white mt-1">{osEmExecucao}</p>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {percExecucao >= 0 ? (
                <>
                  <div className="text-green-300 text-sm font-semibold">↑ {Math.abs(percExecucao)}%</div>
                  <span className="text-white/60 text-xs">vs. ontem</span>
                </>
              ) : (
                <>
                  <div className="text-red-300 text-sm font-semibold">↓ {Math.abs(percExecucao)}%</div>
                  <span className="text-white/60 text-xs">vs. ontem</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">Concluídas</p>
                <p className="text-4xl font-bold text-white mt-1">{osConcluidas}</p>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {percConcluidas >= 0 ? (
                <>
                  <div className="text-green-200 text-sm font-semibold">↑ {Math.abs(percConcluidas)}%</div>
                  <span className="text-white/60 text-xs">vs. ontem</span>
                </>
              ) : (
                <>
                  <div className="text-red-300 text-sm font-semibold">↓ {Math.abs(percConcluidas)}%</div>
                  <span className="text-white/60 text-xs">vs. ontem</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #A0B4D2 0%, #7A95BA 100%)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-white/90 text-sm font-medium">Progresso Médio</p>
                <p className="text-4xl font-bold text-white mt-1">{avgProgress}%</p>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {percProgress >= 0 ? (
                <>
                  <div className="text-green-200 text-sm font-semibold">↑ {Math.abs(percProgress)}%</div>
                  <span className="text-white/70 text-xs">vs. ontem</span>
                </>
              ) : (
                <>
                  <div className="text-red-300 text-sm font-semibold">↓ {Math.abs(percProgress)}%</div>
                  <span className="text-white/70 text-xs">vs. ontem</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Observações Section */}
      {isWidgetVisible('insights') && (
        <DashboardInsights ordens={filteredOrdens} pessoas={[]} categorias={categorias} />
      )}

      {/* Secondary KPIs */}
      {isWidgetVisible('kpis-secondary') && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Taxa de Cumprimento</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{onTimeRate}%</p>
                <p className="text-xs text-slate-400">OS no prazo ou concluídas a tempo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tempo Médio Resolução</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgResolutionDays} dias</p>
                <p className="text-xs text-slate-400">Para conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Em Elaboração</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{osEmElaboracao}</p>
                <p className="text-xs text-slate-400">Aguardando início</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS by Regional */}
        {isWidgetVisible('os-regional') && (
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              OS por Regional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {osByRegional.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={osByRegional} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [value, statusLabels[name] || name]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => statusLabels[value] || value}
                  />
                  <Bar dataKey="elaboracao" stackId="a" fill="#64748b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="execucao" stackId="a" fill="#0000FF" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="concluido" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cancelado" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* OS by Status */}
        {isWidgetVisible('os-status') && (
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-500" />
              OS por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {osByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={osByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {osByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS by Category */}
        {isWidgetVisible('os-categoria') && (
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              OS por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {osByCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={osByCategoria} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0000FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Top Almoxarifados */}
        {isWidgetVisible('top-almoxarifados') && (
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              Top 5 Almoxarifados por Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {osByAlmoxarifado.length > 0 ? (
              <div className="space-y-4">
                {osByAlmoxarifado.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                      style={{ 
                        background: index === 0 ? '#0000FF' : 
                                  index === 1 ? '#FF6B00' : 
                                  index === 2 ? '#A0B4D2' : '#cbd5e1'
                      }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                        {item.name}
                      </p>
                      <div className="mt-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${(item.total / osByAlmoxarifado[0].total) * 100}%`,
                            background: 'linear-gradient(90deg, #FF6B00 0%, #FF8C00 100%)'
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{item.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
        </TabsContent>

        {/* ABA MAPAS */}
        <TabsContent value="mapas" className="mt-6 space-y-8">
      {/* Maps Row - Mobile First */}
      <div className="grid grid-cols-1 gap-6">
        {/* Heatmap Section */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-orange-500" />
              Mapa de Calor - Expedições
            </CardTitle>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={heatmapInstalacao} onValueChange={setHeatmapInstalacao}>
                  <SelectTrigger className="w-48 bg-white dark:bg-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="origem">Instalação de Origem</SelectItem>
                    <SelectItem value="destino">Instalação de Destino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Checkbox 
                    checked={heatmapCriteria === 'quantidade_os'}
                    onCheckedChange={(checked) => checked && setHeatmapCriteria('quantidade_os')}
                  />
                  <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Qtd OS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Checkbox 
                    checked={heatmapCriteria === 'valor_total'}
                    onCheckedChange={(checked) => checked && setHeatmapCriteria('valor_total')}
                  />
                  <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Valor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Checkbox 
                    checked={heatmapCriteria === 'peso_total'}
                    onCheckedChange={(checked) => checked && setHeatmapCriteria('peso_total')}
                  />
                  <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Peso</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Checkbox 
                    checked={heatmapCriteria === 'quantidade_itens'}
                    onCheckedChange={(checked) => checked && setHeatmapCriteria('quantidade_itens')}
                  />
                  <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Itens</span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <MapContainer
                center={[-15.7801, -47.9292]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {heatmapData.map((data, index) => (
                  <Circle
                    key={`heat-${index}`}
                    center={[data.instalacao.latitude, data.instalacao.longitude]}
                    radius={getCircleRadius(data.value)}
                    pathOptions={{
                      fillColor: getCircleColor(data.value),
                      fillOpacity: 0.4,
                      color: getCircleColor(data.value),
                      weight: 2,
                      opacity: 0.8
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-slate-900">{data.instalacao.nome}</h3>
                        <p className="text-sm text-slate-600">{data.instalacao.cidade} - {data.instalacao.estado}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="font-medium">Quantidade de OS: {data.osCount}</p>
                          {heatmapCriteria === 'quantidade_os' && (
                            <p>Total: {data.value} OS</p>
                          )}
                          {heatmapCriteria === 'valor_total' && (
                            <p>Valor Total: R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          )}
                          {heatmapCriteria === 'peso_total' && (
                            <p>Peso Total: {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</p>
                          )}
                          {heatmapCriteria === 'quantidade_itens' && (
                            <p>Quantidade Total: {data.value.toLocaleString('pt-BR')} itens</p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-slate-600 dark:text-slate-400">Muito Alto</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Section */}
        <Card className="bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            Mapa de Instalações e Almoxarifados
          </CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <Checkbox 
                  checked={mapFilters.usina}
                  onCheckedChange={(checked) => setMapFilters({...mapFilters, usina: checked})}
                />
                <Zap className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">Usinas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <Checkbox 
                  checked={mapFilters.subestacao}
                  onCheckedChange={(checked) => setMapFilters({...mapFilters, subestacao: checked})}
                />
                <Grid className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">Subestações</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <Checkbox 
                  checked={mapFilters.outros}
                  onCheckedChange={(checked) => setMapFilters({...mapFilters, outros: checked})}
                />
                <Building2 className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">Outros</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <Checkbox 
                  checked={mapFilters.almoxarifadosEntidade}
                  onCheckedChange={(checked) => setMapFilters({...mapFilters, almoxarifadosEntidade: checked})}
                />
                <Warehouse className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">Almox</span>
              </label>
            </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <MapContainer
              center={[-15.7801, -47.9292]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Instalações */}
              {instalacoes
                .filter(inst => {
                  if (inst.classificacao === 'Usina') return mapFilters.usina;
                  if (inst.classificacao === 'Subestação') return mapFilters.subestacao;
                  if (inst.classificacao === 'Outros') return mapFilters.outros;
                  // Não exibir Almoxarifados do tipo Instalação aqui, apenas via entidade Almoxarifado
                  return false;
                })
                .filter(inst => inst.latitude && inst.longitude)
                .map((inst) => {
                  const iconColor = 
                    inst.classificacao === 'Usina' ? '#16a34a' :
                    inst.classificacao === 'Subestação' ? '#2563eb' :
                    inst.classificacao === 'Almoxarifado' ? '#d97706' : '#64748b';
                  
                  const iconHtml = `
                    <div style="
                      background: ${iconColor};
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border: 3px solid white;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        ${inst.classificacao === 'Usina' ? '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>' :
                          inst.classificacao === 'Subestação' ? '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' :
                          inst.classificacao === 'Almoxarifado' ? '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' :
                          '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'}
                      </svg>
                    </div>
                  `;
                  
                  const customIcon = L.divIcon({
                    html: iconHtml,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  });
                  
                  return (
                    <Marker
                      key={`inst-${inst.id}`}
                      position={[inst.latitude, inst.longitude]}
                      icon={customIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-slate-900">{inst.nome}</h3>
                          <p className="text-sm text-slate-600">{inst.classificacao}</p>
                          {inst.cidade && inst.estado && (
                            <p className="text-xs text-slate-500 mt-1">{inst.cidade} - {inst.estado}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              
              {/* Almoxarifados */}
              {mapFilters.almoxarifadosEntidade && almoxarifados
                .filter(almox => almox.latitude && almox.longitude)
                .map((almox) => {
                  const iconHtml = `
                    <div style="
                      background: #9333ea;
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border: 3px solid white;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                  `;
                  
                  const customIcon = L.divIcon({
                    html: iconHtml,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  });
                  
                  return (
                    <Marker
                      key={`almox-${almox.id}`}
                      position={[almox.latitude, almox.longitude]}
                      icon={customIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-slate-900">{almox.nome}</h3>
                          <p className="text-sm text-slate-600">Almoxarifado</p>
                          {almox.endereco && (
                            <p className="text-xs text-slate-500 mt-1">{almox.endereco}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
      </div>
        </TabsContent>

        {/* ABA TORRE DE CONTROLE */}
        <TabsContent value="torre" className="mt-6 space-y-8">
          <TorreControleContent
            filteredOrdens={filteredOrdens}
            tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
            numItensNFCompra={numItensNFCompra}
            pessoas={pessoas}
            categorias={categorias}
            regionais={regionais}
            almoxarifados={almoxarifados}
          />
              </TabsContent>

              {/* ABA RECEBIMENTO */}
              <TabsContent value="recebimento" className="mt-6 space-y-8">
                <PainelRecebimento
                  filteredOrdens={filteredOrdens}
                  categoriaRecebimento={categoriaRecebimento}
                  almoxarifados={almoxarifados}
                  problemasRecebimento={problemasRecebimento}
                />
              </TabsContent>

              {/* ABA EXPEDIÇÃO */}
              <TabsContent value="expedicao" className="mt-6 space-y-8">
                <PainelExpedicao
                  filteredOrdens={filteredOrdens}
                  almoxarifados={almoxarifados}
                />
              </TabsContent>

              {/* ABA PROJETOS */}
              <TabsContent value="projetos" className="mt-6">
                <ProjetosDashboard 
                  regionalFilter={filters.regional}
                  almoxarifadoFilter={filters.almoxarifado}
                />
              </TabsContent>

              {/* ABA PRODUTIVIDADE */}
              <TabsContent value="produtividade" className="mt-6 space-y-8">
                <OSProductivityRanking
                  ordens={filteredOrdens}
                  pessoas={pessoas}
                />

                {/* Gráfico de Ranking de Líderes */}
                {isWidgetVisible('esforco-pessoa') && (
                <Card className="bg-white dark:bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      Ranking de Líderes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OSPorPessoaChart 
                      ordens={filteredOrdens} 
                      pessoas={pessoas}
                      regionais={regionais}
                      almoxarifados={almoxarifados}
                    />
                  </CardContent>
                </Card>
                )}

                {/* Gráfico de Ranking de Atendentes */}
                <Card className="bg-white dark:bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      Ranking de Atendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OSPorAtendenteChart 
                      ordens={filteredOrdens} 
                      pessoas={pessoas}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              </Tabs>
              </div>
              );
              }