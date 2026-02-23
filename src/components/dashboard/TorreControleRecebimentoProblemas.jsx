import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, TrendingDown } from 'lucide-react';

export default function TorreControleRecebimentoProblemas({
  filteredOrdens,
  regionais,
  problemasRecebimento
}) {
  // Filtrar OS com problemas de recebimento
  const ordensComProblemas = filteredOrdens.filter(os => os.problema_recebimento === true);
  const totalProblemas = ordensComProblemas.length;
  
  // Agrupar problemas por tipo
  const problemasData = {};
  problemasRecebimento.forEach(p => {
    problemasData[p.id] = p;
  });
  
  const problemasContagem = {};
  ordensComProblemas.forEach(os => {
    if (os.problemas_recebimento_ids && Array.isArray(os.problemas_recebimento_ids)) {
      os.problemas_recebimento_ids.forEach(pid => {
        const problema = problemasData[pid];
        if (problema) {
          problemasContagem[problema.nome] = (problemasContagem[problema.nome] || 0) + 1;
        }
      });
    }
  });
  
  const problemasChartData = Object.entries(problemasContagem).map(([nome, count]) => ({
    nome,
    quantidade: count
  })).sort((a, b) => b.quantidade - a.quantidade);
  
  // Problemas por Regional
  const problemasPorRegional = regionais.map(regional => {
    const osRegional = ordensComProblemas.filter(os => os.regional_id === regional.id);
    return {
      sigla: regional.sigla,
      quantidade: osRegional.length
    };
  }).filter(d => d.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade);
  
  // Status de resolução dos problemas
  const problemasSolucionados = ordensComProblemas.filter(os => os.data_solucao).length;
  const problemasAbertos = totalProblemas - problemasSolucionados;
  
  const statusData = [
    { nome: 'Solucionados', valor: problemasSolucionados, fill: '#10B981' },
    { nome: 'Abertos', valor: problemasAbertos, fill: '#EF4444' }
  ];
  
  const COLORS = ['#0000FF', '#FF6B00', '#10B981', '#A0B4D2', '#EC4899', '#6366F1'];

  return (
    <div className="space-y-8">
      {/* KPIs de Problemas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Total de Problemas</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalProblemas}</p>
            <p className="text-xs text-slate-400 mt-1">OS com problemas registrados</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#10B981' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Solucionados</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{problemasSolucionados}</p>
            <p className="text-xs text-slate-400 mt-1">{totalProblemas > 0 ? ((problemasSolucionados / totalProblemas) * 100).toFixed(0) : 0}% dos problemas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: '#FF6B00' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Abertos</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{problemasAbertos}</p>
            <p className="text-xs text-slate-400 mt-1">Aguardando solução</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problemas por Tipo */}
        {problemasChartData.length > 0 && (
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Tipos de Problemas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={problemasChartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="quantidade" fill="#0000FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {/* Status dos Problemas */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status dos Problemas</CardTitle>
          </CardHeader>
          <CardContent>
            {totalProblemas === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400">
                Sem problemas registrados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="valor"
                    label={({ nome, valor, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Problemas por Regional */}
      {problemasPorRegional.length > 0 && (
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Problemas por Regional</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={problemasPorRegional} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sigla" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="quantidade" fill="#FF6B00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}