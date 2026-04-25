import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const ORDENS_QUERY_KEY = ['ordens'];

// Busca global (sem filtros) — usada pelo AppContext para Dashboard, Torre de Controle etc.
async function fetchOrdensGlobal() {
  const [ativas1, ativas2, recentes] = await Promise.all([
    base44.entities.OrdemServico.filter({ status: 'elaboracao' }),
    base44.entities.OrdemServico.filter({ status: 'execucao' }),
    base44.entities.OrdemServico.list('-created_date', 1000),
  ]);
  const ids = new Set();
  const merged = [];
  for (const os of [...ativas1, ...ativas2, ...recentes]) {
    if (!ids.has(os.id)) { ids.add(os.id); merged.push(os); }
  }
  return merged;
}

// Busca filtrada e paginada — usada pela página OrdensServico
async function fetchOrdensFiltradas({ queryKey }) {
  const [, filtros] = queryKey;
  const { backendFilter = {}, sort = '-created_date', limit = 100, page = 1 } = filtros || {};
  const skip = (page - 1) * limit;

  // Construir filtro para o backend
  const filter = {};
  if (backendFilter.status && backendFilter.status !== 'all') filter.status = backendFilter.status;
  if (backendFilter.regional_id) filter.regional_id = backendFilter.regional_id;
  if (backendFilter.almoxarifado_id) filter.almoxarifado_id = backendFilter.almoxarifado_id;
  if (backendFilter.categoria_id) filter.categoria_id = backendFilter.categoria_id;

  const hasFilter = Object.keys(filter).length > 0;
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
    invalidateFiltradas: () => queryClient.invalidateQueries({ queryKey: ['ordens-filtradas'] }),
    setData: (updater) => queryClient.setQueryData(ORDENS_QUERY_KEY, updater),
    getData: () => queryClient.getQueryData(ORDENS_QUERY_KEY),
  };
}