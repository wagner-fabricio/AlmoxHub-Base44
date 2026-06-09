import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileType, Code2, Loader2, Presentation } from 'lucide-react';
import { exportToHTML, exportToPDF, exportToDOCX } from './exportRelatorio';
import { exportToPPTX } from './exportRelatorioPPTX';

export default function ExportarRelatorioMenu({ elementId, dados, analise, periodoLabel, orientacao }) {
  const [exporting, setExporting] = useState(null);

  const handle = async (tipo) => {
    setExporting(tipo);
    try {
      if (tipo === 'html') await exportToHTML(elementId, orientacao);
      else if (tipo === 'pdf') await exportToPDF(elementId, orientacao);
      else if (tipo === 'docx') await exportToDOCX(dados, analise, periodoLabel, orientacao);
      else if (tipo === 'pptx') await exportToPPTX(dados, analise, periodoLabel, orientacao);
    } catch (e) {
      console.error('Erro na exportação:', e);
      alert('Erro ao exportar: ' + e.message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={!!exporting} className="text-white font-semibold" style={{ backgroundColor: '#FF6B00' }}>
          {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando {exporting.toUpperCase()}...</> : <><Download className="w-4 h-4 mr-2" /> Exportar Relatório</>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato (orientação: {orientacao})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handle('html')}>
          <Code2 className="w-4 h-4 mr-2 text-blue-600" /> Exportar HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('pdf')}>
          <FileType className="w-4 h-4 mr-2 text-red-600" /> Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('docx')}>
          <FileText className="w-4 h-4 mr-2 text-blue-700" /> Exportar Word (DOCX)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('pptx')}>
          <Presentation className="w-4 h-4 mr-2 text-orange-600" /> Exportar PowerPoint (PPTX)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}