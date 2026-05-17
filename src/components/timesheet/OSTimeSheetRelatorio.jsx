import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatarTempo } from './TimeSheetButton';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, ChevronDown } from 'lucide-react';

export default function OSTimeSheetRelatorio({ pessoas: pessoasProp, categorias: categoriasProp, subcategorias: subcategoriasProp, almoxarifados: almoxarifadosProp, ordens, filters }) {
  const [entries, setEntries] = useState([]);
  const [ordensFaltantes, setOrdensFaltantes] = useState([]);
  const [pessoasFull, setPessoasFull] = useState(null);
  const [categoriasFull, setCategoriasFull] = useState(null);
  const [subcategoriasFull, setSubcategoriasFull] = useState(null);
  const [almoxarifadosFull, setAlmoxarifadosFull] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar listas de referência completas (props podem vir truncadas pelo limite padrão)
  useEffect(() => {
    Promise.all([
      base44.entities.Pessoa.list('-created_date', 5000),
      base44.entities.Categoria.list('-created_date', 1000),
      base44.entities.Subcategoria.list('-created_date', 1000),
      base44.entities.Almoxarifado.list('-created_date', 1000),
    ]).then(([p, c, s, a]) => {
      setPessoasFull(p || []);
      setCategoriasFull(c || []);
      setSubcategoriasFull(s || []);
      setAlmoxarifadosFull(a || []);
    }).catch(err => console.error('Erro ao carregar listas de referência:', err));
  }, []);

  const pessoas = pessoasFull || pessoasProp;
  const categorias = categoriasFull || categoriasProp;
  const subcategorias = subcategoriasFull || subcategoriasProp;
  const almoxarifados = almoxarifadosFull || almoxarifadosProp;

  // Derivar período dos filtros principais
  const periodo = filters?.periodo || 'all';

  useEffect(() => {
    carregarEntries();
  }, [periodo, filters?.dataInicio, filters?.dataFim]);

  const carregarEntries = async () => {
    setLoading(true);
    try {
      const agora = new Date();
      let dataInicio = null;
      let dataFim = null;

      if (periodo === 'hoje') {
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
      } else if (periodo === '7') {
        const d = new Date(agora); d.setDate(d.getDate() - 7);
        dataInicio = d.toISOString();
      } else if (periodo === '30') {
        const d = new Date(agora); d.setDate(d.getDate() - 30);
        dataInicio = d.toISOString();
      } else if (periodo === '90') {
        const d = new Date(agora); d.setDate(d.getDate() - 90);
        dataInicio = d.toISOString();
      } else if (periodo === 'mes_atual') {
        dataInicio = startOfMonth(agora).toISOString();
      } else if (periodo === 'customizado') {
        if (filters?.dataInicio) dataInicio = new Date(filters.dataInicio).toISOString();
        if (filters?.dataFim) { const d = new Date(filters.dataFim); d.setHours(23,59,59,999); dataFim = d.toISOString(); }
      }

      const data = await base44.entities.TimeSheetEntry.filter({ status: 'closed' }, '-inicio', 500);
      let filtered = data || [];
      if (dataInicio) filtered = filtered.filter(e => e.inicio >= dataInicio);
      if (dataFim) filtered = filtered.filter(e => e.inicio <= dataFim);

      setEntries(filtered);

      // Buscar OS que não estão na lista paginada da página pai
      // Em lotes para evitar sobrecarregar a API (centenas de requisições paralelas falham silenciosamente)
      const idsOrdensProp = new Set((ordens || []).map(o => o.id));
      const idsFaltando = [...new Set(filtered.map(e => e.os_id).filter(id => id && !idsOrdensProp.has(id)))];
      if (idsFaltando.length > 0) {
        const BATCH_SIZE = 20;
        const encontradas = [];
        for (let i = 0; i < idsFaltando.length; i += BATCH_SIZE) {
          const lote = idsFaltando.slice(i, i + BATCH_SIZE);
          const buscas = await Promise.all(
            lote.map(id => base44.entities.OrdemServico.get(id).catch(() => null))
          );
          encontradas.push(...buscas.filter(Boolean));
        }
        setOrdensFaltantes(encontradas);
      } else {
        setOrdensFaltantes([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lista combinada: ordens da prop + ordens buscadas individualmente
  const ordensCompletas = [...(ordens || []), ...ordensFaltantes];

  // Aplicar filtros principais nas entries/OS
  const pessoaFiltroId = filters?.pessoa_id || '';
  const searchLower = filters?.search?.toLowerCase() || '';

  const entriesFiltradas = entries.filter(e => {
    if (pessoaFiltroId && e.pessoa_id !== pessoaFiltroId) return false;
    return true;
  });

  // Detectar se há filtros de OS ativos. Se houver, OS não encontradas devem ser descartadas
  // (não podemos validar o filtro contra a OS) ao invés de aparecerem como linhas vazias.
  const temFiltrosDeOS = !!(
    (filters?.regional && filters.regional !== 'all') ||
    (filters?.almoxarifado && filters.almoxarifado !== 'all') ||
    (filters?.categorias?.length > 0) ||
    (filters?.statusList?.length > 0) ||
    (filters?.status && filters.status !== 'all') ||
    searchLower
  );

  // Consolidar por OS, aplicando filtros de regional/almoxarifado/categoria/busca
  const porOS = {};
  for (const e of entriesFiltradas) {
    if (!porOS[e.os_id]) {
      const os = ordensCompletas.find(o => o.id === e.os_id);
      // Se há filtros de OS e não achamos a OS, descartar (não temos como validar)
      if (!os && temFiltrosDeOS) continue;
      // Aplicar filtros de OS
      if (os) {
        if (filters?.regional && filters.regional !== 'all' && os.regional_id !== filters.regional) continue;
        if (filters?.almoxarifado && filters.almoxarifado !== 'all' && os.almoxarifado_id !== filters.almoxarifado) continue;
        if (filters?.categorias?.length > 0 && !filters.categorias.includes(os.categoria_id)) continue;
        if (filters?.statusList?.length > 0 && !filters.statusList.includes(os.status)) continue;
        if (filters?.status && filters.status !== 'all' && os.status !== filters.status) continue;
        if (searchLower && !os.codigo?.toLowerCase().includes(searchLower) && !os.descricao_resumida?.toLowerCase().includes(searchLower)) continue;
      }
      porOS[e.os_id] = { os_id: e.os_id, os_codigo: e.os_codigo, os, total_minutos: 0, sessoes: 0, pessoas: new Set() };
    }
    porOS[e.os_id].total_minutos += e.duracao_minutos || 0;
    porOS[e.os_id].sessoes += 1;
    porOS[e.os_id].pessoas.add(e.pessoa_nome);
  }

  const listaOS = Object.values(porOS).sort((a, b) => b.total_minutos - a.total_minutos);
  const totalGeral = Object.values(porOS).reduce((s, item) => s + item.total_minutos, 0);
  const totalSessoes = Object.values(porOS).reduce((s, item) => s + item.sessoes, 0);

  return (
    <div className="space-y-5">
      {/* Totalizador */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Clock className="w-4 h-4" />
        <span>Total: <strong className="text-slate-900 dark:text-white">{formatarTempo(totalGeral)}</strong></span>
        <span className="text-slate-400">|</span>
        <span>{listaOS.length} OS · {totalSessoes} sessões</span>
      </div>

      {/* Tabela consolidada por OS */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : listaOS.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum registro encontrado para o período selecionado</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">OS</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Descrição</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Categoria</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Subcategoria</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Almoxarifado</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Líder</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Executores</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Sessões</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600">Tempo total</th>
              </tr>
            </thead>
            <tbody>
              {listaOS.map((item, idx) => {
                const os = item.os;
                const cat = os ? (categorias || []).find(c => c.id === os.categoria_id) : null;
                const subcats = os ? (subcategorias || []).filter(s => (os.subcategorias_ids || []).includes(s.id)) : [];
                const almox = os ? (almoxarifados || []).find(a => a.id === os.almoxarifado_id) : null;
                const lider = os ? (pessoas || []).find(p => p.id === os.lider_id) : null;
                const executores = os ? (pessoas || []).filter(p => (os.executores_ids || []).includes(p.id)) : [];
                return (
                  <tr key={item.os_id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-700/20' : ''}`}>
                    <td className="px-3 py-2 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{item.os_codigo || item.os_id}</td>
                    <td className="px-3 py-2 max-w-[160px] truncate text-slate-600 dark:text-slate-400" title={os?.descricao_resumida}>{os?.descricao_resumida || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">{cat?.nome || '—'}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate text-slate-600 dark:text-slate-400">{subcats.length ? subcats.map(s => s.nome).join(', ') : '—'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{almox?.nome || '—'}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">{lider?.nome?.split(' ')[0] || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {executores.length ? executores.map(e => (
                          <span key={e.id} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs">{e.nome.split(' ')[0]}</span>
                        )) : <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">{item.sessoes}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatarTempo(item.total_minutos)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
              <tr>
                <td colSpan={8} className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">Total geral:</td>
                <td className="px-3 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">{formatarTempo(totalGeral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Detalhe por sessão */}
      {entriesFiltradas.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-2">
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            Ver sessões individuais ({entriesFiltradas.length})
          </summary>
          <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">OS</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Pessoa (início)</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Início</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Fim</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Pausado por</th>
                  <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">Duração</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {entriesFiltradas.map(e => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-mono">{e.os_codigo || e.os_id}</td>
                    <td className="p-3">{e.pessoa_nome}</td>
                    <td className="p-3 text-slate-500">{e.inicio ? format(new Date(e.inicio), 'dd/MM HH:mm', { locale: ptBR }) : '-'}</td>
                    <td className="p-3 text-slate-500">{e.fim ? format(new Date(e.fim), 'dd/MM HH:mm', { locale: ptBR }) : '-'}</td>
                    <td className="p-3">{e.pessoa_nome_pausa || '-'}</td>
                    <td className="p-3 text-right font-medium">{formatarTempo(e.duracao_minutos)}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        e.tipo_encerramento === 'auto_fim_expediente' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        e.tipo_encerramento === 'stop' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        e.tipo_encerramento === 'auto_edicao' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {e.tipo_encerramento === 'auto_fim_expediente' ? 'Auto 18h' :
                         e.tipo_encerramento === 'stop' ? 'Stop' :
                         e.tipo_encerramento === 'auto_edicao' ? 'Edição' : 'Pause'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}