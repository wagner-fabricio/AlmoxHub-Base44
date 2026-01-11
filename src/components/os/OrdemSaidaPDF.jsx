import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export default function OrdemSaidaPDF({ ordem }) {
  const contentRef = useRef(null);

  const generatePDF = async () => {
    const pages = contentRef.current.querySelectorAll('.ordem-page');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }

    pdf.save(`Ordem_Saida_${ordem.numero.replace('/', '_')}.pdf`);
  };

  // Dividir materiais em páginas (máximo ~10 itens por página para caber bem)
  const materiaisPages = [];
  const itemsPerPage = 10;
  const totalMateriais = ordem.materiais_selecionados?.length || 0;
  
  for (let i = 0; i < totalMateriais; i += itemsPerPage) {
    materiaisPages.push(ordem.materiais_selecionados.slice(i, i + itemsPerPage));
  }

  // Se não houver materiais mas houver volumes, criar pelo menos uma página
  if (materiaisPages.length === 0) {
    materiaisPages.push([]);
  }

  const totalPages = materiaisPages.length;
  const totalVolumes = ordem.volumes_selecionados?.reduce((sum, v) => sum + (v.quantidade || 1), 0) || 0;
  const pesoTotal = ordem.volumes_selecionados?.reduce((sum, v) => sum + (v.peso_bruto * (v.quantidade || 1)), 0) || 0;

  return (
    <div>
      <Button onClick={generatePDF} variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-2" />
        Baixar PDF
      </Button>

      {/* Conteúdo para geração do PDF (oculto) */}
      <div ref={contentRef} style={{ position: 'absolute', left: '-9999px' }}>
        {materiaisPages.map((materiaisDaPagina, pageIndex) => (
          <div 
            key={pageIndex}
            className="ordem-page"
            style={{
              width: '297mm',
              height: '210mm',
              padding: '10mm',
              backgroundColor: 'white',
              fontFamily: 'Arial, sans-serif',
              fontSize: '9px',
              color: '#000',
              position: 'relative',
              display: 'flex',
              gap: '0'
            }}
          >
            {/* Coluna Esquerda */}
            {renderColumn(materiaisDaPagina, pageIndex, totalPages, totalVolumes, pesoTotal)}
            
            {/* Linha de corte no meio */}
            <div style={{
              width: '2px',
              backgroundColor: '#000',
              margin: '0 2mm',
              borderLeft: '1px dashed #666',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '-15px',
                transform: 'rotate(-90deg)',
                fontSize: '8px',
                color: '#666'
              }}>
                ✂ CORTAR AQUI
              </div>
            </div>
            
            {/* Coluna Direita (espelhada) */}
            {renderColumn(materiaisDaPagina, pageIndex, totalPages, totalVolumes, pesoTotal)}
          </div>
        ))}
      </div>
    </div>
  );

  function renderColumn(materiaisDaPagina, pageIndex, totalPages, totalVolumes, pesoTotal) {
    return (
      <div style={{ flex: 1, paddingRight: '3mm' }}>
        {/* Cabeçalho */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '6px',
          paddingBottom: '6px',
          borderBottom: '2px solid #000'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
            AXIA ENERGIA
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              border: '2px solid #000',
              padding: '3px 8px'
            }}>
              ORDEM DE SAÍDA
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '3px', fontSize: '10px' }}>
              <div style={{ border: '2px solid #000', padding: '2px 8px', fontWeight: 'bold' }}>
                {ordem.numero}
              </div>
              <div style={{ border: '2px solid #000', padding: '2px 8px', fontWeight: 'bold' }}>
                {format(new Date(ordem.data_emissao), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '7px', color: '#666' }}>
            Pág {pageIndex + 1}/{totalPages}
          </div>
        </div>

        {/* Dados do Portador e Veículo */}
        <div style={{ marginBottom: '6px', fontSize: '8px' }}>
          <div>
            <strong>O PORTADOR:</strong> {ordem.portador_nome} {ordem.portador_cpf ? `- CPF ${ordem.portador_cpf}` : ''}
          </div>
          <div style={{ marginTop: '2px' }}>
            <strong>TEM AUTORIZAÇÃO PARA TRANSPORTAR O VEÍCULO:</strong> {ordem.veiculo_placa}
          </div>
          <div style={{ marginTop: '2px' }}>
            <strong>PARA:</strong> {ordem.destino}
          </div>
        </div>

        {/* Materiais */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '8px' }}>COM OS SEGUINTES MATERIAIS:</div>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '7px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#e5e7eb', borderBottom: '1px solid #000' }}>
                <th style={{ border: '1px solid #999', padding: '2px', textAlign: 'left' }}>CÓDIGO</th>
                <th style={{ border: '1px solid #999', padding: '2px', textAlign: 'center', width: '40px' }}>QUANT</th>
                <th style={{ border: '1px solid #999', padding: '2px', textAlign: 'left' }}>DESCRIÇÃO DOS MATERIAIS</th>
              </tr>
            </thead>
            <tbody>
              {materiaisDaPagina.map((material, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ddd', padding: '2px', fontSize: '7px' }}>{material.codigo}</td>
                  <td style={{ border: '1px solid #ddd', padding: '2px', textAlign: 'center' }}>{material.quantidade}</td>
                  <td style={{ border: '1px solid #ddd', padding: '2px', fontSize: '7px' }}>{material.descricao}</td>
                </tr>
              ))}
              {/* Linhas vazias para manter layout */}
              {Array.from({ length: Math.max(0, 5 - materiaisDaPagina.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  <td style={{ border: '1px solid #ddd', padding: '2px', height: '14px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #ddd', padding: '2px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #ddd', padding: '2px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '3px', fontWeight: 'bold', fontSize: '7px' }}>
            Total-Quant: {ordem.materiais_selecionados?.reduce((sum, m) => sum + m.quantidade, 0) || 0}
            {' | '}
            Total-Itens: {ordem.materiais_selecionados?.length || 0}
          </div>
        </div>

        {/* Documentos e Volumes - Apenas na primeira página */}
        {pageIndex === 0 && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '60% 40%', 
              gap: '4px',
              marginBottom: '6px' 
            }}>
              {/* Documentos */}
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '7px' }}>
                  REFERENTES AOS SEGUINTES DOCUMENTOS:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e5e7eb' }}>
                      <th style={{ border: '1px solid #999', padding: '2px', fontSize: '6px' }}>TIPO</th>
                      <th style={{ border: '1px solid #999', padding: '2px', fontSize: '6px' }}>NÚMERO</th>
                      <th style={{ border: '1px solid #999', padding: '2px', fontSize: '6px' }}>Q. ITENS</th>
                      <th style={{ border: '1px solid #999', padding: '2px', fontSize: '6px' }}>VALOR DOC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordem.documentos_referencia?.map((doc, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '2px' }}>{doc.tipo}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px' }}>{doc.numero}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px', textAlign: 'center' }}>{doc.qtd_itens}</td>
                        <td style={{ border: '1px solid #ddd', padding: '2px', textAlign: 'right' }}>{doc.valor_doc || '-'}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan="2" style={{ border: '1px solid #999', padding: '2px', fontSize: '7px' }}>TOTAL</td>
                      <td style={{ border: '1px solid #999', padding: '2px', textAlign: 'center' }}>
                        {ordem.documentos_referencia?.reduce((sum, d) => sum + (d.qtd_itens || 0), 0) || 0}
                      </td>
                      <td style={{ border: '1px solid #999', padding: '2px', textAlign: 'right' }}>
                        {ordem.documentos_referencia?.reduce((sum, d) => sum + (d.valor_doc || 0), 0) || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Volumes */}
              <div style={{ 
                border: '2px solid #000', 
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '8px', marginBottom: '4px' }}>
                  PESO (KG) / VOLUMES
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {pesoTotal.toFixed(2)} / {totalVolumes}
                </div>
              </div>
            </div>

            {/* Assinaturas */}
            <div style={{ 
              marginTop: '8px',
              borderTop: '1px solid #000',
              paddingTop: '6px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '7px' }}>ASS:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ 
                  border: '1px solid #999', 
                  borderRadius: '2px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '7px' }}>_______________________</div>
                    <div style={{ marginTop: '2px', fontSize: '6px' }}>
                      {ordem.responsavel_emissao_nome || ''} 
                      {ordem.responsavel_emissao_matricula ? ` - MAT ${ordem.responsavel_emissao_matricula}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  border: '1px solid #999', 
                  borderRadius: '2px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '7px' }}>_______________________</div>
                    <div style={{ marginTop: '2px', fontSize: '6px' }}>
                      {ordem.responsavel_autorizacao_nome || ''} 
                      {ordem.responsavel_autorizacao_matricula ? ` - MAT ${ordem.responsavel_autorizacao_matricula}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}