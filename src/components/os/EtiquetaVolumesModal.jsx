import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Tag, Package, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { drawLabelCorreios } from './EtiquetaCorreios';

const ISO_SYMBOLS = [
  { id: 'fragil',           label: 'Frágil',              description: 'Conteúdo quebrável — manuseio cuidadoso' },
  { id: 'lado_cima',        label: 'Este Lado Para Cima', description: 'Posição correta de armazenamento' },
  { id: 'umidade',          label: 'Proteger da Umidade', description: 'Manter em local seco e protegido' },
  { id: 'empilhamento',     label: 'Empilhamento',        description: 'Limite de empilhamento' },
  { id: 'centro_gravidade', label: 'Centro de Gravidade', description: 'Posição do centro de gravidade' },
  { id: 'nao_garra',        label: 'Não Usar Garra',      description: 'Proibido uso de garras mecânicas' },
];

const SYMBOL_SVGS = {
  fragil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
    <path d="M14 4 L66 4 C74 26 72 48 56 60 C50 65 48 68 48 68 L32 68 C32 68 30 65 24 60 C8 48 6 26 14 4Z" fill="black"/>
    <path d="M43 14 L34 40 L42 40 L33 64 L50 36 L42 36 L51 14Z" fill="white"/>
    <rect x="36" y="68" width="8" height="17" fill="black" rx="1"/>
    <rect x="20" y="85" width="40" height="9" rx="3" fill="black"/>
  </svg>`,
  lado_cima: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M21 46 L10 46 L27 8 L44 46 L33 46 L33 78 L21 78Z" fill="black"/>
    <path d="M47 46 L36 46 L53 8 L70 46 L59 46 L59 78 L47 78Z" fill="black"/>
    <rect x="4" y="82" width="72" height="8" rx="2" fill="black"/>
  </svg>`,
  umidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M4 46 Q4 6 40 6 Q76 6 76 46Z" fill="black"/>
    <line x1="27" y1="10" x2="27" y2="46" stroke="white" stroke-width="2.5"/>
    <line x1="53" y1="10" x2="53" y2="46" stroke="white" stroke-width="2.5"/>
    <rect x="37" y="46" width="6" height="28" fill="black" rx="3"/>
    <path d="M40 74 Q40 88 53 88 Q66 88 66 78" fill="none" stroke="black" stroke-width="7" stroke-linecap="round"/>
  </svg>`,
  empilhamento: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
    <rect x="2"  y="63" width="76" height="23" rx="3" fill="black"/>
    <rect x="9"  y="38" width="62" height="23" rx="3" fill="black"/>
    <rect x="18" y="15" width="44" height="21" rx="3" fill="black"/>
    <rect x="0"  y="60" width="80" height="4" fill="white"/>
    <rect x="0"  y="35" width="80" height="4" fill="white"/>
  </svg>`,
  centro_gravidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="37" y="4"  width="6" height="72" fill="black" rx="3"/>
    <rect x="4"  y="37" width="72" height="6"  fill="black" rx="3"/>
    <circle cx="40" cy="40" r="8" fill="black"/>
  </svg>`,
  nao_garra: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="22" y="10" width="7"  height="24" rx="3.5" fill="black"/>
    <rect x="36" y="10" width="8"  height="24" rx="4"   fill="black"/>
    <rect x="51" y="10" width="7"  height="24" rx="3.5" fill="black"/>
    <rect x="22" y="31" width="36" height="6"  rx="2"   fill="black"/>
    <rect x="36" y="37" width="8"  height="26" rx="4"   fill="black"/>
    <line x1="12" y1="68" x2="68" y2="12" stroke="black" stroke-width="9" stroke-linecap="round"/>
  </svg>`,
};

const svgToPng = (svgStr, px = 280) => new Promise((resolve) => {
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, px, px);
    ctx.drawImage(img, 0, 0, px, px);
    URL.revokeObjectURL(url); resolve(c.toDataURL('image/png'));
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
  img.src = url;
});

export default function EtiquetaVolumesModal({ open, onClose, os, instalacoes, almoxarifados }) {
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [labelsPerPage, setLabelsPerPage]     = useState('2');
  const [generating, setGenerating]           = useState(false);
  const [modelo, setModelo]                   = useState('transportadora'); // 'transportadora' | 'correios'
  const [papel, setPapel]                     = useState('a4');             // 'a4' | 'termica'

  const instalacaoOrigem  = instalacoes?.find(i => i?.id === os?.instalacao_origem_id);
  const instalacaoDestino = instalacoes?.find(i => i?.id === os?.instalacao_destino_id);
  const almoxarifado      = almoxarifados?.find(a => a?.id === os?.almoxarifado_id);

  const expandedVolumes = (os?.volumes || []).flatMap(vol => {
    const qty = parseInt(vol.quantidade) || 1;
    return Array(qty).fill(vol);
  });
  const totalLabels = expandedVolumes.length;

  const toggleSymbol = (id) =>
    setSelectedSymbols(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const getEndereco = (inst) => {
    if (!inst) return '';
    return [inst.logradouro, inst.numero, inst.bairro,
      `${inst.cidade || ''}${inst.estado ? '/' + inst.estado : ''}`, inst.cep
    ].filter(Boolean).join(', ');
  };

  const buildPdf = async () => {
    const symImages = {};
    for (const sid of selectedSymbols)
      if (SYMBOL_SVGS[sid]) symImages[sid] = await svgToPng(SYMBOL_SVGS[sid], 280);

    // Pre-generate QR code (same link as "compartilhar" button)
    const osUrl = `${window.location.origin}/OrdensServico?os_id=${os.id}`;
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(osUrl, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
    } catch(e) { console.warn('QR generation failed', e); }

    // ─── Configuração de papel e grade ───
    // Térmica: 100×150 mm, 1 etiqueta por página, margem de 5 mm
    // A4: usa labelsPerPage
    const isTermica = papel === 'termica';
    const n = isTermica ? 1 : parseInt(labelsPerPage);
    const pdf = isTermica
      ? new jsPDF({ orientation: 'p', unit: 'mm', format: [100, 150] })
      : new jsPDF('p', 'mm', 'a4');
    const PW = isTermica ? 100 : 210;
    const PH = isTermica ? 150 : 297;
    const MG = 5;
    const GAP = isTermica ? 0 : 2;
    const grids = { 1:[1,1], 2:[1,2], 4:[2,2], 8:[2,4] };
    const [cols, rows] = grids[n];
    const LW = (PW - 2*MG - (cols-1)*GAP) / cols;
    const LH = (PH - 2*MG - (rows-1)*GAP) / rows;

      // ── Returns the largest fontSize ≤ maxFs where text fits in maxW ──
      const fitFont = (text, maxW, maxFs, minFs = 4) => {
        let fs = maxFs;
        while (fs > minFs) {
          pdf.setFontSize(fs);
          if (pdf.getStringUnitWidth(text) * fs / pdf.internal.scaleFactor <= maxW) return fs;
          fs -= 0.4;
        }
        return minFs;
      };

      // ── Truncates text with ellipsis until it fits maxW ──
      const truncate = (text, maxW) => {
        if (!text) return '';
        const scale = pdf.internal.scaleFactor;
        const fs    = pdf.getFontSize();
        const ellipsis = '…';
        if (pdf.getStringUnitWidth(text) * fs / scale <= maxW) return text;
        let t = text;
        while (t.length > 1 && pdf.getStringUnitWidth(t + ellipsis) * fs / scale > maxW)
          t = t.slice(0, -1);
        return t + ellipsis;
      };

      const genBarcode = (text) => {
        try {
          const c = document.createElement('canvas');
          JsBarcode(c, text, { format:'CODE128', displayValue:false, width:2, height:60, margin:4, background:'#fff', lineColor:'#000' });
          return c.toDataURL('image/png');
        } catch { return null; }
      };

      const totalWeight = expandedVolumes.reduce((s,v) => s + (parseFloat(v.peso_bruto)||0), 0);
      const totalM3     = expandedVolumes.reduce((s,v) => s + (parseFloat(v.m3)||0), 0);

      const drawLabel = (lx, ly, lw, lh, vol, vIdx, vTotal) => {
        const mg = 2.5;
        const iw = lw - 2*mg;

        // ── Scale-based font sizes ──
        const scale = Math.sqrt(lw * lh);
        const FSN  = Math.max(10,  scale * 0.118);
        const FSL  = Math.max(8.5, FSN  * 0.80);
        const FSA  = Math.max(7.5, FSN  * 0.76);
        const FSC  = Math.max(11,  FSN  * 1.36);
        const FSS  = Math.max(9,   FSN  * 0.84);
        const FSH  = Math.max(8,   FSN  * 0.92);
        const FSBar= Math.max(6.5, FSN  * 0.70);

        const lhOf = (fs) => fs * 0.50;

        const HEADER_H = Math.max(6.5, FSH  * 0.84);
        const SUMBAR_H = Math.max(3.8, FSBar * 0.65);  // text-only, no fill
        const BOT_H    = Math.max(22,  lh   * 0.27);   // QR + barcode + info

        // ── TOP section column layout ──
        const colGap    = 1.5;
        const leftColW  = iw * 0.44 - colGap / 2;
        const rightColW = iw * 0.56 - colGap / 2;
        const colX_R    = lx + mg + leftColW + colGap;

        const TOP_H = lhOf(FSL) + 0.8 + lhOf(FSA) * 4 + 3.5;
        const MID_H = lh - HEADER_H - TOP_H - BOT_H;

        // ── Border ──
        pdf.setLineWidth(0.8); pdf.setDrawColor(0);
        pdf.rect(lx, ly, lw, lh, 'S');

        // ══════════ HEADER ══════════
        pdf.setFillColor(0,0,0);
        pdf.rect(lx, ly, lw, HEADER_H, 'F');
        pdf.setTextColor(255,255,255);
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSH);
        pdf.text('AXIA ENERGIA', lx+mg, ly + HEADER_H*0.74);
        const vtLabel = `VOL. ${vIdx+1}/${vTotal}`;
        const vtW = pdf.getStringUnitWidth(vtLabel) * FSH / pdf.internal.scaleFactor;
        pdf.text(vtLabel, lx+lw-mg-vtW, ly + HEADER_H*0.74);
        pdf.setTextColor(0,0,0);

        // ══════════ TOP SECTION — Remetente / Destinatário ══════════
        const topStart = ly + HEADER_H;
        const topEnd   = topStart + TOP_H;
        let ty = topStart + 1.5;
        let ry = topStart + 1.5;

        const fitBlock = (text, maxW, maxH, maxFs) => {
          let fs = maxFs;
          while (fs > 4) {
            pdf.setFont('helvetica','normal');
            pdf.setFontSize(fs);
            const lines = pdf.splitTextToSize(text, maxW);
            const totalH = lines.length * lhOf(fs);
            const allFit = lines.every(l => pdf.getStringUnitWidth(l) * fs / pdf.internal.scaleFactor <= maxW);
            if (allFit && totalH <= maxH) return { fs, lines };
            fs -= 0.4;
          }
          pdf.setFontSize(4);
          return { fs: 4, lines: pdf.splitTextToSize(text, maxW) };
        };

        const blockH = TOP_H - lhOf(FSL) - 0.8 - 2.0;
        // For n=1 cap font smaller so long names/addresses don't overflow the section
        const blockMaxFs = n === 1 ? FSA * 0.58 : FSA;

        // Render name + address+CNPJ concatenated
        const renderAddrBlock = (inst, x, startY, colW, freeText) => {
          let nome, addrLine;
          if (freeText) {
            // Use first non-empty line as "nome" (bold) and remaining as address (normal)
            const lines = (freeText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            nome = lines[0] || '-';
            addrLine = lines.slice(1).join(', ');
          } else {
            nome = inst?.nome || '-';
            const addr     = getEndereco(inst);
            const cnpjPart = inst?.cnpj ? ` — CNPJ: ${inst.cnpj}` : '';
            addrLine = addr + cnpjPart;
          }
          const fullText = [nome, addrLine].filter(Boolean).join('\n');
          const block    = fitBlock(fullText, colW, blockH, blockMaxFs);
          const fs       = block.fs;
          pdf.setFontSize(fs);
          let y = startY;
          const maxLines = Math.floor(blockH / lhOf(fs));
          const nameLines = pdf.splitTextToSize(nome, colW);
          const addrLines = addrLine ? pdf.splitTextToSize(addrLine, colW) : [];
          const allLines  = [...nameLines, ...addrLines].slice(0, maxLines);
          // Render name lines (bold)
          let lineIdx = 0;
          pdf.setFont('helvetica','bold');
          while (lineIdx < nameLines.length && lineIdx < allLines.length) {
            pdf.text(truncate(allLines[lineIdx], colW), x, y + lhOf(fs)*0.76);
            y += lhOf(fs);
            lineIdx++;
          }
          y += 0.4;
          // Render addr lines (normal)
          pdf.setFont('helvetica','normal');
          while (lineIdx < allLines.length) {
            pdf.text(truncate(allLines[lineIdx], colW), x, y + lhOf(fs)*0.76);
            y += lhOf(fs);
            lineIdx++;
          }
        };

        // Left: REMETENTE
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSL);
        pdf.text('REMETENTE:', lx+mg, ty + lhOf(FSL)*0.76);
        ty += lhOf(FSL) + 0.8;
        renderAddrBlock(instalacaoOrigem, lx+mg, ty, leftColW);

        // Right: DESTINATÁRIO
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSL);
        pdf.text('DESTINATÁRIO:', colX_R, ry + lhOf(FSL)*0.76);
        ry += lhOf(FSL) + 0.8;
        if (os?.destino_externo) {
          renderAddrBlock(null, colX_R, ry, rightColW, os?.destino_externo_descricao || '');
        } else {
          renderAddrBlock(instalacaoDestino, colX_R, ry, rightColW);
        }

        // Column divider
        pdf.setLineWidth(0.25);
        pdf.line(lx+mg+leftColW+0.75, topStart+1.5, lx+mg+leftColW+0.75, topEnd-1.5);

        // Section border
        pdf.setLineWidth(0.9);
        pdf.line(lx, topEnd, lx+lw, topEnd);

        // ══════════ MIDDLE SECTION ══════════
        const midStart = topEnd;
        const midEnd   = midStart + MID_H - SUMBAR_H;
        const hasSyms  = selectedSymbols.length > 0;
        const symZoneW = hasSyms ? Math.min(lw * 0.33, 36) : 0;
        const dataW    = iw - symZoneW;
        let my = midStart + 1.5;

        // Build mid-section lines, auto-fit font
        const midLines = [
          { text: 'ORDEM DE SERVIÇO:', bold: true, big: false },
          { text: os?.codigo || '-',   bold: true, big: true  },
          ...(os?.num_reserva     ? [{ text: `Reserva: ${os.num_reserva}`,     bold: false, big: false }] : []),
          ...(os?.num_migo        ? [{ text: `MIGO: ${os.num_migo}`,           bold: false, big: false }] : []),
          ...(os?.usuario_reserva ? [{ text: `Usuário: ${os.usuario_reserva}${os.orgao ? ` (${os.orgao})` : ''}`, bold: false, big: false }] : []),
          { text: '---divider---', bold: false, big: false },
          { text: `C: ${vol.comprimento||'—'} cm  L: ${vol.largura||'—'} cm  A: ${vol.altura||'—'} cm`, bold: false, big: false },
          { text: `Peso Bruto: ${vol.peso_bruto||'—'} kg${vol.m3 ? `   M³: ${vol.m3}` : ''}`, bold: false, big: false },
        ];

        // For 4/page reduce starting font slightly to avoid overflow
        const midFsMax  = n === 4 ? FSS * 0.82 : FSS;
        const midAvailH = midEnd - midStart - 3;
        let midFs = midFsMax;
        for (let testFs = midFsMax; testFs >= 5; testFs -= 0.5) {
          const codeFsT = Math.min(FSC, testFs * 1.35);
          let h = 0;
          midLines.forEach(ln => {
            if (ln.text === '---divider---') { h += 2; return; }
            const fs = ln.big ? codeFsT : testFs;
            const lines = pdf.splitTextToSize(ln.text, dataW);
            h += lines.length * lhOf(fs) + 0.7;
          });
          if (h <= midAvailH) { midFs = testFs; break; }
        }
        const midCodeFs = Math.min(FSC, midFs * 1.35);

        midLines.forEach(ln => {
          if (my > midEnd) return;
          if (ln.text === '---divider---') {
            my += 0.4; pdf.setLineWidth(0.15); pdf.line(lx+mg, my, lx+mg+dataW, my); my += 1.6; return;
          }
          const fs = ln.big ? midCodeFs : midFs;
          pdf.setFont('helvetica', ln.bold ? 'bold' : 'normal'); pdf.setFontSize(fs);
          const lines = pdf.splitTextToSize(ln.text, dataW).map(l => truncate(l, dataW));
          pdf.text(lines, lx+mg, my + lhOf(fs)*0.76);
          my += lines.length * lhOf(fs) + 0.7;
        });

        // Symbols (3 cols for 8/page, 2 for others when enough symbols/space)
        if (hasSyms && symZoneW > 0) {
          const symX    = lx + mg + dataW + 1;
          const availH  = MID_H - SUMBAR_H - 3;
          // Columns per layout: 1→1col, 2→3cols, 4→2cols, 8→3cols
          const symCols = n === 1 ? 1 :
                          n === 2 ? (selectedSymbols.length > 1 ? 3 : 1) :
                          n === 8 ? (selectedSymbols.length > 2 ? 3 : 2) :
                          (selectedSymbols.length > 2 ? 2 : 1);
          const symRows = Math.ceil(selectedSymbols.length / symCols);
          const colW    = symZoneW / symCols;
          const rowGap  = (n === 4 || n === 8) ? 0.6 : 1.2;
          // Scale factor to prevent overflow: n=4 tighter, n=1 slightly tighter
          const symScale = n === 4 ? 0.72 : n === 1 ? 0.82 : 1.0;
          const symSz   = Math.max(4, Math.min(colW - 0.6, (availH / symRows) - rowGap) * symScale);
          const showLbl = symSz >= 11;
          const rowH    = symSz + (showLbl ? 4.5 : rowGap);

          // Right-align: start from the right edge of the sym zone
          const symStartX = lx + lw - mg - symZoneW;
          selectedSymbols.forEach((sid, si) => {
            const col = si % symCols, row = Math.floor(si / symCols);
            const sX  = symStartX + col * colW + (colW - symSz) / 2;
            const sY  = midStart + 2 + row * rowH;
            if (sY + symSz > midEnd + SUMBAR_H) return;
            if (symImages[sid]) pdf.addImage(symImages[sid], 'PNG', sX, sY, symSz, symSz);
            if (showLbl) {
              const sym = ISO_SYMBOLS.find(s => s.id === sid);
              if (sym) {
                pdf.setFontSize(Math.max(3.5, symSz * 0.20));
                pdf.setFont('helvetica','normal');
                pdf.text(pdf.splitTextToSize(sym.label, colW - 0.5).slice(0, 2), sX, sY + symSz + 1.8);
              }
            }
          });
        }

        // ── Summary line — no fill, top border only, includes m³ total ──
        const smY = midStart + MID_H - SUMBAR_H;
        pdf.setLineWidth(0.5);
        pdf.line(lx, smY, lx+lw, smY);
        const sumText = `${vTotal} vol(s)  |  Peso Total: ${totalWeight.toFixed(1)} kg  |  M³ Total: ${totalM3.toFixed(3)}  |  Vol. ${vIdx+1}/${vTotal}`;
        const sumFs   = fitFont(sumText, iw, FSBar, 4);
        pdf.setFont('helvetica','normal'); pdf.setFontSize(sumFs); pdf.setTextColor(0,0,0);
        pdf.text(sumText, lx+mg, smY + SUMBAR_H * 0.72);

        // Section border (mid → bot)
        pdf.setLineWidth(0.9);
        pdf.line(lx, midStart + MID_H, lx+lw, midStart + MID_H);

        // ══════════ BOTTOM — QR (left) | Barcode + info (right) ══════════
        const botY   = midStart + MID_H;
        const qrSize = Math.min(BOT_H - 3, iw * 0.34);
        const qrX    = lx + mg;
        const qrY    = botY + (BOT_H - qrSize) / 2;

        // Left: QR code
        if (qrDataUrl) {
          pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        }

        // Right: barcode (OS number only) + info lines
        const bcColX = lx + mg + qrSize + 2;
        const bcColW = iw - qrSize - 2;
        const osCode = (os?.codigo || 'OS').replace(/[^A-Z0-9\-_]/gi, '').toUpperCase();
        const bcImg  = genBarcode(osCode);

        if (bcImg) {
          const bcH = Math.min(BOT_H * 0.38, 12);
          pdf.addImage(bcImg, 'PNG', bcColX, botY + 1.0, bcColW, bcH);

          const almoxNome = almoxarifado?.nome || '-';
          const respSep   = os?.responsavel_separacao || '-';
          const dataSep   = os?.separacao_concluida_em || os?.data_separacao || '-';
          const anotacoes = os?.anotacoes || '-';

          const infoItems = [
            { label: 'Almoxarifado',    value: almoxNome               },
            { label: 'Resp. Separação', value: respSep                 },
            { label: 'Data Separação',  value: dataSep                 },
            { label: 'Anotações',       value: anotacoes, wrap: true   },
          ];

          // Auto-fit font to available height for all info items
          const infoAvailH = BOT_H - bcH - 2.5;
          const infoFsMax  = FSS * 0.75;
          let infoFs = infoFsMax;
          for (let tf = infoFsMax; tf >= 3.5; tf -= 0.3) {
            const totalH = infoItems.length * (lhOf(tf) + 0.5);
            if (totalH <= infoAvailH) { infoFs = tf; break; }
          }

          let iy = botY + 1.0 + bcH + 0.8;
          infoItems.forEach(({ label, value, wrap }) => {
            if (iy > botY + BOT_H - 0.5) return;
            const lblStr = label + ': ';
            pdf.setFont('helvetica','bold'); pdf.setFontSize(infoFs * 0.88);
            const lblW = pdf.getStringUnitWidth(lblStr) * infoFs * 0.88 / pdf.internal.scaleFactor;
            pdf.text(lblStr, bcColX, iy + lhOf(infoFs) * 0.76);
            pdf.setFont('helvetica','normal'); pdf.setFontSize(infoFs);
            if (wrap && n === 1) {
              // Multi-line wrap for 1/page layout
              const valueW = bcColW - lblW;
              const lines  = pdf.splitTextToSize(value, valueW);
              pdf.text(lines, bcColX + lblW, iy + lhOf(infoFs) * 0.76);
              iy += lines.length * lhOf(infoFs) + 0.5;
            } else {
              pdf.text(truncate(value, bcColW - lblW), bcColX + lblW, iy + lhOf(infoFs) * 0.76);
              iy += lhOf(infoFs) + 0.5;
            }
          });
        }
      };

    expandedVolumes.forEach((vol, vIdx) => {
      const pos = vIdx % n, col = pos % cols, row = Math.floor(pos / cols);
      if (vIdx > 0 && pos === 0) pdf.addPage();
      const lx = MG + col*(LW+GAP);
      const ly = MG + row*(LH+GAP);
      if (modelo === 'correios') {
        drawLabelCorreios(pdf, lx, ly, LW, LH, {
          os, vol, vIdx, vTotal: expandedVolumes.length,
          instalacaoOrigem, instalacaoDestino, almoxarifado,
          totalWeight, totalM3,
        });
      } else {
        drawLabel(lx, ly, LW, LH, vol, vIdx, expandedVolumes.length);
      }
    });

    return pdf;
  };

  const handleDownload = async () => {
    if (!os?.volumes?.length) return;
    setGenerating(true);
    try {
      const pdf = await buildPdf();
      pdf.save(`Etiquetas_${os?.codigo || 'OS'}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar etiquetas:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!os?.volumes?.length) return;
    setGenerating(true);
    try {
      const pdf = await buildPdf();
      const blobUrl = pdf.output('bloburl');
      // Abre em nova janela e dispara o print após o PDF carregar
      const win = window.open(blobUrl, '_blank');
      if (win) {
        win.addEventListener('load', () => {
          try { win.focus(); win.print(); } catch (e) { /* ignore */ }
        });
      }
    } catch (err) {
      console.error('Erro ao gerar etiquetas para impressão:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Gerar Etiquetas Logísticas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <Package className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {totalLabels} etiqueta{totalLabels !== 1 ? 's' : ''} {totalLabels !== 1 ? 'serão geradas' : 'será gerada'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {(os?.volumes||[]).length} tipo(s) de volume · OS {os?.codigo}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Modelo de Etiqueta</Label>
            <Select value={modelo} onValueChange={setModelo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transportadora">Etiqueta para Transportadora</SelectItem>
                <SelectItem value="correios">Etiqueta para Correios</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {modelo === 'correios'
                ? 'Destinatário e remetente em blocos separados, com código de barras do CEP (Code 128C).'
                : 'Modelo completo com QR, código de barras da OS, símbolos ISO e dados operacionais.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Papel</Label>
            <Select value={papel} onValueChange={setPapel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="termica">Térmica 100 × 150 mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {papel === 'a4' && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Etiquetas por Folha A4</Label>
              <Select value={labelsPerPage} onValueChange={setLabelsPerPage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 por folha — máximo detalhe</SelectItem>
                  <SelectItem value="2">2 por folha</SelectItem>
                  <SelectItem value="4">4 por folha</SelectItem>
                  <SelectItem value="8">8 por folha — compacta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Símbolos ISO 780 — Manuseio e Transporte</Label>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecione os símbolos aplicáveis a esta carga</p>
            <div className="space-y-2 mt-1">
              {ISO_SYMBOLS.map(sym => (
                <label key={sym.id} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedSymbols.includes(sym.id)
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                  <Checkbox checked={selectedSymbols.includes(sym.id)} onCheckedChange={() => toggleSymbol(sym.id)} className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{sym.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sym.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t mt-2">
          <Button variant="outline" onClick={onClose} className="sm:flex-1">Cancelar</Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={generating || totalLabels === 0}
            className="sm:flex-1"
          >
            {generating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              : <><Printer className="w-4 h-4 mr-2" />Imprimir</>
            }
          </Button>
          <Button
            onClick={handleDownload}
            disabled={generating || totalLabels === 0}
            className="sm:flex-1"
            style={{ backgroundColor: '#0000FF' }}
          >
            {generating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              : <><Download className="w-4 h-4 mr-2" />Baixar PDF</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}