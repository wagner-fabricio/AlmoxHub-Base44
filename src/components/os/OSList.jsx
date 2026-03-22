import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, Clock, Loader2, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-100 text-slate-700', label: 'Baixa' },
  media: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
  alta: { color: 'bg-amber-100 text-amber-700', label: 'Alta' },
  urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
};

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500', label: 'Elaboração' },
  execucao: { icon: Loader2, color: 'text-blue-500', label: 'Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500', label: 'Cancelado' },
};

export default function OSList({ ordens, pessoas, categorias, regionais, onOSClick }) {
  const [columnFilters, setColumnFilters] = useState({
    codigo: [],
    categoria: [],
    regional: [],
    lider: [],
    prioridade: [],
    status: []
  });
  
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });

  // Mapas de lookup memoizados — O(1) ao invés de O(n) por acesso
  const pessoasMap = useMemo(() => new Map(pessoas.map(p => [p.id, p])), [pessoas]);
  const categoriasMap = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias]);
  const regionaisMap = useMemo(() => new Map(regionais.map(r => [r.id, r])), [regionais]);

  const getLider = (liderId) => pessoasMap.get(liderId);
  const getCategoria = (catId) => categoriasMap.get(catId);
  const getRegional = (regId) => regionaisMap.get(regId);

  // Unique values memoizados — só recalcula quando ordens mudam
  const uniqueValues = useMemo(() => {
    const codigos = new Set(), categoriaSet = new Set(), regionalSet = new Set();
    const liderSet = new Set(), prioridadeSet = new Set(), statusSet = new Set();
    ordens.forEach(os => {
      if (os.codigo) codigos.add(os.codigo);
      const cat = categoriasMap.get(os.categoria_id);
      if (cat) categoriaSet.add(cat.nome);
      const reg = regionaisMap.get(os.regional_id);
      if (reg) regionalSet.add(reg.sigla);
      const lid = pessoasMap.get(os.lider_id);
      if (lid) liderSet.add(lid.nome);
      if (os.prioridade) prioridadeSet.add(os.prioridade);
      if (os.status) statusSet.add(os.status);
    });
    return {
      codigo: Array.from(codigos).sort(),
      categoria: Array.from(categoriaSet).sort(),
      regional: Array.from(regionalSet).sort(),
      lider: Array.from(liderSet).sort(),
      prioridade: Array.from(prioridadeSet).sort(),
      status: Array.from(statusSet).sort(),
    };
  }, [ordens, pessoasMap, categoriasMap, regionaisMap]);

  const getUniqueValues = (column) => uniqueValues[column] || [];

  // Toggle filter value
  const toggleFilter = (column, value) => {
    setColumnFilters(prev => {
      const current = prev[column];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  // Clear column filter
  const clearFilter = (column) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
  };

  // Handle sorting
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

  // Apply filters + sort memoizados
  const filteredOrdens = useMemo(() => {
  let result = ordens.filter(os => {
    if (columnFilters.codigo.length > 0 && !columnFilters.codigo.includes(os.codigo)) return false;
    
    const categoria = getCategoria(os.categoria_id);
    if (columnFilters.categoria.length > 0 && !columnFilters.categoria.includes(categoria?.nome)) return false;
    
    const regional = getRegional(os.regional_id);
    if (columnFilters.regional.length > 0 && !columnFilters.regional.includes(regional?.sigla)) return false;
    
    const lider = getLider(os.lider_id);
    if (columnFilters.lider.length > 0 && !columnFilters.lider.includes(lider?.nome)) return false;
    
    if (columnFilters.prioridade.length > 0 && !columnFilters.prioridade.includes(os.prioridade)) return false;
    if (columnFilters.status.length > 0 && !columnFilters.status.includes(os.status)) return false;
    
    return true;
  });

  // Apply sorting
  if (sortConfig.column && sortConfig.direction) {
    result = [...result].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.column === 'codigo') {
        aValue = a.codigo || '';
        bValue = b.codigo || '';
      } else if (sortConfig.column === 'lider') {
        aValue = getLider(a.lider_id)?.nome || '';
        bValue = getLider(b.lider_id)?.nome || '';
      } else if (sortConfig.column === 'data_inicial') {
        aValue = a.data_inicial ? new Date(a.data_inicial).getTime() : 0;
        bValue = b.data_inicial ? new Date(b.data_inicial).getTime() : 0;
      } else if (sortConfig.column === 'prazo') {
        aValue = a.prazo ? new Date(a.prazo).getTime() : 0;
        bValue = b.prazo ? new Date(b.prazo).getTime() : 0;
      } else if (sortConfig.column === 'data_conclusao') {
        aValue = a.data_conclusao ? new Date(a.data_conclusao).getTime() : 0;
        bValue = b.data_conclusao ? new Date(b.data_conclusao).getTime() : 0;
      } else if (sortConfig.column === 'tempo_decorrido') {
        const aDays = a.data_inicial && a.prazo ? differenceInDays(new Date(a.prazo), new Date(a.data_inicial)) : 0;
        const bDays = b.data_inicial && b.prazo ? differenceInDays(new Date(b.prazo), new Date(b.data_inicial)) : 0;
        aValue = aDays;
        bValue = bDays;
      } else if (sortConfig.column === 'prioridade') {
        const prioridadeOrder = { baixa: 1, media: 2, alta: 3, urgente: 4 };
        aValue = prioridadeOrder[a.prioridade] || 0;
        bValue = prioridadeOrder[b.prioridade] || 0;
      } else if (sortConfig.column === 'status') {
        const statusOrder = { elaboracao: 1, execucao: 2, concluido: 3, cancelado: 4 };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
      } else if (sortConfig.column === 'progresso') {
        aValue = a.progresso || 0;
        bValue = b.progresso || 0;
      } else if (sortConfig.column === 'tempo_decorrido') {
        const aDataFinal = a.status === 'concluido' ? (a.data_conclusao || a.prazo) : new Date().toISOString().split('T')[0];
        const bDataFinal = b.status === 'concluido' ? (b.data_conclusao || b.prazo) : new Date().toISOString().split('T')[0];
        aValue = a.data_inicial && aDataFinal ? differenceInDays(new Date(aDataFinal), new Date(a.data_inicial)) : 0;
        bValue = b.data_inicial && bDataFinal ? differenceInDays(new Date(bDataFinal), new Date(b.data_inicial)) : 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
  }, [ordens, columnFilters, sortConfig, pessoasMap, categoriasMap, regionaisMap]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
      <Table style={{ minWidth: '1600px' }}>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead className="font-semibold w-44">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSort('codigo')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Código
                  {sortConfig.column === 'codigo' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-30" />
                  )}
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.codigo.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Código</span>
                        {columnFilters.codigo.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('codigo')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('codigo').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.codigo.includes(value)}
                              onCheckedChange={() => toggleFilter('codigo', value)}
                            />
                            <span className="text-sm font-mono">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold w-32">
              <div className="flex items-center gap-2">
                Categoria
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.categoria.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Categoria</span>
                        {columnFilters.categoria.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('categoria')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('categoria').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.categoria.includes(value)}
                              onCheckedChange={() => toggleFilter('categoria', value)}
                            />
                            <span className="text-sm">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold w-28">
              <div className="flex items-center gap-2">
                Regional
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.regional.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Regional</span>
                        {columnFilters.regional.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('regional')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('regional').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.regional.includes(value)}
                              onCheckedChange={() => toggleFilter('regional', value)}
                            />
                            <span className="text-sm">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold w-40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSort('lider')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Líder
                  {sortConfig.column === 'lider' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-30" />
                  )}
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.lider.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Líder</span>
                        {columnFilters.lider.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('lider')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('lider').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.lider.includes(value)}
                              onCheckedChange={() => toggleFilter('lider', value)}
                            />
                            <span className="text-sm">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold">
              <button
                onClick={() => handleSort('data_inicial')}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Data Inicial
                {sortConfig.column === 'data_inicial' ? (
                  sortConfig.direction === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-30" />
                )}
              </button>
            </TableHead>
            <TableHead className="font-semibold">
              <button
                onClick={() => handleSort('prazo')}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Prazo
                {sortConfig.column === 'prazo' ? (
                  sortConfig.direction === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-30" />
                )}
              </button>
            </TableHead>
            <TableHead className="font-semibold">
              <button
                onClick={() => handleSort('data_conclusao')}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Data Conclusão
                {sortConfig.column === 'data_conclusao' ? (
                  sortConfig.direction === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-30" />
                )}
              </button>
            </TableHead>
            <TableHead className="font-semibold">
              <button
                onClick={() => handleSort('tempo_decorrido')}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Tempo Previsto
                {sortConfig.column === 'tempo_decorrido' ? (
                  sortConfig.direction === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-30" />
                )}
              </button>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSort('prioridade')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Prioridade
                  {sortConfig.column === 'prioridade' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-30" />
                  )}
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.prioridade.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Prioridade</span>
                        {columnFilters.prioridade.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('prioridade')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('prioridade').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.prioridade.includes(value)}
                              onCheckedChange={() => toggleFilter('prioridade', value)}
                            />
                            <Badge className={prioridadeConfig[value]?.color}>
                              {prioridadeConfig[value]?.label}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Status
                  {sortConfig.column === 'status' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 opacity-30" />
                  )}
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.status.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Status</span>
                        {columnFilters.status.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('status')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('status').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.status.includes(value)}
                              onCheckedChange={() => toggleFilter('status', value)}
                            />
                            <span className="text-sm">{statusConfig[value]?.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold">
              <button
                onClick={() => handleSort('tempo_decorrido')}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                Tempo Decorrido
                {sortConfig.column === 'tempo_decorrido' ? (
                  sortConfig.direction === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-30" />
                )}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-right">
              <button
                onClick={() => handleSort('progresso')}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
              >
                Progresso
                {sortConfig.column === 'progresso' ? (
                  sortConfig.direction === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-30" />
                )}
              </button>
            </TableHead>
            </TableRow>
            </TableHeader>
        <TableBody>
          {filteredOrdens.map((os) => {
            const StatusIcon = statusConfig[os.status]?.icon || Clock;
            const lider = getLider(os.lider_id);
            const categoria = getCategoria(os.categoria_id);
            const regional = getRegional(os.regional_id);

            return (
              <TableRow 
                key={os.id} 
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => onOSClick?.(os)}
              >
                <TableCell>
                  <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                    {os.codigo}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {categoria?.nome || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{regional?.sigla || '-'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {lider?.nome?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {lider?.nome || 'Não atribuído'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {os.data_inicial ? format(new Date(os.data_inicial), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {os.data_conclusao ? format(new Date(os.data_conclusao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {os.data_inicial && os.prazo ? `${differenceInDays(new Date(os.prazo), new Date(os.data_inicial))} dias` : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={prioridadeConfig[os.prioridade]?.color}>
                    {prioridadeConfig[os.prioridade]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                     <StatusIcon className={`w-4 h-4 ${statusConfig[os.status]?.color}`} />
                     <span className="text-sm">{statusConfig[os.status]?.label}</span>
                   </div>
                 </TableCell>
                 <TableCell>
                   <span className="text-sm text-slate-600 dark:text-slate-400">
                     {(() => {
                       let dataFinal;
                       if (os.status === 'concluido') {
                         dataFinal = os.data_conclusao || os.prazo;
                       } else {
                         dataFinal = new Date().toISOString().split('T')[0];
                       }

                       if (os.data_inicial && dataFinal) {
                         const dias = differenceInDays(new Date(dataFinal), new Date(os.data_inicial));
                         return `${dias} dia${dias !== 1 ? 's' : ''}`;
                       }
                       return '-';
                     })()}
                   </span>
                 </TableCell>
                 <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${os.progresso || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-10">
                      {os.progresso || 0}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-900 dark:text-white">
          {filteredOrdens.length} OS
        </span>
        <span className="font-semibold text-slate-900 dark:text-white">
          Total Tempo Decorrido: {filteredOrdens.reduce((sum, os) => {
            if (os.data_inicial && os.prazo) {
              return sum + differenceInDays(new Date(os.prazo), new Date(os.data_inicial));
            }
            return sum;
          }, 0)} dias
        </span>
      </div>
    </div>
  );
}