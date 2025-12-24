import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Edit, 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Tag, 
  MessageSquare, 
  Paperclip, 
  Image,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-100 text-slate-700', label: 'Baixa' },
  media: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
  alta: { color: 'bg-amber-100 text-amber-700', label: 'Alta' },
  urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
};

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500 bg-slate-100', label: 'Em Elaboração' },
  execucao: { icon: AlertTriangle, color: 'text-blue-500 bg-blue-100', label: 'Em Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500 bg-green-100', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500 bg-red-100', label: 'Cancelado' },
};

export default function OSDetailModal({
  open,
  onClose,
  os,
  regionais,
  almoxarifados,
  pessoas,
  categorias,
  subcategorias,
  onEdit,
  onRefresh
}) {
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);

  useEffect(() => {
    if (open && os) {
      loadComentarios();
      loadUser();
    }
  }, [open, os]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Buscar dados da pessoa para obter foto de perfil
      const pessoaData = await base44.entities.Pessoa.filter({ user_id: user.id });
      if (pessoaData && pessoaData[0]) {
        setCurrentUserPessoa(pessoaData[0]);
      }
    } catch (e) {}
  };

  const loadComentarios = async () => {
    try {
      const data = await base44.entities.Comentario.filter({ ordem_servico_id: os.id });
      setComentarios(data);
    } catch (e) {
      console.error('Error loading comments:', e);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoadingComment(true);
    try {
      await base44.entities.Comentario.create({
        ordem_servico_id: os.id,
        conteudo: newComment,
        autor_nome: currentUser?.full_name || 'Usuário'
      });
      setNewComment('');
      loadComentarios();
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setLoadingComment(false);
    }
  };

  if (!os) return null;

  const categoria = categorias.find(c => c.id === os.categoria_id);
  const regional = regionais.find(r => r.id === os.regional_id);
  const almoxarifado = almoxarifados.find(a => a.id === os.almoxarifado_id);
  const lider = pessoas.find(p => p.id === os.lider_id);
  const StatusIcon = statusConfig[os.status]?.icon || Clock;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{os.codigo}</span>
              <DialogTitle className="text-xl font-semibold mt-1">
                {categoria?.nome || 'Ordem de Serviço'}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={prioridadeConfig[os.prioridade]?.color}>
                {prioridadeConfig[os.prioridade]?.label}
              </Badge>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[os.status]?.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{statusConfig[os.status]?.label}</span>
              </div>
              <Button onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <Tabs defaultValue="detalhes">
              <TabsList className="mb-6">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="materiais">Materiais</TabsTrigger>
                <TabsTrigger value="comentarios">
                  Comentários ({comentarios.length})
                </TabsTrigger>
                <TabsTrigger value="anexos">
                  Anexos ({(os.anexos?.length || 0) + (os.imagens?.length || 0)})
                </TabsTrigger>
              </TabsList>

              {/* Detalhes Tab */}
              <TabsContent value="detalhes" className="space-y-6">
                {/* Progress */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900 dark:text-white">Progresso</span>
                    <span className="text-2xl font-bold text-blue-600">{os.progresso || 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${os.progresso || 0}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Regional</p>
                      <p className="font-medium text-slate-900 dark:text-white">{regional?.sigla} - {regional?.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Almoxarifado</p>
                      <p className="font-medium text-slate-900 dark:text-white">{almoxarifado?.nome || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Líder</p>
                      <p className="font-medium text-slate-900 dark:text-white">{lider?.nome || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Prazo</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {os.prazo ? format(new Date(os.prazo), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {os.descricao_resumida && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Descrição</h4>
                    <p className="text-slate-600 dark:text-slate-400">{os.descricao_resumida}</p>
                  </div>
                )}

                {/* Notes */}
                {os.anotacoes && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Anotações</h4>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{os.anotacoes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Materiais Tab */}
              <TabsContent value="materiais" className="space-y-6">
                {os.itens_documento?.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Código</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Descrição</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Qtd</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">R$ Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {os.itens_documento.map((item, i) => (
                          <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                            <td className="p-3 font-mono text-sm">{item.codigo}</td>
                            <td className="p-3">{item.descricao}</td>
                            <td className="p-3 text-right">{item.quantidade} {item.unidade}</td>
                            <td className="p-3 text-right font-medium">
                              R$ {(item.r_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum material cadastrado
                  </div>
                )}
              </TabsContent>

              {/* Comentários Tab */}
              <TabsContent value="comentarios" className="space-y-4">
                {/* Comment Input */}
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    {currentUserPessoa?.foto_perfil && (
                      <AvatarImage src={currentUserPessoa.foto_perfil} alt={currentUser?.full_name} />
                    )}
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {currentUser?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Adicionar um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button onClick={handleAddComment} disabled={loadingComment}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comentarios.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      Nenhum comentário ainda
                    </div>
                  ) : (
                    comentarios.map((comment) => {
                      const commentAuthor = pessoas.find(p => p.id === comment.autor_id);
                      return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          {commentAuthor?.foto_perfil && (
                            <AvatarImage src={commentAuthor.foto_perfil} alt={comment.autor_nome} />
                          )}
                          <AvatarFallback className="bg-slate-100 text-slate-700">
                            {comment.autor_nome?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {comment.autor_nome}
                            </span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(comment.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{comment.conteudo}</p>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Anexos Tab */}
              <TabsContent value="anexos" className="space-y-6">
                {/* Images */}
                {os.imagens?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Imagens ({os.imagens.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {os.imagens.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 hover:opacity-80 transition-opacity"
                        >
                          <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {os.anexos?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Anexos ({os.anexos.length})
                    </h4>
                    <div className="space-y-2">
                      {os.anexos.map((url, i) => (
                        <a 
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-blue-600 hover:underline">Anexo {i + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(!os.imagens?.length && !os.anexos?.length) && (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum anexo
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}