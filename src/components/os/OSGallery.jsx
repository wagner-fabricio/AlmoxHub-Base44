import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Calendar, User, PackageCheck, MapPin } from 'lucide-react';
import TimeSheetButton from '@/components/timesheet/TimeSheetButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-500', label: 'Baixa' },
  media: { color: 'bg-blue-500', label: 'Média' },
  alta: { color: 'bg-amber-500', label: 'Alta' },
  urgente: { color: 'bg-red-500', label: 'Urgente' },
};

function OSCard({ os, pessoas, categorias, regionais, instalacoes, onOSClick, currentPessoa, onOSChange }) {
  const lider = pessoas.find(p => p.id === os.lider_id);
  const categoria = categorias.find(c => c.id === os.categoria_id);
  const regional = regionais.find(r => r.id === os.regional_id);
  const coverImage = os.imagens?.[0];
  const getInstalacao = (instId) => instalacoes?.find(i => i.id === instId);

  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
      onClick={() => onOSClick?.(os)}
    >
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={os.codigo} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
        )}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${prioridadeConfig[os.prioridade]?.color} shadow-lg`} />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50">
          <div className="h-full bg-blue-500" style={{ width: `${os.progresso || 0}%` }} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{os.codigo}</span>
            <h3 className="font-medium text-slate-900 dark:text-white mt-1 line-clamp-1">{categoria?.nome || 'Sem Categoria'}</h3>
          </div>
          <Badge variant="outline" className="shrink-0">{regional?.sigla || '-'}</Badge>
        </div>

        {os.descricao_resumida && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{os.descricao_resumida}</p>
        )}

        {categoria?.nome?.toLowerCase().includes('expedição') && (os.num_reserva || os.num_migo || os.instalacao_destino_id || os.usuario_reserva) && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1.5 text-xs">
            {os.num_reserva && (
              <div className="flex items-center gap-2">
                <PackageCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-600 dark:text-slate-400">Reserva: <span className="font-medium text-slate-900 dark:text-white">{os.num_reserva}</span></span>
              </div>
            )}
            {os.num_migo && (
              <div className="flex items-center gap-2">
                <PackageCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-600 dark:text-slate-400">MIGO: <span className="font-medium text-slate-900 dark:text-white">{os.num_migo}</span></span>
              </div>
            )}
            {os.instalacao_destino_id && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-600 dark:text-slate-400 truncate">Destino: <span className="font-medium text-slate-900 dark:text-white">{getInstalacao(os.instalacao_destino_id)?.nome || '-'}</span></span>
              </div>
            )}
            {os.usuario_reserva && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-600 dark:text-slate-400 truncate">Usuário: <span className="font-medium text-slate-900 dark:text-white">{os.usuario_reserva}</span></span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[80px]">{lider?.nome || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentPessoa && (
              <span onClick={e => e.stopPropagation()}>
                <TimeSheetButton os={os} currentPessoa={currentPessoa} onStateChange={onOSChange} size="sm" />
              </span>
            )}
            {os.prazo && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(os.prazo), 'dd/MM', { locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function OSGallery({ ordens, pessoas, categorias, regionais, instalacoes, onOSClick, rotulos = [], currentPessoa, onOSChange }) {
  // Build columns: one per rótulo + "Sem Rótulo"
  const colunas = [];

  // Collect all rótulo IDs present across all OS
  const rotuloIdsUsados = new Set();
  ordens.forEach(os => (os.rotulos_ids || []).forEach(id => rotuloIdsUsados.add(id)));

  // Sort rótulos by name, only those actually used
  const rotulosUsados = rotulos
    .filter(r => rotuloIdsUsados.has(r.id))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  rotulosUsados.forEach(rotulo => {
    const osNaColuna = ordens.filter(os => (os.rotulos_ids || []).includes(rotulo.id));
    colunas.push({ id: rotulo.id, rotulo, ordens: osNaColuna });
  });

  // "Sem Rótulo" column
  const semRotulo = ordens.filter(os => !os.rotulos_ids || os.rotulos_ids.length === 0);
  if (semRotulo.length > 0) {
    colunas.push({ id: '__sem_rotulo__', rotulo: null, ordens: semRotulo });
  }

  // If no rótulos at all, fall back to flat grid
  if (colunas.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ordens.map(os => (
          <OSCard key={os.id} os={os} pessoas={pessoas} categorias={categorias} regionais={regionais} instalacoes={instalacoes} onOSClick={onOSClick} currentPessoa={currentPessoa} onOSChange={onOSChange} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: `${colunas.length * 300}px` }}>
        {colunas.map(({ id, rotulo, ordens: colOrdens }) => {
          const hex = rotulo?.cor?.replace('#', '') || '';
          const lum = hex ? (0.299 * parseInt(hex.substr(0,2),16) + 0.587 * parseInt(hex.substr(2,2),16) + 0.114 * parseInt(hex.substr(4,2),16)) / 255 : 1;
          const textColor = lum > 0.5 ? '#000000' : '#ffffff';

          return (
            <div key={id} className="flex-shrink-0 w-72">
              {/* Column Header */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg mb-3 font-semibold text-sm"
                style={rotulo ? { backgroundColor: rotulo.cor, color: textColor } : { backgroundColor: '#f1f5f9', color: '#475569' }}
              >
                <span>{rotulo ? rotulo.nome : 'Sem Rótulo'}</span>
                <span className="text-xs font-normal opacity-75">{colOrdens.length}</span>
              </div>

              {/* Cards Stack */}
              <div className="space-y-4">
                {colOrdens.map(os => (
                  <OSCard key={os.id} os={os} pessoas={pessoas} categorias={categorias} regionais={regionais} instalacoes={instalacoes} onOSClick={onOSClick} currentPessoa={currentPessoa} onOSChange={onOSChange} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}