import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar, User, MapPin, Users, TrendingUp, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prioridadeConfig = {
  baixa: { cor: 'bg-slate-50 text-slate-600', label: 'Baixa' },
  media: { cor: 'bg-blue-50 text-blue-600', label: 'Média' },
  alta: { cor: 'bg-orange-50 text-orange-600', label: 'Alta' },
  urgente: { cor: 'bg-red-50 text-red-600', label: 'Urgente' }
};

const statusConfig = {
  elaboracao: { label: 'Em Elaboração', cor: 'bg-amber-50 text-amber-600' },
  execucao: { label: 'Em Execução', cor: 'bg-blue-50 text-blue-600' },
  concluido: { label: 'Concluído', cor: 'bg-green-50 text-green-600' },
  cancelado: { label: 'Cancelado', cor: 'bg-red-50 text-red-600' }
};

export default function OSCard({ osId, isMinha }) {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState(null);
  const [regional, setRegional] = useState(null);
  const [lider, setLider] = useState(null);
  const [executores, setExecutores] = useState([]);
  const [instalacaoOrigem, setInstalacaoOrigem] = useState(null);
  const [instalacaoDestino, setInstalacaoDestino] = useState(null);

  useEffect(() => {
    loadOS();
  }, [osId]);

  const loadOS = async () => {
    try {
      const osById = await base44.entities.OrdemServico.filter({ id: osId });
      let osData = Array.isArray(osById) && osById.length > 0 ? osById[0] : null;
      
      if (!osData && osId) {
        const osByCodigo = await base44.entities.OrdemServico.filter({ codigo: osId });
        osData = Array.isArray(osByCodigo) && osByCodigo.length > 0 ? osByCodigo[0] : null;
      }
      
      if (!osData) {
        setLoading(false);
        return;
      }
      
      setOs(osData);

      if (osData.categoria_id) {
        const catResult = await base44.entities.Categoria.filter({ id: osData.categoria_id });
        setCategoria(Array.isArray(catResult) && catResult.length > 0 ? catResult[0] : null);
      }

      if (osData.regional_id) {
        const regResult = await base44.entities.Regional.filter({ id: osData.regional_id });
        setRegional(Array.isArray(regResult) && regResult.length > 0 ? regResult[0] : null);
      }

      if (osData.lider_id) {
        const liderResult = await base44.entities.Pessoa.filter({ id: osData.lider_id });
        setLider(Array.isArray(liderResult) && liderResult.length > 0 ? liderResult[0] : null);
      }

      if (osData.executores_ids?.length > 0) {
        const pessoasResult = await base44.entities.Pessoa.list();
        const execList = (pessoasResult || []).filter(p => osData.executores_ids.includes(p.id));
        setExecutores(execList);
      }

      if (osData.instalacao_origem_id) {
        const instOrigem = await base44.entities.Instalacao.filter({ id: osData.instalacao_origem_id });
        setInstalacaoOrigem(Array.isArray(instOrigem) && instOrigem.length > 0 ? instOrigem[0] : null);
      }

      if (osData.instalacao_destino_id) {
        const instDestino = await base44.entities.Instalacao.filter({ id: osData.instalacao_destino_id });
        setInstalacaoDestino(Array.isArray(instDestino) && instDestino.length > 0 ? instDestino[0] : null);
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-3 ${isMinha ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">Carregando...</span>
        </div>
      </Card>
    );
  }

  if (!os) {
    return (
      <Card className={`p-3 ${isMinha ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">OS não encontrada</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-3 ${isMinha ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ClipboardList className={`w-4 h-4 ${isMinha ? 'text-blue-600' : 'text-slate-600'} shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className={`font-semibold text-sm ${isMinha ? 'text-blue-900' : 'text-slate-900 dark:text-white'} truncate`}>
                {os.codigo || 'Sem código'}
              </div>
              {categoria && (
                <div className="text-xs text-slate-500 truncate">
                  {categoria.nome}
                </div>
              )}
            </div>
          </div>
          
          <Badge className={`${statusConfig[os.status]?.cor} text-xs shrink-0`}>
            {statusConfig[os.status]?.label || os.status}
          </Badge>
        </div>

        {os.descricao_resumida && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {os.descricao_resumida}
          </p>
        )}

        <div className="space-y-1.5">
          {/* Líder e Executores */}
          {lider && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <User className="w-3 h-3" />
              <span className="font-medium">Líder:</span>
              <span>{lider.nome}</span>
            </div>
          )}

          {executores.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Users className="w-3 h-3" />
              <span className="font-medium">Executores:</span>
              <span>{((executores || []).filter(e => e && e.nome)).map(e => e.nome).join(', ')}</span>
            </div>
          )}

          {/* Progresso */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">{os.progresso || 0}%</span>
            </div>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${os.progresso || 0}%` }}
              />
            </div>
          </div>

          {/* Campos de Expedição */}
          {categoria?.nome?.toLowerCase().includes('expedição') && (
            <>
              {os.num_reserva && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <ClipboardList className="w-3 h-3" />
                  <span className="font-medium">Reserva:</span>
                  <span>{os.num_reserva}</span>
                </div>
              )}
              {instalacaoOrigem && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">Origem:</span>
                  <span>{instalacaoOrigem.nome}</span>
                </div>
              )}
              {instalacaoDestino && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">Destino:</span>
                  <span>{instalacaoDestino.nome}</span>
                </div>
              )}
            </>
          )}

          {/* Info adicional */}
          <div className="flex flex-wrap gap-2 text-xs">
            {regional && (
              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{regional.sigla}</span>
              </div>
            )}
            
            {os.prazo && (
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(os.prazo), 'dd/MM/yy', { locale: ptBR })}</span>
              </div>
            )}

            <Badge className={prioridadeConfig[os.prioridade]?.cor}>
              {prioridadeConfig[os.prioridade]?.label || os.prioridade}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}