import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const parseDate = (d) => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T12:00:00');
  return new Date(d);
};

const fmtDate = (d) => {
  const date = parseDate(d);
  return date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '—';
};

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium text-slate-900 dark:text-white break-words">
      {value || <span className="text-slate-400 dark:text-slate-500">—</span>}
    </p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
      <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {children}
    </div>
  </div>
);

export default function OSDocumentoView({ os, instalacoes }) {
  if (!os) return null;

  const vinculacaoLabel = {
    custeio: 'Custeio',
    investimento: 'Investimento'
  }[os.vinculacao] || os.vinculacao;

  const origem = Array.isArray(instalacoes) ? instalacoes.find(i => i?.id === os.instalacao_origem_id) : null;
  const destino = Array.isArray(instalacoes) ? instalacoes.find(i => i?.id === os.instalacao_destino_id) : null;

  return (
    <div className="space-y-6">
      <Section title="Dados da Reserva">
        <Field label="Número da Reserva" value={os.num_reserva} />
        <Field label="Data Criação" value={fmtDate(os.data_reserva)} />
        <Field label="Vinculação" value={vinculacaoLabel} />
      </Section>

      <Section title="Dados do Usuário">
        <Field label="Nome Usuário" value={os.usuario_reserva} />
        <Field label="Email Usuário" value={os.usuario_reserva_email} />
        <Field label="Área do Usuário" value={os.orgao} />
      </Section>

      <Section title="Dados de Baixa do Estoque">
        <Field label="Número MIGO" value={os.num_migo} />
        <Field label="Data MIGO" value={fmtDate(os.data_migo)} />
        <Field label="Tipo Movimento" value={os.tipo_movimento} />
      </Section>

      <Section title="Origem e Destino">
        <Field label="Instalação Origem" value={origem?.nome} />
        <Field label="Instalação Destino" value={destino?.nome} />
        <Field label="Local Entrega" value={os.local_entrega} />
      </Section>

      <Section title="Datas Complementares">
        <Field label="Data Ressuprimento" value={fmtDate(os.data_ressuprimento)} />
        <Field label="Data Aprovação EPI" value={fmtDate(os.data_aprovacao_epi)} />
        <Field label="Observações Adicionais" value={os.observacoes_adicionais} />
      </Section>
    </div>
  );
}