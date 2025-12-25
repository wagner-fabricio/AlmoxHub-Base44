import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-500', label: 'Baixa' },
  media: { color: 'bg-blue-500', label: 'Média' },
  alta: { color: 'bg-amber-500', label: 'Alta' },
  urgente: { color: 'bg-red-500', label: 'Urgente' },
};

export default function OSGallery({ ordens, pessoas, categorias, regionais, instalacoes, onOSClick }) {
  const getLider = (liderId) => pessoas.find(p => p.id === liderId);
  const getCategoria = (catId) => categorias.find(c => c.id === catId);
  const getRegional = (regId) => regionais.find(r => r.id === regId);
  const getInstalacao = (instId) => instalacoes?.find(i => i.id === instId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ordens.map((os) => {
        const lider = getLider(os.lider_id);
        const categoria = getCategoria(os.categoria_id);
        const regional = getRegional(os.regional_id);
        const coverImage = os.imagens?.[0];

        return (
          <Card 
            key={os.id}
            className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
            onClick={() => onOSClick?.(os)}
          >
            {/* Image Area */}
            <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
              {coverImage ? (
                <img 
                  src={coverImage} 
                  alt={os.codigo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                </div>
              )}
              
              {/* Priority Badge */}
              <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${prioridadeConfig[os.prioridade]?.color} shadow-lg`} />
              
              {/* Progress Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${os.progresso || 0}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {os.codigo}
                  </span>
                  <h3 className="font-medium text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {categoria?.nome || 'Sem Categoria'}
                  </h3>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {regional?.sigla || '-'}
                </Badge>
              </div>

              {os.descricao_resumida && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {os.descricao_resumida}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[80px]">{lider?.nome || '-'}</span>
                </div>
                {os.prazo && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(os.prazo), 'dd/MM', { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}