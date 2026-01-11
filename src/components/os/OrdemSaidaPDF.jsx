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
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '3px solid #0000FF'
        }}>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693889ed43a3c099705a3c51/a4c044743_LogoAxia.jpg"
            alt="Axia Energia"
            style={{ height: '28px', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              border: '3px solid #0000FF',
              padding: '4px 10px',
              backgroundColor: '#f0f0ff'
            }}>
              ORDEM DE SAÍDA
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontSize: '11px' }}>
              <div style={{ 
                border: '2px solid #0000FF', 
                padding: '3px 10px', 
                fontWeight: 'bold',
                backgroundColor: '#f0f0ff'
              }}>
                {ordem.numero}
              </div>
              <div style={{ 
                border: '2px solid #0000FF', 
                padding: '3px 10px', 
                fontWeight: 'bold',
                backgroundColor: '#f0f0ff'
              }}>
                {format(new Date(ordem.data_emissao), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '7px', color: '#666', textAlign: 'right' }}>
            Página<br/>{pageIndex + 1}/{totalPages}
          </div>
        </div>

        {/* Dados do Portador e Veículo */}
        <div style={{ 
          marginBottom: '8px', 
          fontSize: '8px',
          backgroundColor: '#f8f9fa',
          padding: '6px',
          border: '1px solid #dee2e6',
          borderRadius: '3px'
        }}>
          <div style={{ marginBottom: '3px' }}>
            <strong style={{ color: '#0000FF' }}>O PORTADOR:</strong> {ordem.portador_nome} {ordem.portador_cpf ? `- CPF ${ordem.portador_cpf}` : ''}
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong style={{ color: '#0000FF' }}>TEM AUTORIZAÇÃO PARA TRANSPORTAR O VEÍCULO:</strong> {ordem.veiculo_placa}
          </div>
          <div>
            <strong style={{ color: '#0000FF' }}>PARA:</strong> {ordem.destino}
          </div>
        </div>

        {/* Materiais */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '4px', 
            fontSize: '8px',
            color: '#0000FF',
            borderBottom: '2px solid #0000FF',
            paddingBottom: '2px'
          }}>
            COM OS SEGUINTES MATERIAIS:
          </div>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '7px',
            border: '2px solid #0000FF'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#e3e9ff', borderBottom: '2px solid #0000FF' }}>
                <th style={{ border: '1px solid #b8c5ff', padding: '3px', textAlign: 'left', fontWeight: 'bold' }}>CÓDIGO</th>
                <th style={{ border: '1px solid #b8c5ff', padding: '3px', textAlign: 'center', width: '40px', fontWeight: 'bold' }}>QUANT</th>
                <th style={{ border: '1px solid #b8c5ff', padding: '3px', textAlign: 'left', fontWeight: 'bold' }}>DESCRIÇÃO DOS MATERIAIS</th>
              </tr>
            </thead>
            <tbody>
              {materiaisDaPagina.map((material, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9ff' }}>
                  <td style={{ border: '1px solid #d0d7ff', padding: '3px', fontSize: '7px' }}>{material.codigo}</td>
                  <td style={{ border: '1px solid #d0d7ff', padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>{material.quantidade}</td>
                  <td style={{ border: '1px solid #d0d7ff', padding: '3px', fontSize: '7px' }}>{material.descricao}</td>
                </tr>
              ))}
              {/* Linhas vazias para manter layout */}
              {Array.from({ length: Math.max(0, 5 - materiaisDaPagina.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} style={{ backgroundColor: (materiaisDaPagina.length + idx) % 2 === 0 ? '#ffffff' : '#f8f9ff' }}>
                  <td style={{ border: '1px solid #d0d7ff', padding: '2px', height: '14px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d0d7ff', padding: '2px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #d0d7ff', padding: '2px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ 
            marginTop: '4px', 
            fontWeight: 'bold', 
            fontSize: '8px',
            backgroundColor: '#f0f0ff',
            padding: '3px 6px',
            border: '1px solid #0000FF',
            borderRadius: '2px'
          }}>
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
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '3px', 
                  fontSize: '7px',
                  color: '#0000FF',
                  borderBottom: '2px solid #0000FF',
                  paddingBottom: '2px'
                }}>
                  REFERENTES AOS SEGUINTES DOCUMENTOS:
                </div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '7px',
                  border: '2px solid #0000FF'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e3e9ff' }}>
                      <th style={{ border: '1px solid #b8c5ff', padding: '2px', fontSize: '6px', fontWeight: 'bold' }}>TIPO</th>
                      <th style={{ border: '1px solid #b8c5ff', padding: '2px', fontSize: '6px', fontWeight: 'bold' }}>NÚMERO</th>
                      <th style={{ border: '1px solid #b8c5ff', padding: '2px', fontSize: '6px', fontWeight: 'bold' }}>Q. ITENS</th>
                      <th style={{ border: '1px solid #b8c5ff', padding: '2px', fontSize: '6px', fontWeight: 'bold' }}>VALOR DOC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordem.documentos_referencia?.map((doc, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9ff' }}>
                        <td style={{ border: '1px solid #d0d7ff', padding: '2px' }}>{doc.tipo}</td>
                        <td style={{ border: '1px solid #d0d7ff', padding: '2px' }}>{doc.numero}</td>
                        <td style={{ border: '1px solid #d0d7ff', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>{doc.qtd_itens}</td>
                        <td style={{ border: '1px solid #d0d7ff', padding: '2px', textAlign: 'right' }}>{doc.valor_doc || '-'}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#e3e9ff' }}>
                      <td colSpan="2" style={{ border: '1px solid #0000FF', padding: '2px', fontSize: '7px' }}>TOTAL</td>
                      <td style={{ border: '1px solid #0000FF', padding: '2px', textAlign: 'center' }}>
                        {ordem.documentos_referencia?.reduce((sum, d) => sum + (d.qtd_itens || 0), 0) || 0}
                      </td>
                      <td style={{ border: '1px solid #0000FF', padding: '2px', textAlign: 'right' }}>
                        {ordem.documentos_referencia?.reduce((sum, d) => sum + (d.valor_doc || 0), 0) || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Volumes */}
              <div style={{ 
                border: '3px solid #0000FF', 
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f0ff',
                borderRadius: '3px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '8px', marginBottom: '4px', color: '#0000FF' }}>
                  PESO (KG) / VOLUMES
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0000FF' }}>
                  {pesoTotal.toFixed(2)} / {totalVolumes}
                </div>
              </div>
            </div>

            {/* Assinaturas */}
            <div style={{ 
              marginTop: '8px',
              borderTop: '3px solid #0000FF',
              paddingTop: '6px'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '4px', 
                fontSize: '8px',
                color: '#0000FF'
              }}>
                ASSINATURAS:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ 
                  border: '2px solid #0000FF', 
                  borderRadius: '3px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9ff'
                }}>
                  <div>
                    <div style={{ fontSize: '7px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </div>
                    <div style={{ marginTop: '3px', fontSize: '6px', fontWeight: 'bold' }}>
                      {ordem.responsavel_emissao_nome || 'EMISSOR'} 
                      {ordem.responsavel_emissao_matricula ? ` - MAT ${ordem.responsavel_emissao_matricula}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  border: '2px solid #0000FF', 
                  borderRadius: '3px',
                  padding: '12px 6px',
                  textAlign: 'center',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9ff'
                }}>
                  <div>
                    <div style={{ fontSize: '7px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </div>
                    <div style={{ marginTop: '3px', fontSize: '6px', fontWeight: 'bold' }}>
                      {ordem.responsavel_autorizacao_nome || 'AUTORIZADOR'} 
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