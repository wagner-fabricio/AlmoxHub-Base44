import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ORDENS_QUERY_KEY = ['ordens'];

async function fetchOrdens() {
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

export function useOrdensQuery(options = {}) {
  return useQuery({
    queryKey: ORDENS_QUERY_KEY,
    queryFn: fetchOrdens,
    staleTime: 2 * 60 * 1000,   // 2 min — evita refetch desnecessário
    gcTime: 5 * 60 * 1000,      // 5 min — mantém cache após unmount
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useOrdensQueryClient() {
  const queryClient = useQueryClient();
  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey: ORDENS_QUERY_KEY }),
    setData: (updater) => queryClient.setQueryData(ORDENS_QUERY_KEY, updater),
    getData: () => queryClient.getQueryData(ORDENS_QUERY_KEY),
  };
}

export { ORDENS_QUERY_KEY };