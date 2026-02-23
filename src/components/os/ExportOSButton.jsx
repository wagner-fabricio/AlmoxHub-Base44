import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ExportOSButton({ ordens, pessoas, categorias, regionais, almoxarifados, instalacoes, subcategorias }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    format: 'pdf',
    orientation: 'landscape',
    includeFields: {
      basicos: true,
      pessoas: true,
      datas: true,
      expedicao: false,
      recebimento: false,
      problemas: false,
      volumes: false,
      anexos: false
    }
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      if (config.format === 'pdf') {
        await exportPDF();
      } else {
        await exportExcel();
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const exportPDF = async () => {
    const doc = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 255);
    doc.text('Relatório de Ordens de Serviço', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 27);
    doc.text(`Total de OS: ${ordens.length}`, 14, 32);

    // Preparar dados da tabela
    const tableData = ordens.map(os => {
      const row = [];
      
      if (config.includeFields.basicos) {
        row.push(os.codigo || '-');
        const categoria = categorias?.find(c => c.id === os.categoria_id);
        row.push(categoria?.nome || '-');
        const regional = regionais?.find(r => r.id === os.regional_id);
        row.push(regional?.sigla || '-');
        const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
        row.push(almox?.nome || '-');
        row.push(getStatusLabel(os.status));
        row.push(os.prioridade || '-');
      }

      if (config.includeFields.pessoas) {
        const lider = pessoas?.find(p => p.id === os.lider_id);
        row.push(lider?.nome || '-');
        const executores = (os.executores_ids || []).map(id => {
          const p = pessoas?.find(pessoa => pessoa.id === id);
          return p?.nome?.split(' ')[0];
        }).join(', ');
        row.push(executores || '-');
      }

      if (config.includeFields.datas) {
        row.push(os.data_inicial ? new Date(os.data_inicial).toLocaleDateString('pt-BR') : '-');
        row.push(os.prazo ? new Date(os.prazo).toLocaleDateString('pt-BR') : '-');
        row.push(os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : '-');
      }

      if (config.includeFields.expedicao) {
        row.push(os.status_separacao ? getStatusSeparacaoLabel(os.status_separacao) : '-');
        row.push(os.num_reserva || '-');
      }

      if (config.includeFields.recebimento) {
        row.push(os.nfe_numero || '-');
        row.push(os.numero_migo_receb || '-');
      }

      return row;
    });

    // Preparar headers
    const headers = [];
    if (config.includeFields.basicos) {
      headers.push('Código', 'Categoria', 'Regional', 'Almoxarifado', 'Status', 'Prioridade');
    }
    if (config.includeFields.pessoas) {
      headers.push('Líder', 'Executores');
    }
    if (config.includeFields.datas) {
      headers.push('Início', 'Prazo', 'Conclusão');
    }
    if (config.includeFields.expedicao) {
      headers.push('Status Sep.', 'Nº Reserva');
    }
    if (config.includeFields.recebimento) {
      headers.push('NFe', 'MIGO');
    }

    // Gerar tabela
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [0, 0, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      margin: { top: 40, left: 14, right: 14 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        'AlmoxHub - Axia Energia',
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }

    doc.save(`ordens_servico_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = async () => {
    // Preparar dados para CSV (compatível com Excel)
    const headers = [];
    if (config.includeFields.basicos) {
      headers.push('Código', 'Categoria', 'Regional', 'Almoxarifado', 'Status', 'Prioridade', 'Descrição');
    }
    if (config.includeFields.pessoas) {
      headers.push('Líder', 'Executores', 'Outros Envolvidos');
    }
    if (config.includeFields.datas) {
      headers.push('Data Inicial', 'Prazo', 'Data Conclusão', 'Progresso %');
    }
    if (config.includeFields.expedicao) {
      headers.push('Status Separação', 'Nº Reserva', 'Data Reserva', 'Órgão', 'MIGO Expedição', 'Data MIGO', 'Instalação Origem', 'Instalação Destino');
    }
    if (config.includeFields.recebimento) {
      headers.push('NFe', 'Série NFe', 'Data NFe', 'MIGO Recebimento', 'Data MIGO Receb', 'V360', 'Doc Referência', 'Data Recebimento', 'Problema Recebimento');
    }
    if (config.includeFields.volumes) {
      headers.push('Qtd Volumes', 'Peso Total (kg)', 'M³ Total');
    }

    const rows = [headers];

    ordens.forEach(os => {
      const row = [];
      
      if (config.includeFields.basicos) {
        row.push(os.codigo || '');
        const categoria = categorias?.find(c => c.id === os.categoria_id);
        row.push(categoria?.nome || '');
        const regional = regionais?.find(r => r.id === os.regional_id);
        row.push(regional?.sigla || '');
        const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
        row.push(almox?.nome || '');
        row.push(getStatusLabel(os.status));
        row.push(os.prioridade || '');
        row.push(os.descricao_resumida || '');
      }

      if (config.includeFields.pessoas) {
        const lider = pessoas?.find(p => p.id === os.lider_id);
        row.push(lider?.nome || '');
        const executores = (os.executores_ids || []).map(id => {
          const p = pessoas?.find(pessoa => pessoa.id === id);
          return p?.nome;
        }).filter(n => n).join(', ');
        row.push(executores);
        const outros = (os.outros_envolvidos_ids || []).map(id => {
          const p = pessoas?.find(pessoa => pessoa.id === id);
          return p?.nome;
        }).filter(n => n).join(', ');
        row.push(outros);
      }

      if (config.includeFields.datas) {
        row.push(os.data_inicial ? new Date(os.data_inicial).toLocaleDateString('pt-BR') : '');
        row.push(os.prazo ? new Date(os.prazo).toLocaleDateString('pt-BR') : '');
        row.push(os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : '');
        row.push(os.progresso || 0);
      }

      if (config.includeFields.expedicao) {
        row.push(os.status_separacao ? getStatusSeparacaoLabel(os.status_separacao) : '');
        row.push(os.num_reserva || '');
        row.push(os.data_reserva ? new Date(os.data_reserva).toLocaleDateString('pt-BR') : '');
        row.push(os.orgao || '');
        row.push(os.num_migo || '');
        row.push(os.data_migo ? new Date(os.data_migo).toLocaleDateString('pt-BR') : '');
        const origem = instalacoes?.find(i => i.id === os.instalacao_origem_id);
        row.push(origem?.nome || '');
        const destino = instalacoes?.find(i => i.id === os.instalacao_destino_id);
        row.push(destino?.nome || '');
      }

      if (config.includeFields.recebimento) {
        row.push(os.nfe_numero_receb || '');
        row.push(os.nfe_serie || '');
        row.push(os.nfe_data_receb ? new Date(os.nfe_data_receb).toLocaleDateString('pt-BR') : '');
        row.push(os.numero_migo_receb || '');
        row.push(os.data_migo_receb ? new Date(os.data_migo_receb).toLocaleDateString('pt-BR') : '');
        row.push(os.numero_v360 || '');
        row.push(os.doc_referencia || '');
        row.push(os.data_recebimento ? new Date(os.data_recebimento).toLocaleDateString('pt-BR') : '');
        row.push(os.problema_recebimento ? 'Sim' : 'Não');
      }

      if (config.includeFields.volumes) {
        const volumes = os.volumes || [];
        const qtdTotal = volumes.reduce((sum, v) => sum + (v.quantidade || 0), 0);
        const pesoTotal = volumes.reduce((sum, v) => sum + ((v.peso_bruto || 0) * (v.quantidade || 1)), 0);
        const m3Total = volumes.reduce((sum, v) => sum + ((v.m3 || 0) * (v.quantidade || 1)), 0);
        row.push(qtdTotal);
        row.push(pesoTotal.toFixed(2));
        row.push(m3Total.toFixed(3));
      }

      rows.push(row);
    });

    // Converter para CSV
    const csvContent = rows.map(row => 
      row.map(cell => {
        // Escapar aspas duplas e envolver em aspas se contiver vírgula, quebra de linha ou aspas
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // BOM para UTF-8 (para Excel abrir corretamente com acentos)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ordens_servico_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status) => {
    const labels = {
      elaboracao: 'Em Elaboração',
      execucao: 'Em Execução',
      concluido: 'Concluído',
      cancelado: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getStatusSeparacaoLabel = (status) => {
    const labels = {
      pendente: 'Pendente',
      em_separacao: 'Em Separação',
      separado: 'Separado',
      embalando: 'Embalando',
      aguardando_transporte: 'Aguardando Transporte',
      em_rota: 'Em Rota',
      entregue: 'Entregue'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="w-4 h-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Ordens de Serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <Select value={config.format} onValueChange={(value) => setConfig({ ...config, format: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Profissional</SelectItem>
                <SelectItem value="excel">Excel/CSV Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orientação (apenas PDF) */}
          {config.format === 'pdf' && (
            <div className="space-y-2">
              <Label>Orientação da Página</Label>
              <Select value={config.orientation} onValueChange={(value) => setConfig({ ...config, orientation: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Retrato</SelectItem>
                  <SelectItem value="landscape">Paisagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos a incluir */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Campos a Incluir</Label>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={config.includeFields.basicos}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFields: { ...config.includeFields, basicos: checked } })
                  }
                />
                <div className="flex-1">
                  <Label className="font-medium">Dados Básicos</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Código, Categoria, Regional, Almoxarifado, Status, Prioridade, Descrição
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={config.includeFields.pessoas}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFields: { ...config.includeFields, pessoas: checked } })
                  }
                />
                <div className="flex-1">
                  <Label className="font-medium">Pessoas</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Líder, Executores, Outros Envolvidos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={config.includeFields.datas}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFields: { ...config.includeFields, datas: checked } })
                  }
                />
                <div className="flex-1">
                  <Label className="font-medium">Datas e Progresso</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Data Inicial, Prazo, Conclusão, Progresso
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={config.includeFields.expedicao}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFields: { ...config.includeFields, expedicao: checked } })
                  }
                />
                <div className="flex-1">
                  <Label className="font-medium">Dados de Expedição</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Status Separação, Reserva, MIGO, Instalações
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={config.includeFields.recebimento}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFields: { ...config.includeFields, recebimento: checked } })
                  }
                />
                <div className="flex-1">
                  <Label className="font-medium">Dados de Recebimento</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    NFe, MIGO Recebimento, V360, Problemas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={config.includeFields.volumes}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, includeFields: { ...config.includeFields, volumes: checked } })
                  }
                />
                <div className="flex-1">
                  <Label className="font-medium">Volumes e Dimensões</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Quantidade, Peso Total, M³ Total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>{ordens.length}</strong> ordens de serviço serão exportadas em formato <strong>{config.format === 'pdf' ? 'PDF' : 'Excel/CSV'}</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}