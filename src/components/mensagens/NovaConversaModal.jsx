import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, User } from 'lucide-react';

export default function NovaConversaModal({ open, onClose, pessoas, currentPessoaId, onCriar }) {
  const [tipo, setTipo] = useState('privada');
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [participantesSelecionados, setParticipantesSelecionados] = useState([]);
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const pessoasFiltradas = Array.isArray(pessoas) ? pessoas.filter(p => 
    p && p.id !== currentPessoaId && 
    p.nome?.toLowerCase().includes(buscaDebounced.toLowerCase())
  ) : [];

  const handleCriar = () => {
    if (tipo === 'privada') {
      if (pessoaSelecionada) {
        onCriar('privada', [pessoaSelecionada.id], null);
      }
    } else {
      if (participantesSelecionados.length >= 2 && nomeGrupo.trim()) {
        onCriar('grupo', participantesSelecionados, nomeGrupo);
      }
    }
    handleClose();
  };

  const handleClose = () => {
    setPessoaSelecionada(null);
    setParticipantesSelecionados([]);
    setNomeGrupo('');
    setBusca('');
    setTipo('privada');
    onClose();
  };

  const toggleParticipante = (pessoaId) => {
    if (participantesSelecionados.includes(pessoaId)) {
      setParticipantesSelecionados(participantesSelecionados.filter(id => id !== pessoaId));
    } else {
      setParticipantesSelecionados([...participantesSelecionados, pessoaId]);
    }
  };

  const isValido = tipo === 'privada' 
    ? pessoaSelecionada !== null 
    : participantesSelecionados.length >= 2 && nomeGrupo.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        <Tabs value={tipo} onValueChange={setTipo}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="privada">
              <User className="w-4 h-4 mr-2" />
              Conversa Privada
            </TabsTrigger>
            <TabsTrigger value="grupo">
              <Users className="w-4 h-4 mr-2" />
              Grupo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privada" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar pessoa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {pessoasFiltradas.map((pessoa) => (
                <div
                  key={pessoa.id}
                  onClick={() => setPessoaSelecionada(pessoa)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${pessoaSelecionada?.id === pessoa.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500' 
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {pessoa.foto_perfil ? (
                    <img src={pessoa.foto_perfil} alt={pessoa.nome} className="w-10 h-10 rounded-full" />
                  ) : (
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        {pessoa.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{pessoa.nome}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{pessoa.funcao}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="grupo" className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo *</Label>
              <Input
                placeholder="Ex: Equipe Almoxarifado"
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
              />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar participantes..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Label className="text-sm text-slate-600 dark:text-slate-400">
                Selecionados: {participantesSelecionados.length} (mínimo 2)
              </Label>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {pessoasFiltradas.map((pessoa) => (
                <div
                  key={pessoa.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Checkbox
                    checked={participantesSelecionados.includes(pessoa.id)}
                    onCheckedChange={() => toggleParticipante(pessoa.id)}
                  />
                  {pessoa.foto_perfil ? (
                    <img src={pessoa.foto_perfil} alt={pessoa.nome} className="w-10 h-10 rounded-full" />
                  ) : (
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        {pessoa.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{pessoa.nome}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{pessoa.funcao}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleCriar} disabled={!isValido}>
            Criar {tipo === 'privada' ? 'Conversa' : 'Grupo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}