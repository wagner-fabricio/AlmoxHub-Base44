import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, Search, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionLabels = {
  'enviar_alertas': { label: 'Envio de Alertas', color: 'bg-blue-100 text-blue-700' },
  'create': { label: 'Criação', color: 'bg-green-100 text-green-700' },
  'update': { label: 'Atualização', color: 'bg-amber-100 text-amber-700' },
  'delete': { label: 'Exclusão', color: 'bg-red-100 text-red-700' },
  'login': { label: 'Login', color: 'bg-purple-100 text-purple-700' },
  'logout': { label: 'Logout', color: 'bg-slate-100 text-slate-700' }
};

export default function AuditLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    action: 'all',
    entity_type: 'all',
    user_id: 'all',
    start_date: '',
    end_date: ''
  });
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadData();
  }, [filters, skip]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Apenas admins podem acessar logs
      if (user.role !== 'admin') {
        return;
      }

      const [pessoasData, logsData] = await Promise.all([
        base44.entities.Pessoa.list(),
        base44.functions.invoke('auditLog', {
          filters: filters.action !== 'all' || filters.entity_type !== 'all' || 
                   filters.user_id !== 'all' || filters.start_date || filters.end_date ? {
            ...(filters.action !== 'all' && { action: filters.action }),
            ...(filters.entity_type !== 'all' && { entity_type: filters.entity_type }),
            ...(filters.user_id !== 'all' && { user_id: filters.user_id }),
            ...(filters.start_date && { start_date: filters.start_date }),
            ...(filters.end_date && { end_date: filters.end_date })
          } : {},
          limit,
          skip
        })
      ]);

      setPessoas(pessoasData);
      setLogs(logsData.data.logs);
      setTotal(logsData.data.total);
    } catch (error) {
      console.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const getPessoa = (userId) => {
    return pessoas.find(p => p.user_id === userId);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setSkip(0);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Acesso restrito a administradores</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Logs de Auditoria
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select value={filters.action} onValueChange={(v) => handleFilterChange('action', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              {Object.entries(actionLabels).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.user_id} onValueChange={(v) => handleFilterChange('user_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              {pessoas.map(p => (
                <SelectItem key={p.id} value={p.user_id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            placeholder="Data Início"
          />

          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            placeholder="Data Fim"
          />

          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                action: 'all',
                entity_type: 'all',
                user_id: 'all',
                start_date: '',
                end_date: ''
              });
              setSkip(0);
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Tabela de Logs */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold">Data/Hora</TableHead>
              <TableHead className="font-semibold">Usuário</TableHead>
              <TableHead className="font-semibold">Ação</TableHead>
              <TableHead className="font-semibold">Entidade</TableHead>
              <TableHead className="font-semibold">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhum log encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const pessoa = getPessoa(log.user_id);
                const actionConfig = actionLabels[log.action] || { 
                  label: log.action, 
                  color: 'bg-slate-100 text-slate-700' 
                };
                
                return (
                  <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {pessoa?.nome || 'Usuário Desconhecido'}
                      </div>
                      <div className="text-xs text-slate-500">{pessoa?.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionConfig.color}>
                        {actionConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.entity_type || '-'}</span>
                      {log.entity_id && (
                        <div className="text-xs text-slate-500 font-mono mt-1">
                          {log.entity_id.substring(0, 8)}...
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs overflow-auto max-w-md">
                          {log.details || 'Sem detalhes'}
                        </pre>
                      </details>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Paginação */}
      {total > limit && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {skip + 1} a {Math.min(skip + limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setSkip(skip + limit)}
              disabled={skip + limit >= total}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}