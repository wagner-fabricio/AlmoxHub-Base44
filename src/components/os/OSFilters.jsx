import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, X, LayoutGrid, List, Image, Users, Calendar, ChevronDown } from 'lucide-react';

export default function OSFilters({ 
  filters, 
  setFilters, 
  regionais,
  almoxarifados,
  categorias,
  subcategorias,
  viewMode,
  setViewMode 
}) {
  const clearFilters = () => {
    setFilters({
      search: '',
      migo: '',
      regional: 'all',
      almoxarifado: 'all',
      categorias: [],
      subcategoria: 'all',
      status: 'all',
      visao: 'todos',
      periodo: 'all',
      dataInicio: '',
      dataFim: ''
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.migo ||
    filters.regional !== 'all' ||
    filters.almoxarifado !== 'all' || 
    filters.categorias?.length > 0 || 
    filters.subcategoria !== 'all' ||
    filters.status !== 'all' ||
    filters.periodo !== 'all';

  const filteredSubcategorias = !filters.categorias || filters.categorias.length === 0
    ? subcategorias 
    : subcategorias.filter(s => filters.categorias.includes(s.categoria_id));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
      <div className="space-y-4">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por código, descrição..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full"
            />
          </div>
          <Input
            placeholder="MIGO"
            value={filters.migo}
            onChange={(e) => setFilters({ ...filters, migo: e.target.value.replace(/\D/g, '') })}
            maxLength="20"
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full sm:w-32 md:w-40"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
          <Select
            value={filters.visao}
            onValueChange={(value) => setFilters({ ...filters, visao: value })}
          >
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm">
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
            onValueChange={(value) => setFilters({ ...filters, regional: value, almoxarifado: 'all' })}
          >
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm">
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
            value={filters.almoxarifado}
            onValueChange={(value) => setFilters({ ...filters, almoxarifado: value })}
          >
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm col-span-2 sm:col-span-1">
              <SelectValue placeholder="Almoxarifado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Almoxarifados</SelectItem>
              {(almoxarifados || [])
                .filter(a => filters.regional === 'all' || a.regional_id === filters.regional)
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                className="col-span-2 sm:col-span-1 justify-between bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm h-9"
              >
                <span className="truncate text-xs sm:text-sm">
                  {filters.categorias?.length === 0 ? 'Categorias' : 
                   filters.categorias?.length === 1 ? (categorias.find(c => c.id === filters.categorias[0])?.nome || 'Cat.') :
                   `${filters.categorias?.length} cat.`}
                </span>
                <ChevronDown className="w-4 h-4 shrink-0 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({ ...filters, categorias: [], subcategoria: 'all' })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Limpar seleção
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 max-h-48 overflow-y-auto">
                  {categorias.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                      <Checkbox
                        checked={filters.categorias?.includes(c.id) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({ 
                              ...filters, 
                              categorias: [...(filters.categorias || []), c.id],
                              subcategoria: 'all'
                            });
                          } else {
                            setFilters({ 
                              ...filters, 
                              categorias: (filters.categorias || []).filter(id => id !== c.id),
                              subcategoria: 'all'
                            });
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{c.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={filters.subcategoria}
            onValueChange={(value) => setFilters({ ...filters, subcategoria: value })}
            disabled={filters.categorias?.length === 0}
          >
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm col-span-2 sm:col-span-1">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subcategorias</SelectItem>
              {filteredSubcategorias.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.periodo}
            onValueChange={(value) => setFilters({ ...filters, periodo: value })}
          >
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm col-span-2 sm:col-span-1">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="mes_atual">Mês atual</SelectItem>
              <SelectItem value="customizado">Customizado</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearFilters}
              className="text-slate-500 hover:text-red-500 h-9"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {filters.periodo === 'customizado' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-2 block font-medium">Data Início</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                className="bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-2 block font-medium">Data Fim</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                className="bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden w-fit">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="rounded-none h-9"
            title="Kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none border-x border-slate-200 dark:border-slate-700 h-9"
            title="Lista"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('gallery')}
            className="rounded-none border-x border-slate-200 dark:border-slate-700 h-9"
            title="Galeria"
          >
            <Image className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'responsavel' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('responsavel')}
            className="rounded-none h-9"
            title="Por Responsável"
          >
            <Users className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}