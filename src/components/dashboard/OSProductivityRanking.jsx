import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp, Target, Medal } from 'lucide-react';

export default function OSProductivityRanking({ ordens, pessoas }) {
  // Calcular métricas por pessoa (executor)
  const rankingData = useMemo(() => {
    const pessoasMap = new Map();

    // Agrupar OS por executores_ids
    ordens.forEach(os => {
      if (!os.executores_ids?.length) return;
      
      os.executores_ids.forEach(executorId => {
        if (!pessoasMap.has(executorId)) {
          pessoasMap.set(executorId, {
            totalOS: 0,
            concluidas: 0,
            emExecucao: 0
          });
        }
        
        const metrics = pessoasMap.get(executorId);
        metrics.totalOS += 1;
        if (os.status === 'concluido') metrics.concluidas += 1;
        if (os.status === 'execucao') metrics.emExecucao += 1;
      });
    });

    // Criar ranking com dados das pessoas
    const ranking = Array.from(pessoasMap.entries())
      .map(([pessoaId, metrics]) => {
        const pessoa = pessoas.find(p => p.id === pessoaId);
        if (!pessoa) return null;

        const taxaConclusao = metrics.totalOS > 0 
          ? Math.round((metrics.concluidas / metrics.totalOS) * 100) 
          : 0;

        return {
          id: pessoaId,
          nome: pessoa.nome || 'Sem nome',
          foto: pessoa.foto_perfil,
          totalOS: metrics.totalOS,
          concluidas: metrics.concluidas,
          emExecucao: metrics.emExecucao,
          taxaConclusao
        };
      })
      .filter(p => p !== null)
      .sort((a, b) => b.totalOS - a.totalOS);

    return ranking;
  }, [ordens, pessoas]);

  // Top 3 para diferentes métricas
  const topTotalOS = rankingData[0];
  const topConcluidas = [...rankingData].sort((a, b) => b.concluidas - a.concluidas)[0];
  const topTaxaConclusao = [...rankingData].sort((a, b) => b.taxaConclusao - a.taxaConclusao)[0];

  // Calcular percentual do total para os top 3
  const totalGeralOS = ordens.length;
  const totalGeralConcluidas = ordens.filter(os => os.status === 'concluido').length;

  const podiumRanking = rankingData.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header com métricas Top #3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de OS Top #3 */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total de OS Top #3</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{topTotalOS?.totalOS || 0}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {topTotalOS && totalGeralOS > 0 ? Math.round((topTotalOS.totalOS / totalGeralOS) * 100) : 0}% do Total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OS Concluídas Top #3 */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">OS Concluídas Top #3</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{topConcluidas?.concluidas || 0}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {topConcluidas && totalGeralConcluidas > 0 ? Math.round((topConcluidas.concluidas / totalGeralConcluidas) * 100) : 0}% do Total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conclusão Top #3 */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)' }}>
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Taxa Conclusão Top #3</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{topTaxaConclusao?.taxaConclusao || 0}%</p>
                <p className="text-xs text-slate-400 mt-1">
                  {topTaxaConclusao?.taxaConclusao || 0}% das OS concluídas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área principal com pódio e tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pódio dos 3 primeiros */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-100 dark:border-slate-700/50 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-500" />
                Top 3 Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-4 h-[400px] pb-8">
                {/* 2º Lugar */}
                {podiumRanking[1] && (
                  <div className="flex flex-col items-center" style={{ marginBottom: '40px' }}>
                    <div className="relative mb-3">
                      <Avatar style={{ width: '80px', height: '80px', borderWidth: '4px', borderColor: '#A0B4D2' }}>
                        <AvatarImage src={podiumRanking[1].foto} />
                        <AvatarFallback className="text-white font-bold text-xl" style={{ background: '#A0B4D2' }}>
                          {podiumRanking[1].nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg" style={{ background: '#A0B4D2' }}>
                        2
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white text-center mb-2 max-w-[100px] truncate">
                      {podiumRanking[1].nome.split(' ')[0]}
                    </p>
                    <div className="w-24 rounded-t-2xl flex flex-col items-center justify-end p-4" style={{ height: '120px', background: 'linear-gradient(135deg, #A0B4D2 0%, #7A95BA 100%)' }}>
                      <p className="text-3xl font-bold text-white mb-1">{podiumRanking[1].totalOS}</p>
                      <p className="text-xs text-white/80">OS</p>
                    </div>
                  </div>
                )}

                {/* 1º Lugar */}
                {podiumRanking[0] && (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <Avatar style={{ width: '96px', height: '96px', borderWidth: '4px', borderColor: '#fbbf24' }}>
                        <AvatarImage src={podiumRanking[0].foto} />
                        <AvatarFallback className="bg-amber-400 text-white font-bold text-2xl">
                          {podiumRanking[0].nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Trophy className="w-8 h-8 text-amber-400 drop-shadow-lg" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        1
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white text-center mb-2 max-w-[110px] truncate">
                      {podiumRanking[0].nome.split(' ')[0]}
                    </p>
                    <div className="w-28 rounded-t-2xl flex flex-col items-center justify-end p-4" style={{ height: '180px', background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
                      <Trophy className="w-10 h-10 text-amber-400 mb-2" />
                      <p className="text-4xl font-bold text-white mb-1">{podiumRanking[0].totalOS}</p>
                      <p className="text-xs text-white/80">OS</p>
                    </div>
                  </div>
                )}

                {/* 3º Lugar */}
                {podiumRanking[2] && (
                  <div className="flex flex-col items-center" style={{ marginBottom: '80px' }}>
                    <div className="relative mb-3">
                      <Avatar style={{ width: '72px', height: '72px', borderWidth: '4px', borderColor: '#FF6B00' }}>
                        <AvatarImage src={podiumRanking[2].foto} />
                        <AvatarFallback className="text-white font-bold text-lg" style={{ background: '#FF6B00' }}>
                          {podiumRanking[2].nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ background: '#FF6B00' }}>
                        3
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white text-center mb-2 max-w-[90px] truncate">
                      {podiumRanking[2].nome.split(' ')[0]}
                    </p>
                    <div className="w-20 rounded-t-2xl flex flex-col items-center justify-end p-3" style={{ height: '80px', background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)' }}>
                      <p className="text-2xl font-bold text-white mb-1">{podiumRanking[2].totalOS}</p>
                      <p className="text-xs text-white/80">OS</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de ranking completo */}
        <div className="lg:col-span-3">
          <Card className="bg-white dark:bg-slate-800 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Ranking de Executores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
                    <tr>
                      <th className="text-left py-3 px-4 text-white text-sm font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 text-white text-sm font-semibold">Executor</th>
                      <th className="text-right py-3 px-4 text-white text-sm font-semibold">Total OS</th>
                      <th className="text-right py-3 px-4 text-white text-sm font-semibold hidden sm:table-cell">Concluídas</th>
                      <th className="text-right py-3 px-4 text-white text-sm font-semibold hidden md:table-cell">Em Execução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingData.map((pessoa, index) => (
                      <tr 
                        key={pessoa.id} 
                        className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {index < 3 ? (
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ 
                                  background: index === 0 ? 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' : 
                                            index === 1 ? 'linear-gradient(135deg, #A0B4D2 0%, #7A95BA 100%)' : 
                                            'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)'
                                }}
                              >
                                {index + 1}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold text-sm">
                                {index + 1}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                              <AvatarImage src={pessoa.foto} />
                              <AvatarFallback className="text-sm">
                                {pessoa.nome.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-900 dark:text-white text-sm">
                              {pessoa.nome}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-lg" style={{ color: '#0000FF' }}>
                            {pessoa.totalOS}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden sm:table-cell">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {pessoa.concluidas}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            {pessoa.emExecucao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rankingData.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p>Nenhum dado de produtividade disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}