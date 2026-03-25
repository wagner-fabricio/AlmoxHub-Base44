import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

// Conteúdo de ajuda por aba — dados estáticos, sem impacto de performance
const HELP_CONTENT = {
  geral: {
    title: 'Dados Gerais',
    intro: 'A aba de Dados Gerais concentra as informações principais da OS: classificação, responsáveis e controle de prazo.',
    sections: [
      {
        name: 'Classificação',
        desc: 'Define o tipo e o local da OS.',
        fields: [
          { label: 'Categoria', info: 'Tipo principal da OS (ex: Expedição, Recebimento, Manutenção). Obrigatório.' },
          { label: 'Subcategoria', info: 'Detalha o tipo dentro da categoria escolhida. Obrigatório.' },
          { label: 'Regional', info: 'Região responsável pela OS. Filtra os almoxarifados disponíveis. Obrigatório.' },
          { label: 'Almoxarifado', info: 'Local físico onde a OS será executada. Filtra as pessoas disponíveis. Obrigatório.' },
          { label: 'Projetos / Tags', info: 'Associa a OS a um projeto cadastrado para agrupamento e relatórios.' },
          { label: 'Rótulos', info: 'Marcadores coloridos para facilitar a identificação visual da OS.' },
        ]
      },
      {
        name: 'Atribuição e Responsáveis',
        desc: 'Define quem vai executar a OS.',
        fields: [
          { label: 'OS Global', info: 'Quando ativado, permite selecionar pessoas de qualquer regional, não apenas do almoxarifado escolhido.' },
          { label: 'Equipe', info: 'Selecionar uma equipe preenche automaticamente o Líder e os Executores com os membros cadastrados.' },
          { label: 'Líder', info: 'Responsável principal pela OS. Adicionado automaticamente como executor. Obrigatório.' },
          { label: 'Atendente', info: 'Pessoa que registrou ou abriu a demanda. Campo livre (não precisa ser um usuário do sistema).' },
          { label: 'Executores', info: 'Pessoas que irão realizar as tarefas. Marcados via checkbox. Filtrado pelo almoxarifado selecionado.' },
        ]
      },
      {
        name: 'Prazos e Controle',
        desc: 'Gerencia datas, status e progresso da OS.',
        fields: [
          { label: 'Data Inicial', info: 'Quando a execução da OS começa. Usada como base para o cálculo de Tempo Previsto e Tempo Decorrido.' },
          { label: 'Prazo', info: 'Data limite para conclusão da OS. Obrigatório. Não pode ser anterior à Data Inicial.' },
          { label: 'Tempo Previsto', info: 'Calculado automaticamente: Prazo − Data Inicial = número de dias planejados para execução.' },
          { label: 'Data de Conclusão', info: 'Preenchida automaticamente ao mudar o status para "Concluído". Pode ser editada manualmente nesse status. Será limpa se o status mudar para outro valor.' },
          { label: 'Tempo Decorrido', info: 'Calculado automaticamente: Data Atual − Data Inicial (se em aberto) ou Data Conclusão − Data Inicial (se concluída). Mostra quantos dias a OS já consumiu.' },
          { label: 'Prioridade', info: 'Urgência da OS: Baixa, Média, Alta ou Urgente. Usada nos filtros e no Kanban.' },
          { label: 'Complexidade', info: 'Nível de dificuldade estimado da OS: Baixa, Média ou Alta. Auxilia no planejamento de recursos.' },
          { label: 'Status', info: 'Etapa atual da OS: Em Elaboração → Em Execução → Concluído / Cancelado. Ao marcar "Concluído", a data de conclusão é preenchida automaticamente.' },
          { label: 'Progresso (%)', info: 'Para OS de Expedição e Recebimento, o progresso é calculado automaticamente pelo fluxo de etapas. Para demais categorias, pode ser ajustado manualmente de 0 a 100%.' },
        ]
      },
      {
        name: 'Detalhamento',
        desc: 'Informações textuais adicionais.',
        fields: [
          { label: 'Descrição Resumida', info: 'Texto breve descrevendo o objetivo da OS. Aparece nas listagens e relatórios.' },
          { label: 'Anotações', info: 'Campo livre para observações, contexto adicional ou instruções para os executores.' },
        ]
      }
    ]
  },
  documento: {
    title: 'Documento (Expedição)',
    intro: 'Reúne os dados do documento SAP que originou a expedição. Pode ser preenchido manualmente ou importado via PDF ZMMTSE (aba Anexos).',
    sections: [
      {
        name: 'Dados do Documento',
        desc: 'Informações do pedido de reserva.',
        fields: [
          { label: 'Número da Reserva', info: 'Código da reserva de material no SAP. Obrigatório.' },
          { label: 'Data da Reserva', info: 'Data em que a reserva foi criada. Ao preencher, a Data de Necessidade é sugerida automaticamente como 7 dias úteis após a reserva. Obrigatório.' },
          { label: 'Nome Usuário', info: 'Nome do solicitante da reserva. Obrigatório.' },
          { label: 'Email Usuário', info: 'Email do solicitante para contato.' },
          { label: 'Órgão', info: 'Departamento ou unidade solicitante. Obrigatório.' },
          { label: 'Número MIGO', info: 'Número do documento de saída registrado no SAP (MIGO).' },
          { label: 'Data MIGO', info: 'Data do lançamento no SAP. Obrigatório se o Número MIGO for preenchido.' },
          { label: 'Vinculação', info: 'Define se o material é de Custeio (operação) ou Investimento (projeto). Obrigatório.' },
          { label: 'Instalação Origem', info: 'Local de onde os materiais estão saindo. Filtrado pela regional. Obrigatório.' },
          { label: 'Instalação Destino', info: 'Local para onde os materiais serão enviados. Para Venda Intercompany, aceita qualquer instalação. Obrigatório.' },
        ]
      }
    ]
  },
  materiais: {
    title: 'Materiais',
    intro: 'Lista os itens de material da OS, com código SAP, quantidade, valor e localização no almoxarifado.',
    sections: [
      {
        name: 'Itens do Documento',
        desc: 'Cada linha representa um material.',
        fields: [
          { label: 'Código', info: 'Código do material no SAP.' },
          { label: 'Descrição', info: 'Nome do material.' },
          { label: 'Quantidade', info: 'Quantidade a ser separada ou atendida.' },
          { label: 'Unidade', info: 'Unidade de medida (UN, KG, M, etc.).' },
          { label: 'R$ Unit.', info: 'Valor unitário do material.' },
          { label: 'R$ Total', info: 'Calculado automaticamente: Quantidade × R$ Unitário.' },
          { label: 'Depósito / Endereço', info: 'Localização no almoxarifado para facilitar a separação (picking).' },
          { label: 'Saldo', info: 'Quantidade disponível em estoque.' },
          { label: 'Segurável', info: 'Indica se o item deve ser coberto pelo seguro de transporte.' },
          { label: 'Separado', info: 'Indica que o item já foi fisicamente separado no almoxarifado.' },
        ]
      }
    ]
  },
  volumes: {
    title: 'Volumes',
    intro: 'Descreve as embalagens físicas que serão expedidas, incluindo dimensões, peso e identificação.',
    sections: [
      {
        name: 'Volumes',
        desc: 'Cada linha representa um volume físico.',
        fields: [
          { label: 'ID Volume', info: 'Identificação do volume (ex: caixa 1, pallet 2).' },
          { label: 'Quantidade', info: 'Número de volumes idênticos.' },
          { label: 'Largura / Altura / Comprimento', info: 'Dimensões em centímetros.' },
          { label: 'Peso Bruto (kg)', info: 'Peso total do volume em quilogramas.' },
          { label: 'M³', info: 'Volume cúbico. Calculado automaticamente: (Largura × Altura × Comprimento) ÷ 1.000.000.' },
        ]
      },
      {
        name: 'Separação',
        desc: 'Rastreia o processo de separação física dos volumes.',
        fields: [
          { label: 'Responsável', info: 'Quem realizou a separação dos volumes. Obrigatório quando há volumes.' },
          { label: 'Data Início Separação', info: 'Quando o processo de separação começou. Obrigatório quando há volumes.' },
          { label: 'Separação Concluída Em', info: 'Quando a separação foi finalizada. Obrigatório quando há volumes.' },
          { label: 'Duração Separação', info: 'Calculado automaticamente: Data Conclusão − Data Início. Mostra quantos dias durou a separação.' },
        ]
      }
    ]
  },
  expedicao: {
    title: 'Expedição',
    intro: 'Registra os dados do transporte: transportadora, veículo, motorista e acompanhamento da entrega.',
    sections: [
      {
        name: 'Detalhamento de Expedição',
        desc: 'Uma OS pode ter múltiplas expedições (envios parciais).',
        fields: [
          { label: 'Modal de Transporte', info: 'Como os materiais serão transportados: Terrestre, Aéreo, Marítimo ou Misto.' },
          { label: 'Responsável Transporte', info: 'Quem é responsável pelo frete: Transportadora, Empreiteira, Portador, Axia, etc.' },
          { label: 'Transportadora', info: 'Dados da empresa de transporte: CNPJ, razão social, código SAP, valor do frete.' },
          { label: 'Veículo', info: 'Dados do veículo: placa, tipo, carroceria, tara. Pode ser frota Axia.' },
          { label: 'Motorista', info: 'Dados do condutor: CPF, nome, RG. Pode ser motorista Axia.' },
          { label: 'Usar Seguro', info: 'Ativa a cobertura de seguro para este envio.' },
          { label: 'Aproveitando Carona', info: 'Indica que este envio está aproveitando um veículo de outro carregamento.' },
        ]
      },
      {
        name: 'Acompanhamento de Entrega',
        desc: 'Controla os prazos e confirma a entrega.',
        fields: [
          { label: 'Status Atendimento', info: 'Etapa atual da expedição: Pendente → Em Separação → Separado → Embalando → Aguardando Transporte → Em Rota → Entregue.' },
          { label: 'Data Necessidade', info: 'Data em que o cliente precisa receber os materiais. Sugerida automaticamente como 7 dias úteis após a reserva.' },
          { label: 'Data Entrega', info: 'Data real de entrega. Ao preencher, o status muda automaticamente para "Entregue".' },
          { label: 'Tempo Entrega', info: 'Calculado automaticamente: Data Entrega − Data Necessidade. Positivo = atrasado, negativo = antecipado.' },
          { label: 'Pontualidade', info: 'Resultado automático: "Entregue no prazo" se Data Entrega ≤ Data Necessidade, ou "Entregue fora do prazo" caso contrário.' },
        ]
      }
    ]
  },
  'receb-dados': {
    title: 'Dados de Recebimento',
    intro: 'Registra o recebimento físico dos materiais e eventuais problemas identificados.',
    sections: [
      {
        name: 'Recebimento',
        desc: 'Dados básicos do recebimento.',
        fields: [
          { label: 'Data Recebimento', info: 'Data em que os materiais chegaram fisicamente ao almoxarifado.' },
          { label: 'Responsável Recebimento', info: 'Nome de quem recebeu e conferiu os materiais.' },
          { label: 'Houve um problema?', info: 'Indica se houve divergência ou problema no recebimento (ex: avaria, falta de item).' },
        ]
      },
      {
        name: 'Registro de Problema',
        desc: 'Aparece apenas quando "Houve um problema?" é marcado como Sim.',
        fields: [
          { label: 'Tipo de Problema', info: 'Selecione o(s) problema(s) identificados na lista. Obrigatório quando há problema.' },
          { label: 'Resumo das Pendências', info: 'Descrição das pendências que precisam ser resolvidas.' },
          { label: 'Ações de Acompanhamento', info: 'Quais providências estão sendo tomadas para resolver o problema.' },
          { label: 'Como foi solucionado', info: 'Relato da resolução após o problema ser encerrado.' },
          { label: 'Data Solução', info: 'Quando o problema foi resolvido.' },
          { label: 'Anexos do Problema', info: 'Fotos ou documentos que comprovam o problema (ex: foto de avaria).' },
        ]
      }
    ]
  },
  'receb-documento': {
    title: 'Documento (Recebimento)',
    intro: 'Registra os dados do documento fiscal e lançamentos SAP relacionados ao recebimento.',
    sections: [
      {
        name: 'Dados do Documento',
        desc: 'Informações da nota fiscal e lançamentos.',
        fields: [
          { label: 'Número da NF', info: 'Número da Nota Fiscal recebida. Preenchido automaticamente ao importar o XML.' },
          { label: 'Data da NF', info: 'Data de emissão da Nota Fiscal.' },
          { label: 'Número MIGO', info: 'Número do lançamento de entrada de mercadoria no SAP.' },
          { label: 'Data MIGO', info: 'Data do lançamento no SAP. Obrigatório se o Número MIGO for preenchido.' },
          { label: 'Número ID V360', info: 'ID da nota fiscal no sistema Virtual 360. Ao preencher, aparece um botão para abrir diretamente no V360.' },
          { label: 'Doc Referência', info: 'Número de referência adicional para rastreamento interno.' },
        ]
      }
    ]
  },
  'receb-doc': {
    title: 'Cabeçalho NF',
    intro: 'Exibe os dados do emissor e destinatário extraídos da Nota Fiscal. Preenchido automaticamente ao importar o XML na aba Anexos.',
    sections: [
      {
        name: 'Emissor e Destinatário',
        desc: 'Dados extraídos automaticamente do XML da NF.',
        fields: [
          { label: 'Emissor', info: 'Dados do fornecedor que emitiu a nota: razão social, CNPJ, inscrição estadual, endereço completo.' },
          { label: 'Destinatário', info: 'Dados do recebedor (geralmente a Axia): razão social, CNPJ, inscrição estadual, endereço.' },
        ]
      }
    ]
  },
  'receb-mat': {
    title: 'Materiais (Recebimento)',
    intro: 'Lista os itens da Nota Fiscal para conferência física. Preenchido automaticamente ao importar o XML.',
    sections: [
      {
        name: 'Conferência de Materiais',
        desc: 'Cada linha é um item da NF a ser conferido.',
        fields: [
          { label: 'Código / Descrição', info: 'Código e nome do material conforme a NF.' },
          { label: 'Qtd Esperada', info: 'Quantidade indicada na Nota Fiscal.' },
          { label: 'Qtd Recebida', info: 'Quantidade efetivamente recebida. Preencha após a contagem física.' },
          { label: 'Status', info: 'Calculado automaticamente: Pendente (não conferido), Completo (qtd correta), Parcial (qtd menor), Excedente (qtd maior).' },
          { label: 'Endereço Armazenagem', info: 'Localização no almoxarifado onde o item será guardado.' },
          { label: 'Número de Série', info: 'Identificação individual do equipamento, se aplicável.' },
        ]
      }
    ]
  },
  'receb-transp': {
    title: 'Transportador (Recebimento)',
    intro: 'Dados da empresa responsável pelo transporte da NF. Preenchido automaticamente ao importar o XML.',
    sections: [
      {
        name: 'Dados do Transportador',
        desc: 'Extraídos da NF ou preenchidos manualmente.',
        fields: [
          { label: 'Razão Social / CNPJ', info: 'Identificação da transportadora conforme a NF.' },
          { label: 'Tipo de Frete', info: 'CIF (frete por conta do remetente) ou FOB (por conta do destinatário).' },
          { label: 'Volumes / Peso', info: 'Quantidade de volumes e peso total declarados na NF.' },
        ]
      }
    ]
  },
  'receb-rodape': {
    title: 'Rodapé NF',
    intro: 'Campo para as informações complementares da Nota Fiscal, extraídas do XML ou preenchidas manualmente.',
    sections: [
      {
        name: 'Informações Complementares',
        desc: 'Texto livre com dados adicionais da NF.',
        fields: [
          { label: 'Informações Complementares', info: 'Campo de texto livre com observações do emissor, referências a pedidos, instruções de entrega, dados fiscais adicionais, etc. Preenchido automaticamente ao importar o XML.' },
        ]
      }
    ]
  },
  assinaturas: {
    title: 'Assinaturas',
    intro: 'Permite coletar assinaturas digitais dos envolvidos na OS para formalização do processo.',
    sections: [
      {
        name: 'Assinaturas Digitais',
        desc: 'Registro de aceite e responsabilidade.',
        fields: [
          { label: 'Assinaturas', info: 'Os participantes podem assinar digitalmente para confirmar ciência ou aprovação. As assinaturas ficam vinculadas à OS e aparecem nos relatórios.' },
        ]
      }
    ]
  },
  anexos: {
    title: 'Anexos',
    intro: 'Centraliza os arquivos e imagens vinculados à OS. Para OS de Recebimento e Expedição, também permite importar documentos automaticamente.',
    sections: [
      {
        name: 'Importação Automática',
        desc: 'Disponível conforme o tipo de OS.',
        fields: [
          { label: 'NFe XML (Recebimento)', info: 'Importe o arquivo XML da Nota Fiscal para preencher automaticamente: dados da NF, emissor, destinatário, transportador e itens de conferência.' },
          { label: 'PDF ZMMTSE (Expedição)', info: 'Importe o relatório PDF do SAP para preencher automaticamente: número MIGO, data, reserva, atendente, materiais e localização.' },
        ]
      },
      {
        name: 'Anexos e Imagens',
        desc: 'Arquivos gerais vinculados à OS.',
        fields: [
          { label: 'Anexos', info: 'Documentos (PDF, Word, Excel, etc.) relacionados à OS.' },
          { label: 'Imagens', info: 'Fotos relacionadas à OS (materiais, embalagem, local, etc.). Exibidas em galeria.' },
        ]
      }
    ]
  }
};

function HelpSection({ section, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
      >
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{section.name}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3">
          {section.desc && <p className="text-xs text-slate-500 dark:text-slate-400 italic">{section.desc}</p>}
          {section.fields.map((field, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" style={{ marginTop: '6px' }} />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{field.label}: </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">{field.info}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OSFormHelp({ activeTab }) {
  const [open, setOpen] = useState(false);
  const content = HELP_CONTENT[activeTab] || HELP_CONTENT['geral'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Ajuda desta aba
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-base font-semibold">Ajuda — {content.title}</DialogTitle>
              <p className="text-blue-200 text-xs mt-0.5">Guia dos campos desta aba</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{content.intro}</p>
            <div className="space-y-3">
              {content.sections.map((section, i) => (
                <HelpSection key={i} section={section} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}