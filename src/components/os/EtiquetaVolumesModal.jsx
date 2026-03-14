import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Tag, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

const ISO_SYMBOLS = [
  { id: 'fragil', label: 'Frágil', description: 'Conteúdo quebrável — manuseio cuidadoso' },
  { id: 'lado_cima', label: 'Este Lado Para Cima', description: 'Posição correta de armazenamento' },
  { id: 'umidade', label: 'Proteger da Umidade', description: 'Manter em local seco e protegido' },
  { id: 'empilhamento', label: 'Empilhamento', description: 'Limite de empilhamento' },
  { id: 'centro_gravidade', label: 'Centro de Gravidade', description: 'Posição do centro de gravidade' },
  { id: 'nao_garra', label: 'Não Usar Garra', description: 'Proibido uso de garras mecânicas' },
];

// High-quality SVG silhouettes matching ISO 780 reference
const SYMBOL_SVGS = {
  // Solid black goblet with white lightning bolt crack (ISO fragile)
  fragil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
    <path d="M14 4 L66 4 C74 26 72 48 56 60 C50 65 48 68 48 68 L32 68 C32 68 30 65 24 60 C8 48 6 26 14 4Z" fill="black"/>
    <path d="M43 14 L34 40 L42 40 L33 64 L50 36 L42 36 L51 14Z" fill="white"/>
    <rect x="36" y="68" width="8" height="17" fill="black" rx="1"/>
    <rect x="20" y="85" width="40" height="9" rx="3" fill="black"/>
  </svg>`,

  // Two solid upward arrows with base bar
  lado_cima: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M21 46 L10 46 L27 8 L44 46 L33 46 L33 78 L21 78Z" fill="black"/>
    <path d="M47 46 L36 46 L53 8 L70 46 L59 46 L59 78 L47 78Z" fill="black"/>
    <rect x="4" y="82" width="72" height="8" rx="2" fill="black"/>
  </svg>`,

  // Filled umbrella dome with handle
  umidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M4 46 Q4 6 40 6 Q76 6 76 46Z" fill="black"/>
    <path d="M6 46 Q16 30 28 38 Q40 6 40 46Z" fill="black"/>
    <path d="M40 46 Q40 6 52 38 Q64 30 74 46Z" fill="black"/>
    <line x1="10" y1="46" x2="70" y2="46" stroke="white" stroke-width="3"/>
    <line x1="28" y1="38" x2="28" y2="46" stroke="white" stroke-width="2"/>
    <line x1="52" y1="38" x2="52" y2="46" stroke="white" stroke-width="2"/>
    <rect x="37" y="46" width="6" height="28" fill="black" rx="3"/>
    <path d="M40 74 Q40 88 53 88 Q66 88 66 78" fill="none" stroke="black" stroke-width="7" stroke-linecap="round"/>
  </svg>`,

  // Three stacked boxes
  empilhamento: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
    <rect x="2" y="63" width="76" height="23" rx="3" fill="black"/>
    <rect x="9" y="38" width="62" height="23" rx="3" fill="black"/>
    <rect x="18" y="15" width="44" height="21" rx="3" fill="black"/>
    <rect x="0" y="60" width="80" height="4" fill="white"/>
    <rect x="0" y="35" width="80" height="4" fill="white"/>
  </svg>`,

  // Circle with crosshair and center dot
  centro_gravidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="37" y="4" width="6" height="72" fill="black" rx="3"/>
    <rect x="4" y="37" width="72" height="6" fill="black" rx="3"/>
    <circle cx="40" cy="40" r="8" fill="black"/>
  </svg>`,

  // Fork tines + prohibition circle + diagonal slash
  nao_garra: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="22" y="10" width="7" height="24" rx="3.5" fill="black"/>
    <rect x="36" y="10" width="8" height="24" rx="4" fill="black"/>
    <rect x="51" y="10" width="7" height="24" rx="3.5" fill="black"/>
    <rect x="22" y="31" width="36" height="6" rx="2" fill="black"/>
    <rect x="36" y="37" width="8" height="26" rx="4" fill="black"/>
    <line x1="12" y1="68" x2="68" y2="12" stroke="black" stroke-width="9" stroke-linecap="round"/>
  </svg>`,
};

const svgToPng = (svgStr, px = 240) => new Promise((resolve) => {
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, px, px);
    ctx.drawImage(img, 0, 0, px, px);
    URL.revokeObjectURL(url);
    resolve(c.toDataURL('image/png'));
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
  img.src = url;
});

export default function EtiquetaVolumesModal({ open, onClose, os, instalacoes }) {
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [labelsPerPage, setLabelsPerPage] = useState('2');
  const [generating, setGenerating] = useState(false);

  const instalacaoOrigem = instalacoes?.find(i => i?.id === os?.instalacao_origem_id);
  const instalacaoDestino = instalacoes?.find(i => i?.id === os?.instalacao_destino_id);

  const expandedVolumes = (os?.volumes || []).flatMap(vol => {
    const qty = parseInt(vol.quantidade) || 1;
    return Array(qty).fill(vol);
  });
  const totalLabels = expandedVolumes.length;

  const toggleSymbol = (id) => {
    setSelectedSymbols(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const getEndereco = (inst) => {
    if (!inst) return '';
    return [inst.logradouro, inst.numero, inst.bairro,
      `${inst.cidade || ''}${inst.estado ? '/' + inst.estado : ''}`, inst.cep
    ].filter(Boolean).join(', ');
  };

  const handleGenerate = async () => {
    if (!os?.volumes?.length) return;
    setGenerating(true);
    try {
      const symImages = {};
      for (const sid of selectedSymbols) {
        if (SYMBOL_SVGS[sid]) symImages[sid] = await svgToPng(SYMBOL_SVGS[sid], 240);
      }

      const n = parseInt(labelsPerPage);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const PW = 210, PH = 297, MG = 5, GAP = 2;
      const grids = { 1: [1, 1], 2: [1, 2], 4: [2, 2], 8: [2, 4] };
      const [cols, rows] = grids[n];
      const LW = (PW - 2 * MG - (cols - 1) * GAP) / cols;
      const LH = (PH - 2 * MG - (rows - 1) * GAP) / rows;

      const genBarcode = (text) => {
        try {
          const c = document.createElement('canvas');
          JsBarcode(c, text, { format: 'CODE128', displayValue: false, width: 2, height: 60, margin: 4, background: '#fff', lineColor: '#000' });
          return c.toDataURL('image/png');
        } catch { return null; }
      };

      const totalWeight = expandedVolumes.reduce((s, v) => s + (parseFloat(v.peso_bruto) || 0), 0);

      const drawLabel = (lx, ly, lw, lh, vol, vIdx, vTotal) => {
        const mg = 2.5;
        const iw = lw - 2 * mg;

        // All font sizes scale with label width
        const HEADER_H = Math.max(5, Math.min(lw * 0.062, 7.5));  // reduced header
        const SUMBAR_H = Math.max(4.5, Math.min(lw * 0.052, 6.5)); // reduced summary bar
        const BOT_H = Math.max(14, Math.min(lh * 0.22, 32));

        // Available for top (remetente/destinatário) and mid sections
        const contentH = lh - HEADER_H - BOT_H;
        const TOP_H = contentH * 0.42;
        const MID_H = contentH * 0.58;

        const FSH = Math.max(5.5, Math.min(lw * 0.068, 10));     // header
        const FSL = Math.max(4, Math.min(lw * 0.040, 6));        // label (REMETENTE:)
        const FSN = Math.max(4.5, Math.min(lw * 0.050, 8));      // normal body
        const FSA = Math.max(3.8, Math.min(lw * 0.038, 5.5));    // address (smaller)
        const FSC = Math.max(6, Math.min(lw * 0.075, 12));       // OS code (large)
        const FSS = Math.max(3.8, Math.min(lw * 0.040, 6));      // small fields

        // Outer border
        pdf.setLineWidth(0.8);
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(lx, ly, lw, lh, 'S');

        // ====== HEADER ======
        pdf.setFillColor(0, 0, 0);
        pdf.rect(lx, ly, lw, HEADER_H, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FSH);
        pdf.text('AXIA ENERGIA', lx + mg, ly + HEADER_H * 0.74);
        const vtLabel = `VOL. ${vIdx + 1}/${vTotal}`;
        const vtW = pdf.getStringUnitWidth(vtLabel) * FSH / pdf.internal.scaleFactor;
        pdf.text(vtLabel, lx + lw - mg - vtW, ly + HEADER_H * 0.74);
        pdf.setTextColor(0, 0, 0);

        // ====== TOP SECTION ======
        // Reserve space: REMETENTE label + name + addr + divider + DESTINATÁRIO label + name + addr
        // Calculate per-line heights
        const lhL = FSL * 0.48;
        const lhN = FSN * 0.48;
        const lhA = FSA * 0.48;

        // How many lines fit: split TOP_H evenly between remetente and destinatário
        const halfTop = TOP_H / 2 - 1.5;
        const maxRemLines = Math.max(1, Math.floor((halfTop - lhL - 1) / lhN));
        const maxDestLines = Math.max(1, Math.floor((halfTop - lhL - 1) / lhN));

        let ty = ly + HEADER_H + 1.2;
        const topBoundary = ly + HEADER_H + TOP_H - 1;

        const printLine = (text, x, y, fs, bold = false, maxW = iw, maxLines = 1) => {
          if (y > topBoundary) return y;
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(fs);
          const lines = pdf.splitTextToSize(text, maxW).slice(0, maxLines);
          pdf.text(lines, x, y + fs * 0.38);
          return y + lines.length * (fs * 0.48) + 0.6;
        };

        // REMETENTE
        ty = printLine('REMETENTE:', lx + mg, ty, FSL, true, iw, 1);
        ty = printLine(instalacaoOrigem?.nome || '-', lx + mg, ty, FSN, false, iw, maxRemLines);
        const onEnd = getEndereco(instalacaoOrigem);
        if (onEnd) ty = printLine(onEnd, lx + mg, ty, FSA, false, iw, 1);

        // Divider
        ty += 0.5;
        if (ty < topBoundary) {
          pdf.setLineWidth(0.2);
          pdf.line(lx + mg, ty, lx + lw - mg, ty);
          ty += 1.5;
        }

        // DESTINATÁRIO — always show at least label + name
        const destStart = Math.min(ty, topBoundary - lhL - lhN - 1);
        ty = destStart;
        ty = printLine('DESTINATÁRIO:', lx + mg, ty, FSL, true, iw, 1);
        ty = printLine(instalacaoDestino?.nome || '-', lx + mg, ty, FSN, false, iw, maxDestLines);
        const dnEnd = getEndereco(instalacaoDestino);
        if (dnEnd) printLine(dnEnd, lx + mg, ty, FSA, false, iw, 1);

        // Section divider
        const topEnd = ly + HEADER_H + TOP_H;
        pdf.setLineWidth(0.9);
        pdf.line(lx, topEnd, lx + lw, topEnd);

        // ====== MIDDLE SECTION ======
        const midStart = topEnd;
        const midEnd = midStart + MID_H - SUMBAR_H;
        const hasSyms = selectedSymbols.length > 0;
        const symZoneW = hasSyms ? Math.min(lw * 0.34, 36) : 0;
        const dataW = iw - symZoneW;
        let my = midStart + 1.5;

        const printMid = (text, x, y, fs, bold = false, maxW = dataW, maxLines = 1) => {
          if (y > midEnd) return y;
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(fs);
          const lines = pdf.splitTextToSize(text, maxW).slice(0, maxLines);
          pdf.text(lines, x, y + fs * 0.38);
          return y + lines.length * (fs * 0.48) + 0.6;
        };

        my = printMid('ORDEM DE SERVIÇO:', lx + mg, my, FSS * 0.9, true, dataW, 1);
        my = printMid(os?.codigo || '-', lx + mg, my, FSC, true, dataW, 1);

        if (os?.num_reserva) my = printMid(`Reserva: ${os.num_reserva}`, lx + mg, my, FSS, false, dataW, 1);
        if (os?.num_migo) my = printMid(`MIGO: ${os.num_migo}`, lx + mg, my, FSS, false, dataW, 1);
        if (os?.usuario_reserva) my = printMid(`Usuário: ${os.usuario_reserva}`, lx + mg, my, FSS, false, dataW, 1);

        if (my < midEnd - FSS * 0.6) {
          my += 0.3;
          pdf.setLineWidth(0.15);
          pdf.line(lx + mg, my, lx + mg + dataW, my);
          my += 1.2;
        }

        // Dimensions on one line
        const dimTxt = `C: ${vol.comprimento || '—'} cm  L: ${vol.largura || '—'} cm  A: ${vol.altura || '—'} cm`;
        my = printMid(dimTxt, lx + mg, my, FSS, false, dataW, 1);
        const pesoTxt = `Peso Bruto: ${vol.peso_bruto || '—'} kg${vol.m3 ? `   M³: ${vol.m3}` : ''}`;
        printMid(pesoTxt, lx + mg, my, FSS, false, dataW, 1);

        // Symbols (right column)
        if (hasSyms && symZoneW > 0) {
          const symX = lx + mg + dataW + 1;
          const availH = MID_H - SUMBAR_H - 3;
          const symCols = symZoneW >= 22 && selectedSymbols.length > 2 ? 2 : 1;
          const symRows = Math.ceil(selectedSymbols.length / symCols);
          const colW = symZoneW / symCols;
          const rawSz = Math.min(colW - 2, (availH / symRows) - 4);
          const symSz = Math.max(5, rawSz);
          const showLbl = symSz >= 12;
          const rowH = symSz + (showLbl ? 5 : 2);

          selectedSymbols.forEach((sid, si) => {
            const col = si % symCols;
            const row = Math.floor(si / symCols);
            const sX = symX + col * colW;
            const sY = midStart + 2 + row * rowH;
            if (sY + symSz > midEnd + SUMBAR_H) return;
            if (symImages[sid]) pdf.addImage(symImages[sid], 'PNG', sX, sY, symSz, symSz);
            if (showLbl) {
              const sym = ISO_SYMBOLS.find(s => s.id === sid);
              if (sym) {
                pdf.setFontSize(Math.max(3, symSz * 0.21));
                pdf.setFont('helvetica', 'normal');
                pdf.text(pdf.splitTextToSize(sym.label, colW - 1).slice(0, 2), sX, sY + symSz + 1.5);
              }
            }
          });
        }

        // Summary bar (reduced height)
        const smY = midStart + MID_H - SUMBAR_H;
        pdf.setFillColor(210, 210, 210);
        pdf.rect(lx, smY, lw, SUMBAR_H, 'F');
        const fSum = Math.max(3.8, Math.min(lw * 0.042, 5.8));
        pdf.setFontSize(fSum);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(
          `${vTotal} vol(s)  |  Peso Total: ${totalWeight.toFixed(1)} kg  |  Vol. ${vIdx + 1}/${vTotal}`,
          lx + mg, smY + SUMBAR_H * 0.72
        );

        pdf.setLineWidth(0.9);
        pdf.line(lx, midStart + MID_H, lx + lw, midStart + MID_H);

        // ====== BOTTOM SECTION — Barcode + single info line ======
        const botY = midStart + MID_H;
        const cnpjO = (instalacaoOrigem?.cnpj || '').replace(/\D/g, '').substring(0, 14).padEnd(14, '0');
        const cnpjD = (instalacaoDestino?.cnpj || '').replace(/\D/g, '').substring(0, 14).padEnd(14, '0');
        const osCode = (os?.codigo || 'OS').replace(/[^A-Z0-9\-_]/gi, '').toUpperCase();
        const barcodeData = `${osCode} ${String(vIdx + 1).padStart(2, '0')}/${String(vTotal).padStart(2, '0')} ${cnpjO} ${cnpjD}`;
        const bcImg = genBarcode(barcodeData);
        if (bcImg) {
          const bcH = Math.min(BOT_H * 0.56, 16);
          pdf.addImage(bcImg, 'PNG', lx + mg, botY + 1.5, iw, bcH);

          // Single info line below barcode
          const hrY = botY + 1.5 + bcH + 1.2;
          const fHR = Math.max(3, Math.min(lw * 0.030, 4.5));
          pdf.setFontSize(fHR);
          pdf.setFont('helvetica', 'normal');
          const hrLine = `OS: ${os?.codigo || '-'}  |  Vol: ${vIdx + 1}/${vTotal}  |  Peso: ${vol.peso_bruto || '-'} kg  |  Total: ${totalWeight.toFixed(1)} kg  |  CNPJ Orig: ${instalacaoOrigem?.cnpj || '-'}  |  CNPJ Dest: ${instalacaoDestino?.cnpj || '-'}`;
          const hrLines = pdf.splitTextToSize(hrLine, iw);
          // Always show max 2 lines
          pdf.text(hrLines.slice(0, 2), lx + mg, hrY + fHR * 0.4);
        }
      };

      expandedVolumes.forEach((vol, vIdx) => {
        const pos = vIdx % n;
        const col = pos % cols;
        const row = Math.floor(pos / cols);
        if (vIdx > 0 && pos === 0) pdf.addPage();
        const lx = MG + col * (LW + GAP);
        const ly = MG + row * (LH + GAP);
        drawLabel(lx, ly, LW, LH, vol, vIdx, expandedVolumes.length);
      });

      pdf.save(`Etiquetas_${os?.codigo || 'OS'}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar etiquetas:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                {(os?.volumes || []).length} tipo(s) de volume · OS {os?.codigo}
              </p>
            </div>
          </div>

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

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Símbolos ISO 780 — Manuseio e Transporte</Label>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecione os símbolos aplicáveis a esta carga</p>
            <div className="space-y-2 mt-1">
              {ISO_SYMBOLS.map(sym => (
                <label
                  key={sym.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedSymbols.includes(sym.id)
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Checkbox
                    checked={selectedSymbols.includes(sym.id)}
                    onCheckedChange={() => toggleSymbol(sym.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{sym.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sym.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || totalLabels === 0}
            className="flex-1"
            style={{ backgroundColor: '#0000FF' }}
          >
            {generating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              : <><Tag className="w-4 h-4 mr-2" />Gerar {totalLabels} Etiqueta{totalLabels !== 1 ? 's' : ''}</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}