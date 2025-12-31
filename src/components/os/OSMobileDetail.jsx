import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import {
  X,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Building2,
  User,
  Calendar,
  Package,
  MessageSquare,
  Paperclip,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'bg-slate-500', label: 'Em Elaboração' },
  execucao: { icon: Loader2, color: 'bg-blue-500', label: 'Em Execução' },
  concluido: { icon: CheckCircle, color: 'bg-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'bg-red-500', label: 'Cancelado' },
};

const prioridadeConfig = {
  baixa: { color: 'bg-slate-400', label: 'Baixa' },
  media: { color: 'bg-blue-400', label: 'Média' },
  alta: { color: 'bg-orange-400', label: 'Alta' },
  urgente: { color: 'bg-red-500', label: 'Urgente' },
};

export default function OSMobileDetail({
  os,
  onClose,
  pessoas,
  categorias,
  subcategorias,
  regionais,
  almoxarifados,
  instalacoes,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [checkedItems, setCheckedItems] = useState({});
  const [saving, setSaving] = useState(false);

  const categoria = categorias.find(c => c.id === os.categoria_id);
  const regional = regionais.find(r => r.id === os.regional_id);
  const almoxarifado = almoxarifados.find(a => a.id === os.almoxarifado_id);
  const lider = pessoas.find(p => p.id === os.lider_id);
  const instalacaoDestino = instalacoes.find(i => i.id === os.instalacao_destino_id);
  
  const isExpedicao = categoria?.nome?.toLowerCase().includes('expedição');
  const StatusIcon = statusConfig[os.status]?.icon || Clock;

  const handleToggleItem = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSavePicking = async () => {
    setSaving(true);
    try {
      const updatedItems = os.itens_documento.map((item, index) => ({
        ...item,
        separado: checkedItems[index] || false
      }));

      await base44.entities.OrdemServico.update(os.id, {
        itens_documento: updatedItems
      });

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Error saving picking:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'detalhes', label: 'Detalhes', icon: Clock },
    ...(isExpedicao && os.itens_documento?.length > 0 ? [{ id: 'materiais', label: 'Materiais', icon: Package }] : []),
    { id: 'comentarios', label: 'Chat', icon: MessageSquare },
    { id: 'anexos', label: 'Anexos', icon: Paperclip }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header com gradiente */}
      <div 
        className="p-4 shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${categoria?.cor || '#3b82f6'} 0%, ${categoria?.cor || '#3b82f6'}dd 100%)`
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full shrink-0"
              >
                <X className="w-6 h-6" />
              </Button>
              <p className="text-white/90 text-sm font-mono">{os.codigo}</p>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 px-2">{categoria?.nome || 'Ordem de Serviço'}</h2>
          </div>
          <div className={`${prioridadeConfig[os.prioridade]?.color} rounded-xl px-3 py-1 shrink-0`}>
            <span className="text-white text-xs font-bold">{prioridadeConfig[os.prioridade]?.label}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-white h-3 transition-all duration-300 rounded-full"
            style={{ width: `${os.progresso || 0}%` }}
          />
        </div>
        <p className="text-white/90 text-right text-xs mt-1">{os.progresso || 0}% concluído</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] py-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600'
                }`}
              >
                <TabIcon className="w-5 h-5 mx-auto mb-1" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'detalhes' && (
          <div className="space-y-3">
            {/* Status Badge */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <Badge className={`${statusConfig[os.status]?.color} text-white text-sm py-2 px-4 w-full justify-center`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {statusConfig[os.status]?.label}
              </Badge>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs font-medium">Regional</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{regional?.sigla}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Almoxarifado</span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{almoxarifado?.nome || '-'}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-medium">Líder</span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{lider?.nome || '-'}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-medium">Prazo</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {os.prazo ? format(new Date(os.prazo), 'dd/MM/yy') : '-'}
                </p>
              </div>
            </div>

            {/* Campos Expedição */}
            {os.num_reserva && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-cyan-600 mb-2">
                  <Package className="w-5 h-5" />
                  <span className="text-xs font-medium">Reserva</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{os.num_reserva}</p>
              </div>
            )}

            {instalacaoDestino && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Destino</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{instalacaoDestino.nome}</p>
              </div>
            )}

            {os.usuario_reserva && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-medium">Usuário</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{os.usuario_reserva}</p>
              </div>
            )}

            {/* Executores */}
            {os.executores_ids?.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-teal-600 mb-3">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-medium">Executores</span>
                </div>
                <div className="space-y-2">
                  {os.executores_ids.map(execId => {
                    const executor = pessoas.find(p => p.id === execId);
                    return executor ? (
                      <div key={execId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">
                          {executor.nome.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-900">{executor.nome}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Descrição */}
            {os.descricao_resumida && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-medium text-slate-600 mb-2">Descrição</h4>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{os.descricao_resumida}</p>
              </div>
            )}

            {/* Anotações */}
            {os.anotacoes && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-medium text-slate-600 mb-2">Anotações</h4>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{os.anotacoes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg mb-4">
              <h3 className="text-white font-bold text-lg mb-1">Lista de Separação</h3>
              <p className="text-white/80 text-sm">Marque os itens conforme separa</p>
            </div>

            {os.itens_documento?.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum material cadastrado</p>
              </div>
            ) : (
              os.itens_documento?.map((item, index) => (
                <label
                  key={index}
                  className={`block bg-white rounded-2xl p-4 shadow-sm transition-all ${
                    checkedItems[index] ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Checkbox
                        checked={checkedItems[index] || item.separado || false}
                        onCheckedChange={() => handleToggleItem(index)}
                        className="w-6 h-6 rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-xs font-mono text-slate-500 mb-1">{item.codigo}</p>
                          <p className={`text-sm font-medium ${checkedItems[index] ? 'text-green-700 line-through' : 'text-slate-900'}`}>
                            {item.descricao}
                          </p>
                        </div>
                        {(checkedItems[index] || item.separado) && (
                          <div className="bg-green-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Qtd:</span>
                          <span className={`font-bold ${checkedItems[index] ? 'text-green-700' : 'text-blue-600'}`}>
                            {item.quantidade} {item.unidade}
                          </span>
                        </div>
                        {item.endereco && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Local:</span>
                            <span className="font-medium text-slate-700">{item.endereco}</span>
                          </div>
                        )}
                      </div>

                      {item.deposito && (
                        <div className="mt-2 inline-block">
                          <Badge variant="outline" className="text-xs">
                            Dep. {item.deposito}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))
            )}

            {os.itens_documento?.length > 0 && Object.keys(checkedItems).length > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-20">
                <Button
                  onClick={handleSavePicking}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-6 text-lg rounded-2xl shadow-2xl"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Salvar Separação ({Object.keys(checkedItems).length} itens)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Funcionalidade em desenvolvimento</p>
          </div>
        )}

        {activeTab === 'anexos' && (
          <div className="space-y-4">
            {(!os.imagens?.length && !os.anexos?.length) ? (
              <div className="text-center py-12 text-slate-500">
                <Paperclip className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum anexo</p>
              </div>
            ) : (
              <>
                {os.imagens?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Imagens</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {os.imagens.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-2xl overflow-hidden bg-slate-100"
                        >
                          <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {os.anexos?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Arquivos</h4>
                    <div className="space-y-2">
                      {os.anexos.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm"
                        >
                          <Paperclip className="w-5 h-5 text-slate-400" />
                          <span className="text-sm text-blue-600 font-medium">Anexo {i + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}