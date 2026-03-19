import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todas as ordens com problema_recebimento === true
    const ordens = await base44.entities.OrdemServico.filter({ problema_recebimento: true });

    // Buscar categorias e regionais para referência
    const categorias = await base44.entities.Categoria.list();
    const regionais = await base44.entities.Regional.list();
    const pessoas = await base44.entities.Pessoa.list();

    // Criar mapa para lookups rápidos
    const categoriasMap = {};
    const regionaisMap = {};
    const pessoasMap = {};

    categorias.forEach(c => categoriasMap[c.id] = c.nome);
    regionais.forEach(r => regionaisMap[r.id] = r.sigla);
    pessoas.forEach(p => pessoasMap[p.id] = p.nome);

    // Gerar CSV
    const headers = ['Código', 'Status', 'Categoria', 'Regional', 'Líder', 'Data Recebimento', 'Problemas Marcados', 'Resumo Pendências'];
    const rows = ordens.map(os => [
      os.codigo || '',
      os.status || '',
      categoriasMap[os.categoria_id] || '',
      regionaisMap[os.regional_id] || '',
      pessoasMap[os.lider_id] || '',
      os.data_recebimento || '',
      os.problemas_recebimento_ids?.length || 0,
      os.resumo_pendencias || ''
    ]);

    // Escapar valores com aspas e vírgulas
    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="problemas_recebimento.csv"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});