import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import { format } from 'date-fns';

// ============== HTML ==============
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function htmlKPI({ label, value, sublabel, gradient }) {
  return `
    <div class="kpi" style="background:${gradient}">
      <div class="kpi-label">${esc(label)}</div>
      <div class="kpi-value">${esc(value)}</div>
      ${sublabel ? `<div class="kpi-sub">${esc(sublabel)}</div>` : ''}
    </div>`;
}

function htmlList(title, items, color, bg) {
  return `
    <div class="list-card">
      <div class="list-head"><span class="list-icon" style="background:${bg};color:${color}">●</span><h3>${esc(title)}</h3></div>
      <ul>${(items || []).map(i => `<li><span style="color:${color}">•</span><span>${esc(i)}</span></li>`).join('')}</ul>
    </div>`;
}

function buildHTMLContent(dados, analise, filtrosAplicados, periodoLabel, dataGeracao) {
  const k = dados.kpis;
  const filtrosResumo = [];
  if (filtrosAplicados.regionais?.length) filtrosResumo.push(`Regionais: ${filtrosAplicados.regionais.join(', ')}`);
  if (filtrosAplicados.almoxarifados?.length) filtrosResumo.push(`Almoxarifados: ${filtrosAplicados.almoxarifados.length}`);
  if (filtrosAplicados.categorias?.length) filtrosResumo.push(`Categorias: ${filtrosAplicados.categorias.join(', ')}`);
  if (filtrosAplicados.status?.length) filtrosResumo.push(`Status: ${filtrosAplicados.status.join(', ')}`);

  return `
  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="header-left">
        <div class="header-icon">⚡</div>
        <div>
          <div class="header-eyebrow">Relatório Gerencial Executivo</div>
          <h1>AlmoxHub - Axia Energia</h1>
          <div class="header-sub">Análise consolidada de operações logísticas</div>
        </div>
      </div>
      <div class="header-date">
        <div class="muted">Emitido em</div>
        <div class="bold">${format(new Date(dataGeracao || new Date()), 'dd/MM/yyyy HH:mm')}</div>
      </div>
    </div>
    <div class="header-grid">
      <div>
        <div class="muted small caps">Período Analisado</div>
        <div class="bold">${esc(periodoLabel)}</div>
      </div>
      <div>
        <div class="muted small caps">Escopo</div>
        <div>${esc(filtrosResumo.length ? filtrosResumo.join(' • ') : 'Todos os dados disponíveis')}</div>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <section class="block">
    <h2 class="section-title">📊 Indicadores-Chave de Desempenho</h2>
    <div class="grid grid-3">
      ${htmlKPI({ label: 'Total de OS', value: k.totalOS, sublabel: 'No período', gradient: 'linear-gradient(135deg,#0000FF 0%,#0A003C 100%)' })}
      ${htmlKPI({ label: 'Concluídas', value: k.osConcluidas, sublabel: `${k.percConclusao}% do total`, gradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)' })}
      ${htmlKPI({ label: 'Em Execução', value: k.osEmExecucao, sublabel: 'Em andamento', gradient: 'linear-gradient(135deg,#FF6B00 0%,#FF8C00 100%)' })}
      ${htmlKPI({ label: 'Taxa de Cumprimento', value: `${k.onTimeRate}%`, sublabel: 'OS no prazo', gradient: 'linear-gradient(135deg,#A0B4D2 0%,#7A95BA 100%)' })}
      ${htmlKPI({ label: 'Tempo Médio Resolução', value: `${k.avgResolutionDays} dias`, sublabel: 'Para conclusão', gradient: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)' })}
      ${htmlKPI({ label: 'Progresso Médio', value: `${k.avgProgress}%`, sublabel: 'Geral', gradient: 'linear-gradient(135deg,#ec4899 0%,#be185d 100%)' })}
    </div>
  </section>

  <!-- LEAD TIME -->
  <section class="block">
    <h2 class="section-title">⏱️ Lead Time de Atendimento</h2>
    <div class="grid grid-2">
      <div class="info-card">
        <div class="info-title">Lead Time de Reservas</div>
        <div class="info-value">${dados.leadTimeReservas.dias} <span class="info-unit">dias</span></div>
        <div class="muted small">Base: ${dados.leadTimeReservas.total} OS</div>
      </div>
      <div class="info-card">
        <div class="info-title">Lead Time de NF de Estoque</div>
        <div class="info-value">${dados.leadTimeNFEstoque.dias} <span class="info-unit">dias</span></div>
        <div class="muted small">Base: ${dados.leadTimeNFEstoque.total} OS</div>
      </div>
    </div>
  </section>

  <!-- PAINEIS RECEBIMENTO / EXPEDIÇÃO -->
  <section class="block">
    <h2 class="section-title">📦 Painéis Operacionais</h2>
    <div class="grid grid-2">
      <div class="panel">
        <div class="panel-head" style="color:#0000FF">Painel Recebimento</div>
        <div class="panel-mini-grid">
          <div><div class="muted small">Total</div><div class="panel-val">${dados.recebimento.total}</div></div>
          <div><div class="muted small">Conformidade</div><div class="panel-val" style="color:#10b981">${dados.recebimento.taxaConformidade}%</div></div>
          <div><div class="muted small">Com Problemas</div><div class="panel-val" style="color:#ef4444">${dados.recebimento.comProblemas}</div></div>
          <div><div class="muted small">Lead Time</div><div class="panel-val">${dados.recebimento.leadTime}d</div></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head" style="color:#FF6B00">Painel Expedição</div>
        <div class="panel-mini-grid">
          <div><div class="muted small">Total</div><div class="panel-val">${dados.expedicao.total}</div></div>
          <div><div class="muted small">OTIF</div><div class="panel-val" style="color:#10b981">${dados.expedicao.otif}%</div></div>
          <div><div class="muted small">Em Trânsito</div><div class="panel-val" style="color:#0000FF">${dados.expedicao.emTransito}</div></div>
          <div><div class="muted small">Lead Time</div><div class="panel-val">${dados.expedicao.leadTime}d</div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ANÁLISE IA -->
  <section class="block">
    <div class="ia-head">
      <div class="ia-icon">✨</div>
      <h2>Análise Executiva por IA</h2>
      <span class="ia-badge">Especialista em Logística & RH</span>
    </div>

    <div class="ia-sumario">
      <h3>🏆 Sumário Executivo</h3>
      <p>${esc(analise?.sumario_executivo || '')}</p>
    </div>

    <div class="grid grid-2 mt">
      ${htmlList('👍 Destaques Positivos', analise?.destaques_positivos, '#10b981', '#10b98115')}
      ${htmlList('👎 Destaques Negativos', analise?.destaques_negativos, '#ef4444', '#ef444415')}
    </div>

    <div class="grid grid-2 mt">
      ${htmlList('⚠️ Pontos de Atenção', analise?.pontos_atencao, '#f59e0b', '#f59e0b15')}
      ${htmlList('💡 Sugestões de Melhoria', analise?.sugestoes_melhorias, '#0000FF', '#0000FF15')}
    </div>

    <div class="ia-rh mt">
      <h3>👥 Análise de Produtividade e Recursos Humanos</h3>
      <p>${esc(analise?.analise_produtividade_rh || '')}</p>
    </div>

    <div class="ia-conclusao mt">
      <h3>✨ Conclusão Estratégica</h3>
      <p>${esc(analise?.conclusao_estrategica || '')}</p>
    </div>
  </section>

  <div class="footer">
    AlmoxHub - Axia Energia • Relatório gerado automaticamente em ${format(new Date(), 'dd/MM/yyyy HH:mm')}
  </div>
  `;
}

export async function exportToHTML(elementId, orientacao = 'retrato', payload = null) {
  const isLandscape = orientacao === 'paisagem';
  const maxWidth = isLandscape ? '1400px' : '1000px';

  let body;
  if (payload) {
    body = buildHTMLContent(payload.dados, payload.analise, payload.filtrosAplicados || {}, payload.periodoLabel || '', payload.dataGeracao);
  } else {
    const el = document.getElementById(elementId);
    body = el ? el.outerHTML : '';
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Gerencial - AlmoxHub</title>
<style>
  @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 1cm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #0f172a; line-height: 1.5; }
  .container { max-width: ${maxWidth}; margin: 0 auto; }
  .muted { color: #64748b; }
  .small { font-size: 12px; }
  .caps { text-transform: uppercase; letter-spacing: 0.05em; }
  .bold { font-weight: 600; }
  .mt { margin-top: 16px; }
  .grid { display: grid; gap: 16px; }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

  /* HEADER */
  .header { background: linear-gradient(135deg, #0000FF 0%, #0A003C 100%); color: white; border-radius: 16px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .header-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
  .header-eyebrow { color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
  .header h1 { font-size: 28px; font-weight: 700; margin: 4px 0 0; color: white; }
  .header-sub { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
  .header-date { text-align: right; font-size: 13px; }
  .header-date .muted { color: rgba(255,255,255,0.7); }
  .header-date .bold { color: white; }
  .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.2); }
  .header-grid .muted { color: rgba(255,255,255,0.6); }
  .header-grid .bold, .header-grid div > div:last-child { color: white; }

  /* SECTIONS */
  .block { margin-bottom: 28px; page-break-inside: avoid; }
  .section-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }

  /* KPI */
  .kpi { border-radius: 12px; padding: 20px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
  .kpi-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.85); }
  .kpi-value { font-size: 32px; font-weight: 700; margin-top: 4px; }
  .kpi-sub { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 4px; }

  /* INFO CARD (lead time) */
  .info-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .info-title { font-size: 13px; color: #64748b; font-weight: 500; }
  .info-value { font-size: 36px; font-weight: 700; color: #0000FF; margin: 6px 0; }
  .info-unit { font-size: 16px; color: #64748b; font-weight: 500; }

  /* PANEL */
  .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .panel-head { font-weight: 700; font-size: 15px; margin-bottom: 12px; }
  .panel-mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .panel-val { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 2px; }

  /* IA */
  .ia-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .ia-head h2 { font-size: 20px; font-weight: 700; margin: 0; color: #0f172a; }
  .ia-icon { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #0000FF 0%, #ec4899 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .ia-badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .ia-sumario { background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; }
  .ia-sumario h3 { margin: 0 0 8px; font-size: 16px; color: #0f172a; }
  .ia-sumario p { margin: 0; color: #334155; white-space: pre-line; }
  .ia-rh { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .ia-rh h3 { margin: 0 0 8px; font-size: 16px; color: #0f172a; }
  .ia-rh p { margin: 0; color: #334155; white-space: pre-line; }
  .ia-conclusao { background: linear-gradient(135deg, #0A003C 0%, #0000FF 100%); color: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .ia-conclusao h3 { margin: 0 0 8px; font-size: 16px; color: white; }
  .ia-conclusao p { margin: 0; color: rgba(255,255,255,0.9); white-space: pre-line; }

  .list-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .list-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .list-head h3 { margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; }
  .list-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .list-card ul { list-style: none; padding: 0; margin: 0; }
  .list-card li { display: flex; gap: 8px; font-size: 13px; color: #334155; padding: 4px 0; }
  .list-card li span:first-child { font-weight: 700; flex-shrink: 0; }

  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
<div class="container">${body}</div>
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