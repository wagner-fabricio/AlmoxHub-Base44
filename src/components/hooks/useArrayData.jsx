import { useMemo } from 'react';

/**
 * Hook customizado para trabalhar com dados que podem ou não ser arrays
 * Evita validações repetidas de Array.isArray() por todo o código
 */
export function useArrayData(data) {
  return useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(Boolean); // Remove null/undefined
  }, [data]);
}

/**
 * Hook para encontrar item em array com validação
 */
export function useArrayFind(data, predicate) {
  return useMemo(() => {
    if (!Array.isArray(data)) return null;
    return data.find(predicate);
  }, [data, predicate]);
}

/**
 * Hook para filtrar array com validação
 */
export function useArrayFilter(data, predicate) {
  return useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(predicate);
  }, [data, predicate]);
}