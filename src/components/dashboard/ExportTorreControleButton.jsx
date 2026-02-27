import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { isNoPrazo, isForaPrazo } from '@/components/dashboard/prazoHelpers';
import { differenceInDays } from 'date-fns';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getStatusLabel(status) {
  const map = { elaboracao: 'Em Elaboração', execucao: 'Em Execução', concluido: 'Concluído', cancelado: 'Cancelado' };
  return map[status] || status || '';
}

function getPrazoLabel(os) {
  const hoje = new Date();
  if (!os.prazo) return 'Sem prazo';
  const diasAte = differenceInDays(new Date(os.prazo), hoje);
  if (os.status === 'concluido' || os.status === 'cancelado') return 'Encerrado';
  if (diasAte > 1) return 'No Prazo';
  if (diasAte >= 0) return 'Até 1 dia do Prazo';
  return 'Fora do Prazo';
}

function getKanbanCategory(os) {
  const hoje = new Date();
  if (!os.prazo) return null;
  const dias = differenceInDays(new Date(os.prazo), hoje);
  if (dias > 1) return 'No Prazo';
  if (dias >= 0) return 'Até 1 dia do Prazo';
  return 'Fora do Prazo';
}

function formatDate(val) {
  if (!val) return '';
  try { return new Date(val).toLocaleDateString('pt-BR'); } catch { return val; }
}

function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return 0;
  return parseFloat(val.toFixed(2));
}

function buildOSRow(os, hoje, currentYear) {
  const valorExpedicao = (os.itens_documento || []).reduce((s, item) => s + (item.r_total || 0), 0);
  const valorRecebimento = (os.nfe_itens_conferencia || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0);
  const valorTotal = valorExpedicao + valorRecebimento;
  const numItens = (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length;
  const mes = new Date(os.created_date).getMonth();
  const ano = new Date(os.created_date).getFullYear();
  const noPrazo = isNoPrazo(os, hoje);
  const foraPrazo = isForaPrazo(os, hoje);

  return {
    'Código OS': os.codigo || '',
    'Status': getStatusLabel(os.status),
    'Situação Prazo': noPrazo ? 'No Prazo' : foraPrazo ? 'Fora do Prazo' : '-',
    'Prazo': formatDate(os.prazo),
    'Data Criação': formatDate(os.created_date),
    'Mês Criação': meses[mes] || '',
    'Ano Criação': ano,
    'Mês Ano': `${meses[mes]}/${ano}`,
    'Data Conclusão': formatDate(os.data_conclusao),
    'Líder': pessoas.find(p => p.id === os.lider_id)?.nome || os.lider_id || '',
    'Atendente': os.atendente_nome || '',
    'Categoria': categorias.find(c => c.id === os.categoria_id)?.nome || os.categoria_id || '',
    'Regional': regionais.find(r => r.id === os.regional_id)?.sigla || os.regional_id || '',
    'Almoxarifado': almoxarifados.find(a => a.id === os.almoxarifado_id)?.nome || os.almoxarifado_id || '',
    'Prioridade': os.prioridade || '',
    'Progresso (%)': os.progresso || 0,
    'Nº Itens': numItens,
    'Valor Expedição (R$)': formatCurrency(valorExpedicao),
    'Valor Recebimento (R$)': formatCurrency(valorRecebimento),
    'Valor Total (R$)': formatCurrency(valorTotal),
    'Nº Reserva': os.num_reserva || '',
    'Orgão': os.orgao || '',
    'Vinculação': os.vinculacao || '',
  };
}

function addTotalizadorRow(ws, data, colsNumericas) {
  // Adiciona linha de totalizador em negrito
  const totalRow = {};
  const firstRow = data[0] || {};
  Object.keys(firstRow).forEach(col => {
    if (colsNumericas.includes(col)) {
      totalRow[col] = data.reduce((sum, r) => sum + (parseFloat(r[col]) || 0), 0);
    } else if (col === 'Código OS') {
      totalRow[col] = `TOTAL (${data.length} OS)`;
    } else {
      totalRow[col] = '';
    }
  });
  return totalRow;
}

export default function ExportTorreControleButton({ filteredOrdens, pessoas = [], categorias = [], regionais = [], almoxarifados = [] }) {
  const getNome = (arr, id, campo = 'nome') => arr.find(i => i.id === id)?.[campo] || '';
  const getLiderNome = (id) => pessoas.find(p => p.id === id)?.nome || id || '';
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();
        const hoje = new Date();
        const currentYear = new Date().getFullYear();

        const colsNumericas = ['Nº Itens', 'Valor Expedição (R$)', 'Valor Recebimento (R$)', 'Valor Total (R$)', 'Progresso (%)'];

        // ======= ABA 1: Todas as OS (base completa para drilldown) =======
        const todasRows = filteredOrdens.map(os => buildOSRow(os, hoje, currentYear));
        const totalGeralRow = addTotalizadorRow(null, todasRows, colsNumericas);
        const wsAll = XLSX.utils.json_to_sheet([...todasRows, totalGeralRow]);
        // Destacar linha totalizadora (última linha)
        XLSX.utils.book_append_sheet(wb, wsAll, 'Todas as OS');

        // ======= ABA 2: OS por Prazo - Ano Corrente (mensal) =======
        const osMensalRows = [];
        meses.forEach((mes, index) => {
          const osMes = filteredOrdens.filter(os => {
            const d = new Date(os.created_date);
            return d.getFullYear() === currentYear && d.getMonth() === index;
          });
          const noPrazoList = osMes.filter(os => isNoPrazo(os, hoje));
          const foraPrazoList = osMes.filter(os => isForaPrazo(os, hoje));

          const valorNoPrazo = noPrazoList.reduce((s, os) => {
            const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
            const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
            return s + ve + vr;
          }, 0);

          const valorForaPrazo = foraPrazoList.reduce((s, os) => {
            const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
            const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
            return s + ve + vr;
          }, 0);

          osMes.forEach(os => {
            const noPrazo = isNoPrazo(os, hoje);
            const foraPrazo = isForaPrazo(os, hoje);
            const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
            const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
            osMensalRows.push({
              'Mês': mes,
              'Mês Nº': index + 1,
              'Código OS': os.codigo || '',
              'Status': getStatusLabel(os.status),
              'Situação Prazo': noPrazo ? 'No Prazo' : foraPrazo ? 'Fora do Prazo' : '-',
              'Prazo': formatDate(os.prazo),
              'Data Criação': formatDate(os.created_date),
              'Atendente': os.atendente_nome || '',
              'Líder': pessoas.find(p => p.id === os.lider_id)?.nome || os.lider_id || '',
              'Regional': regionais.find(r => r.id === os.regional_id)?.sigla || os.regional_id || '',
              'Nº Itens': (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length,
              'Valor Expedição (R$)': formatCurrency(ve),
              'Valor Recebimento (R$)': formatCurrency(vr),
              'Valor Total (R$)': formatCurrency(ve + vr),
            });
          });

          if (osMes.length > 0) {
            osMensalRows.push({
              'Mês': `TOTAL ${mes}`,
              'Mês Nº': '',
              'Código OS': `${osMes.length} OS`,
              'Status': '',
              'Situação Prazo': '',
              'Prazo': '',
              'Data Criação': '',
              'Atendente': '',
              'Líder': '',
              'Regional': '',
              'Nº Itens': osMes.reduce((s, os) => s + (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length, 0),
              'Valor Expedição (R$)': '',
              'Valor Recebimento (R$)': '',
              'Valor Total (R$)': formatCurrency(valorNoPrazo + valorForaPrazo),
            });
            osMensalRows.push({ 'Mês': '', 'Mês Nº': '', 'Código OS': `  ↳ No Prazo: ${noPrazoList.length} OS`, 'Status': '', 'Situação Prazo': '', 'Prazo': '', 'Data Criação': '', 'Atendente': '', 'Líder': '', 'Regional': '', 'Nº Itens': '', 'Valor Expedição (R$)': '', 'Valor Recebimento (R$)': '', 'Valor Total (R$)': formatCurrency(valorNoPrazo) });
            osMensalRows.push({ 'Mês': '', 'Mês Nº': '', 'Código OS': `  ↳ Fora do Prazo: ${foraPrazoList.length} OS`, 'Status': '', 'Situação Prazo': '', 'Prazo': '', 'Data Criação': '', 'Atendente': '', 'Líder': '', 'Regional': '', 'Nº Itens': '', 'Valor Expedição (R$)': '', 'Valor Recebimento (R$)': '', 'Valor Total (R$)': formatCurrency(valorForaPrazo) });
            osMensalRows.push({}); // linha em branco separadora
          }
        });

        // Totalizador geral
        const osAnoCorrente = filteredOrdens.filter(os => new Date(os.created_date).getFullYear() === currentYear);
        const totalNoPrazoAnual = osAnoCorrente.filter(os => isNoPrazo(os, hoje)).length;
        const totalForaPrazoAnual = osAnoCorrente.filter(os => isForaPrazo(os, hoje)).length;
        osMensalRows.push({
          'Mês': 'TOTAL ANUAL',
          'Mês Nº': '',
          'Código OS': `${osAnoCorrente.length} OS | No Prazo: ${totalNoPrazoAnual} | Fora: ${totalForaPrazoAnual}`,
          'Status': '',
          'Situação Prazo': '',
          'Prazo': '',
          'Data Criação': '',
          'Atendente': '',
          'Líder': '',
          'Regional': '',
          'Nº Itens': osAnoCorrente.reduce((s, os) => s + (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length, 0),
          'Valor Expedição (R$)': '',
          'Valor Recebimento (R$)': '',
          'Valor Total (R$)': formatCurrency(osAnoCorrente.reduce((s, os) => {
            const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
            const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
            return s + ve + vr;
          }, 0)),
        });

        const wsMensal = XLSX.utils.json_to_sheet(osMensalRows);
        XLSX.utils.book_append_sheet(wb, wsMensal, 'OS por Prazo (Mensal)');

        // ======= ABA 3: Kanban de Execução - Drilldown =======
        const kanbanRows = [];
        const osAbertas = filteredOrdens.filter(os =>
          (os.status === 'elaboracao' || os.status === 'execucao') && os.prazo
        );

        ['elaboracao', 'execucao'].forEach(status => {
          const osList = osAbertas.filter(os => os.status === status);
          ['No Prazo', 'Até 1 dia do Prazo', 'Fora do Prazo'].forEach(categoria => {
            const osCategoria = osList.filter(os => getKanbanCategory(os) === categoria);
            osCategoria.forEach(os => {
              const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
              const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
              const dias = os.prazo ? differenceInDays(new Date(os.prazo), hoje) : null;
              kanbanRows.push({
                'Status': getStatusLabel(status),
                'Categoria Prazo': categoria,
                'Código OS': os.codigo || '',
                'Prazo': formatDate(os.prazo),
                'Dias até Prazo': dias !== null ? dias : '',
                'Data Criação': formatDate(os.created_date),
                'Atendente': os.atendente_nome || '',
                'Líder': os.lider_id || '',
                'Regional': os.regional_id || '',
                'Progresso (%)': os.progresso || 0,
                'Nº Itens': (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length,
                'Valor Total (R$)': formatCurrency(ve + vr),
              });
            });

            if (osCategoria.length > 0) {
              kanbanRows.push({
                'Status': `TOTAL ${getStatusLabel(status)} - ${categoria}`,
                'Categoria Prazo': '',
                'Código OS': `${osCategoria.length} OS`,
                'Prazo': '', 'Dias até Prazo': '', 'Data Criação': '',
                'Atendente': '', 'Líder': '', 'Regional': '', 'Progresso (%)': '',
                'Nº Itens': osCategoria.reduce((s, os) => s + (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length, 0),
                'Valor Total (R$)': formatCurrency(osCategoria.reduce((s, os) => {
                  const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
                  const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
                  return s + ve + vr;
                }, 0)),
              });
              kanbanRows.push({});
            }
          });

          // Subtotal por status
          const totalStatus = osList.length;
          kanbanRows.push({
            'Status': `SUBTOTAL ${getStatusLabel(status)}`,
            'Categoria Prazo': `No Prazo: ${osList.filter(os => getKanbanCategory(os) === 'No Prazo').length} | Até 1 dia: ${osList.filter(os => getKanbanCategory(os) === 'Até 1 dia do Prazo').length} | Fora: ${osList.filter(os => getKanbanCategory(os) === 'Fora do Prazo').length}`,
            'Código OS': `${totalStatus} OS`,
            'Prazo': '', 'Dias até Prazo': '', 'Data Criação': '', 'Atendente': '', 'Líder': '', 'Regional': '', 'Progresso (%)': '', 'Nº Itens': '', 'Valor Total (R$)': '',
          });
          kanbanRows.push({});
          kanbanRows.push({});
        });

        // Totalizador kanban
        kanbanRows.push({
          'Status': 'TOTAL KANBAN EXECUÇÃO',
          'Categoria Prazo': `No Prazo: ${osAbertas.filter(os => getKanbanCategory(os) === 'No Prazo').length} | Até 1 dia: ${osAbertas.filter(os => getKanbanCategory(os) === 'Até 1 dia do Prazo').length} | Fora: ${osAbertas.filter(os => getKanbanCategory(os) === 'Fora do Prazo').length}`,
          'Código OS': `${osAbertas.length} OS abertas`,
          'Prazo': '', 'Dias até Prazo': '', 'Data Criação': '', 'Atendente': '', 'Líder': '', 'Regional': '', 'Progresso (%)': '',
          'Nº Itens': osAbertas.reduce((s, os) => s + (os.itens_documento || []).length + (os.nfe_itens_conferencia || []).length, 0),
          'Valor Total (R$)': formatCurrency(osAbertas.reduce((s, os) => {
            const ve = (os.itens_documento || []).reduce((a, i) => a + (i.r_total || 0), 0);
            const vr = (os.nfe_itens_conferencia || []).reduce((a, i) => a + (parseFloat(i.valor_total) || 0), 0);
            return s + ve + vr;
          }, 0)),
        });

        const wsKanban = XLSX.utils.json_to_sheet(kanbanRows);
        XLSX.utils.book_append_sheet(wb, wsKanban, 'Kanban Execução');

        // Salvar
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getFullYear()}`;
        XLSX.writeFile(wb, `TorreControle_${dateStr}.xlsx`);
      } catch (e) {
        console.error('Erro ao exportar:', e);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      {loading ? 'Exportando...' : 'Exportar Excel'}
    </Button>
  );
}