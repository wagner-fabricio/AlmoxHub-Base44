import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusColors = {
  elaboracao: '#64748b',
  execucao: '#0000FF',
  atrasado: '#ef4444',
  concluido: '#10b981'
};

const statusLabels = {
  elaboracao: 'Não Iniciada',
  execucao: 'Em Andamento',
  atrasado: 'Atrasado',
  concluido: 'Concluído'
};

const CustomAxisTick = ({ x, y, payload, pessoas, regionais, almoxarifados }) => {
  const pessoa = pessoas.find(p => p.id === payload.value);
  const regional = regionais.find(r => r.id === pessoa?.regional_id);
  const almoxarifadosList = almoxarifados.filter(a => pessoa?.almoxarifados_ids?.includes(a.id));
  
  if (!pessoa) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <UITooltip>
        <TooltipTrigger asChild>
          <g transform={`translate(${x},${y})`}>
            <foreignObject x={-20} y={0} width={40} height={40}>
              <div className="flex items-center justify-center">
                <Avatar className="w-8 h-8 border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                  {pessoa.foto_perfil ? (
                    <AvatarImage src={pessoa.foto_perfil} alt={pessoa.nome} />
                  ) : (
                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {pessoa.nome?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </foreignObject>
          </g>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-white dark:bg-slate-800 border shadow-lg p-3">
          <div className="space-y-1">
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{pessoa.nome}</p>
            {regional && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">Regional:</span> {regional.sigla}
              </p>
            )}
            {almoxarifadosList.length > 0 && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">Almoxarifado:</span> {almoxarifadosList.map(a => a.nome).join(', ')}
              </p>
            )}
          </div>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
};

export default function OSPorPessoaChart({ ordens, pessoas, regionais, almoxarifados }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(ordens) || !Array.isArray(pessoas)) return [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Agrupar por pessoa (lider_id)
    const grupos = {};
    
    ordens.forEach(os => {
      if (os.lider_id) {
        if (!grupos[os.lider_id]) {
          grupos[os.lider_id] = {
            pessoa_id: os.lider_id,
            elaboracao: 0,
            execucao: 0,
            atrasado: 0,
            concluido: 0
          };
        }

        // Verificar se está atrasado
        const estaAtrasado = os.status !== 'concluido' && os.prazo && new Date(os.prazo) < hoje;

        if (estaAtrasado) {
          grupos[os.lider_id].atrasado++;
        } else if (os.status === 'elaboracao') {
          grupos[os.lider_id].elaboracao++;
        } else if (os.status === 'execucao') {
          grupos[os.lider_id].execucao++;
        } else if (os.status === 'concluido') {
          grupos[os.lider_id].concluido++;
        }
      }
    });

    // Converter para array e ordenar por total de OSs
    return Object.values(grupos)
      .map(g => ({
        ...g,
        total: g.elaboracao + g.execucao + g.atrasado + g.concluido
      }))
      .filter(g => g.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 pessoas com mais OSs
  }, [ordens, pessoas]);

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="pessoa_id" 
          tick={<CustomAxisTick pessoas={pessoas} regionais={regionais} almoxarifados={almoxarifados} />}
          interval={0}
          height={60}
        />
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
        <Bar dataKey="elaboracao" stackId="a" fill={statusColors.elaboracao} />
        <Bar dataKey="execucao" stackId="a" fill={statusColors.execucao} />
        <Bar dataKey="atrasado" stackId="a" fill={statusColors.atrasado} />
        <Bar dataKey="concluido" stackId="a" fill={statusColors.concluido} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}