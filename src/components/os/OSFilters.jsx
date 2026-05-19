import React, { useMemo, useState } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, Filter, X, LayoutGrid, List, Image, Users, ChevronDown, ChevronRight, AlertCircle, InboxIcon, Clock } from 'lucide-react';

export default function OSFilters({ 
  filters, 
  setFilters, 
  regionais,
  almoxarifados,
  categorias,
  subcategorias,
  pessoas,
  viewMode,
  setViewMode,
  isExpedicaoView = false,
  isRecebimentoView = false
}) {
  const isPendenciasView = viewMode === 'pendencias_expedicao';
  const isPendenciasRecebimentoView = viewMode === 'pendencias_recebimento';
  const [isOpen, setIsOpen] = React.useState(true);

  const clearFilters = () => {
    // Se estiver na visão de expedição, manter a categoria Expedição
    const expedicaoCategoria = isExpedicaoView 
      ? categorias.find(c => c.nome === 'Expedição')
      : null;
    
    // Se estiver na visão de recebimento, manter a categoria Recebimento
    const recebimentoCategoria = isRecebimentoView 
      ? categorias.find(c => c.nome === 'Recebimento')
      : null;
    
    setFilters({
      search: '',
      migo: '',
      reserva: '',
      codigoMaterial: '',
      regional: [],
      almoxarifado: [],
      categorias: expedicaoCategoria ? [expedicaoCategoria.id] : (recebimentoCategoria ? [recebimentoCategoria.id] : []),
      subcategoria: 'all',
      status: 'all',
      statusList: [],
      visao: 'todos',
      periodo: 'all',
      dataInicio: '',
      dataFim: '',
      pessoa_id: ''
    });
  };

  // Compatibilidade: regional/almoxarifado aceitam string antiga ('all'/id) ou array
  const regionaisSel = Array.isArray(filters.regional)
    ? filters.regional
    : (filters.regional && filters.regional !== 'all' ? [filters.regional] : []);
  const almoxSel = Array.isArray(filters.almoxarifado)
    ? filters.almoxarifado
    : (filters.almoxarifado && filters.almoxarifado !== 'all' ? [filters.almoxarifado] : []);

  const hasActiveFilters = 
    filters.search || 
    filters.migo ||
    filters.reserva ||
    filters.codigoMaterial ||
    regionaisSel.length > 0 ||
    almoxSel.length > 0 || 
    filters.categorias?.length > 0 || 
    filters.subcategoria !== 'all' ||
    filters.status !== 'all' ||
    filters.statusList?.length > 0 ||
    filters.periodo !== 'all' ||
    filters.pessoa_id;

  const filteredSubcategorias = useMemo(() =>
    !filters.categorias || filters.categorias.length === 0
      ? subcategorias
      : subcategorias.filter(s => filters.categorias.includes(s.categoria_id)),
    [filters.categorias, subcategorias]
  );

  const filteredPessoas = useMemo(() =>
    (pessoas || []).filter(p => {
      if (!p) return false;
      if (almoxSel.length > 0) return (p.almoxarifados_ids || []).some(id => almoxSel.includes(id));
      if (regionaisSel.length > 0) return regionaisSel.includes(p.regional_id);
      return true;
    }).sort((a, b) => a.nome.localeCompare(b.nome)),
    [pessoas, almoxSel, regionaisSel]
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Filtros</h2>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">Toggle filters</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-4">
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
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full sm:w-28"
          />
          <Input
            placeholder="Reserva"
            value={filters.reserva || ''}
            onChange={(e) => setFilters({ ...filters, reserva: e.target.value.replace(/\D/g, '') })}
            maxLength="20"
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full sm:w-28"
          />
          <Input
            placeholder="Cód. Material"
            value={filters.codigoMaterial || ''}
            onChange={(e) => setFilters({ ...filters, codigoMaterial: e.target.value })}
            maxLength="30"
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full sm:w-32"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 md:gap-2">
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-between bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm h-9"
              >
                <span className="truncate text-xs sm:text-sm">
                  {regionaisSel.length === 0 ? 'Regional' :
                   regionaisSel.length === 1 ? (regionais.find(r => r.id === regionaisSel[0])?.sigla || '1 regional') :
                   `${regionaisSel.length} regionais`}
                </span>
                <ChevronDown className="w-4 h-4 shrink-0 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({ ...filters, regional: [], almoxarifado: [] })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Limpar seleção
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 max-h-48 overflow-y-auto">
                  {regionais.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                      <Checkbox
                        checked={regionaisSel.includes(r.id)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...regionaisSel, r.id]
                            : regionaisSel.filter(id => id !== r.id);
                          // Ao mudar regional, limpar almoxarifados que não pertencem mais
                          const validAlmoxIds = (almoxarifados || [])
                            .filter(a => next.length === 0 || next.includes(a.regional_id))
                            .map(a => a.id);
                          const nextAlmox = almoxSel.filter(id => validAlmoxIds.includes(id));
                          setFilters({ ...filters, regional: next, almoxarifado: nextAlmox });
                        }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{r.sigla}</span>
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-between bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm h-9"
              >
                <span className="truncate text-xs sm:text-sm">
                  {almoxSel.length === 0 ? 'Almoxarifado' :
                   almoxSel.length === 1 ? ((almoxarifados || []).find(a => a.id === almoxSel[0])?.nome || '1 almox.') :
                   `${almoxSel.length} almox.`}
                </span>
                <ChevronDown className="w-4 h-4 shrink-0 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({ ...filters, almoxarifado: [] })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Limpar seleção
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 max-h-60 overflow-y-auto">
                  {(almoxarifados || [])
                    .filter(a => a.ativo !== false && (regionaisSel.length === 0 || regionaisSel.includes(a.regional_id)))
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((a) => (
                      <label key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <Checkbox
                          checked={almoxSel.includes(a.id)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...almoxSel, a.id]
                              : almoxSel.filter(id => id !== a.id);
                            setFilters({ ...filters, almoxarifado: next });
                          }}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{a.nome}</span>
                      </label>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                className="justify-between bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm h-9"
                disabled={isExpedicaoView || isRecebimentoView || isPendenciasView || isPendenciasRecebimentoView}
              >
                <span className="truncate text-xs sm:text-sm">
                  {isExpedicaoView || isPendenciasView
                    ? 'Expedição'
                    : isRecebimentoView || isPendenciasRecebimentoView
                    ? 'Recebimento'
                    : filters.categorias?.length === 0 ? 'Categorias' : 
                      filters.categorias?.length === 1 ? (categorias.find(c => c.id === filters.categorias[0])?.nome || 'Cat.') :
                      `${filters.categorias?.length} cat.`}
                </span>
                {!isExpedicaoView && !isRecebimentoView && <ChevronDown className="w-4 h-4 shrink-0 ml-1" />}
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
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subcategorias</SelectItem>
              {filteredSubcategorias.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                className="justify-between bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm h-9"
                disabled={isPendenciasView || isPendenciasRecebimentoView}
              >
                <span className="truncate text-xs sm:text-sm">
                  {isPendenciasView || isPendenciasRecebimentoView
                    ? 'Elaboração + Execução'
                    : !filters.statusList || filters.statusList.length === 0 ? 'Status' : 
                    filters.statusList.length === 1 ? 
                      ({ elaboracao: 'Elaboração', execucao: 'Execução', concluido: 'Concluído', cancelado: 'Cancelado' }[filters.statusList[0]] || 'Status') :
                    `${filters.statusList.length} status`}
                </span>
                {!isPendenciasView && !isPendenciasRecebimentoView && <ChevronDown className="w-4 h-4 shrink-0 ml-1" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({ ...filters, statusList: [] })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Limpar seleção
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                  {[
                    { id: 'elaboracao', label: 'Em Elaboração' },
                    { id: 'execucao', label: 'Em Execução' },
                    { id: 'concluido', label: 'Concluído' },
                    { id: 'cancelado', label: 'Cancelado' }
                  ].map((status) => (
                    <label key={status.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                      <Checkbox
                        checked={filters.statusList?.includes(status.id) || false}
                        onCheckedChange={(checked) => {
                          const currentList = filters.statusList || [];
                          if (checked) {
                            setFilters({ 
                              ...filters, 
                              statusList: [...currentList, status.id]
                            });
                          } else {
                            setFilters({ 
                              ...filters, 
                              statusList: currentList.filter(id => id !== status.id)
                            });
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={filters.periodo}
            onValueChange={(value) => setFilters({ ...filters, periodo: value })}
          >
            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="mes_atual">Mês atual</SelectItem>
              <SelectItem value="customizado">Customizado</SelectItem>
            </SelectContent>
          </Select>

          {pessoas?.length > 0 && (
            <Select
              value={filters.pessoa_id || 'all'}
              onValueChange={(v) => setFilters({ ...filters, pessoa_id: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="bg-slate-50 dark:bg-slate-900 text-sm">
                <SelectValue placeholder="Pessoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as pessoas</SelectItem>
                {filteredPessoas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearFilters}
              className="text-slate-500 hover:text-red-500 h-9"
              title={isExpedicaoView ? "Limpar filtros (mantém categoria Expedição)" : isRecebimentoView ? "Limpar filtros (mantém categoria Recebimento)" : "Limpar filtros"}
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
        <div className="flex flex-wrap gap-3 items-end">
          
          {/* Visões gerais */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 px-1">Visão Geral</span>
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

          {/* Divisor */}
          <div className="h-9 w-px bg-slate-200 dark:bg-slate-700 self-end mb-0.5" />

          {/* Expedição */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-orange-500 dark:text-orange-400 px-1 flex items-center gap-1">
              <LayoutGrid className="w-3 h-3" /> Expedição
            </span>
            <div className="flex border border-orange-200 dark:border-orange-800/60 rounded-lg overflow-hidden w-fit">
              <Button
                variant={viewMode === 'kanban_expedicao' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const expedicaoCategoria = categorias.find(c => c.nome === 'Expedição');
                  if (expedicaoCategoria) setFilters({ ...filters, categorias: [expedicaoCategoria.id] });
                  setViewMode('kanban_expedicao');
                }}
                className={`rounded-none h-9 gap-1.5 text-xs ${viewMode === 'kanban_expedicao' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                title="Kanban Expedição"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </Button>
              <Button
                variant={viewMode === 'pendencias_expedicao' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const expedicaoCategoria = categorias.find(c => c.nome === 'Expedição');
                  setFilters(prev => ({
                    ...prev,
                    categorias: expedicaoCategoria ? [expedicaoCategoria.id] : prev.categorias,
                    statusList: ['elaboracao', 'execucao'],
                    status: 'all'
                  }));
                  setViewMode('pendencias_expedicao');
                }}
                className={`rounded-none border-l border-orange-200 dark:border-orange-800/60 h-9 gap-1.5 text-xs ${viewMode === 'pendencias_expedicao' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                title="Pendências de Expedição"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pendências</span>
              </Button>
            </div>
          </div>

          {/* Recebimento */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-blue-500 dark:text-blue-400 px-1 flex items-center gap-1">
              <InboxIcon className="w-3 h-3" /> Recebimento
            </span>
            <div className="flex border border-blue-200 dark:border-blue-800/60 rounded-lg overflow-hidden w-fit">
              <Button
                variant={viewMode === 'kanban_recebimento' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const recebimentoCategoria = categorias.find(c => c.nome === 'Recebimento');
                  if (recebimentoCategoria) setFilters({ ...filters, categorias: [recebimentoCategoria.id] });
                  setViewMode('kanban_recebimento');
                }}
                className={`rounded-none h-9 gap-1.5 text-xs ${viewMode === 'kanban_recebimento' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                title="Kanban Recebimento"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </Button>
              <Button
                variant={viewMode === 'pendencias_recebimento' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  const recebimentoCategoria = categorias.find(c => c.nome === 'Recebimento');
                  setFilters(prev => ({
                    ...prev,
                    categorias: recebimentoCategoria ? [recebimentoCategoria.id] : prev.categorias,
                    statusList: ['elaboracao', 'execucao'],
                    status: 'all'
                  }));
                  setViewMode('pendencias_recebimento');
                }}
                className={`rounded-none border-l border-blue-200 dark:border-blue-800/60 h-9 gap-1.5 text-xs ${viewMode === 'pendencias_recebimento' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                title="Pendências de Recebimento"
              >
                <InboxIcon className="w-3.5 h-3.5" />
                <span>Pendências</span>
              </Button>
            </div>
          </div>

          {/* Divisor */}
          <div className="h-9 w-px bg-slate-200 dark:bg-slate-700 self-end mb-0.5" />

          {/* TimeSheet */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 px-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> TimeSheet
            </span>
            <div className="flex border border-emerald-200 dark:border-emerald-800/60 rounded-lg overflow-hidden w-fit">
              <Button
                variant={viewMode === 'timesheet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timesheet')}
                className={`rounded-none h-9 gap-1.5 text-xs ${viewMode === 'timesheet' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                title="TimeSheet ao vivo"
              >
                <span className={`w-2 h-2 rounded-full ${viewMode === 'timesheet' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                <span>Ao Vivo</span>
              </Button>
              <Button
                variant={viewMode === 'timesheet_relatorio' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timesheet_relatorio')}
                className={`rounded-none border-l border-emerald-200 dark:border-emerald-800/60 h-9 gap-1.5 text-xs ${viewMode === 'timesheet_relatorio' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                title="Relatório de horas"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Relatório</span>
              </Button>
            </div>
          </div>

        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}