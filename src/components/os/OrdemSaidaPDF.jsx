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
            
            {/* Linha de separação */}
            <div style={{
              width: '1px',
              backgroundColor: '#ccc',
              margin: '0 3mm'
            }}></div>
            
            {/* Coluna Direita (espelhada) */}
            {renderColumn(materiaisDaPagina, pageIndex, totalPages, totalVolumes, pesoTotal)}
          </div>
        ))}
      </div>
    </div>
  );

  function renderColumn(materiaisDaPagina, pageIndex, totalPages, totalVolumes, pesoTotal) {
    const minLinhasTabela = 15; // Garantir pelo menos 15 linhas para preencher bem a página
    
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
          marginBottom: '2mm'
        }}>
          <div style={{ 
            backgroundColor: '#000',
            padding: '1.5mm 2mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '12mm'
          }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693889ed43a3c099705a3c51/6df844129_AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_VERTICAL_NEGATIVO_RBG.png"
              alt="Axia Energia"
              style={{ height: '11mm', objectFit: 'contain' }}
            />
            <div style={{ 
              fontSize: '11pt', 
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '0.5px'
            }}>
              ORDEM DE SAÍDA
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: 'white' }}>
                {ordem.numero}
              </div>
              <div style={{ fontSize: '6pt', color: '#ccc' }}>
                {format(new Date(ordem.data_emissao), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div style={{ marginBottom: '2mm' }}>
          <div style={{ 
            backgroundColor: '#d9d9d9',
            padding: '0.8mm 1.5mm',
            fontSize: '6pt',
            fontWeight: 'bold',
            border: '1px solid #666'
          }}>
            DADOS DA AUTORIZAÇÃO
          </div>
          <div style={{ 
            border: '1px solid #999',
            borderTop: 'none',
            padding: '1.2mm',
            fontSize: '5.5pt',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ marginBottom: '0.8mm' }}>
              <span style={{ fontWeight: 'bold' }}>Portador:</span> {ordem.portador_nome || '____________________'}
              {ordem.portador_cpf && <span> - CPF: {ordem.portador_cpf}</span>}
            </div>
            <div style={{ marginBottom: '0.8mm' }}>
              <span style={{ fontWeight: 'bold' }}>Veículo:</span> {ordem.veiculo_placa || '____________________'}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Destino:</span> {ordem.destino || '____________________'}
            </div>
          </div>
        </div>

        {/* Materiais - Seção Principal */}
        <div style={{ marginBottom: '2mm', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            backgroundColor: '#333',
            color: 'white',
            padding: '1mm',
            fontSize: '6pt',
            fontWeight: 'bold',
            border: '1px solid #333'
          }}>
            MATERIAIS TRANSPORTADOS
          </div>
          <div style={{ 
            border: '1px solid #666',
            borderTop: 'none',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '5.5pt'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#e8e8e8' }}>
                  <th style={{ 
                    border: '1px solid #ccc', 
                    padding: '1.2mm 1mm', 
                    textAlign: 'left', 
                    fontWeight: 'bold',
                    width: '22%',
                    verticalAlign: 'middle'
                  }}>CÓDIGO</th>
                  <th style={{ 
                    border: '1px solid #ccc', 
                    padding: '1.2mm 1mm', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    width: '10%',
                    verticalAlign: 'middle'
                  }}>QUANT</th>
                  <th style={{ 
                    border: '1px solid #ccc', 
                    padding: '1.2mm 1mm', 
                    textAlign: 'left', 
                    fontWeight: 'bold',
                    verticalAlign: 'middle'
                  }}>DESCRIÇÃO DOS MATERIAIS</th>
                </tr>
              </thead>
              <tbody>
                {materiaisDaPagina.map((material, idx) => (
                  <tr key={idx} style={{ 
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f8f8'
                  }}>
                    <td style={{ 
                      border: '1px solid #ddd', 
                      padding: '1.5mm 1.2mm',
                      fontFamily: 'Courier, monospace',
                      fontWeight: 'bold',
                      fontSize: '5.5pt',
                      verticalAlign: 'middle'
                    }}>{material.codigo}</td>
                    <td style={{ 
                      border: '1px solid #ddd', 
                      padding: '1.5mm 1.2mm', 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      fontSize: '6pt',
                      verticalAlign: 'middle'
                    }}>{material.quantidade}</td>
                    <td style={{ 
                      border: '1px solid #ddd', 
                      padding: '1.5mm 1.2mm',
                      fontSize: '5.5pt',
                      verticalAlign: 'middle'
                    }}>{material.descricao}</td>
                  </tr>
                ))}
                {/* Linhas vazias para preencher a página */}
                {Array.from({ length: Math.max(0, minLinhasTabela - materiaisDaPagina.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} style={{ 
                    backgroundColor: (materiaisDaPagina.length + idx) % 2 === 0 ? '#ffffff' : '#f8f8f8'
                  }}>
                    <td style={{ border: '1px solid #ddd', padding: '1.5mm 1.2mm', height: '4.5mm', verticalAlign: 'middle' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #ddd', padding: '1.5mm 1.2mm', verticalAlign: 'middle' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #ddd', padding: '1.5mm 1.2mm', verticalAlign: 'middle' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ 
            backgroundColor: '#e8e8e8',
            padding: '1mm',
            border: '1px solid #666',
            borderTop: 'none',
            fontSize: '5.5pt',
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
              display: 'flex',
              gap: '2mm',
              marginBottom: '2mm'
            }}>
              {/* Documentos - Dados da expedição */}
              <div style={{ 
                border: '2px solid #333',
                display: 'flex',
                flexDirection: 'column',
                flex: 1
              }}>
                <div style={{ 
                  backgroundColor: '#d9d9d9',
                  padding: '1mm 1.5mm',
                  fontSize: '5.5pt',
                  fontWeight: 'bold',
                  border: '1px solid #666',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '5mm'
                }}>
                  DOCUMENTOS DE REFERÊNCIA
                </div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '5.5pt',
                  flex: 1
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e8e8e8' }}>
                      <th style={{ 
                        border: '1px solid #ccc', 
                        padding: '1.2mm 1mm', 
                        fontWeight: 'bold', 
                        width: '25%',
                        verticalAlign: 'middle'
                      }}>TIPO DOC</th>
                      <th style={{ 
                        border: '1px solid #ccc', 
                        padding: '1.2mm 1mm', 
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                      }}>Nº DOC</th>
                      <th style={{ 
                        border: '1px solid #ccc', 
                        padding: '1.2mm 1mm', 
                        fontWeight: 'bold', 
                        textAlign: 'right', 
                        width: '25%',
                        verticalAlign: 'middle'
                      }}>VALOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '1.5mm 1mm', 
                        backgroundColor: '#fff',
                        verticalAlign: 'middle'
                      }}>
                        {ordem.tipo_doc || '-'}
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '1.5mm 1mm', 
                        backgroundColor: '#fff',
                        verticalAlign: 'middle'
                      }}>
                        {ordem.num_doc || '-'}
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '1.5mm 1mm', 
                        textAlign: 'right', 
                        fontWeight: 'bold', 
                        backgroundColor: '#fff',
                        verticalAlign: 'middle'
                      }}>
                        {ordem.valor_total != null && ordem.valor_total !== 0 ? ordem.valor_total.toFixed(2) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Volumes */}
              <div style={{ 
                border: '2px solid #333', 
                display: 'flex',
                flexDirection: 'column',
                flex: 1
              }}>
                <div style={{
                  backgroundColor: '#4a4a4a',
                  color: 'white',
                  padding: '1mm',
                  fontSize: '5.5pt',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '5mm'
                }}>
                  RESUMO DE CARGA
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#fafafa',
                  padding: '2mm'
                }}>
                  <div style={{ fontSize: '5pt', color: '#666', marginBottom: '1mm' }}>
                    PESO TOTAL (KG) / VOLUMES
                  </div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#000' }}>
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
                padding: '0.7mm 1.5mm',
                fontSize: '5.5pt',
                fontWeight: 'bold',
                borderBottom: '1px solid #666'
              }}>
                ASSINATURAS
              </div>
              <div style={{ padding: '1mm', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2mm' }}>
                  <div>
                    <div style={{ fontSize: '5pt', fontWeight: 'bold', marginBottom: '0.3mm' }}>
                      Emissão
                    </div>
                    <div style={{ fontSize: '4.5pt', color: '#666', marginBottom: '0.5mm' }}>
                      {ordem.responsavel_emissao_nome || '________________'}
                      {ordem.responsavel_emissao_matricula && ` MAT ${ordem.responsavel_emissao_matricula}`}
                    </div>
                    <div style={{ 
                      borderBottom: '1px solid #666', 
                      marginTop: '1.5mm',
                      marginBottom: '0.3mm'
                    }}></div>
                    <div style={{ fontSize: '3.5pt', textAlign: 'center', color: '#999' }}>
                      Assinatura
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '5pt', fontWeight: 'bold', marginBottom: '0.3mm' }}>
                      Autorização
                    </div>
                    <div style={{ fontSize: '4.5pt', color: '#666', marginBottom: '0.5mm' }}>
                      {ordem.responsavel_autorizacao_nome || '________________'}
                      {ordem.responsavel_autorizacao_matricula && ` MAT ${ordem.responsavel_autorizacao_matricula}`}
                    </div>
                    <div style={{ 
                      borderBottom: '1px solid #666', 
                      marginTop: '1.5mm',
                      marginBottom: '0.3mm'
                    }}></div>
                    <div style={{ fontSize: '3.5pt', textAlign: 'center', color: '#999' }}>
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