import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatorioSeparacao({ os, regional, almoxarifado, lider, categoria, subcategorias, currentUser }) {
  const getFieldValue = (value) => {
    return value || '_______________________';
  };

  const totalVolumes = os.volumes?.reduce((sum, v) => sum + 1, 0) || 0;
  const totalPeso = os.volumes?.reduce((sum, v) => sum + (v.peso_bruto || 0), 0) || 0;
  const totalM3 = os.volumes?.reduce((sum, v) => sum + (v.m3 || 0), 0) || 0;

  const getPrioridadeColor = () => {
    switch(os.prioridade) {
      case 'urgente': return '#DC2626';
      case 'alta': return '#F59E0B';
      case 'media': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <div id="relatorio-separacao" className="bg-white p-8 text-black" style={{ width: '210mm', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Header Destacado */}
      <div className="border-2 mb-6" style={{ borderColor: getPrioridadeColor() }}>
        <div className="p-3" style={{ backgroundColor: getPrioridadeColor() }}>
          <h1 className="text-2xl font-bold text-center text-white">LISTA DE SEPARAÇÃO DE MATERIAIS</h1>
        </div>
        <div className="p-4 bg-gray-50 border-t-2" style={{ borderColor: getPrioridadeColor() }}>
          <div className="grid gap-4 text-center" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
            <div>
              <div className="text-xs text-gray-600 mb-1">ORDEM DE SERVIÇO</div>
              <div className="text-xl font-bold">{os.codigo}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">PRAZO</div>
              <div className="text-xl font-bold" style={{ color: getPrioridadeColor() }}>
                {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">PRIORIDADE</div>
              <div className="text-xl font-bold" style={{ color: getPrioridadeColor() }}>
                {os.prioridade?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dados Gerais - Compacto */}
      <div className="mb-4">
        <div className="bg-gray-200 px-3 py-1 font-semibold text-sm border border-gray-400">INFORMAÇÕES GERAIS</div>
        <div className="border border-gray-300 p-2 text-xs grid grid-cols-4 gap-2 bg-gray-50">
          <div><span className="font-semibold">Regional:</span> {regional?.sigla || '-'}</div>
          <div><span className="font-semibold">Almoxarifado:</span> {almoxarifado?.nome || '-'}</div>
          <div><span className="font-semibold">Líder:</span> {lider?.nome || '-'}</div>
          <div><span className="font-semibold">Atendente:</span> {os.atendente_nome || '-'}</div>
        </div>
        {os.descricao_resumida && (
          <div className="border border-gray-300 border-t-0 p-2 text-xs bg-white">
            <span className="font-semibold">Observações:</span> {os.descricao_resumida}
          </div>
        )}
      </div>

      {/* Documento - Apenas se tiver dados */}
      {(os.num_reserva || os.num_migo || os.orgao || os.usuario_reserva) && (
        <div className="mb-4">
          <div className="bg-gray-200 px-3 py-1 font-semibold text-sm border border-gray-400">DOCUMENTO</div>
          <div className="border border-gray-300 p-2 text-xs grid grid-cols-4 gap-2 bg-gray-50">
            {os.num_reserva && <div><span className="font-semibold">Reserva:</span> {os.num_reserva}</div>}
            {os.num_migo && <div><span className="font-semibold">MIGO:</span> {os.num_migo}</div>}
            {os.usuario_reserva && <div><span className="font-semibold">Usuário:</span> {os.usuario_reserva}</div>}
            {os.orgao && <div><span className="font-semibold">Órgão:</span> {os.orgao}</div>}
          </div>
        </div>
      )}

      {/* Materiais - Seção Principal com Destaque */}
      <div className="mb-6">
        <div className="bg-blue-600 text-white px-3 py-2 font-bold text-base border-2 border-blue-600">
          📦 MATERIAIS PARA SEPARAÇÃO
        </div>
        <div className="border-2 border-blue-600">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50 border-b-2 border-blue-600">
                <th className="p-2 border-r border-gray-300 text-center font-bold text-sm" style={{ width: '5%' }}>✓</th>
                <th className="p-2 border-r border-gray-300 text-left font-bold text-sm" style={{ width: '15%' }}>Código</th>
                <th className="p-2 border-r border-gray-300 text-left font-bold text-sm" style={{ width: '30%' }}>Descrição</th>
                <th className="p-2 border-r border-gray-300 text-center font-bold text-sm" style={{ width: '10%' }}>Qtd</th>
                <th className="p-2 border-r border-gray-300 text-center font-bold text-sm" style={{ width: '15%' }}>Saldo Após Separação</th>
                <th className="p-2 text-center font-bold text-sm" style={{ width: '25%' }}>Localização</th>
              </tr>
            </thead>
            <tbody>
              {os.itens_documento?.length > 0 ? (
                os.itens_documento.map((item, i) => (
                  <tr key={i} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="p-2 border-r border-gray-300 text-center align-middle">
                      <div className="w-5 h-5 border-2 border-gray-400 mx-auto"></div>
                    </td>
                    <td className="p-2 border-r border-gray-300 font-mono font-bold text-sm align-middle">{item.codigo || '___________'}</td>
                    <td className="p-2 border-r border-gray-300 text-sm align-middle">{item.descricao || '______________________________'}</td>
                    <td className="p-2 border-r border-gray-300 text-center font-bold text-sm align-middle">{item.quantidade ? `${item.quantidade} ${item.unidade}` : '_____'}</td>
                    <td className="p-2 border-r border-gray-300 text-center font-bold text-base align-middle" style={{ backgroundColor: '#FEF3C7' }}>_____</td>
                    <td className="p-2 text-center font-bold text-base align-middle" style={{ backgroundColor: '#DBEAFE' }}>{item.endereco || '___________'}</td>
                  </tr>
                ))
              ) : (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="p-2 border-r border-gray-300 text-center align-middle">
                      <div className="w-5 h-5 border-2 border-gray-400 mx-auto"></div>
                    </td>
                    <td className="p-2 border-r border-gray-300 align-middle">___________</td>
                    <td className="p-2 border-r border-gray-300 align-middle">______________________________</td>
                    <td className="p-2 border-r border-gray-300 text-center align-middle">_____</td>
                    <td className="p-2 border-r border-gray-300 text-center align-middle" style={{ backgroundColor: '#FEF3C7' }}>_____</td>
                    <td className="p-2 text-center align-middle" style={{ backgroundColor: '#DBEAFE' }}>___________</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volumes - Tabela para Preenchimento Manual */}
      <div className="mb-4">
        <div className="bg-gray-200 px-3 py-1 font-semibold text-sm border border-gray-400">RESUMO DE VOLUMES</div>
        <div className="border border-gray-300">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 text-center font-semibold text-xs">Qtd</th>
                <th className="p-2 border-r border-gray-300 text-center font-semibold text-xs">Comprimento (cm)</th>
                <th className="p-2 border-r border-gray-300 text-center font-semibold text-xs">Largura (cm)</th>
                <th className="p-2 border-r border-gray-300 text-center font-semibold text-xs">Altura (cm)</th>
                <th className="p-2 text-center font-semibold text-xs">Peso (kg)</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300 text-center">_____</td>
                  <td className="p-2 border-r border-gray-300 text-center">_____</td>
                  <td className="p-2 border-r border-gray-300 text-center">_____</td>
                  <td className="p-2 border-r border-gray-300 text-center">_____</td>
                  <td className="p-2 text-center">_____</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controle de Separação - Compacto */}
      <div className="mb-4 border-2 border-gray-400">
        <div className="bg-gray-200 px-3 py-1 font-bold text-sm border-b-2 border-gray-400">
          ✍️ CONTROLE DE SEPARAÇÃO
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Início da Separação */}
            <div>
              <div className="font-semibold mb-2 text-xs">⏰ INÍCIO DA SEPARAÇÃO</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-gray-600">Data:</label>
                  <div className="border-b-2 border-gray-400 mt-1 h-5"></div>
                </div>
                <div>
                  <label className="text-gray-600">Horário:</label>
                  <div className="border-b-2 border-gray-400 mt-1 h-5"></div>
                </div>
              </div>
            </div>
            
            {/* Fim da Separação */}
            <div>
              <div className="font-semibold mb-2 text-xs">⏱️ FIM DA SEPARAÇÃO</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-gray-600">Data:</label>
                  <div className="border-b-2 border-gray-400 mt-1 h-5"></div>
                </div>
                <div>
                  <label className="text-gray-600">Horário:</label>
                  <div className="border-b-2 border-gray-400 mt-1 h-5"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold mb-1 text-xs">Responsável pela Separação</div>
              <div className="text-xs text-gray-600 mb-1">Nome: {os.responsavel_separacao || '_______________________'}</div>
              <div className="border-b-2 border-gray-400 mt-4 mb-1"></div>
              <div className="text-xs text-center text-gray-600">Assinatura</div>
            </div>
            
            <div>
              <div className="font-semibold mb-1 text-xs">Conferente</div>
              <div className="text-xs text-gray-600 mb-1">Nome: _______________________</div>
              <div className="border-b-2 border-gray-400 mt-4 mb-1"></div>
              <div className="text-xs text-center text-gray-600">Assinatura</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black pt-2 mt-8 text-xs text-gray-600">
        <div className="flex justify-between">
          <div>
            <strong>Gerado por:</strong> {currentUser?.full_name || 'Sistema'}
          </div>
          <div>
            <strong>Data/Hora:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
          <div>
            <strong>Página:</strong> 1 de 1
          </div>
        </div>
      </div>
    </div>
  );
}