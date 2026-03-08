import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Edit, Trash2, FolderKanban, ChevronDown, ChevronRight, ExternalLink, Clock, CheckCircle, Loader2, AlertTriangle, User, Square } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500', label: 'Elaboração' },
  execucao: { icon: Loader2, color: 'text-blue-500', label: 'Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500', label: 'Cancelado' },
};

const PROJETO_STATUS = [
  { value: 'ativo', label: 'Ativo', className: 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' },
  { value: 'parado', label: 'Parado', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer' },
  { value: 'concluido', label: 'Concluído', className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer' },
  { value: 'cancelado', label: 'Cancelado', className: 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer' },
];

const STATUS_ORDER = ['ativo', 'parado', 'concluido', 'cancelado'];

function getStatusConfig(status) {
  return PROJETO_STATUS.find(s => s.value === status) || PROJETO_STATUS[0];
}

export default function ProjetosList({ 
  projetos, 
  ordens,
  pessoas,
  categorias,
  almoxarifados = [],
  onEdit, 
  onDelete,
  onOpenOS,
  onStatusChange
}) {
  const [columnFilters, setColumnFilters] = useState({ nome: [], status_projeto: [] });
  const [expandedProjetoId, setExpandedProjetoId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [localStatus, setLocalStatus] = useState({});

  const getOSCount = (projetoId) => {
    if (!Array.isArray(ordens)) return 0;
    return ordens.filter(os => os?.projetos_ids?.includes(projetoId)).length;
  };

  const getProjetoExecutores = (projetoId) => {
    if (!Array.isArray(ordens)) return [];
    const projetoOrdens = ordens.filter(os => os?.projetos_ids?.includes(projetoId));
    const executoresIds = new Set();
    projetoOrdens.forEach(os => {
      if (os?.executores_ids && Array.isArray(os.executores_ids)) {
        os.executores_ids.forEach(id => id && executoresIds.add(id));
      }
    });
    return Array.from(executoresIds);
  };

  const getProjetoOrdens = (projetoId) => {
    if (!Array.isArray(ordens)) return [];
    return ordens.filter(os => os?.projetos_ids?.includes(projetoId));
  };

  const toggleExpanded = (projetoId) => {
    setExpandedProjetoId(expandedProjetoId === projetoId ? null : projetoId);
  };

  const handleToggleStatus = async (e, projeto) => {
    e.stopPropagation();
    const currentIndex = STATUS_ORDER.indexOf(projeto.status_projeto || 'ativo');
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
    setUpdatingStatus(projeto.id);
    await base44.entities.Projeto.update(projeto.id, { status_projeto: nextStatus });
    onStatusChange?.();
    setUpdatingStatus(null);
  };

  const getUniqueNomes = () => {
    return [...new Set(projetos.map(p => p.nome))].sort();
  };

  const toggleFilter = (column, value) => {
    setColumnFilters(prev => {
      const current = prev[column];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  const clearFilter = (column) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
  };

  const filteredProjetos = Array.isArray(projetos) ? projetos.filter(projeto => {
    if (!projeto) return false;
    if (columnFilters.nome.length > 0 && !columnFilters.nome.includes(projeto.nome)) return false;
    const status = projeto.status_projeto || 'ativo';
    if (columnFilters.status_projeto.length > 0 && !columnFilters.status_projeto.includes(status)) return false;
    return true;
  }) : [];

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
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('nome')} className="h-6 text-xs">Limpar</Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getUniqueNomes().map(value => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox checked={columnFilters.nome.includes(value)} onCheckedChange={() => toggleFilter('nome', value)} />
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
            <TableHead className="font-semibold">Líder</TableHead>
            <TableHead className="font-semibold">Almoxarifado</TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                Status
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Filter className={`w-3 h-3 ${columnFilters.status_projeto.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-semibold">Filtrar Status</span>
                        {columnFilters.status_projeto.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => clearFilter('status_projeto')} className="h-6 text-xs">Limpar</Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {PROJETO_STATUS.map(s => (
                          <label key={s.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded">
                            <Checkbox checked={columnFilters.status_projeto.includes(s.value)} onCheckedChange={() => toggleFilter('status_projeto', s.value)} />
                            <Badge className={s.className.replace('hover:bg-green-200', '').replace('hover:bg-yellow-200', '').replace('hover:bg-blue-200', '').replace('hover:bg-red-200', '').replace('cursor-pointer', '')}>{s.label}</Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjetos.map((projeto) => {
            const osCount = getOSCount(projeto.id);
            const projetoOrdens = getProjetoOrdens(projeto.id);
            const isExpanded = expandedProjetoId === projeto.id;
            const lider = Array.isArray(pessoas) ? pessoas.find(p => p?.id === projeto.lider_id) : null;
            const almoxarifado = almoxarifados.find(a => a.id === projeto.almoxarifado_id);
            const statusAtual = getStatusConfig(localStatus[projeto.id] || projeto.status_projeto || 'ativo');

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
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${projeto.cor}20` }}>
                        <FolderKanban className="w-4 h-4" style={{ color: projeto.cor }} />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{projeto.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{projeto.descricao || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {lider ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900 dark:text-white">{lider?.nome || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{almoxarifado?.nome || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusAtual.className} select-none`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (updatingStatus === projeto.id) return;
                        const currentStatus = localStatus[projeto.id] || projeto.status_projeto || 'ativo';
                        const currentIndex = STATUS_ORDER.indexOf(currentStatus);
                        const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
                        setLocalStatus(prev => ({ ...prev, [projeto.id]: nextStatus }));
                        setUpdatingStatus(projeto.id);
                        await base44.entities.Projeto.update(projeto.id, { status_projeto: nextStatus });
                        setUpdatingStatus(null);
                      }}
                    >
                      {updatingStatus === projeto.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {statusAtual.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(projeto); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(projeto); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="p-0 pl-10 pr-4 pb-4">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ordens de Serviço</span>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Código</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Descrição</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Categoria</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Líder</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Almoxarifado</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Data Inicial</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Data Conclusão</th>
                              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2 w-40">Progresso</th>
                              <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projetoOrdens.map((os, idx) => {
                              const osLider = Array.isArray(pessoas) ? pessoas.find(p => p?.id === os.lider_id) : null;
                              const categoria = Array.isArray(categorias) ? categorias.find(c => c?.id === os.categoria_id) : null;
                              const almoxOS = almoxarifados.find(a => a.id === os.almoxarifado_id);
                              const progresso = os.progresso || 0;
                              const progressColor = progresso === 100 ? '#10b981' : progresso >= 50 ? '#0000FF' : '#FF6B00';

                              return (
                                <tr key={`os-${os.id}`} className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${idx < projetoOrdens.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300 font-medium">{os.codigo}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{os.descricao_resumida || os.anotacoes || '-'}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">{categoria?.nome || '-'}</td>
                                  <td className="px-4 py-2.5 text-xs text-blue-600 dark:text-blue-400 font-medium">{osLider?.nome || '-'}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">{almoxOS?.nome || '-'}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">{os.data_inicial || '-'}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">{os.data_conclusao || '-'}</td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${progresso}%`, backgroundColor: progressColor }} />
                                      </div>
                                      <span className="text-xs font-bold w-8 shrink-0" style={{ color: progressColor }}>{progresso}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); onOpenOS?.(os); }}>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Abrir
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}