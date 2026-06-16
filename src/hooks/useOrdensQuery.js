import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const ORDENS_QUERY_KEY = ['ordens'];
export const ORDENS_FILTRADAS_KEY = 'ordens-filtradas';

// Busca global (sem filtros) — usada pelo AppContext para Dashboard, Torre de Controle etc.
// O SDK Base44 limita a 5000 registros por chamada. Paginamos para buscar todos.
async function fetchOrdensGlobal() {
  const PAGE = 5000;
  const MAX_TOTAL = 50000; // teto de segurança
  const all = [];
  let skip = 0;
  while (skip < MAX_TOTAL) {
    const batch = await base44.entities.OrdemServico.list('-created_date', PAGE, skip);
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < PAGE) break; // última página
    skip += PAGE;
  }
  return all;
}

// Busca todas as OS atribuídas a uma pessoa (líder OU executor), paginando o backend.
// O backend não consegue fazer OR entre líder/executor numa única query, então fazemos 2 buscas e unimos.
async function fetchOrdensAtribuidas(pessoaId) {
  const PAGE = 5000;
  const MAX_TOTAL = 50000;
  const buscarTudo = async (filter) => {
    const acc = [];
    let s = 0;
    while (s < MAX_TOTAL) {
      const batch = await base44.entities.OrdemServico.filter(filter, '-created_date', PAGE, s);
      if (!batch || batch.length === 0) break;
      acc.push(...batch);
      if (batch.length < PAGE) break;
      s += PAGE;
    }
    return acc;
  };
  const [comoLider, comoExecutor] = await Promise.all([
    buscarTudo({ lider_id: pessoaId }),
    buscarTudo({ executores_ids: pessoaId }),
  ]);
  const ids = new Set();
  const merged = [];
  for (const os of [...comoLider, ...comoExecutor]) {
    if (!ids.has(os.id)) { ids.add(os.id); merged.push(os); }
  }
  return merged;
}

// Busca filtrada e paginada — usada pela página OrdensServico
async function fetchOrdensFiltradas({ queryKey }) {
  const [, filtros] = queryKey;
  const { backendFilter = {}, sort = '-created_date', limit = 100, page = 1, textSearch = {}, atribuidasPessoaId } = filtros || {};
  const skip = (page - 1) * limit;

  // Visão "Atribuídas a Mim" — buscar todas as OS onde a pessoa é líder ou executor
  if (atribuidasPessoaId) {
    return fetchOrdensAtribuidas(atribuidasPessoaId);
  }

  // Quando há busca de texto (código/MIGO/reserva), varremos todo o dataset
  // paginando para garantir que OS antigas apareçam — filtro de texto é client-side
  // mas só é eficaz se carregarmos todos os registros relevantes.
  const { search, migo, reserva, codigoMaterial } = textSearch;
  const hasTextSearch = !!(search || migo || reserva || codigoMaterial);

  // Construir filtro para o backend
  const filter = {};
  if (backendFilter.status && backendFilter.status !== 'all') filter.status = backendFilter.status;
  if (backendFilter.regional_id) filter.regional_id = backendFilter.regional_id;
  if (backendFilter.almoxarifado_id) filter.almoxarifado_id = backendFilter.almoxarifado_id;
  if (backendFilter.categoria_id) filter.categoria_id = backendFilter.categoria_id;

  const hasFilter = Object.keys(filter).length > 0;

  // Se houver busca de texto, carregamos TODOS os registros (paginando o backend)
  // para que o filtro client-side encontre OS antigas.
  if (hasTextSearch) {
    const PAGE = 5000;
    const MAX_TOTAL = 50000;
    const all = [];
    let s = 0;
    while (s < MAX_TOTAL) {
      const batch = hasFilter
        ? await base44.entities.OrdemServico.filter(filter, sort, PAGE, s)
        : await base44.entities.OrdemServico.list(sort, PAGE, s);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < PAGE) break;
      s += PAGE;
    }
    return all;
  }

  if (hasFilter) {
    return base44.entities.OrdemServico.filter(filter, sort, limit, skip);
  }
  // Sem filtros: pega as mais recentes + ativas para garantir cobertura
  const [ativas1, ativas2, recentes] = await Promise.all([
    base44.entities.OrdemServico.filter({ status: 'elaboracao' }, sort, limit),
    base44.entities.OrdemServico.filter({ status: 'execucao' }, sort, limit),
    base44.entities.OrdemServico.list(sort, limit, skip),
  ]);
  const ids = new Set();
  const merged = [];
  for (const os of [...ativas1, ...ativas2, ...recentes]) {
    if (!ids.has(os.id)) { ids.add(os.id); merged.push(os); }
  }
  return merged;
}

// Hook global — sem filtros, para AppContext (Dashboard, EmFluxo etc.)
export function useOrdensQuery(options = {}) {
  return useQuery({
    queryKey: ORDENS_QUERY_KEY,
    queryFn: fetchOrdensGlobal,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Hook filtrado — para OrdensServico com paginação backend
// filtros: { backendFilter, sort, limit, page }
export function useOrdensFiltradas(filtros, options = {}) {
  return useQuery({
    queryKey: ['ordens-filtradas', filtros],
    queryFn: fetchOrdensFiltradas,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // mantém dados anteriores enquanto carrega nova página
    ...options,
  });
}

export function useOrdensQueryClient() {
  const queryClient = useQueryClient();
  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey: ORDENS_QUERY_KEY }),
    invalidateFiltradas: () => queryClient.invalidateQueries({ queryKey: [ORDENS_FILTRADAS_KEY] }),
    setData: (updater) => queryClient.setQueryData(ORDENS_QUERY_KEY, updater),
    getData: () => queryClient.getQueryData(ORDENS_QUERY_KEY),
  };
}

// Hook que sincroniza as queries de OS em tempo real via subscription
// Deve ser montado uma única vez no topo da árvore (AppContext já usa useOrdensQuery — subscribe lá)
export function useOrdensRealTimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = base44.entities.OrdemServico.subscribe((event) => {
      const { type, id, data } = event;

      // 1. Atualiza cache global (ORDENS_QUERY_KEY)
      queryClient.setQueryData(ORDENS_QUERY_KEY, (prev = []) => {
        if (type === 'create' && data) {
          return prev.some(o => o.id === id) ? prev : [data, ...prev];
        }
        if (type === 'update' && data) {
          return prev.map(o => o.id === id ? { ...o, ...data } : o);
        }
        if (type === 'delete') {
          return prev.filter(o => o.id !== id);
        }
        return prev;
      });

      // 2. Atualiza todos os caches filtrados ativos (ordens-filtradas/*)
      queryClient.setQueriesData({ queryKey: [ORDENS_FILTRADAS_KEY] }, (prev = []) => {
        if (type === 'create' && data) {
          return prev.some(o => o.id === id) ? prev : [data, ...prev];
        }
        if (type === 'update' && data) {
          return prev.map(o => o.id === id ? { ...o, ...data } : o);
        }
        if (type === 'delete') {
          return prev.filter(o => o.id !== id);
        }
        return prev;
      });
    });

    return unsub;
  }, [queryClient]);
}