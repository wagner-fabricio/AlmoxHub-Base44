import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Settings, 
  Upload, 
  X, 
  UserPlus, 
  Shield, 
  Trash2,
  Camera,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GrupoDetalhesModal({ 
  open, 
  onClose, 
  conversa, 
  participantes,
  pessoas,
  currentPessoaId,
  onUpdate
}) {
  const [nomeGrupo, setNomeGrupo] = useState(conversa?.nome_grupo || '');
  const [descricaoGrupo, setDescricaoGrupo] = useState(conversa?.descricao_grupo || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const currentParticipante = participantes.find(p => p.pessoa_id === currentPessoaId);
  const isAdmin = currentParticipante?.permissao === 'admin';

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Conversa.update(conversa.id, {
        avatar_grupo: file_url
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!isAdmin) return;
    
    try {
      setSaving(true);
      await base44.entities.Conversa.update(conversa.id, {
        nome_grupo: nomeGrupo,
        descricao_grupo: descricaoGrupo
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar informações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePromoverAdmin = async (participanteId) => {
    if (!isAdmin) return;

    try {
      const part = participantes.find(p => p.id === participanteId);
      await base44.entities.ParticipanteConversa.update(participanteId, {
        permissao: part.permissao === 'admin' ? 'membro' : 'admin'
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao promover participante:', error);
    }
  };

  const handleRemoverMembro = async (participanteId) => {
    if (!isAdmin) return;

    try {
      await base44.entities.ParticipanteConversa.update(participanteId, {
        status: 'removido'
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  const handleAddMembers = async () => {
    if (!isAdmin || selectedNewMembers.length === 0) return;

    try {
      await Promise.all(
        selectedNewMembers.map(pessoaId =>
          base44.entities.ParticipanteConversa.create({
            conversa_id: conversa.id,
            pessoa_id: pessoaId,
            permissao: 'membro',
            status: 'ativo'
          })
        )
      );
      setSelectedNewMembers([]);
      setShowAddMember(false);
      setBusca('');
      onUpdate();
    } catch (error) {
      console.error('Erro ao adicionar membros:', error);
    }
  };

  const participantesAtivos = participantes.filter(p => p.status === 'ativo');
  const participantesIdsAtivos = participantesAtivos.map(p => p.pessoa_id);
  const pessoasDisponiveis = pessoas.filter(p => 
    !participantesIdsAtivos.includes(p.id) &&
    p.nome.toLowerCase().includes(buscaDebounced.toLowerCase())
  );

  const toggleNewMember = (pessoaId) => {
    if (selectedNewMembers.includes(pessoaId)) {
      setSelectedNewMembers(selectedNewMembers.filter(id => id !== pessoaId));
    } else {
      setSelectedNewMembers([...selectedNewMembers, pessoaId]);
    }
  };

  if (!conversa || conversa.tipo !== 'grupo') return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Grupo</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <Info className="w-4 h-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Membros ({participantesAtivos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Avatar do Grupo */}
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="relative">
                {conversa.avatar_grupo ? (
                  <img
                    src={conversa.avatar_grupo}
                    alt={conversa.nome_grupo}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Users className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                  </div>
                )}
                {isAdmin && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
              {uploadingImage && (
                <p className="text-xs text-slate-500">Enviando imagem...</p>
              )}
            </div>

            {/* Nome do Grupo */}
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
                disabled={!isAdmin}
                placeholder="Nome do grupo"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={descricaoGrupo}
                onChange={(e) => setDescricaoGrupo(e.target.value)}
                disabled={!isAdmin}
                placeholder="Adicione uma descrição para o grupo..."
                className="min-h-[100px]"
              />
            </div>

            {isAdmin && (
              <Button onClick={handleSaveInfo} disabled={saving} className="w-full">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}

            {!isAdmin && (
              <p className="text-xs text-slate-500 text-center">
                Apenas administradores podem editar as informações do grupo
              </p>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            {isAdmin && (
              <div className="mb-4">
                {!showAddMember ? (
                  <Button onClick={() => setShowAddMember(true)} className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Membros
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Adicionar Membros</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowAddMember(false);
                          setSelectedNewMembers([]);
                          setBusca('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Input
                      placeholder="Buscar pessoas..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />

                    <ScrollArea className="h-48 border rounded-lg">
                      <div className="p-2 space-y-1">
                        {pessoasDisponiveis.map((pessoa) => (
                          <div
                            key={pessoa.id}
                            className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          >
                            <Checkbox
                              checked={selectedNewMembers.includes(pessoa.id)}
                              onCheckedChange={() => toggleNewMember(pessoa.id)}
                            />
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {pessoa.nome.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{pessoa.nome}</p>
                              <p className="text-xs text-slate-500">{pessoa.funcao}</p>
                            </div>
                          </div>
                        ))}
                        {pessoasDisponiveis.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">
                            {busca ? 'Nenhuma pessoa encontrada' : 'Todas as pessoas já são membros'}
                          </p>
                        )}
                      </div>
                    </ScrollArea>

                    <Button
                      onClick={handleAddMembers}
                      disabled={selectedNewMembers.length === 0}
                      className="w-full"
                    >
                      Adicionar {selectedNewMembers.length > 0 && `(${selectedNewMembers.length})`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {participantesAtivos.map((participante) => {
                  const pessoa = pessoas.find(p => p.id === participante.pessoa_id);
                  const isCurrentUser = participante.pessoa_id === currentPessoaId;
                  const isParticipanteAdmin = participante.permissao === 'admin';

                  return (
                    <div
                      key={participante.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      {pessoa?.foto_perfil ? (
                        <img
                          src={pessoa.foto_perfil}
                          alt={pessoa.nome}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            {pessoa?.nome?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {pessoa?.nome || 'Usuário'}
                            {isCurrentUser && (
                              <span className="text-xs text-slate-500 ml-1">(você)</span>
                            )}
                          </p>
                          {isParticipanteAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{pessoa?.funcao}</p>
                      </div>

                      {isAdmin && !isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePromoverAdmin(participante.id)}>
                              <Shield className="w-4 h-4 mr-2" />
                              {isParticipanteAdmin ? 'Remover Admin' : 'Tornar Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoverMembro(participante.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover do Grupo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}