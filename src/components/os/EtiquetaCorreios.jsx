// Desenha uma etiqueta no padrão "Correios": duas sub-etiquetas separadas
// (DESTINATÁRIO em cima com código de barras do CEP em destaque, REMETENTE
// embaixo). Abaixo do remetente, um bloco com as informações da etiqueta
// (OS, volume, peso, almoxarifado, etc.) para uso operacional interno.
//
// O código de barras usa Code 128 Subtipo C (apenas dígitos, alta densidade),
// com o conteúdo sendo o CEP do destinatário sem hífen (8 dígitos).
//
// Recebe pdf (jsPDF) e desenha na área (lx, ly, lw, lh).

import JsBarcode from 'jsbarcode';

const getEndereco = (inst) => {
  if (!inst) return '';
  return [inst.logradouro, inst.numero, inst.bairro,
    `${inst.cidade || ''}${inst.estado ? '/' + inst.estado : ''}`,
  ].filter(Boolean).join(', ');
};

const onlyDigits = (s) => (s || '').toString().replace(/\D/g, '');

const fmtCep = (cep) => {
  const d = onlyDigits(cep);
  if (d.length === 8) return `${d.slice(0,5)}-${d.slice(5)}`;
  return cep || '';
};

const genBarcodeCode128C = (digits) => {
  try {
    const c = document.createElement('canvas');
    // Code 128 Subtipo C exige número par de dígitos.
    const safe = digits.length % 2 === 0 ? digits : '0' + digits;
    JsBarcode(c, safe, {
      format: 'CODE128C',
      displayValue: false,
      width: 2.6,
      height: 80,
      margin: 4,
      background: '#fff',
      lineColor: '#000',
    });
    return c.toDataURL('image/png');
  } catch (e) {
    console.warn('Barcode CEP failed', e);
    return null;
  }
};

// Quebra de bloco — mesma utilidade do modal principal
const lhOf = (fs) => fs * 0.50;

const fitBlock = (pdf, text, maxW, maxH, maxFs) => {
  let fs = maxFs;
  while (fs > 4) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(fs);
    const lines = pdf.splitTextToSize(text, maxW);
    const totalH = lines.length * lhOf(fs);
    if (totalH <= maxH) return { fs, lines };
    fs -= 0.4;
  }
  pdf.setFontSize(4);
  return { fs: 4, lines: pdf.splitTextToSize(text, maxW) };
};

// Desenha uma sub-etiqueta com borda (cabeçalho + nome + endereço + opcional barcode)
const drawSubEtiqueta = (pdf, lx, ly, lw, lh, opts) => {
  const { titulo, nome, endereco, cep, barcodeImg, infoExtra } = opts;
  const mg = 3;
  const iw = lw - 2 * mg;

  // Border
  pdf.setLineWidth(0.6);
  pdf.setDrawColor(0);
  pdf.rect(lx, ly, lw, lh, 'S');

  // Escala de fonte baseada no tamanho
  const scale = Math.sqrt(lw * lh);
  const FS_TITLE = Math.max(14, scale * 0.165);
  const FS_NAME  = Math.max(10, FS_TITLE * 0.62);
  const FS_ADDR  = Math.max(8.5, FS_TITLE * 0.55);

  let y = ly + mg + 1;

  // Título (DESTINATÁRIO / REMETENTE)
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(FS_TITLE);
  pdf.setTextColor(0,0,0);
  pdf.text(titulo, lx + mg, y + lhOf(FS_TITLE) * 0.78);
  y += lhOf(FS_TITLE) + 1.2;

  // Nome (negrito)
  if (nome) {
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(FS_NAME);
    const nameLines = pdf.splitTextToSize(nome.toUpperCase(), iw);
    pdf.text(nameLines, lx + mg, y + lhOf(FS_NAME) * 0.78);
    y += nameLines.length * lhOf(FS_NAME) + 0.6;
  }

  // Endereço (normal)
  if (endereco) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(FS_ADDR);
    const addrLines = pdf.splitTextToSize(endereco, iw);
    pdf.text(addrLines, lx + mg, y + lhOf(FS_ADDR) * 0.78);
    y += addrLines.length * lhOf(FS_ADDR) + 0.4;
  }

  // CEP textual
  if (cep) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(FS_ADDR);
    pdf.text(`Cep: ${fmtCep(cep)}.`, lx + mg, y + lhOf(FS_ADDR) * 0.78);
    y += lhOf(FS_ADDR) + 0.6;
  }

  // Código de barras (apenas destinatário)
  if (barcodeImg) {
    const remainingH = (ly + lh) - y - mg;
    const bcMaxH = Math.min(remainingH - 4, lh * 0.42);
    const bcH = Math.max(10, bcMaxH);
    const bcW = Math.min(iw * 0.7, 80);
    const bcX = lx + (lw - bcW) / 2;
    const bcY = y + 1;
    pdf.addImage(barcodeImg, 'PNG', bcX, bcY, bcW, bcH);
    // CEP textual sob o código
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(Math.max(8, FS_ADDR * 0.95));
    const cepLabel = fmtCep(cep);
    const lblW = pdf.getStringUnitWidth(cepLabel) * pdf.getFontSize() / pdf.internal.scaleFactor;
    pdf.text(cepLabel, lx + (lw - lblW) / 2, bcY + bcH + 3);
  }

  // Info extra (opcional, apenas no remetente): bloco com OS, volume, etc.
  if (infoExtra && infoExtra.length > 0) {
    const remainingH = (ly + lh) - y - mg;
    const FS_INFO = Math.max(7, FS_ADDR * 0.85);
    const blockText = infoExtra.join('\n');
    const block = fitBlock(pdf, blockText, iw, remainingH - 2, FS_INFO);

    // Linha separadora sutil
    pdf.setLineWidth(0.2);
    pdf.line(lx + mg, y + 1, lx + lw - mg, y + 1);
    let iy = y + 3;
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(block.fs);
    block.lines.forEach((ln) => {
      if (iy + lhOf(block.fs) > ly + lh - mg) return;
      pdf.text(ln, lx + mg, iy + lhOf(block.fs) * 0.78);
      iy += lhOf(block.fs);
    });
  }
};

export function drawLabelCorreios(pdf, lx, ly, lw, lh, ctx) {
  const {
    os,
    vol,
    vIdx,
    vTotal,
    instalacaoOrigem,
    instalacaoDestino,
    almoxarifado,
    totalWeight,
    totalM3,
  } = ctx;

  // Dois blocos: destinatário (em cima) e remetente (embaixo), separados por gap
  const gap = 4;
  const subH = (lh - gap) / 2;

  // ───── DESTINATÁRIO ─────
  let destNome, destEndereco, destCep;
  if (os?.destino_externo) {
    const lines = (os?.destino_externo_descricao || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    destNome = lines[0] || '-';
    destEndereco = lines.slice(1).join(', ');
    // Tenta extrair CEP do texto livre
    const cepMatch = (os?.destino_externo_descricao || '').match(/\b\d{5}-?\d{3}\b/);
    destCep = cepMatch ? cepMatch[0] : '';
  } else {
    destNome = instalacaoDestino?.nome || '-';
    destEndereco = getEndereco(instalacaoDestino);
    destCep = instalacaoDestino?.cep || '';
  }

  const cepDigits = onlyDigits(destCep);
  const barcodeImg = cepDigits.length === 8 ? genBarcodeCode128C(cepDigits) : null;

  drawSubEtiqueta(pdf, lx, ly, lw, subH, {
    titulo: 'DESTINATÁRIO',
    nome: destNome,
    endereco: destEndereco,
    cep: destCep,
    barcodeImg,
  });

  // ───── REMETENTE ─────
  const remNome = instalacaoOrigem?.nome || '-';
  const remEndereco = getEndereco(instalacaoOrigem);
  const remCep = instalacaoOrigem?.cep || '';

  // Info extra (abaixo do remetente)
  const infoExtra = [
    `OS: ${os?.codigo || '-'}   Vol. ${vIdx + 1}/${vTotal}`,
    `Almoxarifado: ${almoxarifado?.nome || '-'}`,
    ...(os?.num_reserva ? [`Reserva: ${os.num_reserva}`] : []),
    ...(os?.num_migo ? [`MIGO: ${os.num_migo}`] : []),
    `Dim: ${vol.comprimento || '—'} × ${vol.largura || '—'} × ${vol.altura || '—'} cm   Peso: ${vol.peso_bruto || '—'} kg${vol.m3 ? `   M³: ${vol.m3}` : ''}`,
    `Totais: ${vTotal} vol(s) · ${totalWeight.toFixed(1)} kg · ${totalM3.toFixed(3)} m³`,
    ...(os?.responsavel_separacao ? [`Resp. Separação: ${os.responsavel_separacao}`] : []),
  ];

  drawSubEtiqueta(pdf, lx, ly + subH + gap, lw, subH, {
    titulo: 'REMETENTE',
    nome: remNome,
    endereco: remEndereco,
    cep: remCep,
    infoExtra,
  });
}