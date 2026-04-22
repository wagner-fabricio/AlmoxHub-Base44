import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { isNoPrazo, isForaPrazo } from '@/components/dashboard/prazoHelpers';
import { ChevronDown, Filter, X } from 'lucide-react';

const PAGE_SIZE = 100;

const safeFormat = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : format(dt, 'dd/MM/yy');
};

const statusLabels = {
  elaboracao: { label: 'Elaboração', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  execucao: { label: 'Execução', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const prioridadeLabels = {
  baixa: { label: 'Baixa', cls: 'bg-slate-100 text-slate-500' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700' },
  alta: { label: 'Alta', cls: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

const situacaoLabels = ['No Prazo', 'Fora do Prazo', 'Sem prazo'];

// ── Filter Dropdown ───────────────────────────────────────────────────────────
function FilterDropdown({ options, selected, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = selected.length > 0;

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={`ml-1 p-0.5 rounded transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        title={`Filtrar ${label}`}
      >
        <Filter className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg min-w-[160px] max-h-60 overflow-y-auto py-1">
          {isActive && (
            <button
              onClick={() => { onChange([]); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 border-b border-slate-100 dark:border-slate-700"
            >
              <X className="w-3 h-3" /> Limpar filtro
            </button>
          )}
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sort + Filter Th ──────────────────────────────────────────────────────────
function ColTh({ col, children, sortCol, sortDir, onSort, filterOptions, filterSelected, onFilter, align = 'left' }) {
  const isActive = sortCol === col;
  return (
    <th className={`px-3 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 whitespace-nowrap text-${align}`}>
      <span className="inline-flex items-center gap-0.5">
        <button
          onClick={() => onSort(col)}
          className="inline-flex items-center gap-0.5 hover:text-blue-600 transition-colors cursor-pointer select-none"
        >
          {children}
          <span className={`ml-0.5 ${isActive ? 'text-blue-600' : 'opacity-30'}`}>
            {isActive ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </button>
        {filterOptions && (
          <FilterDropdown
            options={filterOptions}
            selected={filterSelected || []}
            onChange={onFilter}
            label={typeof children === 'string' ? children : col}
          />
        )}
      </span>
    </th>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TorreControleDadosTabela({ filteredOrdens, pessoas = [], categorias = [], almoxarifados = [], onOpenOS }) {
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('created_date');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({});

  const hoje = new Date();

  const rows = useMemo(() => {
    return filteredOrdens.map(os => {
      const categoria = categorias.find(c => c.id === os.categoria_id);
      const lider = pessoas.find(p => p.id === os.lider_id);
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      const noPrazo = isNoPrazo(os, hoje);
      const foraPrazo = isForaPrazo(os, hoje);
      const diasPrazo = os.prazo ? differenceInDays(new Date(os.prazo), hoje) : null;
      const valorTotal = (os.itens_documento || []).reduce((s, i) => s + (i.r_total || 0), 0)
        + (os.nfe_itens_conferencia || []).reduce((s, i) => s + (parseFloat(i.valor_total) || 0), 0);
      const numItens = (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length;
      const tempoPrevistoD = (os.data_inicial && os.prazo)
        ? differenceInDays(new Date(os.prazo), new Date(os.data_inicial)) : null;

      const situacao = !os.prazo ? 'Sem prazo' : noPrazo ? 'No Prazo' : 'Fora do Prazo';

      return { os, categoria, lider, almox, noPrazo, foraPrazo, diasPrazo, valorTotal, numItens, tempoPrevistoD, situacao };
    });
  }, [filteredOrdens, categorias, pessoas, almoxarifados]);

  // Unique values for filterable columns
  const filterOptions = useMemo(() => ({
    status: [...new Set(rows.map(r => statusLabels[r.os.status]?.label || r.os.status).filter(Boolean))].sort(),
    prioridade: [...new Set(rows.map(r => prioridadeLabels[r.os.prioridade]?.label || r.os.prioridade).filter(Boolean))].sort(),
    categoria: [...new Set(rows.map(r => r.categoria?.nome || '—'))].sort(),
    almox: [...new Set(rows.map(r => r.almox?.nome || '—'))].sort(),
    lider: [...new Set(rows.map(r => r.lider?.nome || '—'))].sort(),
    situacao: situacaoLabels,
  }), [rows]);

  const setFilter = (col, val) => {
    setFilters(f => ({ ...f, [col]: val }));
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v.length > 0).length;

  const clearAllFilters = () => { setFilters({}); setPage(1); };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.status?.length && !filters.status.includes(statusLabels[r.os.status]?.label || r.os.status)) return false;
      if (filters.prioridade?.length && !filters.prioridade.includes(prioridadeLabels[r.os.prioridade]?.label || r.os.prioridade)) return false;
      if (filters.categoria?.length && !filters.categoria.includes(r.categoria?.nome || '—')) return false;
      if (filters.almox?.length && !filters.almox.includes(r.almox?.nome || '—')) return false;
      if (filters.lider?.length && !filters.lider.includes(r.lider?.nome || '—')) return false;
      if (filters.situacao?.length && !filters.situacao.includes(r.situacao)) return false;
      return true;
    });
  }, [rows, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'codigo': va = a.os.codigo || ''; vb = b.os.codigo || ''; break;
        case 'categoria': va = a.categoria?.nome || ''; vb = b.categoria?.nome || ''; break;
        case 'almox': va = a.almox?.nome || ''; vb = b.almox?.nome || ''; break;
        case 'lider': va = a.lider?.nome || ''; vb = b.lider?.nome || ''; break;
        case 'status': va = a.os.status || ''; vb = b.os.status || ''; break;
        case 'prioridade': va = a.os.prioridade || ''; vb = b.os.prioridade || ''; break;
        case 'prazo': va = a.os.prazo || ''; vb = b.os.prazo || ''; break;
        case 'progresso': va = a.os.progresso || 0; vb = b.os.progresso || 0; break;
        case 'diasPrazo': va = a.diasPrazo ?? 99999; vb = b.diasPrazo ?? 99999; break;
        case 'valorTotal': va = a.valorTotal; vb = b.valorTotal; break;
        case 'numItens': va = a.numItens; vb = b.numItens; break;
        case 'tempoPrevistoD': va = a.tempoPrevistoD ?? 99999; vb = b.tempoPrevistoD ?? 99999; break;
        default: va = a.os.created_date || ''; vb = b.os.created_date || '';
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const thProps = (col, filterKey) => ({
    col, sortCol, sortDir, onSort: handleSort,
    filterOptions: filterKey ? filterOptions[filterKey] : undefined,
    filterSelected: filterKey ? (filters[filterKey] || []) : undefined,
    onFilter: filterKey ? (val) => setFilter(filterKey, val) : undefined,
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }} />
            Dados dos Indicadores
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {sorted.length}{sorted.length !== rows.length ? ` de ${rows.length}` : ''} OS
            {sorted.length > 0 && ` · Exibindo ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, sorted.length)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          {totalPages > 1 && (
            <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <ColTh {...thProps('codigo')} >Nº OS</ColTh>
              <ColTh {...thProps('status', 'status')}>Status</ColTh>
              <ColTh {...thProps('prioridade', 'prioridade')}>Prioridade</ColTh>
              <ColTh {...thProps('categoria', 'categoria')}>Categoria</ColTh>
              <ColTh {...thProps('almox', 'almox')}>Almoxarifado</ColTh>
              <ColTh {...thProps('lider', 'lider')}>Líder</ColTh>
              <th className="px-3 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left whitespace-nowrap">Criado em</th>
              <ColTh {...thProps('prazo')}>Prazo</ColTh>
              <ColTh {...thProps('diasPrazo')} align="right">Dias p/ Prazo</ColTh>
              <ColTh {...thProps('progresso')} align="right">Progresso</ColTh>
              <ColTh {...thProps('tempoPrevistoD')} align="right">Tempo Previsto</ColTh>
              <ColTh {...thProps('numItens')} align="right">Itens</ColTh>
              <ColTh {...thProps('valorTotal')} align="right">Valor Total</ColTh>
              <ColTh {...thProps('situacao', 'situacao')} align="center">Situação Prazo</ColTh>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-12 text-slate-400">Nenhuma OS encontrada</td>
              </tr>
            )}
            {pageRows.map(({ os, categoria, lider, almox, noPrazo, diasPrazo, valorTotal, numItens, tempoPrevistoD, situacao }, idx) => {
              const st = statusLabels[os.status];
              const prio = prioridadeLabels[os.prioridade];

              let diasColor = 'text-slate-500';
              let diasLabel = '—';
              if (diasPrazo !== null) {
                diasLabel = diasPrazo === 0 ? 'Hoje' : diasPrazo > 0 ? `+${diasPrazo}d` : `${diasPrazo}d`;
                if (diasPrazo < 0) diasColor = 'text-red-600 font-semibold';
                else if (diasPrazo <= 3) diasColor = 'text-amber-600 font-semibold';
                else diasColor = 'text-green-600';
              }

              return (
                <tr
                  key={os.id}
                  className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button onClick={() => onOpenOS && onOpenOS(os)} className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                      {os.codigo || os.id?.substring(0, 8)}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {st ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span> : '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {prio ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${prio.cls}`}>{prio.label}</span> : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[140px] truncate">{categoria?.nome || '—'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[140px] truncate">{almox?.nome || '—'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{lider?.nome || '—'}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap text-slate-500">{safeFormat(os.created_date)}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap text-slate-500">{safeFormat(os.prazo)}</td>
                  <td className={`px-3 py-2 text-right whitespace-nowrap ${diasColor}`}>{diasLabel}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${os.progresso || 0}%`, background: (os.progresso || 0) >= 100 ? '#22c55e' : '#3b82f6' }} />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 w-8 text-right">{os.progresso || 0}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-slate-500">{tempoPrevistoD !== null ? `${tempoPrevistoD}d` : '—'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">{numItens > 0 ? numItens : '—'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {valorTotal > 0 ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {situacao === 'Sem prazo' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Sem prazo</span>
                    ) : situacao === 'No Prazo' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">No Prazo</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Fora do Prazo</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-xs text-slate-400">Página {safePage} de {totalPages} · {PAGE_SIZE} por página</p>
          <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

function PaginationBar({ page, totalPages, onChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);
  return (
    <div className="flex items-center gap-1">
      <PagBtn onClick={() => onChange(1)} disabled={page === 1}>«</PagBtn>
      <PagBtn onClick={() => onChange(page - 1)} disabled={page === 1}>‹</PagBtn>
      {pages.map((p, i) => p === '...'
        ? <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
        : <PagBtn key={p} onClick={() => onChange(p)} active={page === p}>{p}</PagBtn>
      )}
      <PagBtn onClick={() => onChange(page + 1)} disabled={page === totalPages}>›</PagBtn>
      <PagBtn onClick={() => onChange(totalPages)} disabled={page === totalPages}>»</PagBtn>
    </div>
  );
}

function PagBtn({ onClick, disabled, active, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${active
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40'}`}>
      {children}
    </button>
  );
}