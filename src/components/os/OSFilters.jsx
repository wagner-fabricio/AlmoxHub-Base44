import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, LayoutGrid, List, Image } from 'lucide-react';

export default function OSFilters({ 
  filters, 
  setFilters, 
  regionais, 
  categorias,
  viewMode,
  setViewMode 
}) {
  const clearFilters = () => {
    setFilters({
      search: '',
      regional: 'all',
      categoria: 'all',
      prioridade: 'all',
      status: 'all',
      visao: 'todos'
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.regional !== 'all' || 
    filters.categoria !== 'all' || 
    filters.prioridade !== 'all' ||
    filters.status !== 'all';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por código, descrição..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.visao}
            onValueChange={(value) => setFilters({ ...filters, visao: value })}
          >
            <SelectTrigger className="w-40 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Visão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas OS</SelectItem>
              <SelectItem value="regional">Minha Regional</SelectItem>
              <SelectItem value="meus">Atribuídas a Mim</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.regional}
            onValueChange={(value) => setFilters({ ...filters, regional: value })}
          >
            <SelectTrigger className="w-40 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regionais</SelectItem>
              {regionais.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.categoria}
            onValueChange={(value) => setFilters({ ...filters, categoria: value })}
          >
            <SelectTrigger className="w-40 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.prioridade}
            onValueChange={(value) => setFilters({ ...filters, prioridade: value })}
          >
            <SelectTrigger className="w-36 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearFilters}
              className="text-slate-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="rounded-none"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none border-x border-slate-200 dark:border-slate-700"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('gallery')}
            className="rounded-none"
          >
            <Image className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}