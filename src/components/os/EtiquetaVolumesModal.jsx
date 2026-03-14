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
      const PW = 210, PH = 297;
      // Minimal margins for max space
      const MG = 5, GAP = 2;

      const grids = { 1: [1,1], 2: [1,2], 4: [2,2], 8: [2,4] };
      const [cols, rows] = grids[n];
      const LW = (PW - 2*MG - (cols-1)*GAP) / cols;
      const LH = (PH - 2*MG - (rows-1)*GAP) / rows;

      const genBarcode = (text) => {
        try {
          const c = document.createElement('canvas');
          JsBarcode(c, text, {
            format: 'CODE128', displayValue: false,
            width: 2, height: 80, margin: 4,
            background: '#ffffff', lineColor: '#000000',
          });
          return c.toDataURL('image/png');
        } catch(e) { return null; }
      };

      // Fill polygon helper: takes array of absolute [x,y] points
      const fillPoly = (pts, style = 'F') => {
        if (pts.length < 2) return;
        const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
        pdf.lines(segs, pts[0][0], pts[0][1], [1, 1], style, true);
      };

      // Arc helper: approximate arc with line segments
      const drawArc = (cx, cy, rx, ry, startAngle, endAngle, steps = 20) => {
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const a = startAngle + (endAngle - startAngle) * (i / steps);
          pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
        }
        for (let i = 0; i < pts.length - 1; i++) {
          pdf.line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
        }
      };

      const drawSym = (symId, sx, sy, sz) => {
        pdf.setDrawColor(0, 0, 0);
        pdf.setFillColor(0, 0, 0);
        const lw = Math.max(0.4, sz * 0.055);
        pdf.setLineWidth(lw);
        const cx = sx + sz / 2;
        const cy = sy + sz / 2;

        switch (symId) {
          case 'fragil': {
            // Wine glass: bowl + stem + base + X cracks
            const bowlCy = sy + sz * 0.38;
            const bowlRx = sz * 0.33, bowlRy = sz * 0.26;
            pdf.setFillColor(255, 255, 255);
            pdf.ellipse(cx, bowlCy, bowlRx, bowlRy, 'FD');
            pdf.setFillColor(0, 0, 0);
            // Stem
            pdf.setLineWidth(lw * 1.4);
            pdf.line(cx, bowlCy + bowlRy, cx, sy + sz * 0.82);
            // Base
            pdf.setLineWidth(lw * 2);
            pdf.line(cx - sz * 0.28, sy + sz * 0.85, cx + sz * 0.28, sy + sz * 0.85);
            // X cracks inside bowl
            pdf.setLineWidth(lw * 0.9);
            pdf.line(cx - bowlRx * 0.5, bowlCy - bowlRy * 0.45, cx + bowlRx * 0.5, bowlCy + bowlRy * 0.45);
            pdf.line(cx + bowlRx * 0.5, bowlCy - bowlRy * 0.45, cx - bowlRx * 0.5, bowlCy + bowlRy * 0.45);
            break;
          }

          case 'lado_cima': {
            // Two solid filled upward arrows
            [0.18, 0.58].forEach(xf => {
              const ax = sx + sz * xf + sz * 0.12;
              const aw = sz * 0.13; // half-width of arrowhead
              const headTip = sy + sz * 0.1;
              const headBase = sy + sz * 0.44;
              const bodyW = sz * 0.065;
              const bodyBot = sy + sz * 0.9;
              // Filled arrowhead triangle
              fillPoly([
                [ax, headTip],
                [ax - aw, headBase],
                [ax + aw, headBase],
              ]);
              // Filled rectangle body
              fillPoly([
                [ax - bodyW, headBase],
                [ax + bodyW, headBase],
                [ax + bodyW, bodyBot],
                [ax - bodyW, bodyBot],
              ]);
            });
            break;
          }

          case 'umidade': {
            // Umbrella dome + handle + rain drops
            const uCy = sy + sz * 0.42;
            const uRx = sz * 0.42, uRy = sz * 0.34;
            // Dome arc (top half of ellipse)
            pdf.setLineWidth(lw * 1.6);
            drawArc(cx, uCy, uRx, uRy, Math.PI, 0, 18);
            // Dome base line
            pdf.line(cx - uRx, uCy, cx + uRx, uCy);
            // Internal ribs (2 dividers)
            pdf.setLineWidth(lw * 0.6);
            [-0.45, 0, 0.45].forEach(rf => {
              const rx = cx + uRx * rf;
              const ry = uCy - uRy * Math.sqrt(1 - rf * rf);
              pdf.line(rx, uCy, rx, ry);
            });
            // Vertical pole
            pdf.setLineWidth(lw * 1.4);
            pdf.line(cx, uCy, cx, sy + sz * 0.78);
            // J-curve handle
            drawArc(cx + sz * 0.1, sy + sz * 0.82, sz * 0.1, sz * 0.07, Math.PI, 0, 8);
            // Rain drops (small diagonal lines below)
            pdf.setLineWidth(lw * 0.8);
            [
              [cx - sz * 0.28, sy + sz * 0.88],
              [cx, sy + sz * 0.93],
              [cx + sz * 0.28, sy + sz * 0.88],
            ].forEach(([dx, dy]) => {
              pdf.line(dx, dy, dx + sz * 0.04, dy + sz * 0.06);
            });
            break;
          }

          case 'empilhamento': {
            // 3 stacked boxes (largest at bottom)
            pdf.setFillColor(255, 255, 255);
            pdf.setLineWidth(lw);
            pdf.rect(sx + sz * 0.03, sy + sz * 0.62, sz * 0.94, sz * 0.32, 'FD');
            pdf.rect(sx + sz * 0.11, sy + sz * 0.35, sz * 0.78, sz * 0.25, 'FD');
            pdf.rect(sx + sz * 0.2, sy + sz * 0.1, sz * 0.6, sz * 0.22, 'FD');
            pdf.setFillColor(0, 0, 0);
            // Downward arrow on right side to indicate "not above"
            const aX = sx + sz * 0.82;
            const aY = sy + sz * 0.04;
            const aSz = sz * 0.13;
            fillPoly([
              [aX, aY + aSz],
              [aX - aSz * 0.5, aY],
              [aX + aSz * 0.5, aY],
            ]);
            break;
          }

          case 'centro_gravidade': {
            // Large circle with crosshair and center dot
            pdf.setFillColor(255, 255, 255);
            pdf.setLineWidth(lw * 1.5);
            pdf.ellipse(cx, cy, sz * 0.42, sz * 0.42, 'FD');
            pdf.setFillColor(0, 0, 0);
            // Cross lines
            pdf.setLineWidth(lw);
            pdf.line(cx, sy + sz * 0.04, cx, sy + sz * 0.96);
            pdf.line(sx + sz * 0.04, cy, sx + sz * 0.96, cy);
            // Center filled dot
            pdf.ellipse(cx, cy, sz * 0.07, sz * 0.07, 'F');
            break;
          }

          case 'nao_garra': {
            // Fork/tines + prohibition circle
            const fCx = cx;
            const tineTop = sy + sz * 0.08;
            const tineBot = sy + sz * 0.38;
            const barY = sy + sz * 0.38;
            const handleBot = sy + sz * 0.78;

            // Draw fork shape first
            pdf.setLineWidth(lw * 1.3);
            // 3 tines
            [-sz*0.16, 0, sz*0.16].forEach(dx => {
              pdf.line(fCx + dx, tineTop, fCx + dx, tineBot);
            });
            // Connecting bar
            pdf.line(fCx - sz * 0.16, barY, fCx + sz * 0.16, barY);
            // Handle shaft
            pdf.line(fCx, barY, fCx, handleBot);

            // Prohibition circle (hollow, draws over fork)
            pdf.setFillColor(255, 255, 255);
            pdf.setLineWidth(lw * 2);
            // Draw outer circle
            const cr = sz * 0.44;
            // Clear inside with white fill except the border
            pdf.ellipse(cx, cy, cr, cr, 'S');

            // Redraw fork on top of circle (inside circle, clipped visually by drawing fork)
            pdf.setLineWidth(lw * 1.3);
            [-sz*0.16, 0, sz*0.16].forEach(dx => {
              pdf.line(fCx + dx, tineTop, fCx + dx, tineBot);
            });
            pdf.line(fCx - sz * 0.16, barY, fCx + sz * 0.16, barY);
            pdf.line(fCx, barY, fCx, handleBot);

            // Diagonal red/black slash
            pdf.setLineWidth(lw * 2.8);
            pdf.setDrawColor(0, 0, 0);
            const slashAngle = Math.PI * 0.78;
            pdf.line(
              cx + cr * Math.cos(slashAngle),
              cy - cr * Math.sin(slashAngle),
              cx - cr * Math.cos(slashAngle),
              cy + cr * Math.sin(slashAngle)
            );
            break;
          }
        }

        // Reset
        pdf.setLineWidth(0.2);
        pdf.setDrawColor(0, 0, 0);
        pdf.setFillColor(0, 0, 0);
      };

      const totalWeight = expandedVolumes.reduce((s, v) => s + (parseFloat(v.peso_bruto) || 0), 0);

      const getEndereco = (inst) => {
        if (!inst) return '';
        return [
          inst.logradouro, inst.numero, inst.complemento,
          inst.bairro, `${inst.cidade || ''}${inst.estado ? '/' + inst.estado : ''}`, inst.cep
        ].filter(Boolean).join(', ');
      };

      const drawLabel = (lx, ly, lw, lh, vol, vIdx, vTotal) => {
        const mg = 2.5;
        const iw = lw - 2 * mg;

        // Section proportions
        const TOP_H = lh * 0.33;
        const MID_H = lh * 0.40;
        const BOT_H = lh * 0.27;

        // Outer border
        pdf.setLineWidth(0.8);
        pdf.setDrawColor(0);
        pdf.rect(lx, ly, lw, lh, 'S');

        // ===== TOP SECTION =====
        const HEADER_H = Math.min(8, lh * 0.095);
        pdf.setFillColor(0, 0, 0);
        pdf.rect(lx, ly, lw, HEADER_H, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        const fHeader = Math.max(5.5, Math.min(lw * 0.076, 9));
        pdf.setFontSize(fHeader);
        pdf.text('AXIA ENERGIA', lx + mg, ly + HEADER_H * 0.75);
        const vtLabel = `VOL. ${vIdx + 1}/${vTotal}`;
        const vtW = pdf.getStringUnitWidth(vtLabel) * fHeader / pdf.internal.scaleFactor;
        pdf.text(vtLabel, lx + lw - mg - vtW, ly + HEADER_H * 0.75);
        pdf.setTextColor(0, 0, 0);

        const FSS = Math.max(4, Math.min(lw * 0.042, 6.5));
        const FSN = Math.max(4.8, Math.min(lw * 0.052, 7.5));
        let ty = ly + HEADER_H + 1.5;

        // REMETENTE
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FSS);
        pdf.setTextColor(150, 0, 0);
        pdf.text('REMETENTE:', lx + mg, ty + FSS * 0.38);
        ty += FSS * 0.5 + 1;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FSN);
        const onNome = instalacaoOrigem?.nome || '-';
        const onLines = pdf.splitTextToSize(onNome, iw);
        pdf.text(onLines.slice(0, 2), lx + mg, ty + FSN * 0.38);
        ty += Math.min(onLines.length, 2) * (FSN * 0.42) + 0.8;
        const onEnd = getEndereco(instalacaoOrigem);
        if (onEnd) {
          pdf.setFontSize(FSS * 0.92);
          const onEndL = pdf.splitTextToSize(onEnd, iw);
          pdf.text(onEndL.slice(0, 2), lx + mg, ty + FSS * 0.38);
          ty += Math.min(onEndL.length, 2) * (FSS * 0.42) + 0.8;
        }

        ty += 0.8;
        pdf.setLineWidth(0.25);
        pdf.line(lx + mg, ty, lx + lw - mg, ty);
        ty += 1.5;

        // DESTINATÁRIO
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FSS);
        pdf.setTextColor(0, 0, 150);
        pdf.text('DESTINATÁRIO:', lx + mg, ty + FSS * 0.38);
        ty += FSS * 0.5 + 1;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FSN);
        const dnNome = instalacaoDestino?.nome || '-';
        const dnLines = pdf.splitTextToSize(dnNome, iw);
        pdf.text(dnLines.slice(0, 2), lx + mg, ty + FSN * 0.38);
        ty += Math.min(dnLines.length, 2) * (FSN * 0.42) + 0.8;
        const dnEnd = getEndereco(instalacaoDestino);
        if (dnEnd) {
          pdf.setFontSize(FSS * 0.92);
          const dnEndL = pdf.splitTextToSize(dnEnd, iw);
          pdf.text(dnEndL.slice(0, 2), lx + mg, ty + FSN * 0.38);
        }

        // Section divider
        pdf.setLineWidth(1.0);
        pdf.line(lx, ly + TOP_H, lx + lw, ly + TOP_H);

        // ===== MIDDLE SECTION =====
        const midY = ly + TOP_H;
        const hasSyms = selectedSymbols.length > 0;
        const symZoneW = hasSyms ? Math.min(lw * 0.34, 32) : 0;
        const dataW = iw - symZoneW;
        let my = midY + 1.5;

        // OS Code prominent
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FSS * 0.9);
        pdf.text('ORDEM DE SERVIÇO:', lx + mg, my + FSS * 0.38);
        my += FSS * 0.52 + 1;
        const fOS = Math.max(6.5, Math.min(lw * 0.072, 10.5));
        pdf.setFontSize(fOS);
        const osLines = pdf.splitTextToSize(os?.codigo || '-', dataW);
        pdf.text(osLines[0], lx + mg, my + fOS * 0.38);
        my += fOS * 0.5 + 1.5;

        // Document fields
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FSS);
        const docFields = [];
        if (os?.num_reserva) docFields.push(`Reserva: ${os.num_reserva}`);
        if (os?.num_migo) docFields.push(`MIGO: ${os.num_migo}`);
        if (os?.usuario_reserva) docFields.push(`Usuário: ${os.usuario_reserva}`);
        docFields.forEach(f => {
          pdf.text(f, lx + mg, my + FSS * 0.38);
          my += FSS * 0.52 + 0.8;
        });

        my += 0.5;
        pdf.setLineWidth(0.2);
        pdf.line(lx + mg, my, lx + mg + dataW, my);
        my += 1.5;

        // Dimensions
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FSS * 0.9);
        pdf.text('DIMENSÕES:', lx + mg, my + FSS * 0.38);
        my += FSS * 0.52 + 1;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`C: ${vol.comprimento || '—'} cm  L: ${vol.largura || '—'} cm  A: ${vol.altura || '—'} cm`, lx + mg, my + FSS * 0.38);
        my += FSS * 0.52 + 1;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Peso Bruto: ', lx + mg, my + FSS * 0.38);
        pdf.setFont('helvetica', 'normal');
        const pbW = pdf.getStringUnitWidth('Peso Bruto: ') * FSS / pdf.internal.scaleFactor;
        pdf.text(`${vol.peso_bruto || '—'} kg`, lx + mg + pbW, my + FSS * 0.38);
        if (vol.m3) {
          const kgW = pbW + pdf.getStringUnitWidth(`${vol.peso_bruto || '—'} kg`) * FSS / pdf.internal.scaleFactor + 2;
          pdf.setFont('helvetica', 'bold');
          pdf.text('M³:', lx + mg + kgW, my + FSS * 0.38);
          pdf.setFont('helvetica', 'normal');
          pdf.text(String(vol.m3), lx + mg + kgW + 5, my + FSS * 0.38);
        }

        // ISO Symbols (right column)
        if (hasSyms) {
          const symStartX = lx + mg + dataW + 1;
          const symZoneAvailW = symZoneW;
          const symZoneH = MID_H - 2;
          const symCols = symZoneAvailW > 22 && selectedSymbols.length > 3 ? 2 : 1;
          const symPerCol = Math.ceil(selectedSymbols.length / symCols);
          const rawSz = Math.min(
            (symZoneAvailW / symCols) - 2,
            (symZoneH / symPerCol) - (symZoneAvailW > 22 ? 5 : 4)
          );
          const symSz = Math.max(6, rawSz);

          selectedSymbols.forEach((sid, si) => {
            const col = symCols > 1 ? si % symCols : 0;
            const row = symCols > 1 ? Math.floor(si / symCols) : si;
            const sX = symStartX + col * (symZoneAvailW / symCols);
            const sY = midY + 2 + row * (symSz + (symSz > 10 ? 5.5 : 4));
            drawSym(sid, sX, sY, symSz);
            if (symSz >= 7) {
              const sym = ISO_SYMBOLS.find(s => s.id === sid);
              if (sym) {
                pdf.setFontSize(Math.max(3, symSz * 0.2));
                pdf.setFont('helvetica', 'normal');
                const lblLines = pdf.splitTextToSize(sym.label, symZoneAvailW / symCols - 0.5);
                pdf.text(lblLines.slice(0, 2), sX, sY + symSz + 1.5);
              }
            }
          });
        }

        // Summary bar
        const smY = ly + TOP_H + MID_H - 8;
        pdf.setFillColor(220, 220, 220);
        pdf.rect(lx, smY, lw, 8, 'F');
        pdf.setFontSize(Math.max(4.5, Math.min(lw * 0.046, 6.5)));
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          `${vTotal} vol(s)  |  Peso Total: ${totalWeight.toFixed(1)} kg  |  Vol. ${vIdx + 1}/${vTotal}`,
          lx + mg, smY + 5.2
        );

        pdf.setLineWidth(1.0);
        pdf.line(lx, ly + TOP_H + MID_H, lx + lw, ly + TOP_H + MID_H);

        // ===== BOTTOM SECTION — Barcode =====
        const botY = ly + TOP_H + MID_H;
        const cnpjO = (instalacaoOrigem?.cnpj || '').replace(/\D/g, '').substring(0, 14).padEnd(14, '0');
        const cnpjD = (instalacaoDestino?.cnpj || '').replace(/\D/g, '').substring(0, 14).padEnd(14, '0');
        const osCode = (os?.codigo || 'OS').replace(/[^A-Z0-9\-_]/gi, '').toUpperCase();
        const barcodeData = `${osCode} ${String(vIdx + 1).padStart(2, '0')}/${String(vTotal).padStart(2, '0')} ${cnpjO} ${cnpjD}`;

        const bcImg = genBarcode(barcodeData);
        if (bcImg) {
          const bcH = Math.min(BOT_H * 0.55, 16);
          pdf.addImage(bcImg, 'PNG', lx + mg, botY + 1.5, iw, bcH);
          const hrY = botY + 1.5 + bcH + 1.5;
          const fHR = Math.max(3.5, Math.min(lw * 0.034, 5));
          pdf.setFontSize(fHR);
          pdf.setFont('helvetica', 'normal');
          const hr1 = `OS: ${os?.codigo || '-'}  |  Vol: ${vIdx + 1}/${vTotal}  |  Peso: ${vol.peso_bruto || '-'} kg  |  Peso Total: ${totalWeight.toFixed(1)} kg`;
          const hr2 = `CNPJ Origem: ${instalacaoOrigem?.cnpj || '-'}  |  CNPJ Destino: ${instalacaoDestino?.cnpj || '-'}`;
          pdf.text(pdf.splitTextToSize(hr1, iw), lx + mg, hrY + fHR * 0.4);
          pdf.text(pdf.splitTextToSize(hr2, iw), lx + mg, hrY + fHR * 0.4 + fHR * 0.55 + 1.2);
        }
      };

      // Render pages
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