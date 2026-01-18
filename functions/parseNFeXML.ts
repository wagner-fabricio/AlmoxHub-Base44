import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    const xmlContent = await file.text();
    
    // Remover BOM se presente
    const cleanXml = xmlContent.replace(/^\uFEFF/, '');
    
    // Parse simples usando regex para NFe XML (formato padrão SEFAZ)
    const dados = parseNFeXML(cleanXml);

    return Response.json(dados);
  } catch (error) {
    console.error('Erro ao fazer parse do XML:', error);
    return Response.json({ 
      error: 'Erro ao processar arquivo XML: ' + error.message 
    }, { status: 400 });
  }
});

function parseNFeXML(xmlContent) {
  const resultado = {
    nfe_numero: '',
    nfe_serie: '',
    nfe_data_emissao: '',
    nfe_chave_acesso: '',
    nfe_natureza_operacao: '',
    nfe_dados_emissor: {},
    nfe_dados_destinatario: {},
    nfe_dados_transportador: {},
    nfe_itens_conferencia: []
  };

  try {
    // Extração usando regex para elementos XML com suporte a escopo
    const getElementText = (tag, context = null) => {
      const searchContent = context || xmlContent;
      const regex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
      const match = searchContent.match(regex);
      return match ? match[1].trim() : '';
    };

    const getElementTextNS = (ns, tag, context = null) => {
      const searchContent = context || xmlContent;
      const regex = new RegExp(`<${ns}:${tag}>([^<]*)<\/${ns}:${tag}>`, 'i');
      const match = searchContent.match(regex);
      return match ? match[1].trim() : '';
    };

    // Extrair seções específicas do XML
    const extractSection = (sectionTag) => {
      const regex = new RegExp(`<${sectionTag}[^>]*>([\\s\\S]*?)<\\/${sectionTag}>`, 'i');
      const match = xmlContent.match(regex);
      return match ? match[1] : '';
    };

    // Dados da Nota Fiscal (ideNFe - Identificação)
    resultado.nfe_numero = getElementTextNS('ide', 'dNF') || getElementText('dNF') || '';
    resultado.nfe_serie = getElementTextNS('ide', 'serie') || getElementText('serie') || '';
    
    const dataEmissao = getElementTextNS('ide', 'dEmi') || getElementText('dEmi') || '';
    if (dataEmissao) {
      // Converter YYYYMMDD para YYYY-MM-DD
      resultado.nfe_data_emissao = `${dataEmissao.substring(0, 4)}-${dataEmissao.substring(4, 6)}-${dataEmissao.substring(6, 8)}`;
    }
    
    resultado.nfe_chave_acesso = getElementTextNS('ide', 'cUF') || getElementText('cUF') || '';
    resultado.nfe_natureza_operacao = getElementTextNS('ide', 'natOp') || getElementText('natOp') || '';

    // Dados do Emissor (emit)
    const emitCNPJ = getElementTextNS('emit', 'CNPJ') || getElementText('CNPJ') || '';
    resultado.nfe_dados_emissor = {
      razao_social: getElementTextNS('emit', 'xNome') || getElementText('xNome') || '',
      cnpj: emitCNPJ,
      inscricao_estadual: getElementTextNS('emit', 'IE') || getElementText('IE') || '',
      endereco: getElementTextNS('emit', 'xLgr') || getElementText('xLgr') || '',
      numero: getElementTextNS('emit', 'nro') || getElementText('nro') || '',
      complemento: getElementTextNS('emit', 'xCpl') || getElementText('xCpl') || '',
      bairro: getElementTextNS('emit', 'xBairro') || getElementText('xBairro') || '',
      cidade: getElementTextNS('emit', 'xMun') || getElementText('xMun') || '',
      estado: getElementTextNS('emit', 'UF') || getElementText('UF') || '',
      cep: getElementTextNS('emit', 'CEP') || getElementText('CEP') || ''
    };

    // Dados do Destinatário (dest)
    resultado.nfe_dados_destinatario = {
      razao_social: getElementTextNS('dest', 'xNome') || getElementText('xNome') || '',
      cnpj: getElementTextNS('dest', 'CNPJ') || getElementText('CNPJ') || '',
      inscricao_estadual: getElementTextNS('dest', 'IE') || getElementText('IE') || '',
      endereco: getElementTextNS('dest', 'xLgr') || getElementText('xLgr') || '',
      numero: getElementTextNS('dest', 'nro') || getElementText('nro') || '',
      complemento: getElementTextNS('dest', 'xCpl') || getElementText('xCpl') || '',
      bairro: getElementTextNS('dest', 'xBairro') || getElementText('xBairro') || '',
      cidade: getElementTextNS('dest', 'xMun') || getElementText('xMun') || '',
      estado: getElementTextNS('dest', 'UF') || getElementText('UF') || '',
      cep: getElementTextNS('dest', 'CEP') || getElementText('CEP') || ''
    };

    // Dados do Transportador (transp)
    const transpCNPJ = getElementTextNS('transp', 'CNPJ') || getElementText('CNPJ') || '';
    resultado.nfe_dados_transportador = {
      razao_social: getElementTextNS('transp', 'xNome') || getElementText('xNome') || '',
      cnpj: transpCNPJ,
      endereco: getElementTextNS('transp', 'xEnder') || getElementText('xEnder') || '',
      valor_frete: parseFloat(getElementTextNS('transp', 'vFrete') || getElementText('vFrete') || '0'),
      tipo_frete: getElementTextNS('transp', 'modFrete') || getElementText('modFrete') || '',
      quantidade_volumes: parseInt(getElementTextNS('transp', 'qVol') || getElementText('qVol') || '0'),
      especie_volume: getElementTextNS('transp', 'esp') || getElementText('esp') || '',
      peso_bruto: parseFloat(getElementTextNS('transp', 'pesoG') || getElementText('pesoG') || '0'),
      peso_liquido: parseFloat(getElementTextNS('transp', 'pesoL') || getElementText('pesoL') || '0')
    };

    // Itens (det)
    const detMatches = xmlContent.match(/<det[^>]*>[\s\S]*?<\/det>/gi) || [];
    
    detMatches.forEach((detElement, index) => {
      const codigo = extrairValorRegex(detElement, 'cProd');
      const descricao = extrairValorRegex(detElement, 'xProd');
      const quantidadeStr = extrairValorRegex(detElement, 'qCom');
      const unidade = extrairValorRegex(detElement, 'uCom');

      if (codigo && descricao) {
        resultado.nfe_itens_conferencia.push({
          codigo: codigo.trim(),
          descricao: descricao.trim(),
          quantidade_esperada: parseFloat(quantidadeStr || '0'),
          quantidade_recebida: 0,
          unidade: unidade.trim() || 'UN',
          status_conferencia: 'pendente',
          endereco_armazenagem: ''
        });
      }
    });

    return resultado;
  } catch (error) {
    throw new Error(`Erro ao fazer parse do XML: ${error.message}`);
  }
}

function extrairValorRegex(conteudo, tag) {
  const regex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
  const match = conteudo.match(regex);
  return match ? match[1] : '';
}