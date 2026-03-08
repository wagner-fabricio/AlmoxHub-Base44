import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const textContent = body.textContent; // Texto extraído do PDF

    if (!textContent) {
      return Response.json({ error: 'Conteúdo do PDF não fornecido' }, { status: 400 });
    }

    console.log('Recebido conteúdo com tamanho:', textContent.length);

    // Parse do formato ZMMTSE
    const dados = parseZMMTSE(textContent);

    console.log('Dados extraídos:', JSON.stringify(dados, null, 2));

    return Response.json(dados);
  } catch (error) {
    console.error('Erro ao fazer parse do PDF:', error);
    return Response.json({
      error: 'Erro ao processar arquivo PDF: ' + error.message
    }, { status: 400 });
  }
});

function parseZMMTSE(textContent) {
  const resultado = {
    numero_migo: '',
    data_migo: '',
    num_reserva: '',
    usuario_reserva: '',
    data_documento: '',
    centro_estoque: '',
    instalacao_entrega: '',
    nfe_itens_conferencia: []
  };

  try {
    // Extrair N. DOCUMENTO (número MIGO)
    const migoMatch = textContent.match(/N\.\s*DOCUMENTO\s*\n\s*(\d+)/i);
    if (migoMatch) {
      resultado.numero_migo = migoMatch[1].trim();
    }

    // Extrair DATA DOCUMENTO
    const dataMatch = textContent.match(/DATA\s*DOCUMENTO\s*\n\s*(\d{2}\.\d{2}\.\d{4})/i);
    if (dataMatch) {
      const [dia, mes, ano] = dataMatch[1].split('.');
      resultado.data_migo = `${ano}-${mes}-${dia}`;
    }

    // Extrair CENTRO DE ESTOQUE
    const centroMatch = textContent.match(/CENTRO\s*DE\s*ESTOQUE\s*\n\s*([A-Z0-9]+)/i);
    if (centroMatch) {
      resultado.centro_estoque = centroMatch[1].trim();
    }

    // Extrair NOME/LOCAL ENTREGA
    const nomeMatch = textContent.match(/NOME\/LOCAL\s*ENTREGA\s*\n\s*([A-Z0-9]+)/i);
    if (nomeMatch) {
      resultado.instalacao_entrega = nomeMatch[1].trim();
    }

    // Extrair todos os itens
    // Padrão: Item :XXXX, Material: XXXXXXX, Qtd: X,XXX, ...
    const itemRegex = /Item\s*:\s*(\d+)\s*Material\s*:\s*(\d+)\s*Texto\s*Breve\s*:\s*([^\n]+)\s*Qtd\s*:\s*([\d.,]+)\s*UN\s*:\s*([A-Z]+)/gi;

    let match;
    while ((match = itemRegex.exec(textContent)) !== null) {
      const itemNum = match[1];
      const codigo = match[2];
      const descricao = match[3];
      let quantidade = match[4];

      // Converter quantidade: "1,000" ou "1.000" para número
      quantidade = quantidade.replace(/\./g, '').replace(',', '.').trim();
      quantidade = parseFloat(quantidade) || 0;

      if (codigo && descricao) {
        resultado.nfe_itens_conferencia.push({
          codigo: codigo.trim(),
          descricao: descricao.trim(),
          quantidade_esperada: quantidade,
          quantidade_recebida: 0,
          unidade: match[5].trim() || 'UN',
          valor_unitario: 0,
          status_conferencia: 'pendente',
          endereco_armazenagem: ''
        });
      }
    }

    // Se não encontrou itens com o regex anterior, tentar padrão alternativo
    if (resultado.nfe_itens_conferencia.length === 0) {
      // Padrão alternativo: linhas com "Item : XXXX" seguidas de Material, Qtd, etc.
      const lines = textContent.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.match(/^Item\s*:\s*\d+/i)) {
          // Próximas linhas contêm os dados
          let itemData = {
            codigo: '',
            descricao: '',
            quantidade: 0,
            unidade: 'UN'
          };

          // Procurar Material
          for (let j = i; j < Math.min(i + 15, lines.length); j++) {
            const l = lines[j];

            const materialMatch = l.match(/Material\s*:\s*(\d+)/i);
            if (materialMatch) {
              itemData.codigo = materialMatch[1].trim();
            }

            const textMatch = l.match(/Texto\s*Breve\s*:\s*(.+)/i);
            if (textMatch) {
              itemData.descricao = textMatch[1].trim();
            }

            const qtdMatch = l.match(/Qtd\s*:\s*([\d.,]+)/i);
            if (qtdMatch) {
              let qtd = qtdMatch[1].replace(/\./g, '').replace(',', '.').trim();
              itemData.quantidade = parseFloat(qtd) || 0;
            }

            const unMatch = l.match(/UN\s*:\s*([A-Z]+)/i);
            if (unMatch) {
              itemData.unidade = unMatch[1].trim();
            }
          }

          if (itemData.codigo && itemData.descricao) {
            resultado.nfe_itens_conferencia.push({
              codigo: itemData.codigo,
              descricao: itemData.descricao,
              quantidade_esperada: itemData.quantidade,
              quantidade_recebida: 0,
              unidade: itemData.unidade,
              valor_unitario: 0,
              status_conferencia: 'pendente',
              endereco_armazenagem: ''
            });

            i += 14; // Pular as linhas já processadas
          }
        }
      }
    }

    return resultado;
  } catch (error) {
    throw new Error(`Erro ao fazer parse do ZMMTSE: ${error.message}`);
  }
}