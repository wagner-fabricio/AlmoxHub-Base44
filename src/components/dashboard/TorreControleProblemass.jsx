import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function TorreControleProblemas({ 
  filteredOrdens, 
  categorias, 
  regionais, 
  problemasRecebimento 
}) {
  const categoriaRecebimento = categorias.find(c => c.nome?.toLowerCase().includes('recebimento'));

  if (!categoriaRecebimento) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        Categoria Recebimento não encontrada
      </div>
    );
  }

  const osRecebimento = filteredOrdens.filter(os => 
    os.categoria_id === categoriaRecebimento.id && 
    os.problemas_recebimento_ids?.length > 0
  );

  if (osRecebimento.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        Sem problemas de recebimento registrados
      </div>
    );
  }

  // Mapear problemas por regional
  const problemasData = problemasRecebimento.map(problema => {
    const resultado = {
      name: problema.descricao_resumida,
      total: 0
    };

    // Contar por regional
    regionais.forEach(regional => {
      const count = osRecebimento.filter(os => 
        os.regional_id === regional.id &&
        os.problemas_recebimento_ids?.includes(problema.id)
      ).length;

      if (count > 0) {
        resultado[regional.sigla] = count;
        resultado.total += count;
      }
    });

    return resultado;
  }).filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total);

  if (problemasData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        Sem problemas de recebimento registrados
      </div>
    );
  }

  // Cores para regionais
  const regionaisColors = ['#0000FF', '#FF6B00', '#10b981', '#A0B4D2', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
  const regionaisAtivas = regionais.filter(r => 
    problemasData.some(p => p[r.sigla] > 0)
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" style={{ color: '#A0B4D2' }} />
        Problemas Recebimento
      </h2>
      <Card className="bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Problemas por Regional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(400, problemasData.length * 60)}>
            <BarChart data={problemasData} layout="vertical" margin={{ top: 10, right: 30, left: 150, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                width={140}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />

              {regionaisAtivas.map((regional, index) => (
                <Bar 
                  key={regional.id}
                  dataKey={regional.sigla}
                  stackId="regional"
                  fill={regionaisColors[index % regionaisColors.length]}
                  radius={index === regionaisAtivas.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}