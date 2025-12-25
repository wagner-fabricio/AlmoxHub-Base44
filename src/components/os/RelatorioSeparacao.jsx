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

  return (
    <div id="relatorio-separacao" className="bg-white p-8 text-black" style={{ width: '210mm', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-2 border-black p-4 mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">LISTA DE SEPARAÇÃO DE MATERIAIS</h1>
        <div className="flex justify-between text-sm">
          <div>OS: <span className="font-bold">{os.codigo}</span></div>
          <div>Categoria: <span className="font-bold">{categoria?.nome}</span></div>
        </div>
      </div>

      {/* Dados Gerais */}
      <div className="mb-6">
        <h2 className="text-lg font-bold bg-gray-200 border-2 border-black p-2 mb-2">DADOS GERAIS</h2>
        <div className="border border-black">
          <div className="grid grid-cols-2 border-b border-black">
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Regional:</span> {getFieldValue(regional?.sigla)}
            </div>
            <div className="p-1 flex items-center">
              <span className="font-semibold">Almoxarifado:</span> {getFieldValue(almoxarifado?.nome)}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-black">
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Líder:</span> {getFieldValue(lider?.nome)}
            </div>
            <div className="p-1 flex items-center">
              <span className="font-semibold">Atendente:</span> {getFieldValue(os.atendente_nome)}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-black">
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Prazo:</span> {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '_______________________'}
            </div>
            <div className="p-1 flex items-center">
              <span className="font-semibold">Prioridade:</span> {getFieldValue(os.prioridade?.toUpperCase())}
            </div>
          </div>
          <div className="p-1 flex items-center">
            <span className="font-semibold">Descrição:</span> {getFieldValue(os.descricao_resumida)}
          </div>
        </div>
      </div>

      {/* Documento */}
      <div className="mb-6">
        <h2 className="text-lg font-bold bg-gray-200 border-2 border-black p-2 mb-2">DOCUMENTO</h2>
        <div className="border border-black">
          <div className="grid grid-cols-3 border-b border-black">
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Nº Reserva:</span> {getFieldValue(os.num_reserva)}
            </div>
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Data Reserva:</span> {os.data_reserva ? format(new Date(os.data_reserva), 'dd/MM/yyyy') : '_____________'}
            </div>
            <div className="p-1 flex items-center">
              <span className="font-semibold">Usuário:</span> {getFieldValue(os.usuario_reserva)}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-black">
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Órgão:</span> {getFieldValue(os.orgao)}
            </div>
            <div className="p-1 border-r border-black flex items-center">
              <span className="font-semibold">Data MIGO:</span> {os.data_migo ? format(new Date(os.data_migo), 'dd/MM/yyyy') : '_____________'}
            </div>
            <div className="p-1 flex items-center">
              <span className="font-semibold">Nº MIGO:</span> {getFieldValue(os.num_migo)}
            </div>
          </div>
        </div>
      </div>

      {/* Materiais */}
      <div className="mb-6">
        <h2 className="text-lg font-bold bg-gray-200 border-2 border-black p-2 mb-2">MATERIAIS</h2>
        <div className="border border-black">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="p-1 border-r border-black text-left font-bold align-middle">Código</th>
                <th className="p-1 border-r border-black text-left font-bold align-middle">Descrição</th>
                <th className="p-1 border-r border-black text-center font-bold align-middle">Qtd</th>
                <th className="p-1 border-r border-black text-center font-bold align-middle">Dep.</th>
                <th className="p-1 text-center font-bold align-middle">Localização</th>
              </tr>
            </thead>
            <tbody>
              {os.itens_documento?.length > 0 ? (
                os.itens_documento.map((item, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1 border-r border-black font-mono align-middle">{item.codigo || '___________'}</td>
                    <td className="p-1 border-r border-black align-middle">{item.descricao || '______________________________'}</td>
                    <td className="p-1 border-r border-black text-center align-middle">{item.quantidade ? `${item.quantidade} ${item.unidade}` : '_____'}</td>
                    <td className="p-1 border-r border-black text-center align-middle">{item.deposito || '_____'}</td>
                    <td className="p-1 text-center align-middle">{item.endereco || '___________'}</td>
                  </tr>
                ))
              ) : (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1 border-r border-black align-middle">___________</td>
                    <td className="p-1 border-r border-black align-middle">______________________________</td>
                    <td className="p-1 border-r border-black text-center align-middle">_____</td>
                    <td className="p-1 border-r border-black text-center align-middle">_____</td>
                    <td className="p-1 text-center align-middle">___________</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volumes */}
      <div className="mb-6">
        <h2 className="text-lg font-bold bg-gray-200 border-2 border-black p-2 mb-2">VOLUMES</h2>
        <div className="border border-black">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="p-1 border-r border-black text-center font-bold align-middle">ID Volume</th>
                <th className="p-1 border-r border-black text-center font-bold align-middle">Largura (m)</th>
                <th className="p-1 border-r border-black text-center font-bold align-middle">Altura (m)</th>
                <th className="p-1 border-r border-black text-center font-bold align-middle">Comp. (m)</th>
                <th className="p-1 border-r border-black text-center font-bold align-middle">Peso (kg)</th>
                <th className="p-1 text-center font-bold align-middle">m³</th>
              </tr>
            </thead>
            <tbody>
              {os.volumes?.length > 0 ? (
                os.volumes.map((vol, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1 border-r border-black text-center align-middle">{vol.id_volume || '______'}</td>
                    <td className="p-1 border-r border-black text-center align-middle">{vol.largura || '______'}</td>
                    <td className="p-1 border-r border-black text-center align-middle">{vol.altura || '______'}</td>
                    <td className="p-1 border-r border-black text-center align-middle">{vol.comprimento || '______'}</td>
                    <td className="p-1 border-r border-black text-center align-middle">{vol.peso_bruto || '______'}</td>
                    <td className="p-1 text-center align-middle">{vol.m3 || '______'}</td>
                  </tr>
                ))
              ) : (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="p-1 border-r border-black text-center align-middle">______</td>
                    <td className="p-1 border-r border-black text-center align-middle">______</td>
                    <td className="p-1 border-r border-black text-center align-middle">______</td>
                    <td className="p-1 border-r border-black text-center align-middle">______</td>
                    <td className="p-1 border-r border-black text-center align-middle">______</td>
                    <td className="p-1 text-center align-middle">______</td>
                  </tr>
                ))
              )}
              <tr className="bg-gray-100 font-bold border-t-2 border-black">
                <td className="p-1 border-r border-black text-right align-middle" colSpan="4">TOTAIS:</td>
                <td className="p-1 border-r border-black text-center align-middle">{totalPeso.toFixed(2)} kg</td>
                <td className="p-1 text-center align-middle">{totalM3.toFixed(3)} m³</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Assinaturas */}
      <div className="mb-6">
        <h2 className="text-lg font-bold bg-gray-200 border-2 border-black p-2 mb-2">CONTROLE</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-black p-4">
            <p className="font-semibold mb-2">Responsável pela Separação:</p>
            <div className="border-b border-black mt-12 mb-2"></div>
            <p className="text-xs text-center">Assinatura / Data</p>
          </div>
          <div className="border border-black p-4">
            <p className="font-semibold mb-2">Conferência:</p>
            <div className="border-b border-black mt-12 mb-2"></div>
            <p className="text-xs text-center">Assinatura / Data</p>
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