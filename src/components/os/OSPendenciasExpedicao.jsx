import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';
import { Package, Layers, Weight, DollarSign, ClipboardList } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yy', { locale: ptBR }); } catch { return '—'; }
}

function fmtNum(n, decimals = 2) {
  if (n == null || n === 0) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n) {
  if (n == null || n === 0) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const COLS = [
  { col: 'codigo',           label: 'Nº OS',             filter: false, align: 'left',  width: 'min-w-[155px]' },
  { col: 'status',           label: 'Status',            filter: true,  align: 'left',  width: 'w-28' },
  { col: 'subcats',          label: 'Subcategoria',      filter: true,  align: 'left',  width: 'w-36' },
  { col: 'descricao_resumida', label: 'Descrição',       filter: false, align: 'left',  width: 'min-w-[160px]' },
  { col: 'num_reserva',      label: 'Nº Reserva',        filter: true,  align: 'left',  width: 'w-28' },
  { col: 'num_migo',         label: 'Nº MIGO',           filter: false, align: 'left',  width: 'w-28' },
  { col: 'orgao',            label: 'Órgão',             filter: true,  align: 'left',  width: 'w-32' },
  { col: 'usuario_reserva',  label: 'Nome Usuário',      filter: true,  align: 'left',  width: 'w-36' },
  { col: 'instalacaoDestino', label: 'Inst. Destino',    filter: true,  align: 'left',  width: 'min-w-[150px]' },
  { col: 'data_migo',        label: 'Data MIGO',         filter: false, align: 'center', width: 'w-24' },
  { col: 'data_necessidade', label: 'Data Neces.',       filter: false, align: 'center', width: 'w-24' },
  { col: 'totalItens',       label: 'Itens',             filter: false, align: 'right', width: 'w-14' },
  { col: 'totalVolumes',     label: 'Volumes',           filter: false, align: 'right', width: 'w-16' },
  { col: 'm3Total',          label: 'M³',                filter: false, align: 'right', width: 'w-20' },
  { col: 'pesoTotal',        label: 'Peso (kg)',         filter: false, align: 'right', width: 'w-24' },
  { col: 'valorTotal',       label: 'Valor Total',       filter: false, align: 'right', width: 'w-32' },
];

export default function OSPendenciasExpedicao({ ordens, categorias, subcategorias, instalacoes, onOSClick }) {
  const categoriaExpedicao = categorias?.find(c => c.nome?.toLowerCase().includes('expedi'));
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters();

  const enriched = useMemo(() => {
    if (!categoriaExpedicao) return [];
    return ordens
      .filter(os => os.categoria_id === categoriaExpedicao.id && (os.status === 'elaboracao' || os.status === 'execucao'))
      .map(os => {
        const subcatNomes = (os.subcategorias_ids || [])
          .map(id => subcategorias?.find(s => s.id === id)?.nome)
          .filter(Boolean)
          .join(', ');
        const instalacaoDestino = instalacoes?.find(i => i.id === os.instalacao_destino_id)?.nome || '—';
        const totalItens = (os.itens_documento || []).length;
        const totalVolumes = (os.volumes || []).reduce((s, v) => s + (v.quantidade || 1), 0);
        const m3Total = (os.volumes || []).reduce((s, v) => s + (v.m3 || 0), 0);
        const pesoTotal = (os.volumes || []).reduce((s, v) => s + ((v.peso_bruto || 0) * (v.quantidade || 1)), 0);
        const valorTotal = (os.itens_documento || []).reduce((s, i) => s + (i.r_total || 0), 0);
        return { os, subcats: subcatNomes, instalacaoDestino, totalItens, totalVolumes, m3Total, pesoTotal, valorTotal };
      });
  }, [ordens, categoriaExpedicao, subcategorias, instalacoes]);

  const getUniqueValues = (col) => {
    const vals = enriched.map(r => {
      if (col === 'status') return r.os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução';
      if (col === 'subcats') return r.subcats || '—';
      if (col === 'instalacaoDestino') return r.instalacaoDestino;
      if (col === 'num_reserva') return r.os.num_reserva || '—';
      if (col === 'orgao') return r.os.orgao || '—';
      if (col === 'usuario_reserva') return r.os.usuario_reserva || '—';
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
              : col === 'instalacaoDestino' ? r.instalacaoDestino
              : col === 'num_reserva' ? (r.os.num_reserva || '—')
              : col === 'orgao' ? (r.os.orgao || '—')
              : col === 'usuario_reserva' ? (r.os.usuario_reserva || '—')
              : '—';
      return values.includes(v);
    });
  });

  // Sort
  if (sortConfig.column && sortConfig.direction) {
    rows.sort((a, b) => {
      const col = sortConfig.column;
      let va, vb;
      const strCols = { codigo: 'os.codigo', subcats: 'subcats', descricao_resumida: 'os.descricao_resumida',
        num_reserva: 'os.num_reserva', num_migo: 'os.num_migo', orgao: 'os.orgao',
        usuario_reserva: 'os.usuario_reserva', instalacaoDestino: 'instalacaoDestino',
        data_migo: 'os.data_migo', data_necessidade: 'os.data_necessidade', status: 'os.status' };
      const numCols = ['totalItens', 'totalVolumes', 'm3Total', 'pesoTotal', 'valorTotal'];
      if (strCols[col]) {
        const parts = strCols[col].split('.');
        va = parts.length === 2 ? (a[parts[0]]?.[parts[1]] || '') : (a[col] || '');
        vb = parts.length === 2 ? (b[parts[0]]?.[parts[1]] || '') : (b[col] || '');
      } else if (numCols.includes(col)) {
        va = a[col] ?? 0; vb = b[col] ?? 0;
      } else { va = ''; vb = ''; }
      if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
      if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totals = useMemo(() => ({
    totalItens: rows.reduce((s, r) => s + r.totalItens, 0),
    totalVolumes: rows.reduce((s, r) => s + r.totalVolumes, 0),
    m3Total: rows.reduce((s, r) => s + r.m3Total, 0),
    pesoTotal: rows.reduce((s, r) => s + r.pesoTotal, 0),
    valorTotal: rows.reduce((s, r) => s + r.valorTotal, 0),
  }), [rows]);

  if (!categoriaExpedicao) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center text-slate-400">
        Categoria de Expedição não encontrada.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Pendências de Expedição</h3>
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
        </div>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 dark:bg-slate-600 border-b border-slate-200 dark:border-slate-600">
          {[
            { icon: ClipboardList, label: 'Total Itens', value: totals.totalItens.toLocaleString('pt-BR'), color: 'text-blue-600' },
            { icon: Layers, label: 'Total Volumes', value: totals.totalVolumes.toLocaleString('pt-BR'), color: 'text-purple-600' },
            { icon: Package, label: 'M³ Total', value: totals.m3Total > 0 ? fmtNum(totals.m3Total, 3) : '—', color: 'text-orange-600' },
            { icon: Weight, label: 'Peso Total (kg)', value: totals.pesoTotal > 0 ? fmtNum(totals.pesoTotal, 0) : '—', color: 'text-emerald-600' },
            { icon: DollarSign, label: 'Valor Total', value: totals.valorTotal > 0 ? fmtCurrency(totals.valorTotal) : '—', color: 'text-green-600' },
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
          <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma OS de expedição pendente</p>
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
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{r.os.num_reserva || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{r.os.num_migo || '—'}</td>
                    <td className="px-3 py-2 max-w-[128px] truncate text-slate-700 dark:text-slate-300" title={r.os.orgao}>{r.os.orgao || '—'}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate text-slate-700 dark:text-slate-300" title={r.os.usuario_reserva}>{r.os.usuario_reserva || '—'}</td>
                    <td className="px-3 py-2 max-w-[150px] truncate text-slate-700 dark:text-slate-300" title={r.instalacaoDestino}>{r.instalacaoDestino}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">{fmtDate(r.os.data_migo)}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">{fmtDate(r.os.data_necessidade)}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{r.totalItens || '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{r.totalVolumes || '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{r.m3Total > 0 ? fmtNum(r.m3Total, 3) : '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{r.pesoTotal > 0 ? fmtNum(r.pesoTotal, 2) : '—'}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800 dark:text-slate-200">{r.valorTotal > 0 ? fmtCurrency(r.valorTotal) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-700 border-t-2 border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white">
                <td className="px-3 py-2.5 text-xs" colSpan={11}>
                  TOTAIS · {rows.length} OS
                </td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.totalItens > 0 ? totals.totalItens.toLocaleString('pt-BR') : '—'}</td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.totalVolumes > 0 ? totals.totalVolumes.toLocaleString('pt-BR') : '—'}</td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.m3Total > 0 ? fmtNum(totals.m3Total, 3) : '—'}</td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.pesoTotal > 0 ? fmtNum(totals.pesoTotal, 0) : '—'}</td>
                <td className="px-3 py-2.5 text-right text-xs">{totals.valorTotal > 0 ? fmtCurrency(totals.valorTotal) : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}