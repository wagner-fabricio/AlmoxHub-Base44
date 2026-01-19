import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatorioConferencia({ 
  os, 
  regional, 
  almoxarifado, 
  lider, 
  categoria,
  currentUser 
}) {
  const prioridadeLabels = {
    baixa: 'BAIXA',
    media: 'MÉDIA',
    alta: 'ALTA',
    urgente: 'URGENTE'
  };

  return (
    <div id="relatorio-conferencia" style={{ 
      width: '210mm', 
      minHeight: '297mm',
      padding: '15mm',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11pt',
      color: '#000'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '18pt', 
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          LISTA DE CONFERÊNCIA DE MATERIAIS
        </h1>
      </div>

      {/* Informações principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '10px',
        marginBottom: '20px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#f9fafb'
      }}>
        <div>
          <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>
            ORDEM DE SERVIÇO
          </div>
          <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
            {os.codigo}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>
            PRAZO
          </div>
          <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#2563eb' }}>
            {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>
            PRIORIDADE
          </div>
          <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#2563eb' }}>
            {prioridadeLabels[os.prioridade] || 'MÉDIA'}
          </div>
        </div>
      </div>

      {/* Informações gerais */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '10px 15px',
        marginBottom: '15px',
        borderRadius: '4px'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '11pt', 
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          INFORMAÇÕES GERAIS
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '10pt' }}>
          <div>
            <strong>Regional:</strong> {regional?.sigla || '-'}
          </div>
          <div>
            <strong>Almoxarifado:</strong> {almoxarifado?.nome || '-'}
          </div>
          <div>
            <strong>Líder:</strong> {lider?.nome || '-'}
          </div>
          <div>
            <strong>Atendente:</strong> {os.atendente_nome || '-'}
          </div>
        </div>
      </div>

      {/* Documento */}
      {(os.nfe_numero_receb || os.numero_migo_receb || os.numero_v360) && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '10px 15px',
          marginBottom: '15px',
          borderRadius: '4px'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '11pt', 
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            DOCUMENTO
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '10pt' }}>
            {os.nfe_numero_receb && (
              <div>
                <strong>NF:</strong> {os.nfe_numero_receb}
              </div>
            )}
            {os.numero_migo_receb && (
              <div>
                <strong>MIGO:</strong> {os.numero_migo_receb}
              </div>
            )}
            {os.numero_v360 && (
              <div>
                <strong>ID V360:</strong> {os.numero_v360}
              </div>
            )}
            {os.doc_referencia && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Referência:</strong> {os.doc_referencia}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Materiais para conferência */}
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '12px 15px',
        marginBottom: '10px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '16pt' }}>📋</span>
        <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 'bold' }}>
          MATERIAIS PARA CONFERÊNCIA
        </h3>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
        fontSize: '9pt'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px', 
              textAlign: 'center',
              width: '40px'
            }}>✓</th>
            <th style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px', 
              textAlign: 'left',
              width: '100px'
            }}>Código</th>
            <th style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px', 
              textAlign: 'left'
            }}>Descrição</th>
            <th style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px', 
              textAlign: 'center',
              width: '80px'
            }}>Qtd Esperada</th>
            <th style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px', 
              textAlign: 'center',
              width: '80px',
              backgroundColor: '#fef3c7'
            }}>Qtd Recebida</th>
            <th style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px', 
              textAlign: 'left',
              width: '120px'
            }}>Localização</th>
          </tr>
        </thead>
        <tbody>
          {(os.nfe_itens_conferencia || []).map((item, index) => (
            <tr key={index} style={{ 
              backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
            }}>
              <td style={{ 
                border: '1px solid #d1d5db', 
                padding: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid #6b7280',
                  borderRadius: '3px',
                  display: 'inline-block'
                }}></div>
              </td>
              <td style={{ 
                border: '1px solid #d1d5db', 
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '8pt'
              }}>
                {item.codigo}
              </td>
              <td style={{ 
                border: '1px solid #d1d5db', 
                padding: '8px'
              }}>
                {item.descricao}
              </td>
              <td style={{ 
                border: '1px solid #d1d5db', 
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {item.quantidade_esperada} {item.unidade}
              </td>
              <td style={{ 
                border: '1px solid #d1d5db', 
                padding: '8px',
                textAlign: 'center',
                backgroundColor: '#fef3c7'
              }}>
                {/* Campo vazio para preenchimento manual */}
              </td>
              <td style={{ 
                border: '1px solid #d1d5db', 
                padding: '8px',
                fontSize: '8pt'
              }}>
                {item.endereco_armazenagem || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '12px 15px',
        marginBottom: '20px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11pt',
        fontWeight: 'bold'
      }}>
        <div>
          Total de Itens: {(os.nfe_itens_conferencia || []).length}
        </div>
      </div>

      {/* Controle de conferência */}
      <div style={{
        backgroundColor: '#fef3c7',
        padding: '12px 15px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '11pt', 
          fontWeight: 'bold',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚠️ CONTROLE DE CONFERÊNCIA
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '10pt' }}>
          <div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              📅 INÍCIO DA CONFERÊNCIA
            </div>
            <div style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}>
              Data/Hora: ___/___/______ ___:___
            </div>
            <div style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px',
              backgroundColor: 'white',
              marginTop: '4px',
              borderRadius: '4px'
            }}>
              Responsável: _______________________
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              📅 FIM DA CONFERÊNCIA
            </div>
            <div style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}>
              Data/Hora: ___/___/______ ___:___
            </div>
            <div style={{ 
              border: '1px solid #d1d5db', 
              padding: '8px',
              backgroundColor: 'white',
              marginTop: '4px',
              borderRadius: '4px'
            }}>
              Responsável: _______________________
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div style={{
        border: '1px solid #d1d5db',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '10pt', fontWeight: 'bold' }}>
          OBSERVAÇÕES:
        </h4>
        <div style={{ 
          minHeight: '60px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px'
        }}>
          {/* Espaço para observações escritas à mão */}
        </div>
      </div>

      {/* Footer com assinaturas */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        fontSize: '9pt'
      }}>
        <div>
          <div style={{ 
            borderTop: '1px solid #000', 
            paddingTop: '5px',
            textAlign: 'center'
          }}>
            Conferente
          </div>
        </div>
        <div>
          <div style={{ 
            borderTop: '1px solid #000', 
            paddingTop: '5px',
            textAlign: 'center'
          }}>
            Supervisor/Líder
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{
        marginTop: '20px',
        paddingTop: '10px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '8pt',
        color: '#6b7280'
      }}>
        Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {currentUser?.full_name || 'Sistema'}
      </div>
    </div>
  );
}