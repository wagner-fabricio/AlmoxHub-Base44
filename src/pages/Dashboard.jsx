import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, TrendingUp, Building2, MapPin, Loader2 } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const statusLabels = {
  elaboracao: 'Em Elaboração',
  execucao: 'Em Execução',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [ordens, setOrdens] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    regional: 'all',
    categoria: 'all',
    subcategoria: 'all',
    periodo: '30'
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
      console.error('Error saving filters:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, ordensData, regionaisData, categoriasData, subcategoriasData, almoxarifadosData] = await Promise.all([
        base44.auth.me(),
        base44.entities.OrdemServico.list(),
        base44.entities.Regional.list(),
        base44.entities.Categoria.list(),
        base44.entities.Subcategoria.list(),
        base44.entities.Almoxarifado.list()
      ]);
      setCurrentUser(user);
      setOrdens(ordensData);
      setRegionais(regionaisData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setAlmoxarifados(almoxarifadosData);

      if (user.filtros_preferidos?.Dashboard) {
        setFilters(user.filtros_preferidos.Dashboard);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredOrdens = ordens.filter(os => {
    if (filters.regional !== 'all' && os.regional_id !== filters.regional) return false;
    if (filters.categoria !== 'all' && os.categoria_id !== filters.categoria) return false;
    if (filters.subcategoria !== 'all' && !os.subcategorias_ids?.includes(filters.subcategoria)) return false;
    if (filters.periodo !== 'all') {
      const days = parseInt(filters.periodo);
      const cutoff = subDays(new Date(), days);
      if (new Date(os.created_date) < cutoff) return false;
    }
    return true;
  });

  // Subcategorias filtradas pela categoria selecionada
  const filteredSubcategorias = filters.categoria === 'all' 
    ? subcategorias 
    : subcategorias.filter(s => s.categoria_id === filters.categoria);

  // KPIs
  const totalOS = filteredOrdens.length;
  const osEmElaboracao = filteredOrdens.filter(os => os.status === 'elaboracao').length;
  const osEmExecucao = filteredOrdens.filter(os => os.status === 'execucao').length;
  const osConcluidas = filteredOrdens.filter(os => os.status === 'concluido').length;

  // Average progress
  const avgProgress = totalOS > 0 
    ? Math.round(filteredOrdens.reduce((sum, os) => sum + (os.progresso || 0), 0) / totalOS)
    : 0;

  // On-time completion rate
  const completedOS = filteredOrdens.filter(os => os.status === 'concluido' && os.data_conclusao && os.prazo);
  const onTimeCount = completedOS.filter(os => new Date(os.data_conclusao) <= new Date(os.prazo)).length;
  const onTimeRate = completedOS.length > 0 ? Math.round((onTimeCount / completedOS.length) * 100) : 0;

  // Average resolution time
  const avgResolutionDays = completedOS.length > 0
    ? Math.round(completedOS.reduce((sum, os) => {
        const start = new Date(os.data_inicial || os.created_date);
        const end = new Date(os.data_conclusao);
        return sum + differenceInDays(end, start);
      }, 0) / completedOS.length)
    : 0;

  // Chart data: OS by Regional
  const osByRegional = regionais.map(r => ({
    name: r.sigla,
    total: filteredOrdens.filter(os => os.regional_id === r.id).length
  })).filter(d => d.total > 0);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Visão geral das operações</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={filters.regional} onValueChange={(v) => updateFilters({ ...filters, regional: v })}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regionais</SelectItem>
              {regionais.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.categoria} onValueChange={(v) => updateFilters({ ...filters, categoria: v, subcategoria: 'all' })}>
            <SelectTrigger className="w-44 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.subcategoria} 
            onValueChange={(v) => updateFilters({ ...filters, subcategoria: v })}
            disabled={filters.categoria === 'all'}
          >
            <SelectTrigger className="w-44 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subcategorias</SelectItem>
              {filteredSubcategorias.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.periodo} onValueChange={(v) => updateFilters({ ...filters, periodo: v })}>
            <SelectTrigger className="w-36 bg-white dark:bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de OS</p>
                <p className="text-3xl font-bold mt-1">{totalOS}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Em Execução</p>
                <p className="text-3xl font-bold mt-1">{osEmExecucao}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Concluídas</p>
                <p className="text-3xl font-bold mt-1">{osConcluidas}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Progresso Médio</p>
                <p className="text-3xl font-bold mt-1">{avgProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
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
                <p className="text-xs text-slate-400">OS finalizadas no prazo</p>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS by Regional */}
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
                  />
                  <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* OS by Status */}
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
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS by Category */}
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
                  <Bar dataKey="total" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Almoxarifados */}
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm
                      ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                        {item.name}
                      </p>
                      <div className="mt-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          style={{ width: `${(item.total / osByAlmoxarifado[0].total) * 100}%` }}
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
      </div>
    </div>
  );
}