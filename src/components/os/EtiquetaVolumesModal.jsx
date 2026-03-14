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

// Clean bold silhouette SVGs matching ISO 780 reference quality
const SYMBOL_SVGS = {
  fragil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
    <path d="M16 5 L64 5 C73 32 71 50 58 64 C52 72 50 75 50 75 C50 75 48 72 42 64 C29 50 27 32 16 5Z" fill="black"/>
    <path d="M50 19 L44 41 L52 41 L45 65 L62 37 L54 37 L60 19Z" fill="white"/>
    <rect x="45" y="75" width="10" height="14" fill="black" rx="2"/>
    <path d="M24 91 L56 91 L60 100 H20Z" fill="black"/>
  </svg>`,

  lado_cima: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M22 48 L10 48 L27 7 L44 48 L32 48 L32 80 L22 80Z" fill="black"/>
    <path d="M48 48 L36 48 L53 7 L70 48 L58 48 L58 80 L48 80Z" fill="black"/>
    <rect x="5" y="83" width="70" height="9" rx="2" fill="black"/>
  </svg>`,

  umidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92">
    <path d="M4 48 C4 20 20 5 40 5 C60 5 76 20 76 48Z" fill="black"/>
    <line x1="40" y1="7" x2="40" y2="48" stroke="white" stroke-width="2.5"/>
    <line x1="4" y1="48" x2="22" y2="24" stroke="white" stroke-width="2"/>
    <line x1="76" y1="48" x2="58" y2="24" stroke="white" stroke-width="2"/>
    <rect x="36" y="48" width="8" height="28" fill="black" rx="4"/>
    <path d="M40 76 Q40 88 53 88 Q66 88 66 76" fill="none" stroke="black" stroke-width="7" stroke-linecap="round"/>
  </svg>`,

  empilhamento: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
    <rect x="2" y="62" width="76" height="24" rx="3" fill="black"/>
    <rect x="9" y="38" width="62" height="22" rx="3" fill="black"/>
    <rect x="18" y="16" width="44" height="20" rx="3" fill="black"/>
    <rect x="0" y="59" width="80" height="4" fill="white"/>
    <rect x="0" y="35" width="80" height="4" fill="white"/>
  </svg>`,

  centro_gravidade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="37" y="4" width="6" height="72" fill="black" rx="3"/>
    <rect x="4" y="37" width="72" height="6" fill="black" rx="3"/>
    <circle cx="40" cy="40" r="7" fill="black"/>
  </svg>`,

  nao_garra: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="black" stroke-width="7"/>
    <rect x="22" y="10" width="7" height="24" rx="3.5" fill="black"/>
    <rect x="36" y="10" width="7" height="24" rx="3.5" fill="black"/>
    <rect x="51" y="10" width="7" height="24" rx="3.5" fill="black"/>
    <rect x="22" y="30" width="36" height="6" rx="2" fill="black"/>
    <rect x="36" y="36" width="7" height="26" rx="3.5" fill="black"/>
    <line x1="12" y1="68" x2="68" y2="12" stroke="black" stroke-width="9" stroke-linecap="round"/>
  </svg>`,
};

// Render SVG string to PNG data URL at given pixel size
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
      // Pre-render all selected symbols as high-res PNGs
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

        // Fonts scale with label size — smaller labels get smaller fonts
        const scale = Math.min(lw, lh * 1.4);
        const FSS = Math.max(4, Math.min(scale * 0.042, 7.5));   // small text
        const FSN = Math.max(5, Math.min(scale * 0.052, 9.5));   // normal text
        const FSH = Math.max(6, Math.min(lw * 0.072, 11));       // header
        const FSC = Math.max(6.5, Math.min(lw * 0.080, 13));     // OS code
        const lhS = FSS * 0.46;
        const lhN = FSN * 0.46;

        // Section heights
        const HEADER_H = Math.min(9, Math.max(5.5, FSH * 1.2));
        const BOT_H = Math.min(38, Math.max(13, lh * 0.23));
        const TOP_H = lh * 0.40;   // divider between top and mid
        const MID_H = lh - TOP_H - BOT_H;
        const SUMBAR_H = Math.min(8, MID_H * 0.28);

        // Small label = limit text lines
        const maxNomLines = lh < 85 ? 1 : 2;
        const maxAddrLines = lh < 85 ? 1 : 2;

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
        pdf.text('AXIA ENERGIA', lx + mg, ly + HEADER_H * 0.73);
        const vtLabel = `VOL. ${vIdx + 1}/${vTotal}`;
        const vtW = pdf.getStringUnitWidth(vtLabel) * FSH / pdf.internal.scaleFactor;
        pdf.text(vtLabel, lx + lw - mg - vtW, ly + HEADER_H * 0.73);
        pdf.setTextColor(0, 0, 0);

        // ====== TOP SECTION: Remetente / Destinatário ======
        const topEnd = ly + TOP_H - 1.5; // don't draw below this
        let ty = ly + HEADER_H + 1.5;

        const writeText = (text, x, y, fs, bold = false, maxW = iw, maxLines = 1) => {
          if (y >= topEnd) return y;
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(fs);
          const lines = pdf.splitTextToSize(text, maxW).slice(0, maxLines);
          pdf.text(lines, x, y + fs * 0.38);
          return y + lines.length * (fs * 0.46) + 0.8;
        };

        // Remetente
        ty = writeText('REMETENTE:', lx + mg, ty, FSS, true);
        ty = writeText(instalacaoOrigem?.nome || '-', lx + mg, ty, FSN, false, iw, maxNomLines);
        const onEnd = getEndereco(instalacaoOrigem);
        if (onEnd && ty < topEnd) ty = writeText(onEnd, lx + mg, ty, FSS * 0.92, false, iw, maxAddrLines);

        // Divider
        ty += 0.5;
        if (ty < topEnd) {
          pdf.setLineWidth(0.25);
          pdf.line(lx + mg, ty, lx + lw - mg, ty);
          ty += 2;
        }

        // Destinatário
        ty = writeText('DESTINATÁRIO:', lx + mg, ty, FSS, true);
        ty = writeText(instalacaoDestino?.nome || '-', lx + mg, ty, FSN, false, iw, maxNomLines);
        const dnEnd = getEndereco(instalacaoDestino);
        if (dnEnd && ty < topEnd) writeText(dnEnd, lx + mg, ty, FSS * 0.92, false, iw, maxAddrLines);

        // Section divider line
        pdf.setLineWidth(1.0);
        pdf.line(lx, ly + TOP_H, lx + lw, ly + TOP_H);

        // ====== MID SECTION ======
        const midStart = ly + TOP_H;
        const midEnd = midStart + MID_H - SUMBAR_H; // boundary above summary bar
        const hasSyms = selectedSymbols.length > 0;
        const symZoneW = hasSyms ? Math.min(lw * 0.36, 40) : 0;
        const dataW = iw - symZoneW;
        let my = midStart + 1.5;

        const writeMid = (text, x, y, fs, bold = false, maxW = dataW, maxLines = 1) => {
          if (y >= midEnd) return y;
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(fs);
          const lines = pdf.splitTextToSize(text, maxW).slice(0, maxLines);
          pdf.text(lines, x, y + fs * 0.38);
          return y + lines.length * (fs * 0.46) + 0.8;
        };

        my = writeMid('ORDEM DE SERVIÇO:', lx + mg, my, FSS * 0.9, true);
        my = writeMid(os?.codigo || '-', lx + mg, my, FSC, true, dataW, 1);

        const docFields = [];
        if (os?.num_reserva) docFields.push(`Reserva: ${os.num_reserva}`);
        if (os?.num_migo) docFields.push(`MIGO: ${os.num_migo}`);
        if (os?.usuario_reserva) docFields.push(`Usuário: ${os.usuario_reserva}`);
        for (const f of docFields) {
          if (my >= midEnd) break;
          my = writeMid(f, lx + mg, my, FSS, false, dataW, 1);
        }

        if (my < midEnd - lhS * 2) {
          my += 0.5;
          pdf.setLineWidth(0.2); pdf.line(lx + mg, my, lx + mg + dataW, my); my += 1.5;
          my = writeMid('DIMENSÕES:', lx + mg, my, FSS * 0.9, true, dataW, 1);
        }
        if (my < midEnd) {
          my = writeMid(
            `C: ${vol.comprimento || '—'} cm  L: ${vol.largura || '—'} cm  A: ${vol.altura || '—'} cm`,
            lx + mg, my, FSS, false, dataW, 1
          );
        }
        if (my < midEnd) {
          writeMid(
            `Peso Bruto: ${vol.peso_bruto || '—'} kg${vol.m3 ? `   M³: ${vol.m3}` : ''}`,
            lx + mg, my, FSS, false, dataW, 1
          );
        }

        // Symbols (right column)
        if (hasSyms && symZoneW > 0) {
          const symX = lx + mg + dataW + 1;
          const availH = MID_H - SUMBAR_H - 3;
          const symCols = symZoneW >= 24 && selectedSymbols.length > 2 ? 2 : 1;
          const symRows = Math.ceil(selectedSymbols.length / symCols);
          const colW = symZoneW / symCols;
          const rawSz = Math.min(colW - 2, (availH / symRows) - 4);
          const symSz = Math.max(5, rawSz);
          const showLbl = symSz >= 11;
          const rowSpacing = symSz + (showLbl ? 5 : 2);

          selectedSymbols.forEach((sid, si) => {
            const col = si % symCols;
            const row = Math.floor(si / symCols);
            const sX = symX + col * colW;
            const sY = midStart + 2 + row * rowSpacing;
            if (sY + symSz > midEnd) return;
            if (symImages[sid]) pdf.addImage(symImages[sid], 'PNG', sX, sY, symSz, symSz);
            if (showLbl) {
              const sym = ISO_SYMBOLS.find(s => s.id === sid);
              if (sym) {
                pdf.setFontSize(Math.max(3, symSz * 0.22));
                pdf.setFont('helvetica', 'normal');
                const lbl = pdf.splitTextToSize(sym.label, colW - 1).slice(0, 2);
                pdf.text(lbl, sX, sY + symSz + 1.5);
              }
            }
          });
        }

        // Summary bar
        const smY = midStart + MID_H - SUMBAR_H;
        pdf.setFillColor(215, 215, 215);
        pdf.rect(lx, smY, lw, SUMBAR_H, 'F');
        pdf.setFontSize(Math.max(4, Math.min(lw * 0.044, 6)));
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(
          `${vTotal} vol(s)  |  Peso Total: ${totalWeight.toFixed(1)} kg  |  Vol. ${vIdx + 1}/${vTotal}`,
          lx + mg, smY + SUMBAR_H * 0.68
        );

        pdf.setLineWidth(1.0);
        pdf.line(lx, midStart + MID_H, lx + lw, midStart + MID_H);

        // ====== BOTTOM: Barcode ======
        const botY = midStart + MID_H;
        const cnpjO = (instalacaoOrigem?.cnpj || '').replace(/\D/g, '').substring(0, 14).padEnd(14, '0');
        const cnpjD = (instalacaoDestino?.cnpj || '').replace(/\D/g, '').substring(0, 14).padEnd(14, '0');
        const osCode = (os?.codigo || 'OS').replace(/[^A-Z0-9\-_]/gi, '').toUpperCase();
        const barcodeData = `${osCode} ${String(vIdx + 1).padStart(2, '0')}/${String(vTotal).padStart(2, '0')} ${cnpjO} ${cnpjD}`;
        const bcImg = genBarcode(barcodeData);
        if (bcImg) {
          const bcH = Math.min(BOT_H * 0.52, 16);
          pdf.addImage(bcImg, 'PNG', lx + mg, botY + 1.5, iw, bcH);
          const hrY = botY + 1.5 + bcH + 1.5;
          const fHR = Math.max(3.2, Math.min(lw * 0.032, 5));
          pdf.setFontSize(fHR);
          pdf.setFont('helvetica', 'normal');
          const hr1 = `OS: ${os?.codigo || '-'}  |  Vol: ${vIdx + 1}/${vTotal}  |  Peso: ${vol.peso_bruto || '-'} kg  |  Peso Total: ${totalWeight.toFixed(1)} kg`;
          const hr2 = `CNPJ Origem: ${instalacaoOrigem?.cnpj || '-'}  |  CNPJ Destino: ${instalacaoDestino?.cnpj || '-'}`;
          pdf.text(pdf.splitTextToSize(hr1, iw), lx + mg, hrY + fHR * 0.4);
          pdf.text(pdf.splitTextToSize(hr2, iw), lx + mg, hrY + fHR * 0.4 + fHR * 0.56 + 1);
        }
      };

      // Render all labels
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