import PptxGenJS from 'pptxgenjs';
import { format } from 'date-fns';

const COR_PRIMARIA = '0000FF';
const COR_SECUNDARIA = '0A003C';
const COR_TEXTO = '0F172A';
const COR_CINZA = '64748B';
const COR_FUNDO = 'F8FAFC';

function addTituloSlide(slide, titulo) {
  slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: COR_PRIMARIA } });
  slide.addText(titulo, {
    x: 0.4, y: 0.05, w: '95%', h: 0.5,
    fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
  });
}

function addRodape(slide, numero, total) {
  slide.addText(`AlmoxHub - Axia Energia  |  ${numero}/${total}`, {
    x: 0.4, y: 7.0, w: '95%', h: 0.3,
    fontSize: 9, color: COR_CINZA, fontFace: 'Calibri', align: 'right'
  });
}

function addBullets(slide, items, opts = {}) {
  if (!items || items.length === 0) {
    slide.addText('Sem dados disponíveis.', {
      x: opts.x || 0.5, y: opts.y || 1.0, w: opts.w || 9, h: opts.h || 5,
      fontSize: 14, color: COR_CINZA, italic: true, fontFace: 'Calibri'
    });
    return;
  }
  const textos = items.map(t => ({
    text: t,
    options: { bullet: { code: '25A0' }, color: COR_TEXTO, fontSize: opts.fontSize || 14, paraSpaceAfter: 6 }
  }));
  slide.addText(textos, {
    x: opts.x || 0.5, y: opts.y || 1.0, w: opts.w || 9, h: opts.h || 5,
    fontFace: 'Calibri', valign: 'top'
  });
}

export async function exportToPPTX(dados, analise, periodoLabel, orientacao = 'retrato') {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
  pptx.author = 'AlmoxHub';
  pptx.company = 'Axia Energia';
  pptx.title = 'Relatório Gerencial Executivo';

  const totalSlides = 10;
  let slideNum = 0;

  // ============== Slide 1 — Capa ==============
  slideNum++;
  let s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  s.addShape('rect', { x: 0, y: 0, w: '100%', h: 7.5, fill: { color: COR_SECUNDARIA } });
  s.addShape('rect', { x: 0, y: 3.0, w: '100%', h: 1.5, fill: { color: COR_PRIMARIA } });
  s.addText('AlmoxHub', { x: 0.5, y: 0.5, w: 12, h: 0.6, fontSize: 28, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
  s.addText('Axia Energia', { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 16, color: 'CBD5E1', fontFace: 'Calibri' });
  s.addText('Relatório Gerencial Executivo', { x: 0.5, y: 3.2, w: 12, h: 0.8, fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
  s.addText('Resumo executivo gerado por IA', { x: 0.5, y: 4.0, w: 12, h: 0.4, fontSize: 16, color: 'FFFFFF', fontFace: 'Calibri' });
  s.addText(`Período: ${periodoLabel}`, { x: 0.5, y: 5.5, w: 12, h: 0.4, fontSize: 16, color: 'FFFFFF', fontFace: 'Calibri' });
  s.addText(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { x: 0.5, y: 6.0, w: 12, h: 0.4, fontSize: 14, color: 'CBD5E1', fontFace: 'Calibri' });

  // ============== Slide 2 — KPIs ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '1. Indicadores-Chave de Desempenho');
  const kpis = [
    { label: 'Total de OS', valor: dados.kpis.totalOS, x: 0.5, y: 1.2 },
    { label: 'OS Concluídas', valor: `${dados.kpis.osConcluidas} (${dados.kpis.percConclusao}%)`, x: 4.7, y: 1.2 },
    { label: 'OS em Execução', valor: dados.kpis.osEmExecucao, x: 8.9, y: 1.2 },
    { label: 'Taxa Cumprimento', valor: `${dados.kpis.onTimeRate}%`, x: 0.5, y: 3.8 },
    { label: 'Tempo Médio Resolução', valor: `${dados.kpis.avgResolutionDays} dias`, x: 4.7, y: 3.8 },
    { label: 'Progresso Médio', valor: `${dados.kpis.avgProgress}%`, x: 8.9, y: 3.8 }
  ];
  kpis.forEach(k => {
    s.addShape('roundRect', { x: k.x, y: k.y, w: 3.9, h: 2.3, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1 });
    s.addText(k.label, { x: k.x + 0.2, y: k.y + 0.2, w: 3.5, h: 0.5, fontSize: 13, color: COR_CINZA, fontFace: 'Calibri' });
    s.addText(String(k.valor), { x: k.x + 0.2, y: k.y + 0.8, w: 3.5, h: 1.2, fontSize: 32, bold: true, color: COR_PRIMARIA, fontFace: 'Calibri' });
  });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 3 — Sumário Executivo ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '2. Sumário Executivo');
  s.addText(analise?.sumario_executivo || 'Sem sumário disponível.', {
    x: 0.5, y: 1.0, w: 12.3, h: 5.5, fontSize: 16, color: COR_TEXTO, fontFace: 'Calibri', valign: 'top', paraSpaceAfter: 8
  });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 4 — Destaques Positivos ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '3. Destaques Positivos');
  addBullets(s, analise?.destaques_positivos, { x: 0.5, y: 1.0, w: 12.3, h: 5.8 });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 5 — Destaques Negativos ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '4. Destaques Negativos');
  addBullets(s, analise?.destaques_negativos, { x: 0.5, y: 1.0, w: 12.3, h: 5.8 });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 6 — Pontos de Atenção ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '5. Pontos de Atenção');
  addBullets(s, analise?.pontos_atencao, { x: 0.5, y: 1.0, w: 12.3, h: 5.8 });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 7 — Sugestões de Melhoria ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '6. Sugestões de Melhoria');
  addBullets(s, analise?.sugestoes_melhorias, { x: 0.5, y: 1.0, w: 12.3, h: 5.8 });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 8 — Painéis Operacionais ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '7. Painéis Operacionais e Lead Time');
  // Recebimento
  s.addShape('roundRect', { x: 0.5, y: 1.1, w: 6.1, h: 2.6, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1 });
  s.addText('Painel Recebimento', { x: 0.7, y: 1.2, w: 5.7, h: 0.4, fontSize: 16, bold: true, color: COR_PRIMARIA, fontFace: 'Calibri' });
  s.addText([
    { text: `Total: ${dados.recebimento.total}\n`, options: { fontSize: 13 } },
    { text: `Conformidade: ${dados.recebimento.taxaConformidade}%\n`, options: { fontSize: 13 } },
    { text: `Problemas: ${dados.recebimento.comProblemas}\n`, options: { fontSize: 13 } },
    { text: `Lead Time: ${dados.recebimento.leadTime} dias`, options: { fontSize: 13 } }
  ], { x: 0.7, y: 1.7, w: 5.7, h: 1.9, color: COR_TEXTO, fontFace: 'Calibri', valign: 'top' });
  // Expedição
  s.addShape('roundRect', { x: 6.8, y: 1.1, w: 6.1, h: 2.6, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1 });
  s.addText('Painel Expedição', { x: 7.0, y: 1.2, w: 5.7, h: 0.4, fontSize: 16, bold: true, color: COR_PRIMARIA, fontFace: 'Calibri' });
  s.addText([
    { text: `Total: ${dados.expedicao.total}\n`, options: { fontSize: 13 } },
    { text: `OTIF: ${dados.expedicao.otif}%\n`, options: { fontSize: 13 } },
    { text: `Em trânsito: ${dados.expedicao.emTransito}\n`, options: { fontSize: 13 } },
    { text: `Lead Time: ${dados.expedicao.leadTime} dias`, options: { fontSize: 13 } }
  ], { x: 7.0, y: 1.7, w: 5.7, h: 1.9, color: COR_TEXTO, fontFace: 'Calibri', valign: 'top' });
  // Lead time
  s.addShape('roundRect', { x: 0.5, y: 3.9, w: 12.4, h: 2.6, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1 });
  s.addText('Lead Time de Atendimento', { x: 0.7, y: 4.0, w: 12, h: 0.4, fontSize: 16, bold: true, color: COR_PRIMARIA, fontFace: 'Calibri' });
  s.addText([
    { text: `Reservas: ${dados.leadTimeReservas.dias} dias (base ${dados.leadTimeReservas.total} OS)\n`, options: { fontSize: 14 } },
    { text: `NF de Estoque: ${dados.leadTimeNFEstoque.dias} dias (base ${dados.leadTimeNFEstoque.total} OS)`, options: { fontSize: 14 } }
  ], { x: 0.7, y: 4.5, w: 12, h: 1.9, color: COR_TEXTO, fontFace: 'Calibri', valign: 'top' });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 9 — Produtividade e RH ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '8. Análise de Produtividade e RH');
  s.addText(analise?.analise_produtividade_rh || 'Sem análise disponível.', {
    x: 0.5, y: 1.0, w: 12.3, h: 5.5, fontSize: 15, color: COR_TEXTO, fontFace: 'Calibri', valign: 'top', paraSpaceAfter: 8
  });
  addRodape(s, slideNum, totalSlides);

  // ============== Slide 10 — Conclusão Estratégica ==============
  slideNum++;
  s = pptx.addSlide();
  s.background = { color: COR_FUNDO };
  addTituloSlide(s, '9. Conclusão Estratégica');
  s.addText(analise?.conclusao_estrategica || 'Sem conclusão disponível.', {
    x: 0.5, y: 1.0, w: 12.3, h: 5.5, fontSize: 16, color: COR_TEXTO, fontFace: 'Calibri', valign: 'top', paraSpaceAfter: 8
  });
  addRodape(s, slideNum, totalSlides);

  await pptx.writeFile({ fileName: `relatorio-gerencial-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pptx` });
}