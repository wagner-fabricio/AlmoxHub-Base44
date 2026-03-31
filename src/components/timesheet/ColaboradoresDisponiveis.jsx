import React from 'react';
import { UserCheck } from 'lucide-react';

const funcaoLabels = {
  gestor: 'Gestor',
  lider: 'Líder',
  almoxarife: 'Almoxarife',
};

export default function ColaboradoresDisponiveis({ pessoas, regionais, almoxarifados, pessoasEmSessao, filters }) {
  // Filtrar colaboradores disponíveis:
  // - ativo === true
  // - status_aprovacao === 'aprovado'
  // - sem função 'gestor' (único)
  // - sem sessão ativa no momento
  const disponiveis = (pessoas || []).filter(p => {
    if (!p) return false;
    if (!p.ativo) return false;
    if (p.status_aprovacao !== 'aprovado') return false;
    // Excluir quem tem APENAS função gestor (ou seja, gestores)
    const funcoes = p.funcoes || [];
    if (funcoes.length === 1 && funcoes[0] === 'gestor') return false;
    if (funcoes.length === 0) return false; // sem função definida, pular
    // Excluir quem está em sessão ativa
    if (pessoasEmSessao.has(p.id)) return false;

    // Respeitar filtro de regional
    if (filters?.regional && filters.regional !== 'all') {
      if (p.regional_id !== filters.regional) return false;
    }

    // Respeitar filtro de almoxarifado
    if (filters?.almoxarifado && filters.almoxarifado !== 'all') {
      if (!(p.almoxarifados_ids || []).includes(filters.almoxarifado)) return false;
    }

    // Respeitar filtro de pessoa específica
    if (filters?.pessoa_id) {
      if (p.id !== filters.pessoa_id) return false;
    }

    return true;
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  if (disponiveis.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-green-500" />
          Colaboradores Disponíveis
        </h3>
        <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold rounded-full">
          {disponiveis.length} disponível{disponiveis.length !== 1 ? 'is' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
              <th className="px-4 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left">Colaborador</th>
              <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-28">Matrícula</th>
              <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-36">Funções</th>
              <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-24">Regional</th>
              <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left">Almoxarifados</th>
              <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-28">Perfil</th>
            </tr>
          </thead>
          <tbody>
            {disponiveis.map((p, idx) => {
              const regional = (regionais || []).find(r => r.id === p.regional_id);
              const almoxsNomes = (almoxarifados || [])
                .filter(a => (p.almoxarifados_ids || []).includes(a.id))
                .map(a => a.nome);
              const funcoesFiltradas = (p.funcoes || []).filter(f => f !== 'gestor');

              return (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-700/20' : ''}`}
                >
                  {/* Avatar + Nome */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {p.foto_perfil ? (
                        <img src={p.foto_perfil} alt={p.nome} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {p.nome?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">{p.nome}</p>
                        {p.email && <p className="text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{p.email}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Matrícula */}
                  <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {p.matricula || '—'}
                  </td>

                  {/* Funções */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {funcoesFiltradas.length > 0 ? funcoesFiltradas.map(f => (
                        <span key={f} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {funcaoLabels[f] || f}
                        </span>
                      )) : <span className="text-slate-400">—</span>}
                    </div>
                  </td>

                  {/* Regional */}
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {regional?.sigla || '—'}
                  </td>

                  {/* Almoxarifados */}
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                    {almoxsNomes.length > 0
                      ? almoxsNomes.join(', ')
                      : '—'}
                  </td>

                  {/* Perfil (funcao livre) */}
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {p.funcao || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}