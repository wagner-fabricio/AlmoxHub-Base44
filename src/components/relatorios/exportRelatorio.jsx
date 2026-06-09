import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import { format } from 'date-fns';

// ============== HTML ==============
export async function exportToHTML(elementId, orientacao = 'retrato') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const isLandscape = orientacao === 'paisagem';
  const maxWidth = isLandscape ? '1400px' : '1000px';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Gerencial - AlmoxHub</title>
<style>
  @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 1cm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
  .container { max-width: ${maxWidth}; margin: 0 auto; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<div class="container">${el.outerHTML}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-gerencial-${format(new Date(), 'yyyy-MM-dd-HHmm')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============== PDF ==============
export async function exportToPDF(elementId, orientacao = 'retrato') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#f8fafc', logging: false });
  const imgData = canvas.toDataURL('image/png');

  const isLandscape = orientacao === 'paisagem';
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= (pdfHeight - 20);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20);
  }

  pdf.save(`relatorio-gerencial-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}

// ============== DOCX ==============
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', bold: opts.bold, size: opts.size || 22, color: opts.color })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { after: opts.after ?? 120 }
  });
}

function h(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : 26, color: '0000FF' })],
    heading: level,
    spacing: { before: 240, after: 160 }
  });
}

function bullet(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level: 0 }, spacing: { after: 80 } });
}

export async function exportToDOCX(dados, analise, periodoLabel, orientacao = 'retrato') {
  const children = [
    p('AlmoxHub - Axia Energia', { bold: true, size: 28, align: AlignmentType.CENTER, color: '0000FF' }),
    p('Relatório Gerencial Executivo', { bold: true, size: 36, align: AlignmentType.CENTER, after: 240 }),
    p(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { align: AlignmentType.CENTER, size: 20, color: '64748b' }),
    p(`Período analisado: ${periodoLabel}`, { align: AlignmentType.CENTER, size: 20, color: '64748b', after: 360 }),

    h('1. Indicadores-Chave de Desempenho'),
    p(`• Total de OS: ${dados.kpis.totalOS}`),
    p(`• OS Concluídas: ${dados.kpis.osConcluidas} (${dados.kpis.percConclusao}%)`),
    p(`• OS em Execução: ${dados.kpis.osEmExecucao}`),
    p(`• Taxa de Cumprimento: ${dados.kpis.onTimeRate}%`),
    p(`• Tempo Médio de Resolução: ${dados.kpis.avgResolutionDays} dias`),
    p(`• Progresso Médio: ${dados.kpis.avgProgress}%`),

    h('2. Sumário Executivo'),
    p(analise.sumario_executivo, { after: 200 }),

    h('3. Destaques Positivos'),
    ...(analise.destaques_positivos || []).map(bullet),

    h('4. Destaques Negativos'),
    ...(analise.destaques_negativos || []).map(bullet),

    h('5. Pontos de Atenção'),
    ...(analise.pontos_atencao || []).map(bullet),

    h('6. Sugestões de Melhoria'),
    ...(analise.sugestoes_melhorias || []).map(bullet),

    h('7. Lead Time de Atendimento'),
    p(`• Lead Time de Reservas: ${dados.leadTimeReservas.dias} dias (base ${dados.leadTimeReservas.total} OS)`),
    p(`• Lead Time de NF de Estoque: ${dados.leadTimeNFEstoque.dias} dias (base ${dados.leadTimeNFEstoque.total} OS)`),

    h('8. Painel Recebimento'),
    p(`• Total: ${dados.recebimento.total} | Conformidade: ${dados.recebimento.taxaConformidade}% | Problemas: ${dados.recebimento.comProblemas} | Lead Time: ${dados.recebimento.leadTime} dias`),

    h('9. Painel Expedição'),
    p(`• Total: ${dados.expedicao.total} | OTIF: ${dados.expedicao.otif}% | Em trânsito: ${dados.expedicao.emTransito} | Lead Time: ${dados.expedicao.leadTime} dias`),

    h('10. Análise de Produtividade e RH'),
    p(analise.analise_produtividade_rh, { after: 200 }),

    h('11. Conclusão Estratégica'),
    p(analise.conclusao_estrategica)
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: orientacao === 'paisagem' ? 'landscape' : 'portrait' }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-gerencial-${format(new Date(), 'yyyy-MM-dd-HHmm')}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}