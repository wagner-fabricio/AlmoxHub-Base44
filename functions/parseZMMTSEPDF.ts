import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import pdfParse from 'npm:pdf-parse@1.1.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const pdfBase64 = body.pdfBase64;
    const pdfUrl = body.pdfUrl;

    if (!pdfBase64 && !pdfUrl) {
      return Response.json({ error: 'PDF base64 ou URL não fornecido' }, { status: 400 });
    }

    let pdfBuffer;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    } else {
      const response = await fetch(pdfUrl);
      pdfBuffer = await response.arrayBuffer();
    }

    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    console.log('PDF extraído com sucesso, tamanho:', text.length);

    // Parse específico para ZMMTSE (Movimentação de Material SAP)
    const dados = parseZMMTSE(text);

    console.log('Dados extraídos:', JSON.stringify(dados, null, 2));

    return Response.json(dados);
  } catch (error) {
    console.error('Erro ao fazer parse do PDF:', error);
    return Response.json({ 
      error: 'Erro ao processar arquivo PDF: ' + error.message 
    }, { status: 400 });
  }
});

function parseZMMTSE(text) {
  const resultado = {
    num_migo: '',
    data_documento: '',
    tipo_movimento: '',
    centro_estoque: '',
    itens_documento: []
  };

  try {
    // Extrair Número do Documento (N. DOCUMENTO / Nº MIGO)
    const nDocMatch = text.match(/N\.\s*DOCUMENTO\s*\n\s*(\d+)/i) ||
                      text.match(/Nº?\s*DOCUMENTO\s*\n\s*(\d+)/i) ||
                      text.match(/N\.\s*DOCUMENTO[:\s]+(\d+)/i);
    
    if (nDocMatch) {
      resultado.num_migo = nDocMatch[1].trim();
    }

    // Extrair Data do Documento
    const dataMatch = text.match(/DATA\s*DOCUMENTO\s*\n\s*(\d{2}[\.\/]\d{2}[\.\/]\d{4})/i) ||
                      text.match(/DATA\s*DOCUMENTO[:\s]+(\d{2}[\.\/]\d{2}[\.\/]\d{4})/i);
    
    if (dataMatch) {
      resultado.data_documento = formatarData(dataMatch[1]);
    }

    // Extrair Tipo de Movimento
    const tipoMatch = text.match(/TIPO\s*DE\s*MOVIMENTO\s*\n\s*(\d+)/i) ||
                      text.match(/TIPO\s*DE\s*MOVIMENTO[:\s]+(\d+)/i);
    
    if (tipoMatch) {
      resultado.tipo_movimento = tipoMatch[1].trim();
    }

    // Extrair Centro de Estoque
    const centroMatch = text.match(/CENTRO\s*DE\s*ESTOQUE\s*\n\s*([A-Z0-9]+)/i) ||
                        text.match(/CENTRO\s*DE\s*ESTOQUE[:\s]+([A-Z0-9]+)/i);
    
    if (centroMatch) {
      resultado.centro_estoque = centroMatch[1].trim();
    }

    // Extrair itens (linhas que começam com "Item")
    const itemMatches = text.matchAll(/Item\s*:\s*(\d+)\s*\n([\s\S]*?)(?=Item\s*:|$)/gi);
    
    for (const match of itemMatches) {
      const itemText = match[2];
      const item = parseItem(itemText);
      
      if (item.codigo || item.descricao) {
        resultado.itens_documento.push(item);
      }
    }

    return resultado;
  } catch (error) {
    console.error('Erro ao fazer parse do ZMMTSE:', error);
    throw new Error(`Erro ao fazer parse do ZMMTSE: ${error.message}`);
  }
}

function parseItem(itemText) {
  const item = {
    codigo: '',
    descricao: '',
    quantidade: 0,
    unidade: 'UN',
    endereco: '',
    saldo_estoque: 0,
    numero_reserva: ''
  };

  try {
    // Extrair código do material
    const codigoMatch = itemText.match(/Material\s*:\s*(\d+)/i);
    if (codigoMatch) {
      item.codigo = codigoMatch[1].trim();
    }

    // Extrair descrição (Texto Breve)
    const descMatch = itemText.match(/Texto\s+Breve\s*:\s*([^\n]+)/i);
    if (descMatch) {
      item.descricao = descMatch[1].trim();
    }

    // Extrair quantidade - pode estar após "Qtd" com ":" ou em nova linha
    // Buscar padrão "Qtd" seguido de ":" ou quebra de linha e número
    let qtdMatch = itemText.match(/Qtd\s*:\s*([\d.,]+)/i);
    
    // Se não encontrou, tenta buscar "Qtd" em nova linha
    if (!qtdMatch) {
      qtdMatch = itemText.match(/Qtd\s*\n\s*:\s*([\d.,]+)/i);
    }
    
    // Se ainda não encontrou, tenta sem espaço após Qtd
    if (!qtdMatch) {
      qtdMatch = itemText.match(/Qtd[:\s]+([\d.,]+)/i);
    }

    if (qtdMatch) {
      const qtdStr = qtdMatch[1].replace(/\./g, '').replace(',', '.');
      item.quantidade = parseFloat(qtdStr) || 0;
    }

    // Extrair Unidade
    const unMatch = itemText.match(/UN\s*:\s*([A-Z]+)/i);
    if (unMatch) {
      item.unidade = unMatch[1].trim();
    }

    // Extrair Localização
    const locMatch = itemText.match(/Localização\s*:\s*([^\n]+)/i);
    if (locMatch) {
      item.endereco = locMatch[1].trim();
    }

    // Extrair Saldo em Estoque
    const saldoMatch = itemText.match(/Saldo\s+em\s+Estoque\s*:\s*([\d.,]+)/i);
    if (saldoMatch) {
      const saldoStr = saldoMatch[1].replace(/\./g, '').replace(',', '.');
      item.saldo_estoque = parseFloat(saldoStr) || 0;
    }

    // Extrair Número de Reserva
    const reservaMatch = itemText.match(/Reserva\s*:\s*(\d+)/i);
    if (reservaMatch) {
      item.numero_reserva = reservaMatch[1].trim();
    }

    return item;
  } catch (error) {
    console.error('Erro ao parsear item:', error);
    return item;
  }
}

function formatarData(dataStr) {
  // Converter DD/MM/YYYY ou DD.MM.YYYY para YYYY-MM-DD
  const parts = dataStr.split(/[\/\.]/);
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dataStr;
}