import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { X, Users, User, FileText, Calendar, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500 bg-slate-100', label: 'Em Elaboração' },
  execucao: { icon: AlertTriangle, color: 'text-blue-500 bg-blue-100', label: 'Em Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500 bg-green-100', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500 bg-red-100', label: 'Cancelado' },
};

export default function ProjetoMobileDetail({ projeto, onClose, pessoas, onRefresh }) {
  const [loading, setLoading] = useState(true);
  const [ordensServico, setOrdensServico] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [regionais, setRegionais] = useState([]);

  useEffect(() => {
    loadData();
  }, [projeto]);

  const loadData = async () => {
    try {
      const [osData, categoriasData, regionaisData] = await Promise.all([
        base44.entities.OrdemServico.filter({ projetos_ids: projeto.id }),
        base44.entities.Categoria.list(),
        base44.entities.Regional.list()
      ]);
      
      setOrdensServico(Array.isArray(osData) ? osData : []);
      setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      setRegionais(Array.isArray(regionaisData) ? regionaisData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const lider = (pessoas || []).find(p => p.id === projeto.lider_id);
  const outrosEnvolvidos = (pessoas || []).filter(p => projeto.outros_envolvidos_ids?.includes(p.id)) || [];

  const osStats = {
    total: (ordensServico || []).length,
    concluidas: (ordensServico || []).filter(os => os.status === 'concluido').length,
    emAndamento: (ordensServico || []).filter(os => os.status === 'execucao').length,
    pendentes: (ordensServico || []).filter(os => os.status === 'elaboracao').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0000FF' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div 
        className="p-4 shadow-lg sticky top-0 z-10"
        style={{ 
          background: projeto.cor ? `linear-gradient(135deg, ${projeto.cor} 0%, ${projeto.cor}dd 100%)` : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        }}
      >
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full shrink-0"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1">{projeto.nome}</h1>
            {projeto.descricao && (
              <p className="text-white/90 text-sm">{projeto.descricao}</p>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">{osStats.total}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total de OS</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">{osStats.concluidas}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Concluídas</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-amber-600 mb-1">{osStats.emAndamento}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Em Andamento</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-slate-600 mb-1">{osStats.pendentes}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Pendentes</div>
            </div>
          </div>

          {/* Líder */}
          {lider && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Líder do Projeto</h3>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {lider.foto_perfil && <AvatarImage src={lider.foto_perfil} />}
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {lider.nome?.charAt(0) || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">{lider.nome}</div>
                  {lider.funcao && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">{lider.funcao}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Outros Envolvidos */}
          {outrosEnvolvidos.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Outros Envolvidos ({outrosEnvolvidos.length})</h3>
              </div>
              <div className="space-y-3">
                {((outrosEnvolvidos || []).filter(p => p)).map((pessoa) => (
                  <div key={pessoa.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {pessoa.foto_perfil && <AvatarImage src={pessoa.foto_perfil} />}
                      <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                        {pessoa.nome?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white text-sm">{pessoa.nome}</div>
                      {pessoa.funcao && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{pessoa.funcao}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordens de Serviço */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Ordens de Serviço ({(ordensServico || []).length})</h3>
            </div>
            
            {(ordensServico || []).length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">Nenhuma OS vinculada a este projeto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {((ordensServico || []).filter(os => os)).map((os) => {
                  const categoria = (categorias || []).find(c => c.id === os.categoria_id);
                  const regional = (regionais || []).find(r => r.id === os.regional_id);
                  const liderOS = (pessoas || []).find(p => p.id === os.lider_id);
                  const StatusIcon = statusConfig[os.status]?.icon || Clock;

                  return (
                    <div key={os.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2 bg-white dark:bg-slate-800">
                      {/* Código e Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-slate-500 dark:text-slate-400">{os.codigo}</div>
                          <div className="font-medium text-slate-900 dark:text-white">{categoria?.nome || 'OS'}</div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig[os.status]?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="font-medium">{statusConfig[os.status]?.label}</span>
                        </div>
                      </div>

                      {/* Detalhes */}
                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {regional && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Regional:</span>
                            <span>{regional.sigla}</span>
                          </div>
                        )}
                        {liderOS && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Líder:</span>
                            <span>{liderOS.nome}</span>
                          </div>
                        )}
                        {os.prazo && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">Prazo:</span>
                            <span>{format(new Date(os.prazo), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                          <span className="font-semibold text-blue-600">{os.progresso || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                            style={{ width: `${os.progresso || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}