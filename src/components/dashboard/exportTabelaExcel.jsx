import * as XLSX from 'xlsx';

/**
 * Exporta uma tabela como arquivo Excel.
 * @param {Array<Object>} rows - Linhas já no formato { Coluna: valor, ... }
 * @param {string} fileName - Nome base do arquivo (sem extensão)
 * @param {string} sheetName - Nome da aba dentro da planilha
 */
export function exportTabelaExcel(rows, fileName = 'export', sheetName = 'Dados') {
  if (!rows || rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileName}_${today}.xlsx`);
}

/**
 * Exporta múltiplas tabelas, cada uma em sua própria aba, num único arquivo Excel.
 * @param {Array<{ rows: Array<Object>, sheetName: string }>} sheets - Lista de abas
 * @param {string} fileName - Nome base do arquivo (sem extensão)
 */
export function exportTabelasExcel(sheets, fileName = 'export') {
  const validSheets = (sheets || []).filter(s => s.rows && s.rows.length > 0);
  if (validSheets.length === 0) return;
  const wb = XLSX.utils.book_new();
  validSheets.forEach(({ rows, sheetName }) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Dados').slice(0, 31));
  });
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileName}_${today}.xlsx`);
}