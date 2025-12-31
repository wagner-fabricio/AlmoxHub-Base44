import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Edit, Trash2, FolderKanban } from 'lucide-react';

export default function ProjetosList({ 
  projetos, 
  ordens,
  onEdit, 
  onDelete 
}) {
  const [columnFilters, setColumnFilters] = useState({
    nome: [],
    ativo: []
  });

  const getOSCount = (projetoId) => {
    return ordens.filter(os => os.projetos_ids?.includes(projetoId)).length;
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
            
            return (
              <TableRow 
                key={projeto.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}