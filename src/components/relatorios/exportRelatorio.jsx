import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import { format } from 'date-fns';

// ============== HTML ==============
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function htmlKPI({ label, value, sublabel, color }) {
  return `
    <div class="kpi">
      <div class="kpi-label">${esc(label)}</div>
      <div class="kpi-value" style="color:${color}">${esc(value)}</div>
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

  const proj = dados.projetos;
  return `
  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="header-eyebrow">Relatório Gerencial</div>
        <h1>AlmoxHub · Axia Energia</h1>
        <div class="header-sub">Análise consolidada de operações logísticas</div>
      </div>
      <div class="header-date">
        <div class="muted small caps">Emitido em</div>
        <div class="bold">${format(new Date(dataGeracao || new Date()), 'dd/MM/yyyy HH:mm')}</div>
      </div>
    </div>
    <div class="header-grid">
      <div>
        <div class="muted small caps">Período</div>
        <div class="bold">${esc(periodoLabel)}</div>
      </div>
      <div>
        <div class="muted small caps">Escopo</div>
        <div>${esc(filtrosResumo.length ? filtrosResumo.join(' · ') : 'Todos os dados disponíveis')}</div>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <section class="block">
    <h2 class="section-title">Indicadores-Chave de Desempenho</h2>
    <div class="grid grid-3">
      ${htmlKPI({ label: 'Total de OS', value: k.totalOS, sublabel: 'No período', color: '#0000FF' })}
      ${htmlKPI({ label: 'Concluídas', value: k.osConcluidas, sublabel: `${k.percConclusao}% do total`, color: '#10b981' })}
      ${htmlKPI({ label: 'Em Execução', value: k.osEmExecucao, sublabel: 'Em andamento', color: '#FF6B00' })}
      ${htmlKPI({ label: 'Taxa de Cumprimento', value: `${k.onTimeRate}%`, sublabel: 'OS no prazo', color: '#7A95BA' })}
      ${htmlKPI({ label: 'Tempo Médio Resolução', value: `${k.avgResolutionDays}d`, sublabel: 'Para conclusão', color: '#6366f1' })}
      ${htmlKPI({ label: 'Progresso Médio', value: `${k.avgProgress}%`, sublabel: 'Geral', color: '#ec4899' })}
    </div>
  </section>

  <!-- LEAD TIME -->
  <section class="block">
    <h2 class="section-title">Lead Time de Atendimento</h2>
    <div class="grid grid-2">
      <div class="info-card">
        <div class="info-title">Lead Time de Reservas</div>
        <div class="info-value">${dados.leadTimeReservas.dias} <span class="info-unit">dias</span></div>
        <div class="muted small">Base: ${dados.leadTimeReservas.total} OS concluídas</div>
      </div>
      <div class="info-card">
        <div class="info-title">Lead Time de NF de Estoque</div>
        <div class="info-value">${dados.leadTimeNFEstoque.dias} <span class="info-unit">dias</span></div>
        <div class="muted small">Base: ${dados.leadTimeNFEstoque.total} OS concluídas</div>
      </div>
    </div>
  </section>

  <!-- PAINEIS -->
  <section class="block">
    <h2 class="section-title">Painéis Operacionais</h2>
    <div class="grid grid-2">
      <div class="panel">
        <div class="panel-head">Recebimento</div>
        <div class="panel-mini-grid">
          <div><div class="muted small">Total</div><div class="panel-val">${dados.recebimento.total}</div></div>
          <div><div class="muted small">Conformidade</div><div class="panel-val" style="color:#10b981">${dados.recebimento.taxaConformidade}%</div></div>
          <div><div class="muted small">Com Problemas</div><div class="panel-val" style="color:#ef4444">${dados.recebimento.comProblemas}</div></div>
          <div><div class="muted small">Lead Time</div><div class="panel-val">${dados.recebimento.leadTime}d</div></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">Expedição</div>
        <div class="panel-mini-grid">
          <div><div class="muted small">Total</div><div class="panel-val">${dados.expedicao.total}</div></div>
          <div><div class="muted small">OTIF</div><div class="panel-val" style="color:#10b981">${dados.expedicao.otif}%</div></div>
          <div><div class="muted small">Em Trânsito</div><div class="panel-val" style="color:#0000FF">${dados.expedicao.emTransito}</div></div>
          <div><div class="muted small">Lead Time</div><div class="panel-val">${dados.expedicao.leadTime}d</div></div>
        </div>
      </div>
    </div>
  </section>

  ${proj ? `
  <!-- PROJETOS -->
  <section class="block">
    <h2 class="section-title">Projetos</h2>
    <div class="grid grid-2">
      <div class="info-card">
        <div class="info-title">Concluídos no Período</div>
        <div class="info-value" style="color:#10b981">${proj.totalConcluidos}</div>
        <div class="muted small">${proj.taxaNoPrazo}% no prazo · duração média ${proj.duracaoMediaDias}d</div>
      </div>
      <div class="info-card">
        <div class="info-title">Em Aberto</div>
        <div class="info-value" style="color:#0000FF">${proj.totalAbertos}</div>
        <div class="muted small">${proj.abertosAtrasados} atrasados · ${proj.parados} parados</div>
      </div>
    </div>
  </section>
  ` : ''}

  <!-- ANÁLISE -->
  <section class="block">
    <h2 class="section-title">Análise Executiva</h2>

    <div class="ia-sumario">
      <h3>Sumário Executivo</h3>
      <p>${esc(analise?.sumario_executivo || '')}</p>
    </div>

    <div class="grid grid-2 mt">
      ${htmlList('Destaques Positivos', analise?.destaques_positivos, '#10b981', '#10b98115')}
      ${htmlList('Destaques Negativos', analise?.destaques_negativos, '#ef4444', '#ef444415')}
    </div>

    <div class="grid grid-2 mt">
      ${htmlList('Pontos de Atenção', analise?.pontos_atencao, '#f59e0b', '#f59e0b15')}
      ${htmlList('Sugestões de Melhoria', analise?.sugestoes_melhorias, '#0000FF', '#0000FF15')}
    </div>

    ${analise?.recomendacoes_engenharia_producao ? `
    <div class="mt">
      ${htmlList('Recomendações de Engenharia de Produção', analise.recomendacoes_engenharia_producao, '#6366f1', '#6366f115')}
    </div>` : ''}

    ${analise?.analise_projetos ? `
    <div class="ia-rh mt">
      <h3>Análise de Projetos</h3>
      <p>${esc(analise.analise_projetos)}</p>
    </div>` : ''}

    <div class="ia-rh mt">
      <h3>Análise de Produtividade</h3>
      <p>${esc(analise?.analise_produtividade_rh || '')}</p>
    </div>

    <div class="ia-conclusao mt">
      <h3>Conclusão Estratégica</h3>
      <p>${esc(analise?.conclusao_estrategica || '')}</p>
    </div>
  </section>

  <div class="footer">
    AlmoxHub · Axia Energia — Relatório gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}
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
  body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #fafafa; margin: 0; padding: 32px; color: #1d1d1f; line-height: 1.55; -webkit-font-smoothing: antialiased; }
  .container { max-width: ${maxWidth}; margin: 0 auto; }
  .muted { color: #86868b; }
  .small { font-size: 12px; }
  .caps { text-transform: uppercase; letter-spacing: 0.08em; }
  .bold { font-weight: 600; }
  .mt { margin-top: 16px; }
  .grid { display: grid; gap: 14px; }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

  h1, h2, h3 { letter-spacing: -0.02em; }

  /* HEADER */
  .header { background: white; border: 1px solid #e5e5e7; border-radius: 18px; padding: 36px; margin-bottom: 28px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .header-eyebrow { color: #86868b; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.15em; }
  .header h1 { font-size: 30px; font-weight: 600; margin: 8px 0 4px; color: #1d1d1f; }
  .header-sub { color: #86868b; font-size: 14px; }
  .header-date { text-align: right; font-size: 13px; }
  .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; padding-top: 24px; border-top: 1px solid #f0f0f2; }

  /* SECTIONS */
  .block { margin-bottom: 28px; page-break-inside: avoid; }
  .section-title { font-size: 20px; font-weight: 600; color: #1d1d1f; margin: 0 0 14px; letter-spacing: -0.02em; }

  /* KPI */
  .kpi { background: white; border: 1px solid #e5e5e7; border-radius: 14px; padding: 18px; }
  .kpi-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #86868b; }
  .kpi-value { font-size: 30px; font-weight: 600; margin-top: 6px; letter-spacing: -0.02em; }
  .kpi-sub { font-size: 12px; color: #86868b; margin-top: 4px; }

  /* INFO CARD (lead time, projetos) */
  .info-card { background: white; border: 1px solid #e5e5e7; border-radius: 14px; padding: 20px; }
  .info-title { font-size: 13px; color: #86868b; font-weight: 500; }
  .info-value { font-size: 34px; font-weight: 600; color: #1d1d1f; margin: 6px 0; letter-spacing: -0.02em; }
  .info-unit { font-size: 15px; color: #86868b; font-weight: 400; }

  /* PANEL */
  .panel { background: white; border: 1px solid #e5e5e7; border-radius: 14px; padding: 20px; }
  .panel-head { font-weight: 600; font-size: 15px; margin-bottom: 14px; color: #1d1d1f; }
  .panel-mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .panel-val { font-size: 22px; font-weight: 600; color: #1d1d1f; margin-top: 2px; letter-spacing: -0.02em; }

  /* ANÁLISE */
  .ia-sumario { background: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; padding: 22px; }
  .ia-sumario h3 { margin: 0 0 10px; font-size: 16px; color: #1d1d1f; font-weight: 600; }
  .ia-sumario p { margin: 0; color: #424245; white-space: pre-line; font-size: 14px; }
  .ia-rh { background: white; border: 1px solid #e5e5e7; border-radius: 14px; padding: 22px; }
  .ia-rh h3 { margin: 0 0 10px; font-size: 16px; color: #1d1d1f; font-weight: 600; }
  .ia-rh p { margin: 0; color: #424245; white-space: pre-line; font-size: 14px; }
  .ia-conclusao { background: linear-gradient(135deg, #1d1d1f 0%, #0a0a0c 100%); color: white; border-radius: 14px; padding: 22px; }
  .ia-conclusao h3 { margin: 0 0 10px; font-size: 16px; color: white; font-weight: 600; }
  .ia-conclusao p { margin: 0; color: rgba(255,255,255,0.85); white-space: pre-line; font-size: 14px; }

  .list-card { background: white; border: 1px solid #e5e5e7; border-radius: 14px; padding: 20px; }
  .list-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .list-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: #1d1d1f; }
  .list-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .list-card ul { list-style: none; padding: 0; margin: 0; }
  .list-card li { display: flex; gap: 8px; font-size: 13.5px; color: #424245; padding: 5px 0; line-height: 1.55; }
  .list-card li span:first-child { font-weight: 600; flex-shrink: 0; }

  .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e5e7; text-align: center; font-size: 11px; color: #86868b; }
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

    ...(analise.recomendacoes_engenharia_producao ? [
      h('7. Recomendações de Engenharia de Produção'),
      ...analise.recomendacoes_engenharia_producao.map(bullet)
    ] : []),

    h('8. Lead Time de Atendimento (OS concluídas)'),
    p(`• Lead Time de Reservas: ${dados.leadTimeReservas.dias} dias (base ${dados.leadTimeReservas.total} OS)`),
    p(`• Lead Time de NF de Estoque: ${dados.leadTimeNFEstoque.dias} dias (base ${dados.leadTimeNFEstoque.total} OS)`),

    h('9. Painel Recebimento'),
    p(`• Total: ${dados.recebimento.total} | Conformidade: ${dados.recebimento.taxaConformidade}% | Problemas: ${dados.recebimento.comProblemas} | Lead Time: ${dados.recebimento.leadTime} dias`),

    h('10. Painel Expedição'),
    p(`• Total: ${dados.expedicao.total} | OTIF: ${dados.expedicao.otif}% | Em trânsito: ${dados.expedicao.emTransito} | Lead Time: ${dados.expedicao.leadTime} dias`),

    ...(dados.projetos ? [
      h('11. Projetos'),
      p(`• Concluídos no período: ${dados.projetos.totalConcluidos} (${dados.projetos.taxaNoPrazo}% no prazo, duração média ${dados.projetos.duracaoMediaDias}d)`),
      p(`• Em aberto: ${dados.projetos.totalAbertos} (${dados.projetos.abertosAtrasados} atrasados, ${dados.projetos.parados} parados)`),
      ...(analise.analise_projetos ? [p(analise.analise_projetos, { after: 160 })] : [])
    ] : []),

    h('12. Análise de Produtividade'),
    p(analise.analise_produtividade_rh, { after: 200 }),

    h('13. Conclusão Estratégica'),
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