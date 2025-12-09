import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-100 text-slate-700', label: 'Baixa' },
  media: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
  alta: { color: 'bg-amber-100 text-amber-700', label: 'Alta' },
  urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
};

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500', label: 'Elaboração' },
  execucao: { icon: Loader2, color: 'text-blue-500', label: 'Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500', label: 'Cancelado' },
};

export default function OSList({ ordens, pessoas, categorias, regionais, onOSClick }) {
  const getLider = (liderId) => pessoas.find(p => p.id === liderId);
  const getCategoria = (catId) => categorias.find(c => c.id === catId);
  const getRegional = (regId) => regionais.find(r => r.id === regId);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead className="font-semibold">Código</TableHead>
            <TableHead className="font-semibold">Categoria</TableHead>
            <TableHead className="font-semibold">Regional</TableHead>
            <TableHead className="font-semibold">Líder</TableHead>
            <TableHead className="font-semibold">Prazo</TableHead>
            <TableHead className="font-semibold">Prioridade</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Progresso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordens.map((os) => {
            const StatusIcon = statusConfig[os.status]?.icon || Clock;
            const lider = getLider(os.lider_id);
            const categoria = getCategoria(os.categoria_id);
            const regional = getRegional(os.regional_id);

            return (
              <TableRow 
                key={os.id} 
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => onOSClick?.(os)}
              >
                <TableCell>
                  <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                    {os.codigo}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {categoria?.nome || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{regional?.sigla || '-'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {lider?.nome?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {lider?.nome || 'Não atribuído'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={prioridadeConfig[os.prioridade]?.color}>
                    {prioridadeConfig[os.prioridade]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${statusConfig[os.status]?.color}`} />
                    <span className="text-sm">{statusConfig[os.status]?.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${os.progresso || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-10">
                      {os.progresso || 0}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}