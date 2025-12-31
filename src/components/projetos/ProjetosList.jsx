import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Edit, Trash2, FolderKanban, ChevronDown, ChevronRight, ExternalLink, Clock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500', label: 'Elaboração' },
  execucao: { icon: Loader2, color: 'text-blue-500', label: 'Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500', label: 'Cancelado' },
};

export default function ProjetosList({ 
  projetos, 
  ordens,
  pessoas,
  categorias,
  onEdit, 
  onDelete,
  onOpenOS 
}) {
  const [columnFilters, setColumnFilters] = useState({
    nome: [],
    ativo: []
  });
  const [expandedProjetoId, setExpandedProjetoId] = useState(null);

  const getOSCount = (projetoId) => {
    return ordens.filter(os => os.projetos_ids?.includes(projetoId)).length;
  };

  const getProjetoExecutores = (projetoId) => {
    const projetoOrdens = ordens.filter(os => os.projetos_ids?.includes(projetoId));
    const executoresIds = new Set();
    
    projetoOrdens.forEach(os => {
      if (os.executores_ids && Array.isArray(os.executores_ids)) {
        os.executores_ids.forEach(id => executoresIds.add(id));
      }
    });
    
    return Array.from(executoresIds);
  };

  const getProjetoOrdens = (projetoId) => {
    return ordens.filter(os => os.projetos_ids?.includes(projetoId));
  };

  const toggleExpanded = (projetoId) => {
    setExpandedProjetoId(expandedProjetoId === projetoId ? null : projetoId);
  };

  // Get unique values for each column
  const getUniqueValues = (column) => {
    const values = new Set();
    projetos.forEach(projeto => {
      if (column === 'nome') values.add(projeto.nome);
      if (column === 'ativo') values.add(projeto.ativo !== false ? 'Ativo' : 'Inativo');
    });
    return Array.from(values).sort();
  };

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

  // Apply filters
  const filteredProjetos = projetos.filter(projeto => {
    if (columnFilters.nome.length > 0 && !columnFilters.nome.includes(projeto.nome)) return false;
    
    const statusLabel = projeto.ativo !== false ? 'Ativo' : 'Inativo';
    if (columnFilters.ativo.length > 0 && !columnFilters.ativo.includes(statusLabel)) return false;
    
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                Nome
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.nome.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Nome</span>
                        {columnFilters.nome.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('nome')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('nome').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.nome.includes(value)}
                              onCheckedChange={() => toggleFilter('nome', value)}
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
            <TableHead className="font-semibold">Descrição</TableHead>
            <TableHead className="font-semibold">Cor</TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                Status
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.ativo.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Status</span>
                        {columnFilters.ativo.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('ativo')} className="h-6 text-xs">
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueValues('ativo').map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox
                              checked={columnFilters.ativo.includes(value)}
                              onCheckedChange={() => toggleFilter('ativo', value)}
                            />
                            <Badge className={value === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                              {value}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold">Qtd. OS</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjetos.map((projeto) => {
            const osCount = getOSCount(projeto.id);
            const projetoOrdens = getProjetoOrdens(projeto.id);
            const isExpanded = expandedProjetoId === projeto.id;
            
            return (
              <React.Fragment key={projeto.id}>
                <TableRow 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => osCount > 0 && toggleExpanded(projeto.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {osCount > 0 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      )}
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${projeto.cor}20` }}
                      >
                        <FolderKanban className="w-4 h-4" style={{ color: projeto.cor }} />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {projeto.nome}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {projeto.descricao || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border border-slate-200 dark:border-slate-600"
                        style={{ backgroundColor: projeto.cor }}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {projeto.cor}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={projeto.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {projeto.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {osCount} OS
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(projeto);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(projeto);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded OS rows */}
                {isExpanded && projetoOrdens.map((os) => {
                  const lider = Array.isArray(pessoas) ? pessoas.find(p => p?.id === os.lider_id) : null;
                  const categoria = Array.isArray(categorias) ? categorias.find(c => c?.id === os.categoria_id) : null;
                  const StatusIcon = statusConfig[os.status]?.icon || Clock;

                  return (
                    <TableRow 
                      key={`os-${os.id}`}
                      className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <TableCell colSpan={6} className="pl-16">
                        <div className="flex items-center gap-4 py-2">
                          <span className="font-mono text-sm text-slate-600 dark:text-slate-400 w-40">
                            {os.codigo}
                          </span>
                          <div className="flex items-center gap-2 w-48">
                            <Badge variant="outline" className="text-xs">
                              {categoria?.nome || '-'}
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-40">
                            {lider?.nome || 'Não atribuído'}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 flex-1 line-clamp-1">
                            {os.descricao_resumida || os.anotacoes || '-'}
                          </span>
                          <div className="flex items-center gap-4 w-64">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {os.data_inicial ? format(new Date(os.data_inicial), 'dd/MM/yy') : '-'}
                              {' → '}
                              {os.prazo ? format(new Date(os.prazo), 'dd/MM/yy') : '-'}
                            </div>
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`w-4 h-4 ${statusConfig[os.status]?.color}`} />
                              <span className="text-xs">{statusConfig[os.status]?.label}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenOS?.(os);
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}