import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const statusColors = {
  elaboracao: '#64748b',
  execucao: '#0000FF',
  atrasado: '#ef4444',
  concluido: '#10b981'
};

const statusLabels = {
  elaboracao: 'Em Elaboração',
  execucao: 'Em Execução',
  atrasado: 'Atrasado',
  concluido: 'Concluído'
};

const CustomAxisTick = ({ x, y, payload, pessoas }) => {
  const nomeAtendente = payload.value;
  // Tenta encontrar a pessoa pelo nome para exibir a foto
  const pessoa = pessoas.find(p => p.nome === nomeAtendente || nomeAtendente?.startsWith(p.nome));
  const inicial = nomeAtendente?.charAt(0) || '?';

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-20} y={0} width={40} height={40}>
        <div className="flex items-center justify-center" title={nomeAtendente}>
          <Avatar className="w-8 h-8 border-2 border-white shadow-md">
            {pessoa?.foto_perfil ? (
              <AvatarImage src={pessoa.foto_perfil} alt={nomeAtendente} />
            ) : (
              <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                {inicial}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </foreignObject>
    </g>
  );
};

export default function OSPorAtendenteChart({ ordens, pessoas }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(ordens)) return [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const grupos = {};

    ordens.forEach(os => {
      const atendente = os.atendente_nome?.trim();
      if (!atendente) return;

      if (!grupos[atendente]) {
        grupos[atendente] = {
          pessoa_id: atendente,
          elaboracao: 0,
          execucao: 0,
          atrasado: 0,
          concluido: 0
        };
      }

      const estaAtrasado = os.status !== 'concluido' && os.prazo && new Date(os.prazo) < hoje;

      if (estaAtrasado) {
        grupos[atendente].atrasado++;
      } else if (os.status === 'elaboracao') {
        grupos[atendente].elaboracao++;
      } else if (os.status === 'execucao') {
        grupos[atendente].execucao++;
      } else if (os.status === 'concluido') {
        grupos[atendente].concluido++;
      }
    });

    return Object.values(grupos)
      .map(g => ({ ...g, total: g.elaboracao + g.execucao + g.atrasado + g.concluido }))
      .filter(g => g.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
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
          tick={<CustomAxisTick pessoas={pessoas} />}
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