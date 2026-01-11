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
    const minLinhasTabela = 10; // Garantir pelo menos 10 linhas para preencher bem a página
    
    // Calcular valor total dos materiais
    const valorTotalMateriais = ordem.materiais_selecionados?.reduce((sum, m) => {
      // Aqui você precisaria ter o valor unitário dos materiais
      // Por enquanto vamos deixar como opcional
      return sum + (m.r_total || 0);
    }, 0) || 0;
    
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '190mm' }}>
        {/* Cabeçalho Compacto */}
        <div style={{ 
          border: '2px solid #000',
          marginBottom: '3mm'
        }}>
          <div style={{ 
            backgroundColor: '#000',
            padding: '2mm 3mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693889ed43a3c099705a3c51/6df844129_AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_VERTICAL_NEGATIVO_RBG.png"
              alt="Axia Energia"
              style={{ height: '10mm', objectFit: 'contain' }}
            />
            <div style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '0.5px'
            }}>
              ORDEM DE SAÍDA
            </div>
            <div style={{ color: 'white', fontSize: '6pt', textAlign: 'right' }}>
              <div>Página</div>
              <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>{pageIndex + 1}/{totalPages}</div>
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '2mm',
            display: 'flex',
            justifyContent: 'space-around',
            borderTop: '1px solid #000'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '5pt', color: '#666', marginBottom: '0.5mm' }}>NÚMERO</div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>
                {ordem.numero}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '5pt', color: '#666', marginBottom: '0.5mm' }}>DATA EMISSÃO</div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>
                {format(new Date(ordem.data_emissao), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div style={{ marginBottom: '2.5mm' }}>
          <div style={{ 
            backgroundColor: '#d9d9d9',
            padding: '1mm 2mm',
            fontSize: '6pt',
            fontWeight: 'bold',
            border: '1px solid #666'
          }}>
            DADOS DA AUTORIZAÇÃO
          </div>
          <div style={{ 
            border: '1px solid #999',
            borderTop: 'none',
            padding: '1.5mm',
            fontSize: '6pt',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ marginBottom: '1mm' }}>
              <span style={{ fontWeight: 'bold' }}>Portador:</span> {ordem.portador_nome || '____________________'}
              {ordem.portador_cpf && <span> - CPF: {ordem.portador_cpf}</span>}
            </div>
            <div style={{ marginBottom: '1mm' }}>
              <span style={{ fontWeight: 'bold' }}>Veículo:</span> {ordem.veiculo_placa || '____________________'}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Destino:</span> {ordem.destino || '____________________'}
            </div>
          </div>
        </div>

        {/* Materiais - Seção Principal */}
        <div style={{ marginBottom: '2.5mm', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            backgroundColor: '#4a4a4a',
            color: 'white',
            padding: '1.5mm',
            fontSize: '7pt',
            fontWeight: 'bold',
            border: '2px solid #333'
          }}>
            📦 MATERIAIS TRANSPORTADOS
          </div>
          <div style={{ 
            border: '2px solid #333',
            borderTop: 'none',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '6pt'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#d9d9d9' }}>
                  <th style={{ 
                    border: '1px solid #999', 
                    padding: '1mm', 
                    textAlign: 'left', 
                    fontWeight: 'bold',
                    width: '22%'
                  }}>CÓDIGO</th>
                  <th style={{ 
                    border: '1px solid #999', 
                    padding: '1mm', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    width: '10%'
                  }}>QUANT</th>
                  <th style={{ 
                    border: '1px solid #999', 
                    padding: '1mm', 
                    textAlign: 'left', 
                    fontWeight: 'bold'
                  }}>DESCRIÇÃO DOS MATERIAIS</th>
                </tr>
              </thead>
              <tbody>
                {materiaisDaPagina.map((material, idx) => (
                  <tr key={idx} style={{ 
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f5f5f5'
                  }}>
                    <td style={{ 
                      border: '1px solid #ccc', 
                      padding: '1.5mm',
                      fontFamily: 'Courier, monospace',
                      fontWeight: 'bold',
                      fontSize: '6pt'
                    }}>{material.codigo}</td>
                    <td style={{ 
                      border: '1px solid #ccc', 
                      padding: '1.5mm', 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      fontSize: '7pt'
                    }}>{material.quantidade}</td>
                    <td style={{ 
                      border: '1px solid #ccc', 
                      padding: '1.5mm',
                      fontSize: '6pt'
                    }}>{material.descricao}</td>
                  </tr>
                ))}
                {/* Linhas vazias para preencher a página */}
                {Array.from({ length: Math.max(0, minLinhasTabela - materiaisDaPagina.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} style={{ 
                    backgroundColor: (materiaisDaPagina.length + idx) % 2 === 0 ? '#ffffff' : '#f5f5f5'
                  }}>
                    <td style={{ border: '1px solid #ccc', padding: '1.5mm', height: '5mm' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #ccc', padding: '1.5mm' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #ccc', padding: '1.5mm' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ 
            backgroundColor: '#e8e8e8',
            padding: '1.5mm',
            border: '2px solid #333',
            borderTop: 'none',
            fontSize: '6pt',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Total de Itens: {ordem.materiais_selecionados?.length || 0} | 
            Quantidade Total: {ordem.materiais_selecionados?.reduce((sum, m) => sum + m.quantidade, 0) || 0}
          </div>
        </div>

        {/* Seção Inferior - Apenas na primeira página */}
        {pageIndex === 0 && (
          <div style={{ marginTop: 'auto' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '55% 45%', 
              gap: '3mm',
              marginBottom: '3mm'
            }}>
              {/* Documentos */}
              <div>
                <div style={{ 
                  backgroundColor: '#e8e8e8',
                  padding: '1.5mm 2mm',
                  fontSize: '7pt',
                  fontWeight: 'bold',
                  border: '1px solid #999'
                }}>
                  DOCUMENTOS DE REFERÊNCIA
                </div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '6pt',
                  border: '1px solid #ccc',
                  borderTop: 'none'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '1.5mm', fontWeight: 'bold' }}>TIPO</th>
                      <th style={{ border: '1px solid #ddd', padding: '1.5mm', fontWeight: 'bold' }}>NÚMERO</th>
                      <th style={{ border: '1px solid #ddd', padding: '1.5mm', fontWeight: 'bold', textAlign: 'center' }}>ITENS</th>
                      <th style={{ border: '1px solid #ddd', padding: '1.5mm', fontWeight: 'bold', textAlign: 'right' }}>VALOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordem.documentos_referencia && ordem.documentos_referencia.length > 0 ? (
                      <>
                        {ordem.documentos_referencia.map((doc, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #ddd', padding: '1.5mm' }}>{doc.tipo}</td>
                            <td style={{ border: '1px solid #ddd', padding: '1.5mm' }}>{doc.numero}</td>
                            <td style={{ border: '1px solid #ddd', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold' }}>{doc.qtd_itens}</td>
                            <td style={{ border: '1px solid #ddd', padding: '1.5mm', textAlign: 'right' }}>{doc.valor_doc || '-'}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                          <td colSpan="2" style={{ border: '1px solid #999', padding: '1.5mm' }}>TOTAL</td>
                          <td style={{ border: '1px solid #999', padding: '1.5mm', textAlign: 'center' }}>
                            {ordem.documentos_referencia.reduce((sum, d) => sum + (d.qtd_itens || 0), 0)}
                          </td>
                          <td style={{ border: '1px solid #999', padding: '1.5mm', textAlign: 'right' }}>
                            {ordem.documentos_referencia.reduce((sum, d) => sum + (d.valor_doc || 0), 0) || '-'}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ border: '1px solid #ddd', padding: '3mm', textAlign: 'center', color: '#999' }}>
                          Nenhum documento referenciado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Volumes */}
              <div style={{ 
                border: '2px solid #0066cc', 
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  backgroundColor: '#0066cc',
                  color: 'white',
                  padding: '1.5mm',
                  fontSize: '7pt',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  RESUMO DE CARGA
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f0f8ff',
                  padding: '3mm'
                }}>
                  <div style={{ fontSize: '6pt', color: '#666', marginBottom: '2mm' }}>
                    PESO TOTAL (KG) / VOLUMES
                  </div>
                  <div style={{ fontSize: '16pt', fontWeight: 'bold', color: '#0066cc' }}>
                    {pesoTotal.toFixed(2)} / {totalVolumes}
                  </div>
                </div>
              </div>
            </div>

            {/* Assinaturas - Compacto */}
            <div style={{ 
              border: '1px solid #666'
            }}>
              <div style={{
                backgroundColor: '#d9d9d9',
                padding: '1mm 2mm',
                fontSize: '6pt',
                fontWeight: 'bold',
                borderBottom: '1px solid #666'
              }}>
                ASSINATURAS
              </div>
              <div style={{ padding: '1.5mm' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm' }}>
                  <div>
                    <div style={{ fontSize: '5pt', fontWeight: 'bold', marginBottom: '0.5mm' }}>
                      Emissão
                    </div>
                    <div style={{ fontSize: '5pt', color: '#666', marginBottom: '1mm' }}>
                      {ordem.responsavel_emissao_nome || '____________________'}
                      {ordem.responsavel_emissao_matricula && ` - MAT ${ordem.responsavel_emissao_matricula}`}
                    </div>
                    <div style={{ 
                      borderBottom: '1px solid #333', 
                      marginTop: '2mm',
                      marginBottom: '0.5mm'
                    }}></div>
                    <div style={{ fontSize: '4pt', textAlign: 'center', color: '#999' }}>
                      Assinatura
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '5pt', fontWeight: 'bold', marginBottom: '0.5mm' }}>
                      Autorização
                    </div>
                    <div style={{ fontSize: '5pt', color: '#666', marginBottom: '1mm' }}>
                      {ordem.responsavel_autorizacao_nome || '____________________'}
                      {ordem.responsavel_autorizacao_matricula && ` - MAT ${ordem.responsavel_autorizacao_matricula}`}
                    </div>
                    <div style={{ 
                      borderBottom: '1px solid #333', 
                      marginTop: '2mm',
                      marginBottom: '0.5mm'
                    }}></div>
                    <div style={{ fontSize: '4pt', textAlign: 'center', color: '#999' }}>
                      Assinatura
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}