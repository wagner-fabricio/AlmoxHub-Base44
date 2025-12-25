import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prioridadeConfig = {
  baixa: { cor: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Baixa' },
  media: { cor: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Média' },
  alta: { cor: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Alta' },
  urgente: { cor: 'bg-red-100 text-red-700 border-red-200', label: 'Urgente' }
};

const statusConfig = {
  elaboracao: { label: 'Em Elaboração', cor: 'bg-amber-100 text-amber-700' },
  execucao: { label: 'Em Execução', cor: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluído', cor: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', cor: 'bg-red-100 text-red-700' }
};

export default function OSCard({ osId, onClick, isMinha }) {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState(null);
  const [regional, setRegional] = useState(null);

  useEffect(() => {
    loadOS();
  }, [osId]);

  const loadOS = async () => {
    try {
      const osData = await base44.entities.OrdemServico.filter({ id: osId }).then(d => d[0]);
      if (!osData) {
        setLoading(false);
        return;
      }
      
      setOs(osData);

      // Carregar dados relacionados
      if (osData.categoria_id) {
        const cat = await base44.entities.Categoria.filter({ id: osData.categoria_id }).then(c => c[0]);
        setCategoria(cat);
      }

      if (osData.regional_id) {
        const reg = await base44.entities.Regional.filter({ id: osData.regional_id }).then(r => r[0]);
        setRegional(reg);
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isMinha ? 'bg-blue-700' : 'bg-white dark:bg-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <ClipboardList className={`w-5 h-5 ${isMinha ? 'text-white' : 'text-slate-400'}`} />
          <span className={`text-sm ${isMinha ? 'text-white' : 'text-slate-600'}`}>
            Carregando ordem de serviço...
          </span>
        </div>
      </Card>
    );
  }

  if (!os) {
    return (
      <Card className={`p-3 ${isMinha ? 'bg-blue-700' : 'bg-white dark:bg-slate-800'}`}>
        <div className="flex items-center gap-2">
          <ClipboardList className={`w-5 h-5 ${isMinha ? 'text-white/60' : 'text-slate-400'}`} />
          <span className={`text-sm ${isMinha ? 'text-white/80' : 'text-slate-500'}`}>
            Ordem de serviço não encontrada
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`p-3 cursor-pointer hover:shadow-md transition-all border-2 ${
        isMinha 
          ? 'bg-blue-700 border-blue-500 hover:border-blue-400' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
      }`}
      onClick={() => onClick && onClick(os)}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className={`w-5 h-5 ${isMinha ? 'text-white' : 'text-blue-600'}`} />
            <div>
              <div className={`font-bold ${isMinha ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {os.codigo || 'Sem código'}
              </div>
              {categoria && (
                <div className={`text-xs ${isMinha ? 'text-white/80' : 'text-slate-500'}`}>
                  {categoria.nome}
                </div>
              )}
            </div>
          </div>
          
          <Badge 
            className={`${
              isMinha 
                ? 'bg-white/20 text-white border-white/30' 
                : statusConfig[os.status]?.cor
            } text-xs`}
          >
            {statusConfig[os.status]?.label || os.status}
          </Badge>
        </div>

        {/* Descrição */}
        {os.descricao_resumida && (
          <p className={`text-sm line-clamp-2 ${
            isMinha ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'
          }`}>
            {os.descricao_resumida}
          </p>
        )}

        {/* Info adicional */}
        <div className="flex flex-wrap gap-2 text-xs">
          {regional && (
            <div className={`flex items-center gap-1 ${
              isMinha ? 'text-white/80' : 'text-slate-500'
            }`}>
              <MapPin className="w-3 h-3" />
              <span>{regional.sigla}</span>
            </div>
          )}
          
          {os.prazo && (
            <div className={`flex items-center gap-1 ${
              isMinha ? 'text-white/80' : 'text-slate-500'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(os.prazo), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          )}

          <Badge 
            className={`${
              isMinha 
                ? 'bg-white/20 text-white border-white/30' 
                : prioridadeConfig[os.prioridade]?.cor
            }`}
          >
            {prioridadeConfig[os.prioridade]?.label || os.prioridade}
          </Badge>
        </div>
      </div>
    </Card>
  );
}