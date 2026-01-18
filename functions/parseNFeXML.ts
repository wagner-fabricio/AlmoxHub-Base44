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
    resultado.nfe_numero = getElementTextNS('ide', 'nNF') || getElementText('nNF') || '';
    resultado.nfe_serie = getElementTextNS('ide', 'serie') || getElementText('serie') || '';

    const dataEmissao = getElementTextNS('ide', 'dhEmi') || getElementTextNS('ide', 'dEmi') || getElementText('dhEmi') || getElementText('dEmi') || '';
    if (dataEmissao) {
      // Converter YYYY-MM-DDTHH:MM:SS ou YYYYMMDD para YYYY-MM-DD
      if (dataEmissao.includes('T')) {
        resultado.nfe_data_emissao = dataEmissao.substring(0, 10);
      } else {
        resultado.nfe_data_emissao = `${dataEmissao.substring(0, 4)}-${dataEmissao.substring(4, 6)}-${dataEmissao.substring(6, 8)}`;
      }
    }
    
    resultado.nfe_chave_acesso = getElementTextNS('ide', 'cUF') || getElementText('cUF') || '';
    resultado.nfe_natureza_operacao = getElementTextNS('ide', 'natOp') || getElementText('natOp') || '';

    // Dados do Emissor (emit)
    const emitSection = extractSection('emit');
    const emitCNPJ = getElementTextNS('emit', 'CNPJ', emitSection) || getElementText('CNPJ', emitSection) || '';
    resultado.nfe_dados_emissor = {
      razao_social: getElementTextNS('emit', 'xNome', emitSection) || getElementText('xNome', emitSection) || '',
      cnpj: emitCNPJ,
      inscricao_estadual: getElementTextNS('emit', 'IE', emitSection) || getElementText('IE', emitSection) || '',
      endereco: getElementTextNS('emit', 'xLgr', emitSection) || getElementText('xLgr', emitSection) || '',
      numero: getElementTextNS('emit', 'nro', emitSection) || getElementText('nro', emitSection) || '',
      complemento: getElementTextNS('emit', 'xCpl', emitSection) || getElementText('xCpl', emitSection) || '',
      bairro: getElementTextNS('emit', 'xBairro', emitSection) || getElementText('xBairro', emitSection) || '',
      cidade: getElementTextNS('emit', 'xMun', emitSection) || getElementText('xMun', emitSection) || '',
      estado: getElementTextNS('emit', 'UF', emitSection) || getElementText('UF', emitSection) || '',
      cep: getElementTextNS('emit', 'CEP', emitSection) || getElementText('CEP', emitSection) || ''
    };

    // Dados do Destinatário (dest)
    const destSection = extractSection('dest');
    resultado.nfe_dados_destinatario = {
      razao_social: getElementTextNS('dest', 'xNome', destSection) || getElementText('xNome', destSection) || '',
      cnpj: getElementTextNS('dest', 'CNPJ', destSection) || getElementText('CNPJ', destSection) || '',
      inscricao_estadual: getElementTextNS('dest', 'IE', destSection) || getElementText('IE', destSection) || '',
      endereco: getElementTextNS('dest', 'xLgr', destSection) || getElementText('xLgr', destSection) || '',
      numero: getElementTextNS('dest', 'nro', destSection) || getElementText('nro', destSection) || '',
      complemento: getElementTextNS('dest', 'xCpl', destSection) || getElementText('xCpl', destSection) || '',
      bairro: getElementTextNS('dest', 'xBairro', destSection) || getElementText('xBairro', destSection) || '',
      cidade: getElementTextNS('dest', 'xMun', destSection) || getElementText('xMun', destSection) || '',
      estado: getElementTextNS('dest', 'UF', destSection) || getElementText('UF', destSection) || '',
      cep: getElementTextNS('dest', 'CEP', destSection) || getElementText('CEP', destSection) || ''
    };

    // Dados do Transportador (transp)
    const transpSection = extractSection('transp');
    const tranpCNPJ = getElementTextNS('transp', 'CNPJ', transpSection) || getElementText('CNPJ', transpSection) || '';
    resultado.nfe_dados_transportador = {
      razao_social: getElementTextNS('transp', 'xNome', transpSection) || getElementText('xNome', transpSection) || '',
      cnpj: tranpCNPJ,
      inscricao_estadual: getElementTextNS('transp', 'IE', transpSection) || getElementText('IE', transpSection) || '',
      endereco: getElementTextNS('transp', 'xEnder', transpSection) || getElementText('xEnder', transpSection) || '',
      valor_frete: parseFloat(getElementTextNS('transp', 'vFrete', transpSection) || getElementText('vFrete', transpSection) || '0'),
      tipo_frete: getElementTextNS('transp', 'modFrete', transpSection) || getElementText('modFrete', transpSection) || '',
      quantidade_volumes: parseInt(getElementTextNS('transp', 'qVol', transpSection) || getElementText('qVol', transpSection) || '0'),
      especie_volume: getElementTextNS('transp', 'esp', transpSection) || getElementText('esp', transpSection) || '',
      peso_bruto: parseFloat(getElementTextNS('transp', 'pesoG', transpSection) || getElementText('pesoG', transpSection) || '0'),
      peso_liquido: parseFloat(getElementTextNS('transp', 'pesoL', transpSection) || getElementText('pesoL', transpSection) || '0')
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