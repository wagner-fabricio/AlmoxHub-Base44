import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TorreControleRecebimentoProblemas({
  filteredOrdens,
  regionais,
  problemasRecebimento
}) {
  // Filtrar OS com problemas de recebimento
  const ordensComProblemas = filteredOrdens.filter(os => os.problema_recebimento === true);
  
  // DEBUG
  console.log('=== TorreControleRecebimentoProblemas DEBUG ===');
  console.log('Total de ordens filtradas:', filteredOrdens.length);
  console.log('Ordens com problema_recebimento === true:', ordensComProblemas.length);
  console.log('Problemas Recebimento cadastrados:', problemasRecebimento.length);
  if (ordensComProblemas.length > 0) {
    console.log('Amostra de problemas_recebimento_ids:', ordensComProblemas.slice(0, 3).map(os => ({
      codigo: os.codigo,
      problema_recebimento: os.problema_recebimento,
      problemas_recebimento_ids: os.problemas_recebimento_ids
    })));
  }
  if (problemasRecebimento.length > 0) {
    console.log('Problemas disponíveis:', problemasRecebimento.slice(0, 3).map(p => ({
      id: p.id,
      nome: p.nome
    })));
  }
  
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
        if (problema && problema.nome) {
          problemasContagem[problema.nome] = (problemasContagem[problema.nome] || 0) + 1;
        }
      });
    }
  });
  
  // Converter para array e ordenar por quantidade
  const problemasChartData = Object.entries(problemasContagem)
    .filter(([nome]) => nome && nome !== 'undefined')
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  const totalProblemasMarcados = problemasChartData.reduce((sum, p) => sum + p.quantidade, 0);

  // Gerar cores que variam de verde claro a verde escuro
  const getGradientColor = (index, total) => {
    const hue = 152; // Verde
    const saturation = 70;
    const lightness = 80 - (index / total) * 50; // Varia de 80% a 30%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <Card className="bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ranking de Principais Problemas de Regularização</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Principais Causas de Atraso na Regularização</p>
      </CardHeader>
      <CardContent>
        {problemasChartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-slate-400">
            Sem problemas registrados
          </div>
        ) : (
          <div className="space-y-3">
            {problemasChartData.map((problema, index) => {
              const percentual = totalProblemasMarcados > 0 
                ? ((problema.quantidade / totalProblemasMarcados) * 100).toFixed(0)
                : 0;
              const maxWidth = Math.max(...problemasChartData.map(p => p.quantidade));
              const barWidth = (problema.quantidade / maxWidth) * 100;
              const barColor = getGradientColor(index, problemasChartData.length);

              return (
                <div key={problema.nome} className="flex items-center gap-4 py-2">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {problema.nome}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: barColor
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {problema.quantidade} ({percentual}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}