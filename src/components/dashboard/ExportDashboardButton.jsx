import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function ExportDashboardButton({ 
  dashboardData, 
  filters, 
  regionais,
  categorias 
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    sections: {
      kpis: true,
      graficos: true,
      mapas: false,
      torre: false
    },
    orientation: 'portrait'
  });

  const toggleSection = (section) => {
    setConfig({
      ...config,
      sections: {
        ...config.sections,
        [section]: !config.sections[section]
      }
    });
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header com logo e título
      doc.setFillColor(0, 0, 255); // Azul Axia
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('AlmoxHub', margin, 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Axia Energia', margin, 23);
      
      doc.setFontSize(10);
      doc.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, margin, 30);

      yPos = 45;
      doc.setTextColor(0, 0, 0);

      // Filtros aplicados
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros Aplicados:', margin, yPos);
      yPos += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const filtrosTexto = [];
      if (filters.regional !== 'all') {
        const reg = regionais.find(r => r.id === filters.regional);
        filtrosTexto.push(`Regional: ${reg?.sigla || 'N/A'}`);
      }
      if (filters.categoria !== 'all') {
        const cat = categorias.find(c => c.id === filters.categoria);
        filtrosTexto.push(`Categoria: ${cat?.nome || 'N/A'}`);
      }
      if (filters.status !== 'all') {
        filtrosTexto.push(`Status: ${filters.status}`);
      }
      filtrosTexto.push(`Período: ${filters.periodo === 'all' ? 'Todo período' : `Últimos ${filters.periodo} dias`}`);

      doc.text(filtrosTexto.join(' | '), margin, yPos);
      yPos += 10;

      // Seção KPIs
      if (config.sections.kpis && dashboardData.kpis) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 255);
        doc.text('KPIs Principais', margin, yPos);
        yPos += 8;

        const kpisData = [
          ['KPI', 'Valor', 'Variação'],
          ['Total de OS', dashboardData.kpis.totalOS.toString(), `${dashboardData.kpis.percTotalOS}%`],
          ['Em Execução', dashboardData.kpis.emExecucao.toString(), `${dashboardData.kpis.percExecucao}%`],
          ['Concluídas', dashboardData.kpis.concluidas.toString(), `${dashboardData.kpis.percConcluidas}%`],
          ['Progresso Médio', `${dashboardData.kpis.avgProgress}%`, `${dashboardData.kpis.percProgress}%`],
        ];

        doc.autoTable({
          startY: yPos,
          head: [kpisData[0]],
          body: kpisData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [0, 0, 255], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Seção Gráficos (Tabelas de dados)
      if (config.sections.graficos && dashboardData.charts) {
        // OS por Regional
        if (dashboardData.charts.osByRegional?.length > 0) {
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
          }

          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 255);
          doc.text('OS por Regional', margin, yPos);
          yPos += 8;

          const regionalData = dashboardData.charts.osByRegional.map(item => [
            item.name,
            item.total.toString()
          ]);

          doc.autoTable({
            startY: yPos,
            head: [['Regional', 'Total de OS']],
            body: regionalData,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 255], textColor: 255 },
            styles: { fontSize: 9 },
            margin: { left: margin, right: margin }
          });

          yPos = doc.lastAutoTable.finalY + 10;
        }

        // OS por Categoria
        if (dashboardData.charts.osByCategoria?.length > 0) {
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
          }

          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 255);
          doc.text('OS por Categoria', margin, yPos);
          yPos += 8;

          const categoriaData = dashboardData.charts.osByCategoria.map(item => [
            item.name,
            item.total.toString()
          ]);

          doc.autoTable({
            startY: yPos,
            head: [['Categoria', 'Total de OS']],
            body: categoriaData,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 255], textColor: 255 },
            styles: { fontSize: 9 },
            margin: { left: margin, right: margin }
          });

          yPos = doc.lastAutoTable.finalY + 10;
        }
      }

      // Rodapé
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          'AlmoxHub - Axia Energia',
          margin,
          pageHeight - 10
        );
      }

      // Download
      doc.save(`dashboard_almoxhub_${new Date().toISOString().split('T')[0]}.pdf`);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onValueChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-semibold mb-3">Seções para incluir:</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={config.sections.kpis}
                  onCheckedChange={() => toggleSection('kpis')}
                />
                <span className="text-sm">KPIs Principais</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={config.sections.graficos}
                  onCheckedChange={() => toggleSection('graficos')}
                />
                <span className="text-sm">Gráficos e Tabelas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer opacity-50">
                <Checkbox 
                  checked={config.sections.mapas}
                  onCheckedChange={() => toggleSection('mapas')}
                  disabled
                />
                <span className="text-sm">Mapas (em breve)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer opacity-50">
                <Checkbox 
                  checked={config.sections.torre}
                  onCheckedChange={() => toggleSection('torre')}
                  disabled
                />
                <span className="text-sm">Torre de Controle (em breve)</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Orientação:</h4>
            <Select value={config.orientation} onValueChange={(v) => setConfig({...config, orientation: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato</SelectItem>
                <SelectItem value="landscape">Paisagem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={generatePDF}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}