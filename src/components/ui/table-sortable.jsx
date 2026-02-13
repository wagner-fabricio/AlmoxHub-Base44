import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

// Componente de cabeçalho de tabela com ordenação e filtro
export function SortableTableHead({ 
  label, 
  column,
  sortConfig,
  onSort,
  filterConfig,
  onToggleFilter,
  onClearFilter,
  getUniqueValues,
  renderFilterItem
}) {
  const hasSort = !!onSort;
  const hasFilter = !!filterConfig;
  
  return (
    <div className="flex items-center gap-2">
      {hasSort ? (
        <button
          onClick={() => onSort(column)}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          {label}
          {sortConfig?.column === column ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-30" />
          )}
        </button>
      ) : (
        <span>{label}</span>
      )}
      {hasFilter && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Filter className={`w-3 h-3 ${filterConfig[column]?.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-semibold">Filtrar {label}</span>
                {filterConfig[column]?.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => onClearFilter(column)} className="h-6 text-xs">
                    Limpar
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {getUniqueValues(column).map(value => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                    <Checkbox
                      checked={filterConfig[column]?.includes(value) || false}
                      onCheckedChange={() => onToggleFilter(column, value)}
                    />
                    {renderFilterItem ? renderFilterItem(column, value) : (
                      <span className="text-sm">{value || '-'}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// Hook para gerenciar ordenação e filtro
export function useTableSort(initialColumn = null) {
  const [sortConfig, setSortConfig] = React.useState({ 
    column: initialColumn, 
    direction: null 
  });

  const handleSort = (column) => {
    let direction = 'asc';
    
    if (sortConfig.column === column) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ column, direction });
  };

  return { sortConfig, handleSort };
}

// Hook para gerenciar filtros de coluna
export function useColumnFilters(initialFilters = {}) {
  const [columnFilters, setColumnFilters] = React.useState(initialFilters);

  const toggleFilter = (column, value) => {
    setColumnFilters(prev => {
      const current = prev[column] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  const clearFilter = (column) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
  };

  return { columnFilters, toggleFilter, clearFilter };
}