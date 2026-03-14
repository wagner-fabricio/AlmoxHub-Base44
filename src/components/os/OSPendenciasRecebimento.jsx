import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';
import { Package, DollarSign, ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yy', { locale: ptBR }); } catch { return '—'; }
}

function fmtCurrency(n) {
  if (n == null || n === 0) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const COLS = [
  { col: 'codigo',              label: 'Nº OS',               filter: false, align: 'left',  width: 'min-w-[155px]' },
  { col: 'status',              label: 'Status',              filter: true,  align: 'left',  width: 'w-28' },
  { col: 'subcats',             label: 'Subcategoria',        filter: true,  align: 'left',  width: 'w-36' },
  { col: 'descricao_resumida',  label: 'Descrição',           filter: false, align: 'left',  width: 'min-w-[160px]' },
  { col: 'almoxarifado',        label: 'Almoxarifado',        filter: true,  align: 'left',  width: 'min-w-[140px]' },
  { col: 'nfe_numero_receb',    label: 'Nº NF',               filter: false, align: 'left',  width: 'w-28' },
  { col: 'numero_migo_receb',   label: 'Nº MIGO',             filter: false, align: 'left',  width: 'w-28' },
  { col: 'data_recebimento',    label: 'Data Receb.',         filter: false, align: 'center', width: 'w-24' },
  { col: 'data_migo_receb',     label: 'Data MIGO',           filter: false, align: 'center', width: 'w-24' },
  { col: 'responsavel_recebimento', label: 'Responsável',     filter: true,  align: 'left',  width: 'min-w-[130px]' },
  { col: 'totalItens',          label: 'Itens',               filter: false, align: 'right', width: 'w-14' },
  { col: 'valorTotal',          label: 'Valor Total',         filter: false, align: 'right', width: 'w-32' },
  { col: 'problema_recebimento', label: 'Problema?',          filter: true,  align: 'center', width: 'w-24' },
  { col: 'data_solucao',        label: 'Data Solução',        filter: false, align: 'center', width: 'w-24' },
];

export default function OSPendenciasRecebimento({ ordens, categorias, subcategorias, almoxarifados, onOSClick }) {
  const categoriaRecebimento = categorias?.find(c => c.nome?.toLowerCase().includes('recebimento'));
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters();

  const enriched = useMemo(() => {
    if (!categoriaRecebimento) return [];
    return ordens
      .filter(os => os.categoria_id === categoriaRecebimento.id && (os.status === 'elaboracao' || os.status === 'execucao'))
      .map(os => {
        const subcatNomes = (os.subcategorias_ids || [])
          .map(id => subcategorias?.find(s => s.id === id)?.nome)
          .filter(Boolean)
          .join(', ');
        const almoxNome = almoxarifados?.find(a => a.id === os.almoxarifado_id)?.nome || '—';
        const totalItens = (os.nfe_itens_conferencia || []).length || (os.itens_documento || []).length;
        const valorTotal = (os.nfe_itens_conferencia || []).reduce((s, i) => s + ((i.quantidade_esperada || 0) * (i.valor_unitario || 0)), 0)
          || (os.itens_documento || []).reduce((s, i) => s + (i.r_total || 0), 0);
        return {
          os,
          subcats: subcatNomes,
          almoxNome,
          totalItens,
          valorTotal,
        };
      });
  }, [ordens, categoriaRecebimento, subcategorias, almoxarifados]);

  const getUniqueValues = (col) => {
    const vals = enriched.map(r => {
      if (col === 'status') return r.os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução';
      if (col === 'subcats') return r.subcats || '—';
      if (col === 'almoxarifado') return r.almoxNome;
      if (col === 'responsavel_recebimento') return r.os.responsavel_recebimento || '—';
      if (col === 'problema_recebimento') return r.os.problema_recebimento ? 'Sim' : 'Não';
      return '—';
    });
    return [...new Set(vals)].sort();
  };

  let rows = [...enriched];

  // Apply column filters
  Object.entries(columnFilters).forEach(([col, values]) => {
    if (!values?.length) return;
    rows = rows.filter(r => {
      const v = col === 'status' ? (r.os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução')
              : col === 'subcats' ? (r.subcats || '—')
              : col === 'almoxarifado' ? r.almoxNome
              : col === 'responsavel_recebimento' ? (r.os.responsavel_recebimento || '—')
              : col === 'problema_recebimento' ? (r.os.problema_recebimento ? 'Sim' : 'Não')
              : '—';
      return values.includes(v);
    });
  });

  // Sort
  if (sortConfig.column && sortConfig.direction) {
    rows.sort((a, b) => {
      const col = sortConfig.column;
      let va, vb;
      const numCols = ['totalItens', 'valorTotal'];
      if (numCols.includes(col)) {
        va = a[col] ?? 0; vb = b[col] ?? 0;
      } else {
        const osField = ['nfe_numero_receb', 'numero_migo_receb', 'data_recebimento', 'data_migo_receb',
          'responsavel_recebimento', 'descricao_resumida', 'codigo'].includes(col);
        va = osField ? (a.os[col] || '') : col === 'subcats' ? a.subcats : col === 'almoxarifado' ? a.almoxNome : col === 'status' ? a.os.status : '';
        vb = osField ? (b.os[col] || '') : col === 'subcats' ? b.subcats : col === 'almoxarifado' ? b.almoxNome : col === 'status' ? b.os.status : '';
      }
      if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
      if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totals = useMemo(() => ({
    totalItens: rows.reduce((s, r) => s + r.totalItens, 0),
    valorTotal: rows.reduce((s, r) => s + r.valorTotal, 0),
  }), [rows]);

  if (!categoriaRecebimento) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center text-slate-400">
        Categoria de Recebimento não encontrada.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Pendências de Recebimento</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            OS com status Em Elaboração e Em Execução
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
            {rows.length} OS
          </span>
          <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium rounded-full">
            {rows.filter(r => r.os.status === 'elaboracao').length} Elaboração
          </span>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium rounded-full">
            {rows.filter(r => r.os.status === 'execucao').length} Execução
          </span>
          <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium rounded-full">
            {rows.filter(r => r.os.problema_recebimento).length} c/ Problema
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-600 border-b border-slate-200 dark:border-slate-600">
          {[
            { icon: ClipboardList, label: 'Total OS', value: rows.length.toString(), color: 'text-blue-600' },
            { icon: Package, label: 'Total Itens', value: totals.totalItens.toLocaleString('pt-BR'), color: 'text-purple-600' },
            { icon: DollarSign, label: 'Valor Total', value: totals.valorTotal > 0 ? fmtCurrency(totals.valorTotal) : '—', color: 'text-green-600' },
            { icon: AlertCircle, label: 'Com Problema', value: rows.filter(r => r.os.problema_recebimento).length.toString(), color: 'text-red-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
                <p className={`text-sm font-bold truncate ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma OS de recebimento pendente</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Os filtros aplicados não retornaram resultados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 sticky top-0">
                {COLS.map(({ col, label, filter, width }) => (
                  <th key={col} className={`px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left ${width}`}>
                    <SortableTableHead
                      label={label}
                      column={col}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      filterConfig={filter ? columnFilters : null}
                      onToggleFilter={toggleFilter}
                      onClearFilter={clearFilter}
                      getUniqueValues={getUniqueValues}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const isElaboracao = r.os.status === 'elaboracao';
                const temProblema = r.os.problema_recebimento;
                return (
                  <tr
                    key={r.os.id}
                    onClick={() => onOSClick(r.os)}
                    className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors
                      ${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-700/20' : ''}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {r.os.codigo || r.os.id?.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        isElaboracao
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {isElaboracao ? 'Elaboração' : 'Execução'}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[140px] truncate text-slate-700 dark:text-slate-300" title={r.subcats}>{r.subcats || '—'}</td>
                    <td className="px-3 py-2 max-w-[160px] truncate text-slate-600 dark:text-slate-400" title={r.os.descricao_resumida}>{r.os.descricao_resumida || '—'}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate text-slate-700 dark:text-slate-300" title={r.almoxNome}>{r.almoxNome}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{r.os.nfe_numero_receb || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{r.os.numero_migo_receb || '—'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">{fmtDate(r.os.data_recebimento)}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">{fmtDate(r.os.data_migo_receb)}</td>
                    <td className="px-3 py-2 max-w-[130px] truncate text-slate-700 dark:text-slate-300" title={r.os.responsavel_recebimento}>{r.os.responsavel_recebimento || '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{r.totalItens || '—'}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800 dark:text-slate-200">{r.valorTotal > 0 ? fmtCurrency(r.valorTotal) : '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {temProblema
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" />Sim</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />Não</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">{fmtDate(r.os.data_solucao)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-700 border-t-2 border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white">
                <td className="px-3 py-2.5 text-xs" colSpan={10}>
                  TOTAIS · {rows.length} OS
                </td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.totalItens > 0 ? totals.totalItens.toLocaleString('pt-BR') : '—'}</td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.valorTotal > 0 ? fmtCurrency(totals.valorTotal) : '—'}</td>
                <td className="px-3 py-2.5 text-center text-xs">{rows.filter(r => r.os.problema_recebimento).length} c/ prob.</td>
                <td className="px-3 py-2.5 text-xs"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}