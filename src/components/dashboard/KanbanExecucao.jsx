import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { differenceInDays, parseISO } from 'date-fns';

export default function KanbanExecucao({ ordens = [] }) {
  // Filtrar apenas OS em aberto (elaboracao e execucao)
  const osAbertas = ordens.filter(os => 
    (os.status === 'elaboracao' || os.status === 'execucao') && os.prazo
  );

  // Função para calcular a categoria de prazo
  const getPrazoCategory = (os) => {
    if (!os.prazo) return null;
    
    const hoje = new Date();
    const prazo = new Date(os.prazo);
    const diasAteoPrazo = differenceInDays(prazo, hoje);

    if (diasAteoPrazo > 1) {
      return 'noPrazo';
    } else if (diasAteoPrazo >= 0 && diasAteoPrazo <= 1) {
      return 'ate1Dia';
    } else {
      return 'foraDoPrazo';
    }
  };

  // Agrupar OS por status e categoria de prazo
  const dados = [
    {
      status: 'elaboracao',
      label: 'Em Elaboração',
      noPrazo: 0,
      ate1Dia: 0,
      foraDoPrazo: 0,
      total: 0
    },
    {
      status: 'execucao',
      label: 'Em Execução',
      noPrazo: 0,
      ate1Dia: 0,
      foraDoPrazo: 0,
      total: 0
    }
  ];

  osAbertas.forEach(os => {
    const categoria = getPrazoCategory(os);
    const linha = dados.find(d => d.status === os.status);
    
    if (linha && categoria) {
      if (categoria === 'noPrazo') linha.noPrazo++;
      else if (categoria === 'ate1Dia') linha.ate1Dia++;
      else if (categoria === 'foraDoPrazo') linha.foraDoPrazo++;
      
      linha.total++;
    }
  });

  return (
    <Card className="bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Kanban de Execução</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  No Prazo
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  Até 1 dia do Prazo
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  Fora do Prazo
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  Total Geral
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.map((linha, index) => (
                <tr 
                  key={index} 
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                >
                  <td className="py-4 px-4 font-medium text-slate-900 dark:text-slate-100">
                    {linha.label}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-block px-4 py-2 rounded font-bold text-white" style={{ backgroundColor: '#4A90A4' }}>
                      {linha.noPrazo}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-block px-4 py-2 rounded font-bold text-white" style={{ backgroundColor: '#D4A500' }}>
                      {linha.ate1Dia}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-block px-4 py-2 rounded font-bold text-white" style={{ backgroundColor: '#C85A4A' }}>
                      {linha.foraDoPrazo}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-block px-4 py-2 rounded font-bold text-white" style={{ backgroundColor: '#666666' }}>
                      {linha.total}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}