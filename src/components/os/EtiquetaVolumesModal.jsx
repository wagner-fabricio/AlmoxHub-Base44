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
  { id: 'fragil',         label: 'Frágil',              description: 'Conteúdo quebrável — manuseio cuidadoso' },
  { id: 'lado_cima',      label: 'Este Lado Para Cima', description: 'Posição correta de armazenamento' },
  { id: 'umidade',        label: 'Proteger da Umidade', description: 'Manter em local seco e protegido' },
  { id: 'empilhamento',   label: 'Empilhamento',        description: 'Limite de empilhamento' },
  { id: 'centro_gravidade', label: 'Centro de Gravidade', description: 'Posição do centro de gravidade' },
  { id: 'nao_garra',      label: 'Não Usar Garra',      description: 'Proibido uso de garras mecânicas' },
];

const SYMBOL_SVGS = {
  // Solid black goblet + white lightning bolt
  fragil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
    <path d="M14 4 L66 4 C74 26 72 48 56 60 C50 65 48 68 48 68 L32 68 C32 68 30 65 24 60 C8 48 6 26 14 4Z" fill="black"/>
    <path d="M43 14 L34 40 L42 40 L33 64 L50 36 L42 36 L51 14Z" fill="white"/>
    <rect x="36" y="68" width="8" height="17" fill="black" rx="1"/>
    <rect x="20" y="85" width="40" height="9" rx="3" fill="black"/>
  </svg>`,
  // Two solid upward arrows + base
  lado_cima: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M21 46 L10 46 L27 8 L44 46 L33 46 L33 78 L21 78Z" fill="black"/>
    <path d="M47 46 L36 46 L53 8 L70 46 L59 46 L59 78 L47 78Z" fill="black"/>
    <rect x="4" y="82" width="72" height="8" rx="2" fill="black"/>
  </svg>`,
  // Filled umbrella + J-handle
  umidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M4 46 Q4 6 40 6 Q76 6 76 46Z" fill="black"/>
    <line x1="27" y1="10" x2="27" y2="46" stroke="white" stroke-width="2.5"/>
    <line x1="53" y1="10" x2="53" y2="46" stroke="white" stroke-width="2.5"/>
    <rect x="37" y="46" width="6" height="28" fill="black" rx="3"/>
    <path d="M40 74 Q40 88 53 88 Q66 88 66 78" fill="none" stroke="black" stroke-width="7" stroke-linecap="round"/>
  </svg>`,
  // Three stacked boxes
  empilhamento: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
    <rect x="2"  y="63" width="76" height="23" rx="3" fill="black"/>
    <rect x="9"  y="38" width="62" height="23" rx="3" fill="black"/>
    <rect x="18" y="15" width="44" height="21" rx="3" fill="black"/>
    <rect x="0"  y="60" width="80" height="4" fill="white"/>
    <rect x="0"  y="35" width="80" height="4" fill="white"/>
  </svg>`,
  // Crosshair circle + center dot
  centro_gravidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="37" y="4"  width="6" height="72" fill="black" rx="3"/>
    <rect x="4"  y="37" width="72" height="6"  fill="black" rx="3"/>
    <circle cx="40" cy="40" r="8" fill="black"/>
  </svg>`,
  // Fork tines + prohibition slash
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

  const instalacaoOrigem  = instalacoes?.find(i => i?.id === os?.instalacao_origem_id);
  const instalacaoDestino = instalacoes?.find(i => i?.id === os?.instalacao_destino_id);

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

  const handleGenerate = async () => {
    if (!os?.volumes?.length) return;
    setGenerating(true);
    try {
      // Pre-render symbols as high-res PNGs
      const symImages = {};
      for (const sid of selectedSymbols)
        if (SYMBOL_SVGS[sid]) symImages[sid] = await svgToPng(SYMBOL_SVGS[sid], 280);

      const n = parseInt(labelsPerPage);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const PW = 210, PH = 297, MG = 5, GAP = 2;
      const grids = { 1: [1,1], 2: [1,2], 4: [2,2], 8: [2,4] };
      const [cols, rows] = grids[n];
      const LW = (PW - 2*MG - (cols-1)*GAP) / cols;
      const LH = (PH - 2*MG - (rows-1)*GAP) / rows;

      const genBarcode = (text) => {
        try {
          const c = document.createElement('canvas');
          JsBarcode(c, text, { format:'CODE128', displayValue:false, width:2, height:60, margin:4, background:'#fff', lineColor:'#000' });
          return c.toDataURL('image/png');
        } catch { return null; }
      };

      const totalWeight = expandedVolumes.reduce((s,v) => s + (parseFloat(v.peso_bruto)||0), 0);

      const drawLabel = (lx, ly, lw, lh, vol, vIdx, vTotal) => {
        const mg = 2.5;
        const iw = lw - 2*mg;

        // ── Font scaling: geometric mean of label dimensions, min 10pt ──
        const scale = Math.sqrt(lw * lh);
        const FSN  = Math.max(10,   scale * 0.120);  // normal body
        const FSL  = Math.max(8.5,  FSN  * 0.82);    // section labels (REMETENTE:)
        const FSA  = Math.max(7.5,  FSN  * 0.78);    // address
        const FSDN = Math.max(11,   FSN  * 1.14);    // destinatário name (larger)
        const FSC  = Math.max(11,   FSN  * 1.38);    // OS code (prominent)
        const FSS  = Math.max(9,    FSN  * 0.86);    // small fields
        const FSH  = Math.max(8,    FSN  * 0.94);    // header text
        const FSBar= Math.max(7.5,  FSN  * 0.80);    // summary bar

        const lhOf = (fs) => fs * 0.50;

        // ── Fixed-height sections ──
        const HEADER_H = Math.max(6.5, FSH * 0.84);
        const SUMBAR_H = Math.max(5,   FSBar * 0.80);
        const BOT_H    = Math.max(14,  lh * 0.20);

        // ── Top section height: max of left/right column needed ──
        const leftColW  = iw * 0.44;
        const rightColW = iw * 0.56 - 2; // 2mm gap
        const topLeft_H  = 1.5 + lhOf(FSL)+0.8 + lhOf(FSN)+0.6  + lhOf(FSA)+0.4 + 1;
        const topRight_H = 1.5 + lhOf(FSL)+0.8 + lhOf(FSDN)+0.6 + lhOf(FSA)+0.4 + 1;
        const TOP_H = Math.max(topLeft_H, topRight_H);
        const MID_H = lh - HEADER_H - TOP_H - SUMBAR_H - BOT_H;

        // ── Outer border ──
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

        // ══════════ TOP SECTION — 2 columns ══════════
        const topStart = ly + HEADER_H;
        const topEnd   = topStart + TOP_H;
        const colGap   = 2;
        const colX_R   = lx + mg + leftColW + colGap; // right col start

        // Left column: REMETENTE (smaller font)
        let ty = topStart + 1.5;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSL);
        pdf.text('REMETENTE:', lx+mg, ty + lhOf(FSL)*0.76); ty += lhOf(FSL)+0.8;

        pdf.setFont('helvetica','normal'); pdf.setFontSize(FSN);
        const rnNome = pdf.splitTextToSize(instalacaoOrigem?.nome || '-', leftColW).slice(0,1);
        pdf.text(rnNome, lx+mg, ty + lhOf(FSN)*0.76); ty += lhOf(FSN)+0.6;

        const rnAddr = getEndereco(instalacaoOrigem);
        if (rnAddr) {
          pdf.setFontSize(FSA);
          const rnAddrL = pdf.splitTextToSize(rnAddr, leftColW).slice(0,2);
          pdf.text(rnAddrL, lx+mg, ty + lhOf(FSA)*0.76);
        }

        // Right column: DESTINATÁRIO (larger font)
        let ry = topStart + 1.5;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSL);
        pdf.text('DESTINATÁRIO:', colX_R, ry + lhOf(FSL)*0.76); ry += lhOf(FSL)+0.8;

        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSDN);
        const dnNome = pdf.splitTextToSize(instalacaoDestino?.nome || '-', rightColW).slice(0,1);
        pdf.text(dnNome, colX_R, ry + lhOf(FSDN)*0.76); ry += lhOf(FSDN)+0.6;

        const dnAddr = getEndereco(instalacaoDestino);
        if (dnAddr) {
          pdf.setFont('helvetica','normal'); pdf.setFontSize(FSA);
          const dnAddrL = pdf.splitTextToSize(dnAddr, rightColW).slice(0,2);
          pdf.text(dnAddrL, colX_R, ry + lhOf(FSA)*0.76);
        }

        // Vertical divider between columns
        pdf.setLineWidth(0.25);
        pdf.line(lx+mg+leftColW+1, topStart+1.5, lx+mg+leftColW+1, topEnd-1.5);

        // Section bottom border
        pdf.setLineWidth(0.9);
        pdf.line(lx, topEnd, lx+lw, topEnd);

        // ══════════ MIDDLE SECTION ══════════
        const midStart = topEnd;
        const midEnd   = midStart + MID_H - SUMBAR_H;
        const hasSyms  = selectedSymbols.length > 0;
        const symZoneW = hasSyms ? Math.min(lw * 0.34, 38) : 0;
        const dataW    = iw - symZoneW;
        let my = midStart + 1.5;

        const printMid = (text, x, y, fs, bold=false, maxW=dataW, maxLines=1) => {
          if (y > midEnd) return y;
          pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(fs);
          const lines = pdf.splitTextToSize(text, maxW).slice(0, maxLines);
          pdf.text(lines, x, y + lhOf(fs)*0.76);
          return y + lines.length * lhOf(fs) + 0.7;
        };

        my = printMid('ORDEM DE SERVIÇO:', lx+mg, my, FSS*0.88, true, dataW, 1);
        my = printMid(os?.codigo || '-',   lx+mg, my, FSC,       true, dataW, 1);

        if (os?.num_reserva)   my = printMid(`Reserva: ${os.num_reserva}`,       lx+mg, my, FSS, false, dataW, 1);
        if (os?.num_migo)      my = printMid(`MIGO: ${os.num_migo}`,             lx+mg, my, FSS, false, dataW, 1);
        if (os?.usuario_reserva) my = printMid(`Usuário: ${os.usuario_reserva}`, lx+mg, my, FSS, false, dataW, 1);

        if (my < midEnd - lhOf(FSS)*2) {
          my += 0.4;
          pdf.setLineWidth(0.15); pdf.line(lx+mg, my, lx+mg+dataW, my); my += 1.2;
          my = printMid(`C: ${vol.comprimento||'—'} cm  L: ${vol.largura||'—'} cm  A: ${vol.altura||'—'} cm`, lx+mg, my, FSS, false, dataW, 1);
          printMid(`Peso Bruto: ${vol.peso_bruto||'—'} kg${vol.m3 ? `   M³: ${vol.m3}` : ''}`, lx+mg, my, FSS, false, dataW, 1);
        }

        // Symbols (right zone)
        if (hasSyms && symZoneW > 0) {
          const symX     = lx + mg + dataW + 1;
          const availH   = MID_H - SUMBAR_H - 3;
          const symCols  = symZoneW >= 24 && selectedSymbols.length > 2 ? 2 : 1;
          const symRows  = Math.ceil(selectedSymbols.length / symCols);
          const colW     = symZoneW / symCols;
          const symSz    = Math.max(6, Math.min(colW-2, (availH/symRows)-5));
          const showLbl  = symSz >= 14;
          const rowH     = symSz + (showLbl ? 6 : 2.5);

          selectedSymbols.forEach((sid, si) => {
            const col = si % symCols;
            const row = Math.floor(si / symCols);
            const sX  = symX + col * colW;
            const sY  = midStart + 2 + row * rowH;
            if (sY + symSz > midEnd + SUMBAR_H) return;
            if (symImages[sid]) pdf.addImage(symImages[sid], 'PNG', sX, sY, symSz, symSz);
            if (showLbl) {
              const sym = ISO_SYMBOLS.find(s => s.id === sid);
              if (sym) {
                pdf.setFontSize(Math.max(4, symSz*0.22));
                pdf.setFont('helvetica','normal');
                pdf.text(pdf.splitTextToSize(sym.label, colW-1).slice(0,2), sX, sY+symSz+2);
              }
            }
          });
        }

        // Summary bar
        const smY = midStart + MID_H - SUMBAR_H;
        pdf.setFillColor(210,210,210);
        pdf.rect(lx, smY, lw, SUMBAR_H, 'F');
        pdf.setFontSize(FSBar); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,0,0);
        pdf.text(
          `${vTotal} vol(s)  |  Peso Total: ${totalWeight.toFixed(1)} kg  |  Vol. ${vIdx+1}/${vTotal}`,
          lx+mg, smY + SUMBAR_H*0.72
        );
        pdf.setLineWidth(0.9);
        pdf.line(lx, midStart+MID_H, lx+lw, midStart+MID_H);

        // ══════════ BOTTOM — Barcode ══════════
        const botY  = midStart + MID_H;
        const cnpjO = (instalacaoOrigem?.cnpj||'').replace(/\D/g,'').substring(0,14).padEnd(14,'0');
        const cnpjD = (instalacaoDestino?.cnpj||'').replace(/\D/g,'').substring(0,14).padEnd(14,'0');
        const osCode = (os?.codigo||'OS').replace(/[^A-Z0-9\-_]/gi,'').toUpperCase();
        const barcodeData = `${osCode} ${String(vIdx+1).padStart(2,'0')}/${String(vTotal).padStart(2,'0')} ${cnpjO} ${cnpjD}`;
        const bcImg = genBarcode(barcodeData);
        if (bcImg) {
          const bcH = Math.min(BOT_H*0.56, 16);
          pdf.addImage(bcImg, 'PNG', lx+mg, botY+1.5, iw, bcH);
          // Single compact info line
          const hrY  = botY + 1.5 + bcH + 1.2;
          const fHR  = Math.max(3.5, Math.min(FSN*0.32, 5));
          pdf.setFontSize(fHR); pdf.setFont('helvetica','normal');
          const hrTxt = `OS: ${os?.codigo||'-'}  |  Vol: ${vIdx+1}/${vTotal}  |  Peso: ${vol.peso_bruto||'-'} kg  |  Total: ${totalWeight.toFixed(1)} kg  |  CNPJ Orig: ${instalacaoOrigem?.cnpj||'-'}  |  CNPJ Dest: ${instalacaoDestino?.cnpj||'-'}`;
          pdf.text(pdf.splitTextToSize(hrTxt, iw).slice(0,2), lx+mg, hrY + fHR*0.4);
        }
      };

      expandedVolumes.forEach((vol, vIdx) => {
        const pos = vIdx % n, col = pos % cols, row = Math.floor(pos/cols);
        if (vIdx > 0 && pos === 0) pdf.addPage();
        drawLabel(MG+col*(LW+GAP), MG+row*(LH+GAP), LW, LH, vol, vIdx, expandedVolumes.length);
      });

      pdf.save(`Etiquetas_${os?.codigo||'OS'}.pdf`);
    } catch(err) {
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
                {(os?.volumes||[]).length} tipo(s) de volume · OS {os?.codigo}
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

        <div className="flex gap-3 pt-3 border-t mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleGenerate} disabled={generating || totalLabels === 0} className="flex-1" style={{ backgroundColor: '#0000FF' }}>
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