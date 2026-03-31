import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Paperclip, MessageSquare, AlertTriangle, Clock, PackageCheck, MapPin, Globe } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RotuloBadges from '@/components/rotulos/RotuloBadges';
import TimeSheetButton from '@/components/timesheet/TimeSheetButton';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Baixa' },
  media: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', label: 'Média' },
  alta: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', label: 'Alta' },
  urgente: { color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', label: 'Urgente' },
};

const statusConfig = {
  elaboracao: { color: 'bg-slate-500', label: 'Em Elaboração' },
  execucao: { color: 'bg-blue-500', label: 'Em Execução' },
  concluido: { color: 'bg-green-500', label: 'Concluído' },
  cancelado: { color: 'bg-red-500', label: 'Cancelado' },
};

// Parse date string (yyyy-MM-dd) sem conversão de fuso horário
const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function OSCard({ os, onClick, lider, categoria, regional, instalacoes, rotulos = [], currentPessoa, onOSChange }) {
  const prazoDate = parseLocalDate(os.prazo);
  const isOverdue = prazoDate && isPast(prazoDate) && os.status !== 'concluido';
  const isDueToday = prazoDate && isToday(prazoDate);

  // Determinar cor da borda baseado no status e prazo
  const getBorderColor = () => {
    if (os.status === 'concluido') return '#10b981'; // verde
    if (isOverdue) return '#ef4444'; // vermelho
    if (os.status === 'execucao') return '#0000FF'; // azul
    return '#64748b'; // cinza (elaboração)
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 bg-white dark:bg-slate-800 group"
      style={{ borderColor: getBorderColor() }}
      onClick={() => onClick?.(os)}
    >
      {/* Badge Global */}
      {os.is_global && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            <Globe className="w-3 h-3" />
            Global
          </span>
        </div>
      )}

      {/* Rótulos */}
      {os.rotulos_ids?.length > 0 && rotulos.length > 0 && (
        <div className="mb-2">
          <RotuloBadges rotulos={rotulos.filter(r => os.rotulos_ids?.includes(r.id))} max={4} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block mb-1">
            {os.codigo}
          </span>
          <h3 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {categoria?.nome || 'Sem Categoria'}
          </h3>
        </div>
        <Badge className={prioridadeConfig[os.prioridade]?.color || prioridadeConfig.media.color}>
          {prioridadeConfig[os.prioridade]?.label || 'Média'}
        </Badge>
      </div>

      {/* Description */}
      {os.descricao_resumida && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
          {os.descricao_resumida}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500 dark:text-slate-400">Progresso</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{os.progresso || 0}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${os.progresso || 0}%` }}
          />
        </div>
      </div>



      {/* Expedição Details */}
      {categoria?.nome?.toLowerCase().includes('expedição') && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1.5">
          {os.num_reserva && (
            <div className="flex items-center gap-2 text-xs">
              <PackageCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Reserva:</span>
              <span className="font-medium text-slate-900 dark:text-white">{os.num_reserva}</span>
            </div>
          )}
          {os.num_migo && (
            <div className="flex items-center gap-2 text-xs">
              <PackageCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">MIGO:</span>
              <span className="font-medium text-slate-900 dark:text-white">{os.num_migo}</span>
            </div>
          )}
          {os.instalacao_destino_id && instalacoes && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Destino:</span>
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {instalacoes.find(i => i.id === os.instalacao_destino_id)?.nome || '-'}
              </span>
            </div>
          )}
          {os.usuario_reserva && (
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Usuário:</span>
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {os.usuario_reserva}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recebimento Details */}
      {categoria?.nome?.toLowerCase().includes('recebimento') && (
        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-1.5">
          {os.numero_migo_receb && (
            <div className="flex items-center gap-2 text-xs">
              <PackageCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-slate-600 dark:text-slate-400">MIGO:</span>
              <span className="font-medium text-slate-900 dark:text-white">{os.numero_migo_receb}</span>
            </div>
          )}
          {os.nfe_numero_receb && (
            <div className="flex items-center gap-2 text-xs">
              <PackageCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-slate-600 dark:text-slate-400">NF:</span>
              <span className="font-medium text-slate-900 dark:text-white">{os.nfe_numero_receb}</span>
            </div>
          )}
          {os.nfe_dados_emissor?.razao_social && (
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-slate-600 dark:text-slate-400">Emissor:</span>
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {os.nfe_dados_emissor.razao_social}
              </span>
            </div>
          )}
          {os.numero_v360 && (
            <div className="flex items-center gap-2 text-xs">
              <PackageCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-slate-600 dark:text-slate-400">V360:</span>
              <span className="font-medium text-slate-900 dark:text-white">{os.numero_v360}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {lider?.nome?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
            {lider?.nome || 'Não atribuído'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          {/* TimeSheet Button */}
          <TimeSheetButton
            os={os}
            currentPessoa={currentPessoa}
            onStateChange={onOSChange}
            size="sm"
          />

          {os.anexos?.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{os.anexos.length}</span>
            </div>
          )}
          
          {prazoDate && (
            <div className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-red-500' : isDueToday ? 'text-amber-500' : ''
            }`}>
              {isOverdue ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span>{format(prazoDate, 'dd/MM', { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}