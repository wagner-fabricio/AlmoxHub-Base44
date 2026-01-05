import React, { useState, useEffect, memo } from 'react';
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

// Cache global para dados relacionados - evita consultas repetidas
const dataCache = {
  categorias: new Map(),
  regionais: new Map(),
  pessoas: new Map(),
  instalacoes: new Map(),
  ordens: new Map(),
  lastFetch: {
    categorias: 0,
    regionais: 0,
    pessoas: 0,
    instalacoes: 0
  }
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para carregar dados em batch
const loadRelatedData = async () => {
  const now = Date.now();
  const promises = [];
  
  // Carregar categorias se cache expirou
  if (now - dataCache.lastFetch.categorias > CACHE_TTL) {
    promises.push(
      base44.entities.Categoria.list().then(data => {
        (data || []).forEach(c => dataCache.categorias.set(c.id, c));
        dataCache.lastFetch.categorias = now;
      }).catch(() => {})
    );
  }
  
  // Carregar regionais se cache expirou
  if (now - dataCache.lastFetch.regionais > CACHE_TTL) {
    promises.push(
      base44.entities.Regional.list().then(data => {
        (data || []).forEach(r => dataCache.regionais.set(r.id, r));
        dataCache.lastFetch.regionais = now;
      }).catch(() => {})
    );
  }
  
  // Carregar pessoas se cache expirou
  if (now - dataCache.lastFetch.pessoas > CACHE_TTL) {
    promises.push(
      base44.entities.Pessoa.list().then(data => {
        (data || []).forEach(p => dataCache.pessoas.set(p.id, p));
        dataCache.lastFetch.pessoas = now;
      }).catch(() => {})
    );
  }
  
  // Carregar instalações se cache expirou
  if (now - dataCache.lastFetch.instalacoes > CACHE_TTL) {
    promises.push(
      base44.entities.Instalacao.list().then(data => {
        (data || []).forEach(i => dataCache.instalacoes.set(i.id, i));
        dataCache.lastFetch.instalacoes = now;
      }).catch(() => {})
    );
  }
  
  await Promise.all(promises);
};

// Componente memoizado para evitar re-renders desnecessários
const OSCard = memo(function OSCard({ osId, isMinha }) {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedData, setRelatedData] = useState({
    categoria: null,
    regional: null,
    lider: null,
    executores: [],
    instalacaoOrigem: null,
    instalacaoDestino: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadOS = async () => {
      if (!osId) {
        setLoading(false);
        return;
      }

      try {
        // Verificar cache primeiro
        let osData = dataCache.ordens.get(osId);
        
        if (!osData) {
          // Tentar buscar por ID
          const osById = await base44.entities.OrdemServico.filter({ id: osId });
          osData = Array.isArray(osById) && osById.length > 0 ? osById[0] : null;
          
          // Se não encontrou, tentar por código
          if (!osData) {
            const osByCodigo = await base44.entities.OrdemServico.filter({ codigo: osId });
            osData = Array.isArray(osByCodigo) && osByCodigo.length > 0 ? osByCodigo[0] : null;
          }
          
          // Adicionar ao cache
          if (osData) {
            dataCache.ordens.set(osId, osData);
            dataCache.ordens.set(osData.id, osData);
            if (osData.codigo) dataCache.ordens.set(osData.codigo, osData);
          }
        }

        if (!isMounted) return;

        if (!osData) {
          setLoading(false);
          return;
        }

        setOs(osData);
        
        // Carregar dados relacionados em batch (uma única vez)
        await loadRelatedData();
        
        if (!isMounted) return;

        // Resolver dados relacionados do cache
        const newRelatedData = {
          categoria: osData.categoria_id ? dataCache.categorias.get(osData.categoria_id) : null,
          regional: osData.regional_id ? dataCache.regionais.get(osData.regional_id) : null,
          lider: osData.lider_id ? dataCache.pessoas.get(osData.lider_id) : null,
          executores: osData.executores_ids?.length > 0 
            ? osData.executores_ids.map(id => dataCache.pessoas.get(id)).filter(Boolean)
            : [],
          instalacaoOrigem: osData.instalacao_origem_id ? dataCache.instalacoes.get(osData.instalacao_origem_id) : null,
          instalacaoDestino: osData.instalacao_destino_id ? dataCache.instalacoes.get(osData.instalacao_destino_id) : null
        };
        
        setRelatedData(newRelatedData);
      } catch (error) {
        console.error('Erro ao carregar OS:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadOS();
    
    return () => { isMounted = false; };
  }, [osId]);

  if (loading) {
    return (
      <Card className={`p-3 ${isMinha ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400 animate-pulse" />
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

  const { categoria, regional, lider, executores, instalacaoOrigem, instalacaoDestino } = relatedData;

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
              <span>{executores.map(e => e.nome).join(', ')}</span>
            </div>
          )}

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
});

export default OSCard;