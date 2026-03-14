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
  { id: 'fragil', label: 'Frágil', description: 'Conteúdo quebrável — manuseio cuidadoso (ISO 780)' },
  { id: 'lado_cima', label: 'Este Lado Para Cima', description: 'Posição correta de armazenamento e transporte' },
  { id: 'umidade', label: 'Proteger da Umidade', description: 'Manter em local seco e protegido' },
  { id: 'empilhamento', label: 'Limite de Empilhamento', description: 'Peso máximo ou número de caixas empilhadas' },
  { id: 'centro_gravidade', label: 'Centro de Gravidade', description: 'Posição do centro de gravidade para içamento seguro' },
  { id: 'nao_garra', label: 'Não Usar Garra / Empilhadeira', description: 'Proibido uso de garras mecânicas ou empilhadeiras' },
];

export default function EtiquetaVolumesModal({ open, onClose, os, instalacoes }) {
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [labelsPerPage, setLabelsPerPage] = useState('2');
  const [generating, setGenerating] = useState(false);

  const instalacaoOrigem = instalacoes?.find(i => i?.id === os?.instalacao_origem_id);
  const instalacaoDestino = instalacoes?.find(i => i?.id === os?.instalacao_destino_id);

  // Expand volumes by their quantity field
  const expandedVolumes = (os?.volumes || []).flatMap(vol => {
    const qty = parseInt(vol.quantidade) || 1;
    return Array(qty).fill(vol);
  });
  const totalLabels = expandedVolumes.length;

  const toggleSymbol = (id) => {
    setSelectedSymbols(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (!os?.volumes?.length) return;
    setGenerating(true);

    try {
      const n = parseInt(labelsPerPage);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const PW = 210, PH = 297, MG = 8, GAP = 3;

      const grids = { 1: [1,1], 2: [1,2], 4: [2,2], 8: [2,4] };
      const [cols, rows] = grids[n];
      const LW = (PW - 2*MG - (cols-1)*GAP) / cols;
      const LH = (PH - 2*MG - (rows-1)*GAP) / rows;

      const genBarcode = (text) => {
        try {
          const c = document.createElement('canvas');
          JsBarcode(c, text, {
            format: 'CODE128', displayValue: false,
            width: 2, height: 100, margin: 6,
            background: '#ffffff', lineColor: '#000000',
          });
          return c.toDataURL('image/png');
        } catch(e) { return null; }
      };

      const drawSym = (symId, sx, sy, sz) => {
        pdf.setDrawColor(0,0,0);
        pdf.setFillColor(0,0,0);
        const lw = Math.max(0.3, sz * 0.04);
        pdf.setLineWidth(lw);

        switch(symId) {
          case 'fragil': {
            // Wine glass
            pdf.ellipse(sx+sz/2, sy+sz*0.28, sz*0.32, sz*0.2, 'S');
            pdf.line(sx+sz/2, sy+sz*0.48, sx+sz/2, sy+sz*0.78);
            pdf.line(sx+sz*0.22, sy+sz*0.82, sx+sz*0.78, sy+sz*0.82);
            pdf.setLineWidth(Math.max(0.2, sz*0.03));
            pdf.line(sx+sz*0.3, sy+sz*0.1, sx+sz*0.7, sy+sz*0.44);
            pdf.line(sx+sz*0.7, sy+sz*0.1, sx+sz*0.3, sy+sz*0.44);
            break;
          }
          case 'lado_cima': {
            // Two upward arrows
            [0.25, 0.72].forEach(xf => {
              const ax = sx + sz*xf;
              pdf.line(ax, sy+sz*0.88, ax, sy+sz*0.28);
              pdf.line(ax, sy+sz*0.28, ax-sz*0.14, sy+sz*0.5);
              pdf.line(ax, sy+sz*0.28, ax+sz*0.14, sy+sz*0.5);
            });
            break;
          }
          case 'umidade': {
            // Umbrella
            const cx = sx+sz/2, cy = sy+sz*0.48, r = sz*0.42;
            let px = cx-r, py = cy;
            for (let i=1; i<=20; i++) {
              const a = (Math.PI*i)/20;
              const nx = cx - r*Math.cos(a), ny = cy - r*Math.sin(a);
              pdf.line(px, py, nx, ny); px=nx; py=ny;
            }
            pdf.line(cx, cy, cx-r*0.65, cy-r*0.45);
            pdf.line(cx, cy, cx+r*0.65, cy-r*0.45);
            pdf.line(cx, cy, cx, sy+sz*0.85);
            pdf.ellipse(cx+sz*0.09, sy+sz*0.85, sz*0.09, sz*0.06, 'S');
            break;
          }
          case 'empilhamento': {
            // Three stacked boxes
            pdf.rect(sx+sz*0.05, sy+sz*0.62, sz*0.9, sz*0.3, 'S');
            pdf.rect(sx+sz*0.12, sy+sz*0.35, sz*0.76, sz*0.24, 'S');
            pdf.rect(sx+sz*0.2, sy+sz*0.1, sz*0.6, sz*0.22, 'S');
            break;
          }
          case 'centro_gravidade': {
            // Circle with crosshairs
            pdf.ellipse(sx+sz/2, sy+sz/2, sz*0.4, sz*0.4, 'S');
            pdf.line(sx+sz/2, sy+sz*0.06, sx+sz/2, sy+sz*0.94);
            pdf.line(sx+sz*0.06, sy+sz/2, sx+sz*0.94, sy+sz/2);
            pdf.ellipse(sx+sz/2, sy+sz/2, sz*0.07, sz*0.07, 'F');
            break;
          }
          case 'nao_garra': {
            // No-fork symbol
            pdf.ellipse(sx+sz/2, sy+sz/2, sz*0.44, sz*0.44, 'S');
            pdf.setLineWidth(Math.max(0.2, sz*0.03));
            [0.32, 0.5, 0.68].forEach(xf => {
              pdf.line(sx+sz*xf, sy+sz*0.18, sx+sz*xf, sy+sz*0.52);
            });
            pdf.line(sx+sz*0.32, sy+sz*0.52, sx+sz*0.68, sy+sz*0.52);
            pdf.line(sx+sz*0.5, sy+sz*0.52, sx+sz*0.5, sy+sz*0.78);
            pdf.setLineWidth(Math.max(0.5, sz*0.07));
            pdf.line(sx+sz*0.15, sy+sz*0.85, sx+sz*0.85, sy+sz*0.15);
            break;
          }
        }
        pdf.setLineWidth(0.2);
        pdf.setDrawColor(0,0,0);
        pdf.setFillColor(0,0,0);
      };

      const totalWeight = expandedVolumes.reduce((s,v) => s+(parseFloat(v.peso_bruto)||0), 0);

      const getEndereco = (inst) => {
        if (!inst) return '';
        return [inst.logradouro, inst.numero, inst.complemento, inst.bairro,
          `${inst.cidade||''}${inst.estado?'/'+inst.estado:''}`, inst.cep
        ].filter(Boolean).join(', ');
      };

      const drawLabel = (lx, ly, lw, lh, vol, vIdx, vTotal) => {
        const mg = 3;
        const iw = lw - 2*mg;
        const TOP_H = lh * 0.34;
        const MID_H = lh * 0.40;
        const BOT_H = lh * 0.26;

        pdf.setLineWidth(0.7);
        pdf.setDrawColor(0);
        pdf.rect(lx, ly, lw, lh, 'S');

        // ===== SECTION SUPERIOR =====
        // Header bar
        pdf.setFillColor(0,0,0);
        pdf.rect(lx, ly, lw, 7.5, 'F');
        pdf.setTextColor(255,255,255);
        pdf.setFont('helvetica','bold');
        pdf.setFontSize(Math.max(6, lw*0.078));
        pdf.text('AXIA ENERGIA', lx+mg, ly+5.5);
        const vtLabel = `VOL. ${vIdx+1}/${vTotal}`;
        pdf.setFontSize(Math.max(5.5, lw*0.058));
        const vtW = pdf.getStringUnitWidth(vtLabel) * pdf.getFontSize() / pdf.internal.scaleFactor;
        pdf.text(vtLabel, lx+lw-mg-vtW, ly+5.5);
        pdf.setTextColor(0,0,0);

        let ty = ly + 9.5;
        const FSS = Math.max(4.2, lw*0.043);
        const FSN = Math.max(5.2, lw*0.054);

        // REMETENTE block
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSS);
        pdf.text('REMETENTE:', lx+mg, ty+3); ty+=4.5;
        pdf.setFont('helvetica','normal'); pdf.setFontSize(FSN);
        const onNome = instalacaoOrigem?.nome || '-';
        const onLines = pdf.splitTextToSize(onNome, iw);
        pdf.text(onLines, lx+mg, ty+3); ty += onLines.length*(FSN*0.42)+1;
        const onEnd = getEndereco(instalacaoOrigem);
        if (onEnd) {
          pdf.setFontSize(FSS);
          const onEndL = pdf.splitTextToSize(onEnd, iw);
          pdf.text(onEndL, lx+mg, ty+2.5); ty += onEndL.length*(FSS*0.42)+1;
        }

        ty += 1;
        pdf.setLineWidth(0.25); pdf.line(lx+mg, ty, lx+lw-mg, ty); ty+=2.5;

        // DESTINATÁRIO block
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSS);
        pdf.text('DESTINATÁRIO:', lx+mg, ty+3); ty+=4.5;
        pdf.setFont('helvetica','normal'); pdf.setFontSize(FSN);
        const dnNome = instalacaoDestino?.nome || '-';
        const dnLines = pdf.splitTextToSize(dnNome, iw);
        pdf.text(dnLines, lx+mg, ty+3); ty += dnLines.length*(FSN*0.42)+1;
        const dnEnd = getEndereco(instalacaoDestino);
        if (dnEnd) {
          pdf.setFontSize(FSS);
          const dnEndL = pdf.splitTextToSize(dnEnd, iw);
          pdf.text(dnEndL, lx+mg, ty+2.5);
        }

        pdf.setLineWidth(0.9); pdf.line(lx, ly+TOP_H, lx+lw, ly+TOP_H);

        // ===== SECTION INTERMEDIÁRIA =====
        const midY = ly + TOP_H;
        let my = midY + mg;
        const hasSyms = selectedSymbols.length > 0;
        const dataW = hasSyms ? iw*0.60 : iw;

        // OS number (prominent)
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSS);
        pdf.text('ORDEM DE SERVIÇO:', lx+mg, my+3); my+=4.5;
        pdf.setFontSize(Math.max(7, lw*0.075));
        pdf.text(os?.codigo || '-', lx+mg, my+4); my+=6.5;

        // Document fields
        const docFields = [];
        if (os?.num_reserva) docFields.push(`Reserva: ${os.num_reserva}`);
        if (os?.num_migo) docFields.push(`MIGO: ${os.num_migo}`);
        if (os?.usuario_reserva) docFields.push(`Usuário: ${os.usuario_reserva}`);
        if (os?.orgao) docFields.push(`Órgão: ${os.orgao}`);
        pdf.setFont('helvetica','normal'); pdf.setFontSize(FSS);
        docFields.forEach(f => { pdf.text(f, lx+mg, my+3); my+=4; });

        pdf.setLineWidth(0.2); pdf.line(lx+mg, my+1, lx+mg+dataW, my+1); my+=3;

        // Dimensions
        pdf.setFont('helvetica','bold'); pdf.setFontSize(FSS);
        pdf.text('DIMENSÕES:', lx+mg, my+3); my+=4.5;
        pdf.setFont('helvetica','normal');
        pdf.text(`C: ${vol.comprimento||'—'} cm   L: ${vol.largura||'—'} cm   A: ${vol.altura||'—'} cm`, lx+mg, my+3); my+=4.5;
        pdf.setFont('helvetica','bold'); pdf.text('Peso Bruto: ', lx+mg, my+3);
        pdf.setFont('helvetica','normal'); pdf.text(`${vol.peso_bruto||'—'} kg`, lx+mg+22, my+3);
        if (vol.m3) { pdf.setFont('helvetica','bold'); pdf.text('  M³: ', lx+mg+48, my+3); pdf.setFont('helvetica','normal'); pdf.text(String(vol.m3), lx+mg+58, my+3); }

        // ISO symbols (right column)
        if (hasSyms) {
          const symX = lx+mg+dataW+2;
          const zoneW = iw-dataW-2;
          const cols2 = zoneW > 28 ? 2 : 1;
          const rawSz = Math.min((zoneW/cols2)-2, (MID_H-6)/Math.ceil(selectedSymbols.length/cols2)-7);
          const symSz = Math.max(5, rawSz);
          let sX = symX, sY = midY+2;

          selectedSymbols.forEach((sid, si) => {
            drawSym(sid, sX, sY, symSz);
            const sym = ISO_SYMBOLS.find(s => s.id===sid);
            if (sym && symSz > 6) {
              pdf.setFontSize(Math.max(3, symSz*0.22));
              pdf.setFont('helvetica','normal');
              const slb = pdf.splitTextToSize(sym.label, zoneW/cols2-1);
              pdf.text(slb, sX, sY+symSz+2);
            }
            if ((si+1)%cols2===0) { sX=symX; sY+=symSz+8; }
            else { sX+=zoneW/cols2; }
          });
        }

        // Summary bar
        const smY = ly+TOP_H+MID_H-7.5;
        pdf.setFillColor(225,225,225);
        pdf.rect(lx, smY, lw, 7.5, 'F');
        pdf.setFontSize(Math.max(4.5, lw*0.046));
        pdf.setFont('helvetica','bold');
        pdf.text(`${vTotal} vol(s)  |  Peso Total: ${totalWeight.toFixed(1)} kg  |  Vol. ${vIdx+1}/${vTotal}`, lx+mg, smY+5);

        pdf.setLineWidth(0.9); pdf.line(lx, ly+TOP_H+MID_H, lx+lw, ly+TOP_H+MID_H);

        // ===== SECTION INFERIOR — Código de Barras =====
        const botY = ly+TOP_H+MID_H;

        const cnpjO = (instalacaoOrigem?.cnpj||'').replace(/\D/g,'').substring(0,14).padEnd(14,'0');
        const cnpjD = (instalacaoDestino?.cnpj||'').replace(/\D/g,'').substring(0,14).padEnd(14,'0');
        const osCode = (os?.codigo||'OS').replace(/[^A-Z0-9\-_]/gi,'').toUpperCase();
        const barcodeData = `${osCode} ${String(vIdx+1).padStart(2,'0')}/${String(vTotal).padStart(2,'0')} ${cnpjO} ${cnpjD}`;

        const bcImg = genBarcode(barcodeData);
        if (bcImg) {
          const bcH = Math.min(BOT_H*0.56, 18);
          pdf.addImage(bcImg, 'PNG', lx+mg, botY+2, iw, bcH);

          // Human-readable text (interpretação em texto legível)
          const hrY = botY+2+bcH+2;
          pdf.setFontSize(Math.max(3.5, lw*0.034));
          pdf.setFont('helvetica','normal');
          const hr1 = `OS: ${os?.codigo||'-'}  |  Vol: ${vIdx+1}/${vTotal}  |  Peso: ${vol.peso_bruto||'-'} kg  |  Peso Total: ${totalWeight.toFixed(1)} kg`;
          const hr2 = `CNPJ Origem: ${instalacaoOrigem?.cnpj||'-'}  |  CNPJ Destino: ${instalacaoDestino?.cnpj||'-'}`;
          const lh1 = pdf.splitTextToSize(hr1, iw);
          pdf.text(lh1, lx+mg, hrY+3);
          const lh2 = pdf.splitTextToSize(hr2, iw);
          pdf.text(lh2, lx+mg, hrY+3+lh1.length*3.5);
        }
      };

      // Render all label pages
      expandedVolumes.forEach((vol, vIdx) => {
        const pos = vIdx % n;
        const col = pos % cols;
        const row = Math.floor(pos / cols);
        if (vIdx > 0 && pos === 0) pdf.addPage();
        const lx = MG + col*(LW+GAP);
        const ly = MG + row*(LH+GAP);
        drawLabel(lx, ly, LW, LH, vol, vIdx, expandedVolumes.length);
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
          {/* Summary */}
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

          {/* Labels per page */}
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

          {/* ISO Symbols */}
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