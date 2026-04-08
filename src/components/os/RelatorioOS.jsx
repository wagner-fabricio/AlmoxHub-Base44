import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const parseDate = (d) => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T12:00:00');
  return new Date(d);
};

const fmtDate = (d) => {
  const parsed = parseDate(d);
  return parsed ? format(parsed, 'dd/MM/yyyy', { locale: ptBR }) : '-';
};

const prioridadeLabels = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
const statusLabels = { elaboracao: 'Em Elaboração', execucao: 'Em Execução', concluido: 'Concluído', cancelado: 'Cancelado' };
const complexidadeLabels = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const vinculacaoLabels = { custeio: 'Custeio', investimento: 'Investimento' };

const getPrioridadeColor = (prioridade) => {
  switch (prioridade) {
    case 'urgente': return '#DC2626';
    case 'alta': return '#F59E0B';
    case 'media': return '#3B82F6';
    default: return '#6B7280';
  }
};

function InfoRow({ label, value, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <span style={{ fontWeight: 700, fontSize: '10px', color: '#374151' }}>{label}: </span>
      <span style={{ fontSize: '10px', color: '#111827' }}>{value || '-'}</span>
    </div>
  );
}

function Section({ title, color = '#1e40af', children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        backgroundColor: color,
        color: 'white',
        padding: '4px 10px',
        fontWeight: 700,
        fontSize: '11px',
        borderRadius: '2px 2px 0 0',
      }}>
        {title}
      </div>
      <div style={{
        border: `1px solid ${color}`,
        borderTop: 'none',
        padding: '8px 10px',
        backgroundColor: '#f9fafb',
        borderRadius: '0 0 2px 2px',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function RelatorioOS({
  os, regional, almoxarifado, lider, categoria, subcategorias,
  executores, projetos, instalacoes, rotulos, currentUser
}) {
  if (!os) return null;

  const prioridadeColor = getPrioridadeColor(os.prioridade);
  const subcatsNomes = (subcategorias || [])
    .filter(s => (os.subcategorias_ids || []).includes(s.id))
    .map(s => s.nome)
    .join(', ');
  const executoresNomes = (executores || [])
    .filter(p => (os.executores_ids || []).includes(p.id))
    .map(p => p.nome)
    .join(', ');
  const projetosNomes = (projetos || [])
    .filter(p => (os.projetos_ids || []).includes(p.id))
    .map(p => p.nome)
    .join(', ');
  const rotulosNomes = (rotulos || [])
    .filter(r => (os.rotulos_ids || []).includes(r.id))
    .map(r => r.nome)
    .join(', ');
  const instalacaoOrigem = (instalacoes || []).find(i => i.id === os.instalacao_origem_id);
  const instalacaoDestino = (instalacoes || []).find(i => i.id === os.instalacao_destino_id);

  return (
    <div
      id="relatorio-os"
      style={{
        width: '210mm',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'white',
        padding: '20mm 16mm',
        color: '#111827',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ border: `2px solid ${prioridadeColor}`, marginBottom: '16px' }}>
        <div style={{ backgroundColor: prioridadeColor, padding: '8px 12px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'white', textAlign: 'center', margin: 0 }}>
            ORDEM DE SERVIÇO — DADOS GERAIS
          </h1>
        </div>
        <div style={{
          padding: '10px 12px',
          backgroundColor: '#f8fafc',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '8px',
          textAlign: 'center',
          borderTop: `2px solid ${prioridadeColor}`,
        }}>
          <div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px' }}>CÓDIGO OS</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{os.codigo || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px' }}>STATUS</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: prioridadeColor }}>{statusLabels[os.status] || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px' }}>PRIORIDADE</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: prioridadeColor }}>{prioridadeLabels[os.prioridade] || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '2px' }}>PROGRESSO</div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{os.progresso || 0}%</div>
          </div>
        </div>
      </div>

      {/* Classificação */}
      <Section title="CLASSIFICAÇÃO" color="#1e40af">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <InfoRow label="Categoria" value={categoria?.nome} />
          <InfoRow label="Subcategoria(s)" value={subcatsNomes} />
          <InfoRow label="Complexidade" value={complexidadeLabels[os.complexidade]} />
          {projetosNomes && <InfoRow label="Projetos/Tags" value={projetosNomes} fullWidth />}
          {rotulosNomes && <InfoRow label="Rótulos" value={rotulosNomes} fullWidth />}
        </div>
      </Section>

      {/* Localização */}
      <Section title="LOCALIZAÇÃO" color="#065f46">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <InfoRow label="Regional" value={regional ? `${regional.sigla} — ${regional.descricao}` : null} />
          <InfoRow label="Almoxarifado" value={almoxarifado?.nome} />
          {instalacaoOrigem && <InfoRow label="Instalação Origem" value={instalacaoOrigem.nome} />}
          {instalacaoDestino && <InfoRow label="Instalação Destino" value={instalacaoDestino.nome} />}
        </div>
      </Section>

      {/* Responsáveis */}
      <Section title="RESPONSÁVEIS" color="#7c3aed">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <InfoRow label="Líder" value={lider?.nome} />
          <InfoRow label="Atendente" value={os.atendente_nome} />
          {executoresNomes && <InfoRow label="Executores" value={executoresNomes} fullWidth />}
        </div>
      </Section>

      {/* Prazos e Datas */}
      <Section title="PRAZOS E DATAS" color="#b45309">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <InfoRow label="Data Inicial" value={fmtDate(os.data_inicial)} />
          <InfoRow label="Prazo" value={fmtDate(os.prazo)} />
          <InfoRow label="Data de Conclusão" value={fmtDate(os.data_conclusao)} />
          {os.data_reserva && <InfoRow label="Data Reserva" value={fmtDate(os.data_reserva)} />}
          {os.data_necessidade && <InfoRow label="Data Necessidade" value={fmtDate(os.data_necessidade)} />}
          {os.data_entrega && <InfoRow label="Data Entrega" value={fmtDate(os.data_entrega)} />}
        </div>
      </Section>

      {/* Documento (se houver dados) */}
      {(os.num_reserva || os.num_migo || os.orgao || os.usuario_reserva || os.vinculacao) && (
        <Section title="DOCUMENTO" color="#0369a1">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {os.num_reserva && <InfoRow label="Nº Reserva" value={os.num_reserva} />}
            {os.data_reserva && <InfoRow label="Data Reserva" value={fmtDate(os.data_reserva)} />}
            {os.num_migo && <InfoRow label="Nº MIGO" value={os.num_migo} />}
            {os.data_migo && <InfoRow label="Data MIGO" value={fmtDate(os.data_migo)} />}
            {os.usuario_reserva && <InfoRow label="Nome Usuário" value={os.usuario_reserva} />}
            {os.orgao && <InfoRow label="Órgão" value={os.orgao} />}
            {os.vinculacao && <InfoRow label="Vinculação" value={vinculacaoLabels[os.vinculacao]} />}
          </div>
        </Section>
      )}

      {/* Descrição e Anotações */}
      {(os.descricao_resumida || os.anotacoes) && (
        <Section title="DESCRIÇÃO E ANOTAÇÕES" color="#374151">
          {os.descricao_resumida && (
            <div style={{ marginBottom: os.anotacoes ? '8px' : 0 }}>
              <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '3px' }}>Descrição Resumida:</div>
              <div style={{ fontSize: '10px', lineHeight: 1.5, color: '#374151' }}>{os.descricao_resumida}</div>
            </div>
          )}
          {os.anotacoes && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '3px' }}>Anotações:</div>
              <div style={{ fontSize: '10px', lineHeight: 1.5, color: '#374151', whiteSpace: 'pre-wrap' }}>{os.anotacoes}</div>
            </div>
          )}
        </Section>
      )}

      {/* Assinatura */}
      <div style={{ border: '2px solid #374151', marginTop: '16px', borderRadius: '2px' }}>
        <div style={{ backgroundColor: '#374151', color: 'white', padding: '4px 10px', fontWeight: 700, fontSize: '11px' }}>
          ✍️ CONTROLE DE VALIDAÇÃO
        </div>
        <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '4px' }}>Responsável pela OS</div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Nome: {lider?.nome || '_______________________'}</div>
            <div style={{ borderBottom: '2px solid #9ca3af', marginTop: '20px', marginBottom: '3px' }}></div>
            <div style={{ fontSize: '9px', textAlign: 'center', color: '#6b7280' }}>Assinatura</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '4px' }}>Conferente / Aprovador</div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Nome: _______________________</div>
            <div style={{ borderBottom: '2px solid #9ca3af', marginTop: '20px', marginBottom: '3px' }}></div>
            <div style={{ fontSize: '9px', textAlign: 'center', color: '#6b7280' }}>Assinatura</div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ borderTop: '2px solid #111827', paddingTop: '6px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6b7280' }}>
        <div><strong>Gerado por:</strong> {currentUser?.full_name || 'Sistema'}</div>
        <div><strong>Data/Hora:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
        <div><strong>Página:</strong> 1 de 1</div>
      </div>
    </div>
  );
}